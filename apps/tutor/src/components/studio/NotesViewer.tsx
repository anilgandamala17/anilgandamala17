import { motion } from 'framer-motion';
import type { GeneratedNote } from '../../types';
import { BookOpen, Download, Printer, Star, Copy, Check, Layers } from 'lucide-react';
import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExportService } from '../../services/exportService';
import { toast } from '../../stores/toastStore';
import { NotesDiagram } from './NotesDiagram';

interface NotesViewerProps {
    note: GeneratedNote;
    onClose?: () => void;
}

function sectionToMarkdown(section: GeneratedNote['sections'][number]): string {
    const diagramLines = (section.diagrams || [])
        .map(d => {
            const nodes = d.nodes.map(n => `- ${n.label}${n.detail ? ` (${n.detail})` : ''}`).join('\n');
            return `### Diagram: ${d.title}\n${d.caption ? `${d.caption}\n` : ''}${nodes}`;
        })
        .join('\n\n');
    return `## ${section.heading}\n\n${section.content}\n\n**Key Points:**\n${section.highlights.map(h => `- ${h}`).join('\n')}${diagramLines ? `\n\n${diagramLines}` : ''}`;
}

export default function NotesViewer({ note }: NotesViewerProps) {
    const [copied, setCopied] = useState(false);
    const diagramCount = useMemo(
        () => note.sections.reduce((n, s) => n + (s.diagrams?.length || 0), 0),
        [note.sections],
    );

    const getMarkdownContent = () => {
        const meta = [
            note.subjectArea ? `**Subject:** ${note.subjectArea}` : null,
            note.gradeLevel ? `**Level:** ${note.gradeLevel}` : null,
            note.chapterName ? `**Chapter:** ${note.chapterName}` : null,
        ].filter(Boolean).join(' · ');
        return `# ${note.title}\n\n${meta ? `${meta}\n\n` : ''}${note.sections.map(sectionToMarkdown).join('\n\n')}`;
    };

    const handleCopy = () => {
        void navigator.clipboard.writeText(getMarkdownContent());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPDF = async () => {
        try {
            await ExportService.exportNotesToPDF(note);
        } catch (err) {
            console.error(err);
            toast.error('Could not download the PDF. Please try again.');
        }
    };

    const handleDownloadDOCX = async () => {
        try {
            await ExportService.exportNotesToDOCX(note);
        } catch (err) {
            console.error(err);
            toast.error('Could not download the Word file. Please try again.');
        }
    };

    const metaBits = [
        note.subjectArea,
        note.gradeLevel,
        note.chapterName,
    ].filter(Boolean);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl border border-amber-200/80 dark:border-amber-900/40 shadow-lg"
        >
            <div className="notes-toolbar flex flex-wrap gap-2 p-3 border-b border-amber-200/70 dark:border-amber-900/40 bg-[#f3ead0] dark:bg-stone-900">
                <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/80 dark:bg-stone-800 border border-amber-300/60 dark:border-stone-600 hover:border-amber-500 rounded-lg transition-all text-slate-700 dark:text-stone-200 shadow-sm"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-sky-700" />}
                    {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
                <button
                    type="button"
                    onClick={() => void handleDownloadPDF()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/80 dark:bg-stone-800 border border-amber-300/60 dark:border-stone-600 hover:border-sky-400 rounded-lg transition-all text-slate-700 dark:text-stone-200 shadow-sm"
                >
                    <Download className="w-4 h-4 text-sky-700" />
                    Download PDF
                </button>
                <button
                    type="button"
                    onClick={() => void handleDownloadDOCX()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/80 dark:bg-stone-800 border border-amber-300/60 dark:border-stone-600 hover:border-sky-400 rounded-lg transition-all text-slate-700 dark:text-stone-200 shadow-sm"
                >
                    <Layers className="w-4 h-4 text-sky-800" />
                    Download DOCX
                </button>
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/80 dark:bg-stone-800 border border-amber-300/60 dark:border-stone-600 rounded-lg transition-all text-slate-700 dark:text-stone-200 shadow-sm"
                >
                    <Printer className="w-4 h-4 text-slate-500" />
                    Print
                </button>
            </div>

            <div id="studio-notes-export" className="notes-notebook">
                <header className="notes-notebook__masthead">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="notes-hand-heading flex items-center gap-2 text-lg text-sky-900 dark:text-amber-100">
                                <BookOpen className="w-5 h-5 shrink-0" />
                                Study notes
                            </p>
                            <h2 className="notes-hand-heading mt-1 text-2xl sm:text-3xl leading-snug text-slate-900 dark:text-amber-50">
                                {note.title}
                            </h2>
                            <p className="notes-hand-body mt-2 text-base text-slate-700 dark:text-stone-300">
                                {note.topicName}
                                {diagramCount > 0 ? ` · ${diagramCount} diagram${diagramCount === 1 ? '' : 's'}` : ''}
                            </p>
                            {metaBits.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {metaBits.map(bit => (
                                        <span
                                            key={bit}
                                            className="notes-hand-body inline-flex items-center rounded-sm border border-sky-800/20 bg-amber-200/50 px-2 py-0.5 text-sm text-sky-950"
                                        >
                                            {bit}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                        {note.qualityScore ? (
                            <div className="notes-hand-heading flex items-center gap-1 bg-amber-200/70 px-2.5 py-1 rounded-sm shrink-0 text-sky-950">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                                <span className="text-lg">{note.qualityScore}%</span>
                            </div>
                        ) : null}
                    </div>
                </header>

                <div className="notes-notebook__body">
                    {note.sections.map((section, index) => (
                        <motion.section
                            key={`${section.heading}-${index}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.05, 0.3) }}
                            className="notes-notebook__section"
                        >
                            <h3 className="notes-hand-heading text-xl sm:text-2xl text-sky-950 dark:text-amber-100">
                                {index + 1}. {section.heading}
                            </h3>

                            <div className="notes-hand-body notes-md text-[17px] text-slate-800 dark:text-stone-200">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ children }) => <p>{children}</p>,
                                        strong: ({ children }) => <strong>{children}</strong>,
                                        mark: ({ children }) => <mark>{children}</mark>,
                                        ul: ({ children }) => <ul className="list-disc">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal">{children}</ol>,
                                        li: ({ children }) => <li>{children}</li>,
                                        code: ({ children }) => (
                                            <code className="rounded-sm bg-amber-100/80 px-1 text-[15px] text-sky-950">
                                                {children}
                                            </code>
                                        ),
                                    }}
                                >
                                    {section.content}
                                </ReactMarkdown>
                            </div>

                            {(section.diagrams || []).map((diagram, di) => (
                                <NotesDiagram key={`${diagram.title}-${di}`} diagram={diagram} />
                            ))}

                            {section.highlights.length > 0 ? (
                                <div className="notes-key-points">
                                    <p className="notes-hand-heading notes-key-points__heading text-base text-sky-900 dark:text-amber-200">
                                        Key points
                                    </p>
                                    <ul className="notes-key-points__list">
                                        {section.highlights.map((highlight, i) => (
                                            <li key={i} className="notes-hand-body text-[16px] text-slate-800 dark:text-stone-100">
                                                <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-800" aria-hidden />
                                                <span className="notes-highlight">{highlight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </motion.section>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
