/**
 * Visual Contract Validator — Add-Ons 2 & 3
 *
 * Add-On 2: Marker Coverage Validator
 *   Ensures every concept_id in the registry appears in the lesson narration.
 *
 * Add-On 3: Bidirectional Contract
 *   Every [VISUAL:x] in speech → must exist in registry.
 *   Every marker in registry → must be referenced in speech.
 */

import { getVisualsForTopic, VisualRegistryEntry } from '../data/visualRegistry';

// ─── Marker Extraction ────────────────────────────────────────────────────────

/** Regex to extract [VISUAL:marker_id] tags from a lesson script */
const VISUAL_TAG_REGEX = /\[VISUAL:([a-zA-Z0-9_-]+)\]/g;

/**
 * Extract all marker IDs referenced in a lesson script.
 * Matches tags of the form [VISUAL:marker_id].
 */
export function extractMarkersFromScript(script: string): string[] {
    const markers: string[] = [];
    let match: RegExpExecArray | null;
    const regex = new RegExp(VISUAL_TAG_REGEX.source, 'g');
    while ((match = regex.exec(script)) !== null) {
        markers.push(match[1].toLowerCase());
    }
    return [...new Set(markers)]; // deduplicate
}

// ─── Add-On 2: Coverage Validator ────────────────────────────────────────────

export interface CoverageReport {
    /** Markers in registry that have NO [VISUAL:x] reference in the script */
    uncoveredConcepts: string[];
    /** Coverage ratio: covered / total */
    coverageRatio: number;
    /** If true, lesson should be blocked from starting */
    blockLesson: boolean;
    /** Human-readable summary */
    summary: string;
}

/**
 * Validates that every marker in the registry appears at least once in the lesson script.
 * If any registry marker is missing from the script, the lesson is blocked.
 */
export function validateCoverage(
    entry: VisualRegistryEntry,
    lessonScript: string
): CoverageReport {
    const scriptMarkers = new Set(extractMarkersFromScript(lessonScript));
    const registryMarkers = entry.visual_assets.map(a => a.marker_id.toLowerCase());

    const uncoveredConcepts = registryMarkers.filter(m => !scriptMarkers.has(m));
    const coverageRatio = registryMarkers.length > 0
        ? (registryMarkers.length - uncoveredConcepts.length) / registryMarkers.length
        : 1.0;

    const blockLesson = uncoveredConcepts.length > 0;
    const summary = blockLesson
        ? `❌ Coverage fail: ${Math.round(coverageRatio * 100)}%. Missing in script: [${uncoveredConcepts.join(', ')}]`
        : `✅ Full coverage: all ${registryMarkers.length} markers referenced in script.`;

    return { uncoveredConcepts, coverageRatio, blockLesson, summary };
}

/**
 * Convenience wrapper: validates coverage for a topic by ID.
 */
export function validateMarkerCoverage(
    topicId: string,
    lessonScript: string
): CoverageReport | null {
    const entry = getVisualsForTopic(topicId);
    if (!entry) return null;
    return validateCoverage(entry, lessonScript);
}

// ─── Add-On 3: Bidirectional Contract ────────────────────────────────────────

export interface BidirectionalContractReport {
    /** [VISUAL:x] tags in script that have NO matching registry entry */
    forwardViolations: string[];
    /** Registry markers that are NOT referenced in the script */
    reverseViolations: string[];
    /** True only when both forward and reverse checks pass */
    isClosedLoop: boolean;
    /** Human-readable summary */
    summary: string;
}

/**
 * Validates the bidirectional contract between a lesson script and the visual registry.
 *
 * Forward:  every [VISUAL:x] in script → must exist in registry
 * Reverse:  every registry marker → must appear in script
 *
 * Both must pass for a "closed-loop" lesson.
 */
export function validateBidirectionalContract(
    topicId: string,
    lessonScript: string
): BidirectionalContractReport | null {
    const entry = getVisualsForTopic(topicId);
    if (!entry) return null;

    const scriptMarkers = extractMarkersFromScript(lessonScript);
    const registryMarkerSet = new Set(entry.visual_assets.map(a => a.marker_id.toLowerCase()));

    // Forward: script → registry
    const forwardViolations = scriptMarkers.filter(m => !registryMarkerSet.has(m));

    // Reverse: registry → script
    const scriptMarkerSet = new Set(scriptMarkers);
    const reverseViolations = [...registryMarkerSet].filter(m => !scriptMarkerSet.has(m));

    const isClosedLoop = forwardViolations.length === 0 && reverseViolations.length === 0;

    const lines: string[] = [];
    if (isClosedLoop) {
        lines.push(`✅ Closed-loop contract verified for topic "${topicId}".`);
    } else {
        if (forwardViolations.length > 0) {
            lines.push(`❌ Forward violations (script → registry): [${forwardViolations.join(', ')}] not in registry.`);
        }
        if (reverseViolations.length > 0) {
            lines.push(`⚠️ Reverse violations (registry → script): [${reverseViolations.join(', ')}] never shown.`);
        }
    }

    return { forwardViolations, reverseViolations, isClosedLoop, summary: lines.join(' ') };
}
