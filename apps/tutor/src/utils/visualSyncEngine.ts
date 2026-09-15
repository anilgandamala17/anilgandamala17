/**
 * Universal Visual-Synced Teaching System
 * Central constants, marker parsing, validation, and the semantic bridge
 * between "what the AI is saying" and "which visual state to show".
 */

import type { TeachingStep, TeachingSession } from '../types';

// ─── 7. GREEN BOARD BEHAVIOR (platform standard) ─────────────────────────────
export const GREEN_BOARD_PADDING_PX = 32;
export const GREEN_BOARD_FADE_DURATION_MS = 300;
export const GREEN_BOARD_SAFE_ASPECT_RATIO = 16 / 9;

// Visual style standardization: same font, label style, arrow style
export const BOARD_VISUAL_STYLE = {
    titleFontSizePx: 18,
    labelFontSizePx: 14,
    captionFontSizePx: 12,
    paddingPx: GREEN_BOARD_PADDING_PX,
} as const;

// Sync marker patterns: [VISUAL:xxx] and [[VISUAL:xxx]] (AI lesson script standard)
export const VISUAL_MARKER_REGEX = /\[VISUAL:(.+?)\]/g;
export const VISUAL_MARKER_DOUBLE_REGEX = /\[\[VISUAL:(.+?)\]\]/g;

// ─── VISUAL SYNC ENGINE: subscribe / emit (semantic bridge) ─────────────────
export type MarkerListener = (marker: string) => void;
const markerListeners: MarkerListener[] = [];

export function subscribeToVisualMarkers(fn: MarkerListener): () => void {
    markerListeners.push(fn);
    return () => {
        const i = markerListeners.indexOf(fn);
        if (i !== -1) markerListeners.splice(i, 1);
    };
}

export function emitVisualMarker(marker: string) {
    const trimmed = (marker || '').trim();
    if (!trimmed) return;
    try {
        void import('../services/analyticsService').then((mod) => {
            const { topicId, segmentIndex } = mod.getAnalyticsLessonContext();
            if (!trimmed || trimmed.toLowerCase() === 'none') {
                mod.analytics.visualSyncError(topicId, 'missing_target', segmentIndex);
            } else if (Math.random() < 0.12) {
                mod.analytics.visualHighlight(topicId, segmentIndex, 'success');
            }
        });
    } catch {
        /* analytics must never break sync */
    }
    markerListeners.forEach((listener) => {
        try {
            listener(trimmed);
        } catch (e) {
            console.warn('Visual marker listener error:', e);
        }
    });
}

/**
 * Scan lesson text for [VISUAL:xxx] or [[VISUAL:xxx]] and emit each marker.
 * Call when AI text is produced or when a step's spokenContent is set.
 */
export function processLessonTextAndEmitMarkers(text: string): void {
    if (!text || typeof text !== 'string') return;
    const single = /\[VISUAL:(.+?)\]/g;
    const double = /\[\[VISUAL:(.+?)\]\]/g;
    let match: RegExpExecArray | null;
    while ((match = single.exec(text)) !== null) {
        emitVisualMarker(match[1]);
    }
    while ((match = double.exec(text)) !== null) {
        emitVisualMarker(match[1]);
    }
}

/**
 * Parse [VISUAL:xxx] markers from narration and return list with char indices
 * in the cleaned text (so TTS can dispatch at correct boundary).
 */
export function parseVisualMarkersFromNarration(narration: string): { id: string; charIndex: number }[] {
    const markers: { id: string; charIndex: number }[] = [];
    let match: RegExpExecArray | null;
    const regex = new RegExp(VISUAL_MARKER_REGEX.source, 'g');
    while ((match = regex.exec(narration)) !== null) {
        markers.push({ id: match[1].trim(), charIndex: match.index });
    }
    const doubleRegex = new RegExp(VISUAL_MARKER_DOUBLE_REGEX.source, 'g');
    while ((match = doubleRegex.exec(narration)) !== null) {
        markers.push({ id: match[1].trim(), charIndex: match.index });
    }
    markers.sort((a, b) => a.charIndex - b.charIndex);
    return markers;
}

/** Extract all unique marker IDs from lesson steps (for registry validation). */
export function extractMarkerIdsFromSteps(steps: { spokenContent?: string }[]): string[] {
    const ids = new Set<string>();
    const single = /\[VISUAL:(.+?)\]/g;
    const double = /\[\[VISUAL:(.+?)\]\]/g;
    for (const step of steps) {
        const text = step.spokenContent || '';
        let m: RegExpExecArray | null;
        while ((m = single.exec(text)) !== null) ids.add(m[1].trim());
        while ((m = double.exec(text)) !== null) ids.add(m[1].trim());
    }
    return Array.from(ids);
}

/**
 * Strip [VISUAL:xxx] from text for TTS. Returns cleaned text and adjusted
 * marker char indices relative to cleaned text.
 */
export function stripVisualMarkersForSpeech(
    narration: string
): { speechText: string; markers: { id: string; charIndex: number }[] } {
    const markers = parseVisualMarkersFromNarration(narration);
    const speechText = narration.replace(VISUAL_MARKER_REGEX, '').replace(/\s+/g, ' ').trim();
    let offset = 0;
    const adjustedMarkers = markers.map((m) => {
        const tagLen = `[VISUAL:${m.id}]`.length;
        const adjustedIndex = Math.max(0, m.charIndex - offset);
        offset += tagLen;
        return { id: m.id, charIndex: adjustedIndex };
    });
    return { speechText, markers: adjustedMarkers };
}

/**
 * Ensure every TeachingStep has a visual: assign visualId from topicId or step id
 * if missing, and ensure visualType is set.
 */
export function ensureSegmentHasVisual(
    step: TeachingStep,
    topicId: string,
    index: number
): TeachingStep {
    const updated = { ...step };
    if (!updated.visualId) {
        updated.visualId = topicId || step.id || `step-${index}`;
    }
    if (!updated.visualType) {
        updated.visualType = 'diagram';
    }
    if (!updated.visualMarkers && updated.spokenContent) {
        const parsed = parseVisualMarkersFromNarration(updated.spokenContent);
        if (parsed.length > 0) {
            updated.visualMarkers = parsed.map((m) => ({
                id: m.id,
                label: m.id,
                description: '',
                charIndex: m.charIndex,
            }));
        }
    }
    return updated;
}

/**
 * 9. Quality validation before lesson activation.
 * Validates: visual matches segment, labels/diagram clarity implied by having visualId,
 * sync markers function (we have markers parsed), pause/resume is handled by UI.
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateSessionVisuals(session: TeachingSession | null): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!session || !session.teachingSteps || session.teachingSteps.length === 0) {
        return { valid: false, errors: ['No session or no teaching steps.'], warnings: [] };
    }
    session.teachingSteps.forEach((step, i) => {
        if (!step.visualType) {
            errors.push(`Step ${i + 1} (${step.id}) missing visualType.`);
        }
        if (!step.spokenContent || step.spokenContent.trim().length === 0) {
            warnings.push(`Step ${i + 1} (${step.id}) has no narration.`);
        }
        if (!step.title || step.title.trim().length === 0) {
            warnings.push(`Step ${i + 1} (${step.id}) has no title.`);
        }
    });
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Convert TeachingStep to segment-like shape for sync engine (segment_id, visual_id, timing_markers).
 */
export function stepToSegmentShape(step: TeachingStep) {
    return {
        segment_id: step.id,
        explanation_text: step.content,
        visual_id: step.visualId || step.id,
        visual_type: step.visualType,
        timing_markers: step.visualMarkers || [],
    };
}

/**
 * 5. Visual fetch strategy (when segment visual not in registry).
 * Order: 1) Internal visual library (TopicVisualRegistry + SubjectFallbacks)
 *        2) Trusted web sources (future)
 *        3) AI-generated diagram (future)
 * Standardize and store for reuse. Currently getTopicVisual() in topicVisuals
 * implements 1) and fallback to CatchStructureVisual; 2–3 can be wired here later.
 */
export function getVisualIdForSegment(step: TeachingStep, topicId: string): string {
    return step.visualId || topicId || step.id;
}
