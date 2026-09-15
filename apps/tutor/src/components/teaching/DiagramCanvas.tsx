/**
 * DiagramCanvas.tsx — Hard Rules 15, 16, 21, 22, 24
 *
 * The green board's diagram renderer. Receives activeDiagramId ("concept_id.diagram_id")
 * and instantly replaces the current diagram with the matching registered one.
 *
 * HR 15: Instant switch — no animation, no fade
 * HR 16: React key={activeDiagramId} destroys previous diagram component
 * HR 21: Only ONE diagram rendered at any time
 * HR 22: Emphasis via thin outline + color shift only (no motion)
 * HR 24: Missing diagram → smart subject-relevant fallback, then "Diagram unavailable"
 *
 * Data-Driven Engine: Uses DiagramRenderer to load SVG from svg_path.
 * Unregistered topics get a smart subject-relevant SVG fallback.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import {
    getConceptDiagram,
    getFirstActiveDiagramId,
    getFallbackDiagram,
    stripDiagramPartSuffix,
} from '../../data/visualRegistry';
import DiagramRenderer, { DiagramUnavailable } from './DiagramRenderer';
import { TextBoardVisual } from './TextBoardVisual';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DiagramCanvasProps {
    /** Current topic ID (from URL params or parent) */
    topicId?: string;
    /**
     * Active diagram key: "concept_id.diagram_id"
     * Null = show first concept diagram (lesson start state).
     */
    activeDiagramId: string | null;
    /** Optional sub-part highlight (e.g. "outer", "matrix") for data-mito-part SVG sync */
    highlightPartId?: string | null;
    /** Step ID for speech sync */
    stepId: string;
    isSpeaking: boolean;
    isPaused: boolean;
    stepContent?: string;
}

// ── DiagramCanvas ─────────────────────────────────────────────────────────────

export function DiagramCanvas({
    topicId: topicIdProp,
    activeDiagramId,
    highlightPartId,
    stepContent,
    // stepId,
    // isSpeaking,
    // isPaused,
}: DiagramCanvasProps) {
    // Resolve topicId from URL if not passed as prop
    const { topicId: topicIdParam } = useParams<{ topicId: string }>();
    const topicId = topicIdProp || topicIdParam || '';

    // Resolve effective activeDiagramId: use first diagram if null (lesson start)
    const effectiveId = activeDiagramId ?? getFirstActiveDiagramId(topicId);

    // Parse concept_id and diagram_id from "concept_id.diagram_id" (strip optional .part suffix)
    const lookupId = effectiveId ? stripDiagramPartSuffix(effectiveId) : '';
    const dotIndex = lookupId ? lookupId.indexOf('.') : -1;
    const conceptId = dotIndex !== -1 ? lookupId.slice(0, dotIndex) : '';
    const diagramId = dotIndex !== -1 ? lookupId.slice(dotIndex + 1) : '';

    // Look up the ConceptDiagram from registry
    const exactDiagram = effectiveId ? getConceptDiagram(topicId, effectiveId) : null;

    const isTextBoardStep = Boolean(
        (typeof stepContent === 'string' && /^\s*(TEXT:|text-board\b)/i.test(stepContent)) ||
        (typeof effectiveId === 'string' && /^(TEXT:|text-board\b)/i.test(effectiveId)),
    );

    if (!exactDiagram && isTextBoardStep && stepContent) {
        return (
            <div className="w-full h-full" key={effectiveId || 'text-board'}>
                <TextBoardVisual content={stepContent} />
            </div>
        );
    }

    const conceptDiagram = exactDiagram ?? getFallbackDiagram(topicId);

    // If still no concept diagram (shouldn't happen with fallback, but safe check)
    if (!conceptDiagram) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <DiagramUnavailable
                    title={`${conceptId}.${diagramId}`}
                    reason="Diagram not available for this topic"
                />
            </div>
        );
    }

    // Hard Rule 16: key={effectiveId} ensures React destroys and remounts on diagram change
    // Hard Rule 21: Only this one component is rendered — no hidden siblings
    return (
        <div
            key={effectiveId}  // Hard Rule 16 — destroy previous on switch
            className="w-full h-full"
            data-diagram-id={effectiveId}
            data-purpose={conceptDiagram.purpose}
        >
            {conceptDiagram.svg_path ? (
                // Data-driven SVG rendering via DiagramRenderer
                // Hard Rule 22: no motion, only color/outline emphasis
                <DiagramRenderer
                    svg_path={conceptDiagram.svg_path}
                    title={conceptDiagram.title}
                    diagram_id={effectiveId || undefined}
                    className="w-full h-full"
                    highlightPartId={highlightPartId}
                />
            ) : (
                // No svg_path — diagram unavailable (Hard Rule 24)
                <DiagramUnavailable
                    title={conceptDiagram.title}
                    reason="No SVG path configured for this diagram"
                />
            )}
        </div>
    );
}

export default React.memo(DiagramCanvas);
