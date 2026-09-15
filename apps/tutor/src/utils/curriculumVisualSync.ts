import { getFirstActiveDiagramId } from '../data/visualRegistry';

function countVisualMarkers(text: string): number {
    return (text.match(/\[VISUAL:/g) || []).length;
}

/**
 * Ensures masterclass narration includes enough `[VISUAL:concept_id.diagram_id]` markers
 * so TTS segments advance diagram + optional `.part` highlights on the board only (no lesson script).
 */
export function injectCurriculumVisualMarkers(spoken: string, lookupKeys: string[], topicId: string): string {
    const trimmed = spoken.trim();
    if (!trimmed) return spoken;

    let keys = [...lookupKeys];
    if (keys.length === 0) {
        const first = getFirstActiveDiagramId(topicId);
        if (first) keys = [first];
    }
    if (keys.length === 0) return spoken;

    const existing = countVisualMarkers(trimmed);
    const words = trimmed
        .replace(/\[VISUAL:[^\]]+\]/g, ' ')
        .replace(/\[TEXT:[^\]]+\]/g, ' ')
        .split(/\s+/)
        .filter(Boolean).length;
    const targetMarkers = Math.max(3, Math.min(24, Math.ceil(words / 200)));

    if (existing >= Math.min(8, targetMarkers)) return trimmed;
    if (existing >= 6) return trimmed;

    const plain = trimmed.replace(/\[VISUAL:[^\]]+\]/g, ' ').replace(/\[TEXT:[^\]]+\]/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (!plain) return spoken;

    const sentences = plain.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [plain];
    const chunks: string[] = [];
    let buf: string[] = [];
    const sentencesPerChunk = Math.max(1, Math.ceil(sentences.length / targetMarkers));
    let ki = 0;
    for (let i = 0; i < sentences.length; i++) {
        buf.push(sentences[i].trim());
        if (buf.length >= sentencesPerChunk || i === sentences.length - 1) {
            const key = keys[ki % keys.length];
            ki++;
            chunks.push(`[VISUAL:${key}] ${buf.join(' ')}`);
            buf = [];
        }
    }
    return chunks.join(' ');
}
