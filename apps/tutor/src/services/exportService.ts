import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType, ImageRun, TextRun } from 'docx';
import type { GeneratedNote, Flashcard, GeneratedSummary } from '@/types';

const NOTES_PAPER = '#f7f0dc';

async function waitForNotesFonts() {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
        await document.fonts.ready.catch(() => {});
    }
}

function notesFileStem(title: string) {
    return title.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'notes';
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
    const b64 = dataUrl.split(',')[1] || '';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

function stripInlineMd(s: string) {
    return s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1');
}

function boldRuns(line: string): TextRun[] {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    if (parts.length <= 1) {
        return [new TextRun({ text: stripInlineMd(line), size: 22 })];
    }
    return parts.map((p) => {
        const m = p.match(/^\*\*([^*]+)\*\*$/);
        if (m) return new TextRun({ text: m[1], bold: true, size: 22 });
        return new TextRun({ text: stripInlineMd(p), size: 22 });
    });
}

function markdownToParagraphs(content: string): Paragraph[] {
    const out: Paragraph[] = [];
    for (const raw of content.split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        const bullet = line.match(/^[-*•]\s+(.+)$/);
        if (bullet) {
            out.push(new Paragraph({ text: stripInlineMd(bullet[1]), bullet: { level: 0 }, spacing: { after: 80 } }));
            continue;
        }
        out.push(new Paragraph({ children: boldRuns(line), spacing: { after: 160 } }));
    }
    return out.length ? out : [new Paragraph({ text: stripInlineMd(content) })];
}

async function captureElementJpeg(el: HTMLElement, backgroundColor: string) {
    await waitForNotesFonts();
    return html2canvas(el, {
        backgroundColor,
        scale: 2,
        logging: false,
        useCORS: true,
        windowWidth: Math.max(el.scrollWidth, el.clientWidth),
        windowHeight: Math.max(el.scrollHeight, el.clientHeight),
    });
}

function addCanvasPagesToPdf(doc: jsPDF, canvas: HTMLCanvasElement) {
    const imgData = canvas.toDataURL('image/jpeg', 0.93);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 6) {
        position -= pageHeight;
        doc.addPage();
        doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }
}

async function captureDiagramPngs(): Promise<Array<{ data: Uint8Array; width: number; height: number }>> {
    const figures = Array.from(
        document.querySelectorAll<HTMLElement>('#studio-notes-export [data-notes-diagram]'),
    );
    const out: Array<{ data: Uint8Array; width: number; height: number }> = [];
    for (const el of figures) {
        const canvas = await html2canvas(el, {
            backgroundColor: '#fffdf6',
            scale: 2,
            logging: false,
            useCORS: true,
        });
        const maxW = 520;
        const width = Math.min(maxW, Math.round(canvas.width / 2));
        const height = Math.max(80, Math.round((canvas.height / canvas.width) * width));
        out.push({
            data: dataUrlToUint8Array(canvas.toDataURL('image/png')),
            width,
            height,
        });
    }
    return out;
}

/**
 * ExportService
 * Centralized utility for exporting learning artifacts to various formats.
 */
export const ExportService = {
    /**
     * Export notes to PDF. When the notebook is on screen, capture it so the
     * file matches what the student sees (handwriting, diagrams, highlights).
     */
    async exportNotesToPDF(note: GeneratedNote): Promise<void> {
        const root = typeof document !== 'undefined'
            ? document.getElementById('studio-notes-export')
            : null;
        if (root) {
            const canvas = await captureElementJpeg(root, NOTES_PAPER);
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            addCanvasPagesToPdf(doc, canvas);
            doc.save(`${notesFileStem(note.title)}-notes.pdf`);
            return;
        }
        await this.exportNotesToPdfFallback(note);
    },

    async exportNotesToPdfFallback(note: GeneratedNote): Promise<void> {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        let currentY = 25;

        // Title
        doc.setFontSize(22);
        doc.setTextColor(75, 85, 99); // Slate-600
        doc.setFont('helvetica', 'bold');
        doc.text(note.title, margin, currentY);
        currentY += 10;

        // Subtitle / Topic
        doc.setFontSize(12);
        doc.setTextColor(107, 114, 128); // Gray-500
        doc.setFont('helvetica', 'normal');
        doc.text(`Topic: ${note.topicName} | Created: ${new Date(note.createdAt).toLocaleDateString()}`, margin, currentY);
        currentY += 15;

        // Divider
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 15;

        // Sections
        note.sections.forEach((section, index) => {
            // Check if we need a new page
            if (currentY > 250) {
                doc.addPage();
                currentY = 20;
            }

            // Heading
            doc.setFontSize(16);
            doc.setTextColor(31, 41, 55); // Gray-800
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${section.heading}`, margin, currentY);
            currentY += 10;

            // Content
            doc.setFontSize(11);
            doc.setTextColor(55, 65, 81); // Gray-700
            doc.setFont('helvetica', 'normal');
            const contentLines = doc.splitTextToSize(section.content, pageWidth - margin * 2);
            doc.text(contentLines, margin, currentY);
            currentY += (contentLines.length * 6) + 8;

            // Highlights
            if (section.highlights && section.highlights.length > 0) {
                doc.setFontSize(10);
                doc.setTextColor(142, 124, 195); // Purple-600 (Aria Accent)
                doc.setFont('helvetica', 'bold');
                doc.text('Key Highlights:', margin + 5, currentY);
                currentY += 6;

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(75, 85, 99);
                section.highlights.forEach(highlight => {
                    const highlightLines = doc.splitTextToSize(`• ${highlight}`, pageWidth - margin * 2 - 10);
                    doc.text(highlightLines, margin + 10, currentY);
                    currentY += (highlightLines.length * 5) + 2;
                });
                currentY += 8;
            }

            if (section.diagrams && section.diagrams.length > 0) {
                section.diagrams.forEach(diagram => {
                    if (currentY > 250) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.setFontSize(11);
                    doc.setTextColor(109, 40, 217);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`Diagram: ${diagram.title}`, margin + 5, currentY);
                    currentY += 6;
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(75, 85, 99);
                    if (diagram.caption) {
                        const captionLines = doc.splitTextToSize(diagram.caption, pageWidth - margin * 2 - 10);
                        doc.text(captionLines, margin + 10, currentY);
                        currentY += (captionLines.length * 5) + 2;
                    }
                    diagram.nodes.forEach(node => {
                        const line = `• ${node.label}${node.detail ? ` — ${node.detail}` : ''}`;
                        const lines = doc.splitTextToSize(line, pageWidth - margin * 2 - 10);
                        doc.text(lines, margin + 10, currentY);
                        currentY += (lines.length * 5) + 1;
                    });
                    currentY += 6;
                });
            }
        });

        // Footer
        const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(156, 163, 175);
            doc.text(`Page ${i} of ${pageCount} | Aɪra Learning Studio`, pageWidth / 2, 285, { align: 'center' });
        }

        doc.save(`${notesFileStem(note.title)}-notes.pdf`);
    },

    /**
     * Export notes to DOCX: same section text as the viewer, with diagram images
     * captured from the notebook when it is on screen.
     */
    async exportNotesToDOCX(note: GeneratedNote): Promise<void> {
        await waitForNotesFonts();
        const hasDiagrams = note.sections.some((s) => (s.diagrams?.length || 0) > 0);
        const diagramImages = hasDiagrams && typeof document !== 'undefined'
            ? await captureDiagramPngs()
            : [];
        let diagramIndex = 0;

        const children: Paragraph[] = [
            new Paragraph({
                text: note.title,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: [
                    note.topicName,
                    note.subjectArea,
                    note.gradeLevel,
                    note.chapterName,
                ].filter(Boolean).join(' · '),
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: '' }),
        ];

        note.sections.forEach((section, index) => {
            children.push(new Paragraph({
                text: `${index + 1}. ${section.heading}`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 360, after: 160 },
            }));
            children.push(...markdownToParagraphs(section.content));
            if (section.highlights.length > 0) {
                children.push(new Paragraph({
                    text: 'Key points',
                    spacing: { before: 160, after: 80 },
                }));
                section.highlights.forEach((h) => {
                    children.push(new Paragraph({
                        text: stripInlineMd(h),
                        bullet: { level: 0 },
                    }));
                });
            }
            (section.diagrams || []).forEach((diagram) => {
                children.push(new Paragraph({
                    text: `Diagram: ${diagram.title}`,
                    spacing: { before: 200, after: 80 },
                }));
                if (diagram.caption) {
                    children.push(new Paragraph({
                        text: diagram.caption,
                        spacing: { after: 80 },
                    }));
                }
                const image = diagramImages[diagramIndex];
                diagramIndex += 1;
                if (image) {
                    children.push(new Paragraph({
                        children: [
                            new ImageRun({
                                type: 'png',
                                data: image.data,
                                transformation: {
                                    width: image.width,
                                    height: image.height,
                                },
                            }),
                        ],
                        spacing: { after: 120 },
                    }));
                } else {
                    diagram.nodes.forEach((n) => {
                        children.push(new Paragraph({
                            text: `${n.label}${n.detail ? ` — ${n.detail}` : ''}`,
                            bullet: { level: 0 },
                        }));
                    });
                }
            });
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children,
            }],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${notesFileStem(note.title)}-notes.docx`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Export Mind Map as PNG
     */
    async exportToPNG(elementId: string, filename: string): Promise<void> {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher resolution
                logging: false,
                useCORS: true,
            });

            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.png`;
            a.click();
        } catch (error) {
            console.error('Failed to export to PNG:', error);
            throw error;
        }
    },

    /**
     * Export Flashcards to PDF (Print-ready layout)
     */
    async exportFlashcardsToPDF(cards: Flashcard[], topicName: string): Promise<void> {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const cardWidth = (pageWidth - margin * 3) / 2;
        const cardHeight = 60;
        let currentX = margin;
        let currentY = 25;

        // Title
        doc.setFontSize(18);
        doc.setTextColor(31, 41, 55);
        doc.text(`${topicName} - Flashcards`, margin, 15);

        cards.forEach((card, index) => {
            // Check if we need a new row or new page
            if (index > 0 && index % 2 === 0) {
                currentX = margin;
                currentY += cardHeight + 10;
            } else if (index > 0) {
                currentX = margin + cardWidth + 10;
            }

            if (currentY + cardHeight > 280) {
                doc.addPage();
                currentY = 20;
                currentX = margin;
            }

            // Card frame
            doc.setDrawColor(209, 213, 219);
            doc.setLineWidth(0.5);
            doc.rect(currentX, currentY, cardWidth, cardHeight);

            // Question
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(75, 85, 99);
            doc.text('QUESTION:', currentX + 5, currentY + 7);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(31, 41, 55);
            const questionLines = doc.splitTextToSize(card.question, cardWidth - 10);
            doc.text(questionLines, currentX + 5, currentY + 13);

            // Divider
            doc.setDrawColor(243, 244, 246);
            doc.line(currentX + 5, currentY + 30, currentX + cardWidth - 5, currentY + 30);

            // Answer
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(75, 85, 99);
            doc.text('ANSWER:', currentX + 5, currentY + 37);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(16, 185, 129); // Green-600
            const answerLines = doc.splitTextToSize(card.answer, cardWidth - 10);
            doc.text(answerLines, currentX + 5, currentY + 43);
        });

        doc.save(`${notesFileStem(topicName || 'topic')}-flashcards.pdf`);
    },

    /**
     * Export Summary to PDF
     */
    async exportSummaryToPDF(summary: GeneratedSummary): Promise<void> {
        const noteAdapter: GeneratedNote = {
            id: summary.id,
            sessionId: summary.sessionId,
            topicName: summary.topicName,
            title: summary.title,
            content: summary.overview,
            createdAt: summary.createdAt,
            userDoubts: [],
            sections: [
                {
                    heading: 'Overview',
                    content: summary.overview,
                    highlights: summary.keyTakeaways
                },
                ...(summary.furtherReading ? [{
                    heading: 'Further Reading',
                    content: summary.furtherReading.join(', '),
                    highlights: []
                }] : [])
            ]
        };
        await this.exportNotesToPdfFallback(noteAdapter);
    },

    /**
     * Export Summary to DOCX
     */
    async exportSummaryToDOCX(summary: GeneratedSummary): Promise<void> {
        const noteAdapter: GeneratedNote = {
            id: summary.id,
            sessionId: summary.sessionId,
            topicName: summary.topicName,
            title: summary.title,
            content: summary.overview,
            createdAt: summary.createdAt,
            userDoubts: [],
            sections: [
                {
                    heading: 'Overview',
                    content: summary.overview,
                    highlights: summary.keyTakeaways
                },
                ...(summary.furtherReading ? [{
                    heading: 'Further Reading',
                    content: summary.furtherReading.join(', '),
                    highlights: []
                }] : [])
            ]
        };
        await this.exportNotesToDOCX(noteAdapter);
    }
};
