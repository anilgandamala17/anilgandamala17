/**
 * markerParser.ts — Speech-Marker-Diagram Binding (Hard Rules 14, 18, 23)
 *
 * Parses [VISUAL:concept_id.diagram_id] tags embedded in lesson narration text.
 * These markers drive the green board's diagram progression.
 *
 * Hard Rule 14: Marker format is [VISUAL:concept_id.diagram_id]
 * Hard Rule 18: Keyword hints are assistive only — never show unregistered diagrams
 * Hard Rule 23: # markers >= # major concepts (validated by validateDiagramAlignment)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedMarker {
    /** Full marker string, e.g. "[VISUAL:atom_model.bohr]" */
    raw: string;
    /** Concept identifier, e.g. "atom_model" */
    conceptId: string;
    /** Diagram identifier within the concept, e.g. "bohr" */
    diagramId: string;
    /** Combined key used as activeDiagramId: "concept_id.diagram_id" */
    activeDiagramId: string;
    /** Character position in the ORIGINAL text (before stripping) */
    charIndex: number;
    /** Character position in the STRIPPED text (after removing markers) */
    strippedCharIndex: number;
}

export interface KeywordHint {
    keyword: string;
    candidateConceptId: string;
    candidateDiagramId: string;
    confidence: number; // 0–1
}

export interface AlignmentResult {
    pass: boolean;
    markerCount: number;
    conceptCount: number;
    /** Hard Rule 23: block publish if markers < concepts */
    blockPublish: boolean;
    message: string;
}

// ── VISUAL_MARKER_REGEX ───────────────────────────────────────────────────────

/** Matches [VISUAL:...] including optional .part suffix (speech-sync highlighting). */
const VISUAL_MARKER_REGEX = /\[VISUAL:([^\]]+)\]/g;

function stripDiagramLookupSuffix(fullKey: string): string {
    const parts = fullKey.split('.');
    if (parts.length >= 3) return `${parts[0]}.${parts[1]}`;
    return fullKey;
}

// ── Core Parser ───────────────────────────────────────────────────────────────

/**
 * Parse all [VISUAL:concept.diagram] markers from lesson text (optional .part suffix).
 * Returns ordered list of markers with both original and stripped char positions.
 *
 * Hard Rule 14: Only [VISUAL:x.y] format is authoritative (optional third+ segment for parts).
 */
export function parseMarkers(text: string): ParsedMarker[] {
    if (!text) return [];

    const markers: ParsedMarker[] = [];
    let match: RegExpExecArray | null;
    let offset = 0; // tracks how many chars have been removed by previous markers

    VISUAL_MARKER_REGEX.lastIndex = 0;
    const regex = new RegExp(VISUAL_MARKER_REGEX.source, 'g');

    while ((match = regex.exec(text)) !== null) {
        const fullKey = match[1].trim();
        const lookupKey = stripDiagramLookupSuffix(fullKey);
        const dot = lookupKey.indexOf('.');
        const conceptId = dot === -1 ? lookupKey : lookupKey.slice(0, dot);
        const diagramId = dot === -1 ? '' : lookupKey.slice(dot + 1);
        const charIndex = match.index;
        const strippedCharIndex = charIndex - offset;

        markers.push({
            raw: match[0],
            conceptId,
            diagramId,
            activeDiagramId: lookupKey,
            charIndex,
            strippedCharIndex,
        });

        offset += match[0].length;
    }

    return markers;
}

/**
 * Strip all [VISUAL:x.y] markers from text before passing to TTS.
 * Hard Rule 14: AI never reads marker syntax aloud.
 */
export function stripMarkers(text: string): string {
    if (!text) return '';
    return text
        .replace(/\[VISUAL:[^\]]+\]/g, '')
        .replace(/\[TEXT:[^\]]+\]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

/**
 * Check if text contains any VISUAL markers.
 */
export function hasMarkers(text: string): boolean {
    if (!text) return false;
    return /\[VISUAL:[^\]]+\]/.test(text);
}

/**
 * Get the first marker in the text (used for initial diagram on lesson start).
 */
export function getFirstMarker(text: string): ParsedMarker | null {
    const markers = parseMarkers(text);
    return markers.length > 0 ? markers[0] : null;
}

// ── Keyword Hint Detection (Hard Rule 18) ─────────────────────────────────────

/**
 * Domain keyword → candidate diagram mapping.
 * These are ASSISTIVE ONLY — never show a diagram not in the registry.
 * Hard Rule 18: Only diagrams that exist in registry may be shown.
 */
const KEYWORD_HINT_MAP: Array<{ keywords: string[]; conceptId: string; diagramId: string; confidence: number }> = [
    // Physics — Atomic Theory
    { keywords: ['dalton', 'solid sphere', 'billiard ball'], conceptId: 'atomic_model', diagramId: 'dalton', confidence: 0.9 },
    { keywords: ['thomson', 'plum pudding', 'electron cloud'], conceptId: 'atomic_model', diagramId: 'thomson', confidence: 0.9 },
    { keywords: ['rutherford', 'nucleus', 'gold foil', 'alpha particle'], conceptId: 'atomic_model', diagramId: 'rutherford', confidence: 0.9 },
    { keywords: ['bohr', 'electron orbit', 'energy level', 'shell'], conceptId: 'atomic_model', diagramId: 'bohr', confidence: 0.9 },
    { keywords: ['quantum', 'orbital', 'wave function', 'probability cloud'], conceptId: 'atomic_model', diagramId: 'quantum', confidence: 0.85 },

    // Biology — Cell
    { keywords: ['cell membrane', 'phospholipid bilayer'], conceptId: 'cell_structure', diagramId: 'membrane', confidence: 0.85 },
    { keywords: ['nucleus', 'dna', 'chromatin'], conceptId: 'cell_structure', diagramId: 'nucleus', confidence: 0.8 },
    { keywords: ['mitochondria', 'atp', 'energy production'], conceptId: 'cell_structure', diagramId: 'mitochondria', confidence: 0.85 },

    // Chemistry — Reactions
    { keywords: ['combination reaction', 'synthesis'], conceptId: 'chemical_reactions', diagramId: 'combination', confidence: 0.85 },
    { keywords: ['decomposition', 'breakdown'], conceptId: 'chemical_reactions', diagramId: 'decomposition', confidence: 0.85 },
    { keywords: ['energy profile', 'activation energy', 'exothermic', 'endothermic'], conceptId: 'chemical_reactions', diagramId: 'energy_profile', confidence: 0.85 },

    // Medicine — Heart
    { keywords: ['right atrium', 'right ventricle', 'deoxygenated'], conceptId: 'cardiac_cycle', diagramId: 'right_flow', confidence: 0.85 },
    { keywords: ['left atrium', 'left ventricle', 'oxygenated', 'aorta'], conceptId: 'cardiac_cycle', diagramId: 'left_flow', confidence: 0.85 },
    { keywords: ['pulmonary', 'lungs', 'gas exchange'], conceptId: 'cardiac_cycle', diagramId: 'pulmonary', confidence: 0.85 },

    // Physics — Newton's Laws
    { keywords: ['inertia', 'first law', 'rest', 'motion'], conceptId: 'newtons_laws', diagramId: 'first_law', confidence: 0.85 },
    { keywords: ['force', 'mass', 'acceleration', 'f equals ma', 'second law'], conceptId: 'newtons_laws', diagramId: 'second_law', confidence: 0.9 },
    { keywords: ['action', 'reaction', 'third law', 'equal opposite'], conceptId: 'newtons_laws', diagramId: 'third_law', confidence: 0.85 },
];

/**
 * Detect high-confidence keyword hints in narration text.
 * Hard Rule 18: These are SUGGESTIONS only — caller must verify against registry before showing.
 *
 * @param text - The narration text (already stripped of [VISUAL:] markers)
 * @param topicId - Current topic (for context filtering)
 * @returns Array of keyword hints, sorted by confidence descending
 */
export function detectKeywordHints(text: string, _topicId?: string): KeywordHint[] {
    if (!text) return [];
    const lower = text.toLowerCase();
    const hints: KeywordHint[] = [];

    for (const entry of KEYWORD_HINT_MAP) {
        const matched = entry.keywords.find(kw => lower.includes(kw.toLowerCase()));
        if (matched) {
            hints.push({
                keyword: matched,
                candidateConceptId: entry.conceptId,
                candidateDiagramId: entry.diagramId,
                confidence: entry.confidence,
            });
        }
    }

    // Sort by confidence descending, deduplicate by activeDiagramId
    const seen = new Set<string>();
    return hints
        .sort((a, b) => b.confidence - a.confidence)
        .filter(h => {
            const key = `${h.candidateConceptId}.${h.candidateDiagramId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

// ── Alignment Validator (Hard Rule 23) ────────────────────────────────────────

/**
 * Hard Rule 23 — Speech ↔ Diagram Alignment Test.
 * # of [VISUAL:] markers in lesson text must be >= # of major concepts in registry.
 * Else block publish.
 *
 * @param lessonText - Full lesson narration text (with markers)
 * @param registeredConceptCount - Number of concepts in the registry for this topic
 */
export function validateDiagramAlignment(
    lessonText: string,
    registeredConceptCount: number
): AlignmentResult {
    const markers = parseMarkers(lessonText);
    const markerCount = markers.length;
    const pass = markerCount >= registeredConceptCount;

    return {
        pass,
        markerCount,
        conceptCount: registeredConceptCount,
        blockPublish: !pass,
        message: pass
            ? `✅ Alignment OK: ${markerCount} markers ≥ ${registeredConceptCount} concepts`
            : `❌ Alignment FAIL: ${markerCount} markers < ${registeredConceptCount} concepts. Lesson blocked.`,
    };
}

/**
 * Build a character-position schedule for marker firing during speech.
 * Maps stripped char positions to activeDiagramId values.
 * Used by TeachingPage to fire diagram-switch events at the right moment.
 */
export function buildMarkerSchedule(
    text: string
): Array<{ strippedCharIndex: number; activeDiagramId: string }> {
    return parseMarkers(text).map(m => ({
        strippedCharIndex: m.strippedCharIndex,
        activeDiagramId: m.activeDiagramId,
    }));
}
