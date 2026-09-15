import React, { useState, useEffect } from 'react';
import { diagramAssetUrl } from '../../utils/diagramAssetUrl';
import { preloadService } from '../../utils/visualPreloadService';

/**
 * DiagramRenderer — Data-Driven SVG Diagram Engine
 *
 * Loads SVG assets from /tutor-media/diagrams/{svg_path} based on registry data.
 * No per-topic logic. No fallback to generic visuals.
 * If svg_path is missing or SVG fails to load → shows DiagramUnavailable.
 */

interface DiagramRendererProps {
    /** Path relative to /tutor-media/diagrams/ e.g. "atomic_theory/atom_bohr.svg" */
    svg_path: string | undefined;
    /** Human-readable title for the diagram */
    title?: string;
    /** Unique key — changing this triggers instant swap */
    diagram_id?: string;
    /** Optional CSS class for the wrapper */
    className?: string;
    /** Highlight specific labels (future: used for sync highlighting) */
    highlightLabels?: string[];
    /**
     * In-diagram part id from narration markers (e.g. "outer", "matrix").
     * SVG groups use data-mito-part="{id}" or data-sync-part="{id}" for speech-sync dim/highlight.
     */
    highlightPartId?: string | null;
}

type LoadState = 'loading' | 'loaded' | 'error';

/**
 * Shown when svg_path is missing or the SVG fails to load.
 * Hard rule: no generic fallback visual — only this message.
 */
const DiagramUnavailable: React.FC<{ title?: string; reason?: string }> = ({ title, reason }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            minHeight: '200px',
            background: 'rgba(0,0,0,0.2)',
            border: '1px dashed rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'monospace',
            textAlign: 'center',
            padding: '24px',
            boxSizing: 'border-box',
        }}
    >
        <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>⬜</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
            Diagram unavailable
        </div>
        {title && (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>
                {title}
            </div>
        )}
        {reason && (
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                {reason}
            </div>
        )}
    </div>
);

/**
 * DiagramRenderer — renders a single SVG diagram from the /tutor-media/diagrams/ directory.
 *
 * Usage:
 *   <DiagramRenderer svg_path="atomic_theory/atom_bohr.svg" title="Bohr Model" />
 *
 * The svg_path is resolved to: /tutor-media/diagrams/{svg_path}
 * SVGs must follow the blackboard standard: viewBox="0 0 400 280", dark green bg.
 */
const DiagramRenderer: React.FC<DiagramRendererProps> = ({
    svg_path,
    title,
    diagram_id,
    className,
    highlightPartId,
    // highlightLabels: _highlightLabels,
}) => {
    const [loadState, setLoadState] = useState<LoadState>('loading');
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Reset when svg_path changes (instant swap via key)
    useEffect(() => {
        if (!svg_path) {
            setLoadState('error');
            setSvgContent(null);
            return;
        }

        const url = diagramAssetUrl(svg_path);
        let cancelled = false;
        const ac = new AbortController();

        // ── 1. Check synchronous cache first (zero-delay render) ──
        const cachedContent = preloadService.getSvgContent(url);
        if (cachedContent) {
            if (import.meta.env.DEV) console.log(`[DiagramRenderer] Cache hit (instant): ${url}`);
            setSvgContent(cachedContent);
            setLoadState('loaded');
            return () => {
                cancelled = true;
                ac.abort();
            };
        }

        // ── 2. Fallback to network fetch if not cached ──
        setLoadState('loading');
        setSvgContent(null);

        if (import.meta.env.DEV) console.log(`[DiagramRenderer] Network fetch: ${url}`);

        fetch(url, { signal: ac.signal })
            .then((res) => {
                if (cancelled) return '';
                if (!res.ok) {
                    console.error(`[DiagramRenderer] Fetch failed: ${res.status} for ${url}`);
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.text();
            })
            .then((text) => {
                if (cancelled || !text) return;
                // Validate it's an SVG
                if (!text.trim().startsWith('<svg') && !text.includes('<svg')) {
                    console.error(`[DiagramRenderer] Invalid SVG content for ${url}`);
                    throw new Error('Not a valid SVG');
                }
                setSvgContent(text);
                setLoadState('loaded');
            })
            .catch((err) => {
                if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
                console.error(`[DiagramRenderer] Error loading ${url}:`, err);
                setLoadState('error');
                setSvgContent(null);
            });

        return () => {
            cancelled = true;
            ac.abort();
        };
    }, [svg_path]);

    // After SVG renders in DOM, force it to fill the board perfectly
    useEffect(() => {
        if (loadState !== 'loaded' || !containerRef.current) return;
        const svgEl = containerRef.current.querySelector('svg');
        if (svgEl) {
            svgEl.setAttribute('width', '100%');
            svgEl.setAttribute('height', '100%');
            svgEl.style.width = '100%';
            svgEl.style.height = '100%';
            svgEl.style.display = 'block';
            svgEl.style.position = 'absolute';
            svgEl.style.inset = '0';
            // Use 'meet' to keep aspect ratio intact (no distortion)
            // Content fills the shorter axis, letterbox on the longer
            svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
    }, [loadState, svgContent]);

    const highlightPartIdRef = React.useRef(highlightPartId);
    
    // Core function to directly mutate DOM classes based on part ID and speech chunk
    const updateHighlights = React.useCallback((partId: string | null | undefined, chunkText: string) => {
        if (loadState !== 'loaded' || !containerRef.current) return;
        const root = containerRef.current.querySelector('svg');
        if (!root) return;
        
        const taggedLayers = Array.from(root.querySelectorAll<SVGElement>('[data-mito-part], [data-sync-part]'));
        const textElements = Array.from(root.querySelectorAll<SVGTextElement>('text, tspan'));
        
        const layers = [...taggedLayers, ...textElements];
        if (layers.length === 0) return;

        const query = (partId && partId !== 'overview') ? partId.toLowerCase().trim() : '';
        const chunkQuery = chunkText ? chunkText.replace(/[^\w\s]/g, '').toLowerCase().trim() : '';

        // If there is no active query and no active speech chunk, clear everything and return
        if (!query && !chunkQuery) {
            layers.forEach((el) => {
                el.classList.remove('mito-dim', 'mito-highlight', 'text-highlight');
            });
            return;
        }

        // Helper to check if an element matches our queries
        const checkMatch = (el: SVGElement) => {
            const part = el.getAttribute('data-mito-part') ?? el.getAttribute('data-sync-part');
            
            // 1. Explicit marker match
            if (query) {
                if (part && part.toLowerCase().trim() === query) {
                    return true;
                }
                if (!part && (el.tagName.toLowerCase() === 'text' || el.tagName.toLowerCase() === 'tspan')) {
                    const text = el.textContent?.toLowerCase().trim() || '';
                    if (text && (text === query || text.includes(query) || (query.includes(text) && text.length > 3))) {
                        return true;
                    }
                }
            }

            // 2. Dynamic speech chunk match
            if (chunkQuery) {
                if (part) {
                    const partStr = part.replace(/[^\w\s]/g, '').toLowerCase().trim();
                    if (partStr.length > 3 && chunkQuery.includes(partStr)) {
                        return true;
                    }
                }
                if (el.tagName.toLowerCase() === 'text' || el.tagName.toLowerCase() === 'tspan') {
                    const text = el.textContent?.replace(/[^\w\s]/g, '').toLowerCase().trim() || '';
                    if (text.length > 3 && (chunkQuery.includes(text) || text.includes(chunkQuery))) {
                        return true;
                    }
                }
            }

            return false;
        };

        // Scan if there is at least one match on the board
        let hasAnyMatch = false;
        for (const el of layers) {
            if (checkMatch(el)) {
                hasAnyMatch = true;
                break;
            }
        }

        // Apply highlights/dimming if a match exists, otherwise show everything normally
        layers.forEach((el) => {
            el.classList.remove('mito-dim', 'mito-highlight', 'text-highlight');
            
            if (hasAnyMatch) {
                if (checkMatch(el)) {
                    el.classList.add('mito-highlight');
                    if (el.tagName.toLowerCase() === 'text' || el.tagName.toLowerCase() === 'tspan') {
                        el.classList.add('text-highlight');
                    }
                } else {
                    el.classList.add('mito-dim');
                }
            }
        });
    }, [loadState]);

    // Handle React state updates (explicit part IDs)
    useEffect(() => {
        highlightPartIdRef.current = highlightPartId;
        updateHighlights(highlightPartId, ''); 
    }, [highlightPartId, updateHighlights]);

    // Handle initial SVG load
    useEffect(() => {
        if (loadState === 'loaded') {
            updateHighlights(highlightPartIdRef.current, '');
        }
    }, [loadState, updateHighlights]);

    // Handle real-time speech DOM updates without React re-renders
    useEffect(() => {
        const handleSpeechChunk = (e: Event) => {
            const ce = e as CustomEvent;
            const chunk = ce.detail?.chunkText || '';
            updateHighlights(highlightPartIdRef.current, chunk);
        };
        const handleSpeechEnd = () => {
            updateHighlights(highlightPartIdRef.current, '');
        };
        window.addEventListener('speech-active-chunk', handleSpeechChunk);
        window.addEventListener('speech-end', handleSpeechEnd);
        return () => {
            window.removeEventListener('speech-active-chunk', handleSpeechChunk);
            window.removeEventListener('speech-end', handleSpeechEnd);
        };
    }, [updateHighlights]);

    // No svg_path provided
    if (!svg_path) {
        return <DiagramUnavailable title={title} reason="No diagram path specified" />;
    }

    // Error loading
    if (loadState === 'error') {
        return (
            <DiagramUnavailable
                title={title}
                reason={`Could not load: ${diagramAssetUrl(svg_path)}`}
            />
        );
    }

    // Loading state
    if (loadState === 'loading') {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    minHeight: '200px',
                    background: 'rgba(26,58,42,0.5)',
                    borderRadius: '8px',
                }}
            >
                <div
                    style={{
                        width: '32px',
                        height: '32px',
                        border: '2px solid rgba(134,239,172,0.3)',
                        borderTopColor: '#86efac',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Loaded — render inline SVG, absolutely fills the board edge-to-edge
    return (
        <div
            key={diagram_id || svg_path}
            ref={containerRef}
            className={`diagram-renderer-canvas ${className || ''}`}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                background: '#1a3a2a',
                borderRadius: '8px',
            }}
            aria-label={title || 'Diagram'}
            role="img"
        >
            <style>{`
                .diagram-renderer-canvas > div > svg,
                .diagram-renderer-canvas svg {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    display: block !important;
                }
                .diagram-renderer-canvas [data-mito-part],
                .diagram-renderer-canvas [data-sync-part],
                .diagram-renderer-canvas text,
                .diagram-renderer-canvas tspan { 
                    transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), 
                                filter 0.35s cubic-bezier(0.4, 0, 0.2, 1), 
                                fill 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                                transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                    transform-box: fill-box;
                    transform-origin: center;
                }
                .diagram-renderer-canvas .mito-dim { 
                    opacity: 0.55; 
                    filter: grayscale(0.15) saturate(0.85); 
                }
                .diagram-renderer-canvas .mito-highlight {
                    opacity: 1 !important;
                    filter: drop-shadow(0 0 12px rgba(250, 204, 21, 0.85)) !important;
                    animation: gentle-pulse 2.5s infinite ease-in-out;
                }
                .diagram-renderer-canvas .text-highlight {
                    fill: #fef08a !important; /* light yellow glow for text */
                    font-weight: 800;
                    filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.9)) !important;
                }
                @keyframes gentle-pulse {
                    0%, 100% {
                        transform: scale(1);
                        filter: drop-shadow(0 0 12px rgba(250, 204, 21, 0.85)) !important;
                    }
                    50% {
                        transform: scale(1.025); /* subtle zoom */
                        filter: drop-shadow(0 0 16px rgba(250, 204, 21, 0.95)) !important;
                    }
                }
            `}</style>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                }}
                dangerouslySetInnerHTML={{ __html: svgContent! }}
            />
        </div>
    );
};

export default React.memo(DiagramRenderer);
export { DiagramUnavailable };
export type { DiagramRendererProps };
