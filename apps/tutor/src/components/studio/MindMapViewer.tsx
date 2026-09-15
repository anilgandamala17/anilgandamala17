import { useState, useRef, useCallback } from 'react';
import type { MindMap, MindMapNode } from '../../types';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { ExportService } from '../../services/exportService';

// ─── Canvas geometry ───────────────────────────────────────────────────────
const W = 1100, H = 840;
const CX = W / 2, CY = H / 2;
const BASE_CAT_RADIUS = 195;
const BASE_CONCEPT_RADIUS = 365;

// Hash string for deterministic layouts
function hashString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    return Math.abs(hash);
}

// ─── Branch colour palette ─────────────────────────────────────────────────
const PALETTE = [
    '#7c3aed', '#2563eb', '#059669', '#d97706',
    '#dc2626', '#0891b2', '#9333ea', '#15803d', '#f43f5e',
];

function toRgba(hex: string, a: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}

// ─── SVG quad-bezier path ──────────────────────────────────────────────────
function qPath(x1: number, y1: number, x2: number, y2: number, bend = 0.12) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const bx = mx + (-dy / len) * len * bend;
    const by = my + (dx / len) * len * bend;
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${bx.toFixed(1)} ${by.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// ─── Text wrapping for SVG ─────────────────────────────────────────────────
function wrap(text: string, max = 13): string[] {
    if (text.length <= max) return [text];
    const words = text.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
        const next = cur ? `${cur} ${w}` : w;
        if (next.length > max && cur) { lines.push(cur); cur = w; }
        else cur = next;
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
}

// SVG text block centred at (x, y)
function SvgLabel({ text, x, y, size = 10, fill = '#fff', max = 13 }: {
    text: string; x: number; y: number; size?: number; fill?: string; max?: number;
}) {
    const lines = wrap(text, max);
    const lh = size * 1.35;
    return (
        <text textAnchor="middle" fill={fill} fontSize={size} fontWeight="600"
            fontFamily="system-ui,-apple-system,sans-serif"
            className="select-none pointer-events-none">
            {lines.map((l, i) => (
                <tspan key={i} x={x} y={y - (lines.length - 1) * lh / 2 + i * lh}
                    dominantBaseline="middle">{l}</tspan>
            ))}
        </text>
    );
}

// ─── Layout ────────────────────────────────────────────────────────────────
interface CatLayout {
    node: MindMapNode; x: number; y: number; angle: number; color: string;
    concepts: { node: MindMapNode; x: number; y: number }[];
}

function buildLayout(central: MindMapNode, layoutSeed: number): CatLayout[] {
    const cats = central.children ?? [];
    const layoutType = layoutSeed % 3; // 0: Radial, 1: Orbital/Staggered, 2: Expanding Net

    return cats.map((cat, i) => {
        const angle = (i / cats.length) * 2 * Math.PI - Math.PI / 2;

        let catR = BASE_CAT_RADIUS;
        if (layoutType === 1) catR = BASE_CAT_RADIUS + (i % 2 === 0 ? -30 : 40);
        else if (layoutType === 2) catR = BASE_CAT_RADIUS * (1 - 0.2 * Math.cos(angle * 2)); // Elliptical

        const cx = CX + catR * Math.cos(angle);
        const cy = CY + catR * Math.sin(angle);
        const color = cat.color || PALETTE[i % PALETTE.length];
        const cons = cat.children ?? [];

        const spreadFactor = layoutType === 2 ? 45 : 35; // Wider spread for net
        const half = cons.length <= 1 ? 0 : (Math.min(spreadFactor, cons.length * 13) * Math.PI / 180);

        return {
            node: cat, x: cx, y: cy, angle, color,
            concepts: cons.map((con, j) => {
                const off = cons.length <= 1 ? 0 : ((j / (cons.length - 1)) - 0.5) * 2 * half;
                const a = angle + off;

                let conR = BASE_CONCEPT_RADIUS;
                if (layoutType === 1) conR += (j % 2 === 0 ? 30 : -20); // Jagged edge out
                else if (layoutType === 2) conR = BASE_CONCEPT_RADIUS * (1 - 0.15 * Math.cos((a) * 2));

                return { node: con, x: CX + conR * Math.cos(a), y: CY + conR * Math.sin(a) };
            }),
        };
    });
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function MindMapViewer({ mindMap }: { mindMap: MindMap }) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState<string | null>(null);
    const [activePopupNode, setActivePopupNode] = useState<{ node: MindMapNode, x: number, y: number, color: string } | null>(null);
    const dragging = useRef(false);
    const last = useRef({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);

    const onWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(z => Math.max(0.35, Math.min(3.5, z + (e.deltaY > 0 ? -0.1 : 0.1))));
    }, []);
    const onDown = useCallback((e: React.MouseEvent) => {
        dragging.current = true; last.current = { x: e.clientX, y: e.clientY };
        if ((e.target as Element).tagName === 'svg') setActivePopupNode(null); // Click background to dismiss
    }, []);
    const onMove = useCallback((e: React.MouseEvent) => {
        if (!dragging.current) return;
        setPan(p => ({ x: p.x + e.clientX - last.current.x, y: p.y + e.clientY - last.current.y }));
        last.current = { x: e.clientX, y: e.clientY };
    }, []);
    const onUp = useCallback(() => { dragging.current = false; }, []);

    const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); setActivePopupNode(null); };
    const exportPng = () => ExportService.exportToPNG('mm-wrap', `${mindMap.topicName.replace(/\s+/g, '-')}-mindmap`);

    const central = mindMap.nodes[0];
    const layoutSeed = hashString(mindMap.topicName);
    const layout = central ? buildLayout(central, layoutSeed) : [];
    const xform = `translate(${CX + pan.x} ${CY + pan.y}) scale(${zoom}) translate(${-CX} ${-CY})`;

    return (
        <div id="mm-wrap" className="flex flex-col h-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-950 dark:to-slate-900">

            {/* ── toolbar ─────────────────────────────────────── */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800">
                <div>
                    <p className="font-bold text-sm text-gray-800 dark:text-slate-100 leading-tight">{mindMap.topicName}</p>
                    <p className="text-[10px] text-purple-400">Spider Mind Map · Scroll to zoom · Drag to pan</p>
                </div>
                <div className="flex items-center gap-1.5">
                    {[{ icon: <ZoomIn className="w-3.5 h-3.5" />, title: 'Zoom in', fn: () => setZoom(z => Math.min(3.5, z + 0.2)) },
                    { icon: <ZoomOut className="w-3.5 h-3.5" />, title: 'Zoom out', fn: () => setZoom(z => Math.max(0.35, z - 0.2)) },
                    { icon: <RotateCcw className="w-3.5 h-3.5" />, title: 'Reset', fn: reset },
                    ].map((b, i) => (
                        <button key={i} onClick={b.fn} title={b.title}
                            className="p-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-600 dark:text-slate-300">
                            {b.icon}
                        </button>
                    ))}
                    <button onClick={exportPng}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors">
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>
                </div>
            </div>

            {/* ── svg canvas ──────────────────────────────────── */}
            <div className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
                onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove}
                onMouseUp={onUp} onMouseLeave={onUp}>
                <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
                    <defs>
                        <radialGradient id="mm-central-g" cx="45%" cy="38%" r="65%">
                            <stop offset="0%" stopColor={layout[0]?.color || "#a78bfa"} />
                            <stop offset="100%" stopColor={layout[0]?.color ? toRgba(layout[0].color, 0.7) : "#6d28d9"} />
                        </radialGradient>
                        <filter id="mm-shadow">
                            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#00000022" />
                        </filter>
                        <filter id="mm-glow">
                            <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor={layout[0]?.color || "#7c3aed"} floodOpacity="0.45" />
                        </filter>
                        {layout.map((cat, i) => (
                            <radialGradient key={`grad-${i}`} id={`mm-cg-${i}`} cx="45%" cy="35%" r="65%">
                                <stop offset="0%" stopColor={cat.color} stopOpacity=".85" />
                                <stop offset="100%" stopColor={cat.color} />
                            </radialGradient>
                        ))}
                    </defs>

                    <g transform={xform}>

                        {/* ── lines ── */}
                        {layout.map((cat, ci) => {
                            const dim = hovered && hovered !== cat.node.id;
                            return (
                                <g key={`ln-${ci}`}>
                                    <path d={qPath(CX, CY, cat.x, cat.y, 0.07)}
                                        stroke={cat.color} strokeWidth={dim ? 2 : 3.5}
                                        fill="none" strokeLinecap="round"
                                        opacity={dim ? 0.25 : 0.85}
                                        style={{ transition: 'opacity .2s,stroke-width .2s' }} />
                                    {cat.concepts.map((con, coi) => (
                                        <path key={coi} d={qPath(cat.x, cat.y, con.x, con.y, 0.2)}
                                            stroke={cat.color} strokeWidth={dim ? 1 : 1.8}
                                            fill="none" strokeLinecap="round"
                                            opacity={dim ? 0.18 : 0.6}
                                            style={{ transition: 'opacity .2s' }} />
                                    ))}
                                </g>
                            );
                        })}

                        {/* ── concept chips ── */}
                        {layout.map((cat, ci) =>
                            cat.concepts.map((con, coi) => {
                                const label = wrap(con.node.label, 14);
                                const bw = Math.min(130, Math.max(64, con.node.label.length * 6.8 + 20));
                                const bh = label.length * 16 + 10;
                                const dim = hovered && hovered !== cat.node.id;
                                const isHovered = hovered === con.node.id;
                                return (
                                    <g key={`cn-${ci}-${coi}`}
                                        opacity={dim ? 0.22 : 1}
                                        style={{ transition: 'opacity .2s, transform .2s', cursor: 'pointer' }}
                                        transform={isHovered ? `scale(1.03) translate(${-con.x * 0.03}, ${-con.y * 0.03})` : ''}
                                        onMouseEnter={() => { setHovered(con.node.id); if (con.node.description) setActivePopupNode({ node: con.node, x: con.x, y: con.y, color: cat.color }); }}
                                        onMouseLeave={() => { setHovered(null); setActivePopupNode(null); }}
                                        onClick={(e) => { e.stopPropagation(); if (con.node.description) setActivePopupNode({ node: con.node, x: con.x, y: con.y, color: cat.color }); }}>
                                        <rect x={con.x - bw / 2} y={con.y - bh / 2}
                                            width={bw} height={bh} rx={9}
                                            fill={toRgba(cat.color, 0.11)}
                                            stroke={toRgba(cat.color, isHovered ? 0.9 : 0.55)} strokeWidth={isHovered ? 2.5 : 1.5}
                                            filter="url(#mm-shadow)" />
                                        <circle cx={con.x - bw / 2 + 8} cy={con.y} r={3.5} fill={cat.color} opacity={0.85} />
                                        <SvgLabel text={con.node.label} x={con.x + 3} y={con.y}
                                            size={9.5} fill="#1e1b4b" max={14} />
                                    </g>
                                );
                            })
                        )}

                        {/* ── category circles ── */}
                        {layout.map((cat, ci) => {
                            const icon = cat.node.description && /\p{Emoji}/u.test(cat.node.description)
                                ? cat.node.description : null;
                            const r = 40;
                            const isH = hovered === cat.node.id;
                            return (
                                <g key={`cat-${ci}`} style={{ cursor: 'pointer' }}
                                    onMouseEnter={() => {
                                        setHovered(cat.node.id);
                                        setActivePopupNode({ node: cat.node, x: cat.x, y: cat.y, color: cat.color });
                                    }}
                                    onMouseLeave={() => { setHovered(null); setActivePopupNode(null); }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActivePopupNode({ node: cat.node, x: cat.x, y: cat.y, color: cat.color });
                                    }}>
                                    {isH && <circle cx={cat.x} cy={cat.y} r={r + 9}
                                        fill={toRgba(cat.color, 0.15)} stroke={cat.color}
                                        strokeWidth={1.5} strokeDasharray="5 3" />}
                                    <circle cx={cat.x} cy={cat.y} r={r}
                                        fill={`url(#mm-cg-${ci})`}
                                        filter="url(#mm-shadow)" />
                                    {icon
                                        ? <>
                                            <text x={cat.x} y={cat.y - 10} textAnchor="middle"
                                                fontSize={17} dominantBaseline="middle"
                                                className="select-none pointer-events-none">{icon}</text>
                                            <SvgLabel text={cat.node.label} x={cat.x} y={cat.y + 13}
                                                size={8.5} fill="#fff" max={12} />
                                        </>
                                        : <SvgLabel text={cat.node.label} x={cat.x} y={cat.y}
                                            size={9} fill="#fff" max={12} />
                                    }
                                </g>
                            );
                        })}

                        {/* ── central node ── */}
                        <g style={{ cursor: 'pointer' }}
                            onMouseEnter={() => {
                                setHovered('central');
                                setActivePopupNode({ node: central || { id: 'central', label: mindMap.topicName, description: 'The central foundational topic of this mind map.' }, x: CX, y: CY, color: layout[0]?.color || "#a78bfa" });
                            }}
                            onMouseLeave={() => { setHovered(null); setActivePopupNode(null); }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActivePopupNode({ node: central || { id: 'central', label: mindMap.topicName, description: 'The central foundational topic of this mind map.' }, x: CX, y: CY, color: layout[0]?.color || "#a78bfa" });
                            }}>
                            <g filter="url(#mm-glow)">
                                <circle cx={CX} cy={CY} r={66} fill="url(#mm-central-g)" />
                                <circle cx={CX} cy={CY} r={71} fill="none"
                                    stroke={toRgba(layout[0]?.color || "#a78bfa", 0.35)} strokeWidth={2.5} />
                            </g>
                            <text x={CX} y={CY - 16} textAnchor="middle" fontSize={24}
                                dominantBaseline="middle"
                                className="select-none pointer-events-none">🧠</text>
                            <SvgLabel text={central?.label ?? mindMap.topicName}
                                x={CX} y={CY + 15} size={11} fill="#fff" max={15} />
                        </g>

                        {/* ── Interactive Concept Tooltip Overlay ── */}
                        {/* ── Interactive Concept Tooltip Overlay ── */}
                        {activePopupNode && (
                            <foreignObject
                                x={activePopupNode.x - (140 / zoom)}
                                y={activePopupNode.y + (20 / zoom)}
                                width={360 / zoom}
                                height={450 / zoom}
                                style={{ pointerEvents: 'none', overflow: 'visible' }}>
                                <div className="animate-in fade-in zoom-in-95 duration-200 bg-white/95 dark:bg-slate-900/95"
                                    style={{
                                        transform: `scale(${1 / zoom})`,
                                        transformOrigin: 'top center',
                                        width: '280px',
                                        backdropFilter: 'blur(12px)',
                                        border: `1.5px solid ${toRgba(activePopupNode.color, 0.4)}`,
                                        boxShadow: `0 10px 25px -5px ${toRgba(activePopupNode.color, 0.2)}, 0 4px 10px -5px rgba(0,0,0,0.1)`,
                                        borderRadius: '12px',
                                        padding: '14px 16px',
                                        pointerEvents: 'auto',
                                        position: 'relative',
                                        zIndex: 50,
                                    }}>
                                    {/* Small arrow pointing to the node */}
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
                                        style={{
                                            background: 'var(--teaching-panel-bg)',
                                            borderLeft: `1.5px solid ${toRgba(activePopupNode.color, 0.4)}`,
                                            borderTop: `1.5px solid ${toRgba(activePopupNode.color, 0.4)}`
                                        }} />

                                    <div className="relative z-10">
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100 leading-tight mb-1.5 flex items-center gap-1.5 border-b pb-1.5" style={{ borderColor: toRgba(activePopupNode.color, 0.2) }}>
                                            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: activePopupNode.color }} />
                                            {activePopupNode.node.label}
                                        </h4>
                                        <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                            {activePopupNode.node.description || `Core concepts and focus areas relating to ${activePopupNode.node.label}.`}
                                        </p>
                                    </div>
                                </div>
                            </foreignObject>
                        )}
                    </g>
                </svg>
            </div>

            {/* ── legend ──────────────────────────────────────── */}
            <div className="shrink-0 px-4 py-2 border-t border-gray-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex flex-wrap gap-x-3 gap-y-1">
                {layout.map((c, i) => (
                    <button key={i} onClick={() => setHovered(h => h === c.node.id ? null : c.node.id)}
                        className="flex items-center gap-1 text-[11px] hover:underline"
                        style={{ color: c.color }}>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                        {c.node.label}
                    </button>
                ))}
                <span className="ml-auto text-[10px] text-gray-400 dark:text-slate-600 italic self-center">
                    Click legend or category to highlight
                </span>
            </div>
        </div>
    );
}
