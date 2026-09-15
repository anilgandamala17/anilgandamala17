/**
 * Light client-side normalizer for AI chat text.
 * Only rewrites obvious walls of text that lack markdown structure.
 */

const MARKDOWN_SIGNAL = /(^|\n)(#{1,6}\s|[-*•]\s|\d+\.\s|```|\*\*|>\s|---)/;
const FORMULA_LINE = /^[A-Za-z][A-Za-z0-9\s]*\s*[=≈]\s*.+$/;

function splitIntoParagraphs(text: string): string {
    const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [text];
    const paragraphs: string[] = [];
    let bucket: string[] = [];

    for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;
        bucket.push(trimmed);
        if (bucket.length >= 3) {
            paragraphs.push(bucket.join(' '));
            bucket = [];
        }
    }

    if (bucket.length) paragraphs.push(bucket.join(' '));
    return paragraphs.join('\n\n');
}

/** Insert paragraph breaks for dense single-block text without markdown. */
export function normalizeChatContent(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) return trimmed;
    if (MARKDOWN_SIGNAL.test(trimmed)) return trimmed;
    if (trimmed.includes('\n\n')) return trimmed;

    const lineCount = trimmed.split('\n').length;
    if (lineCount > 1 && trimmed.length < 600) return trimmed;
    if (trimmed.length < 280) return trimmed;

    return splitIntoParagraphs(trimmed);
}

/** Detect standalone formula lines for display hints. */
export function isFormulaLine(line: string): boolean {
    const t = line.trim();
    if (!t || t.length > 120) return false;
    if (t.startsWith('```')) return false;
    return FORMULA_LINE.test(t);
}
