// topicVisuals.tsx — Diagram-First Academic Canvas
// Hard Rules: No animations, no decorative UI, blackboard style only.

/* eslint-disable react-refresh/only-export-components -- visual registry exports types + multiple canvas components */
import React from 'react';
import { MonitorOff } from 'lucide-react';
import { useSpeechSync } from '../../hooks/useSpeechSync';

// ============================================
// CORE UTILITIES
// ============================================

// Visual Props interface
export interface VisualProps {
    isSpeaking: boolean;
    isPaused: boolean;
    stepId: string;
    title?: string;
    visualMarkers?: { id: string; label: string; description: string }[];
    // Base props for consistent styling
    id: string;
    label: string;
    description: string;
    activeVisual?: string | null;
}

/**
 * Returns the active marker ID from speech sync.
 * No animation state — purely for highlight selection.
 */
export function useVisualSync(stepId: string) {
    const { activeMarker } = useSpeechSync(stepId);
    return activeMarker;
}

// Chalk palette
const CW = 'rgba(255,255,255,0.85)';  // chalk white
const CG = '#86efac';                   // chalk green
// CB and CR are removed as they are no longer used.

/** Highlight stroke for active marker — thin outline only (Hard Rule 10) */
export function highlight(markerId: string, activeMarker: string | null, base = CW): string {
    return markerId === activeMarker ? CG : base;
}

export function highlightWidth(markerId: string, activeMarker: string | null, base = 1.5): number {
    return markerId === activeMarker ? 2.5 : base;
}


/** Hard Rule 12: Shown when no proper diagram exists for a concept */
export const DiagramUnavailable: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
            <div className="bg-slate-800/50 p-6 rounded-full mb-4">
                <MonitorOff size={48} className="opacity-20" />
            </div>
            <h3 className="text-xl font-medium text-slate-200 mb-2">Visual Content Unavailable</h3>
            <p className="max-w-md text-sm leading-relaxed">
                We're having trouble loading the specific diagram for this step.
                Please focus on the explanation while we attempt to restore the visual.
            </p>
        </div>
    );
};

// ============================================
// LEGACY COMPONENT COMPATIBILITY
// ============================================

/** 
 * Fallback visual for topics not yet in the registry. 
 * Renders a structured box with the topic title.
 */
export function CatchStructureVisual({ title }: VisualProps) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-xl">
            <div className="text-white/40 text-sm mb-2 italic">Topic Architecture</div>
            <div className="text-white text-lg font-bold border-b-2 border-emerald-500/50 pb-2 mb-4">
                {title || 'Academic Concept'}
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
                <div className="h-20 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center text-[10px] text-white/30 uppercase tracking-widest">Structure</div>
                <div className="h-20 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center text-[10px] text-white/30 uppercase tracking-widest">Logic</div>
            </div>
        </div>
    );
}

/** 
 * Legacy registry fallback path.
 * In the modern engine, DiagramCanvas is preferred.
 */
export function getTopicVisual(_topicId: string, _title?: string): (props: VisualProps) => JSX.Element {
    return CatchStructureVisual;
}
