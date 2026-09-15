import mammoth from 'mammoth';

type PdfJsModule = typeof import('pdfjs-dist');

let pdfjsReady: Promise<PdfJsModule> | null = null;

/**
 * Lazy-load pdfjs only when a PDF is uploaded.
 * Eager imports break TeachingPage boot under the landing→Vite proxy
 * ("requested module '/node_modules/pdfjs-dist…'" ESM errors).
 */
async function getPdfJs(): Promise<PdfJsModule> {
    if (!pdfjsReady) {
        pdfjsReady = (async () => {
            const pdfjsLib = await import('pdfjs-dist');
            const workerMod = await import('pdfjs-dist/build/pdf.worker.mjs?url');
            const workerSrc =
                typeof workerMod.default === 'string'
                    ? workerMod.default
                    : String(workerMod.default ?? '');
            if (workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
            }
            return pdfjsLib;
        })();
    }
    return pdfjsReady;
}

/**
 * Extracts raw text from common document formats based on the file type.
 * Supports: PDF, DOCX, TXT, Markdown, CSV, JSON, and Images (PNG/JPG via base64).
 */
export async function extractTextFromFile(file: File): Promise<string> {
    const type = file.type;
    const name = file.name.toLowerCase();

    // 1. Plain text / Markdown / JSON / CSV
    if (type.startsWith('text/') || name.endsWith('.md') || name.endsWith('.json') || name.endsWith('.csv')) {
        return await file.text();
    }

    // 2. PDF
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
        return await extractPdfText(file);
    }

    // 3. DOCX
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
        return await extractDocxText(file);
    }

    // 4. Images – return base64 so AI can describe them visually
    if (type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(name)) {
        return await encodeImageToBase64(file);
    }

    throw new Error(`Unsupported file type: ${type || name}. Supported: PDF, DOCX, TXT, PNG, JPG.`);
}

async function extractPdfText(file: File): Promise<string> {
    try {
        const pdfjsLib = await getPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        const numPages = pdf.numPages;
        let fullText = '';

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((item: any) => item.str)
                .join(' ');
            fullText += `[Page ${i}]\n${pageText}\n\n`;
        }

        return fullText.trim();
    } catch (error) {
        console.error('Failed to parse PDF:', error);
        throw new Error('Failed to extract text from PDF document. Make sure the PDF contains readable text (not a scanned image).');
    }
}

async function extractDocxText(file: File): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value.trim();
    } catch (error) {
        console.error('Failed to parse DOCX:', error);
        throw new Error('Failed to extract text from Word document.');
    }
}

/**
 * Encodes an image file to base64 with a data URI prefix.
 * This is used to pass the image to vision-capable AI models.
 */
async function encodeImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(`__IMAGE_BASE64__${result}`);
        };
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
    });
}
