/** Minimal shape so AI services can list diagram keys without importing the visual seed registry. */
export type VisualLookupEntry = {
    concepts?: Array<{
        concept_id: string;
        diagrams?: Array<{ diagram_id: string }>;
    }>;
};

/**
 * All `concept_id.diagram_id` compound keys for a topic (for narration [VISUAL:...] markers).
 */
export function collectDiagramLookupKeys(entry: VisualLookupEntry | null | undefined): string[] {
    if (!entry?.concepts?.length) return [];
    const keys: string[] = [];
    for (const c of entry.concepts) {
        for (const d of c.diagrams ?? []) {
            keys.push(`${c.concept_id}.${d.diagram_id}`);
        }
    }
    return keys;
}
