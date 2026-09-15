import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface EmojiMascotProps {
    size?: number;
    emotion?: 'happy' | 'excited' | 'thinking' | 'neutral' | 'winking' | 'cool' | 'love';
    lookAt?: { x: number; y: number } | null;
    isSpeaking?: boolean;
    variant?: 'classic' | 'simple' | 'teacher';
}

export default function EmojiMascot({
    size = 200,
    emotion = 'happy',
    lookAt = null,
    isSpeaking = false,
    variant = 'classic',
}: EmojiMascotProps) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isBlinking, setIsBlinking] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (lookAt) {
            const m = 15;
            setMousePosition({
                x: Math.min(Math.max(lookAt.x * m, -m), m),
                y: Math.min(Math.max(lookAt.y * m, -m), m)
            });
            return;
        }
        const h = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const m = 18;
            setMousePosition({
                x: Math.min(Math.max((e.clientX - rect.left - rect.width / 2) / 15, -m), m),
                y: Math.min(Math.max((e.clientY - rect.top - rect.height / 2) / 15, -m), m),
            });
        };
        window.addEventListener('mousemove', h);
        return () => window.removeEventListener('mousemove', h);
    }, [lookAt]);

    useEffect(() => {
        const loop = () => {
            setTimeout(() => {
                setIsBlinking(true);
                setTimeout(() => {
                    setIsBlinking(false);
                    if (Math.random() > 0.7) {
                        setTimeout(() => {
                            setIsBlinking(true);
                            setTimeout(() => setIsBlinking(false), 150);
                        }, 100);
                    }
                    loop();
                }, 150);
            }, Math.random() * 3000 + 2000);
        };
        loop();
    }, []);

    type EbKey = 'neutral' | 'thinking' | 'excited' | 'cool' | 'love';
    const eyebrows: Record<EbKey, { l: number; r: number; rl: number; rr: number }> = {
        neutral: { l: 0, r: 0, rl: 0, rr: 0 },
        thinking: { l: -10, r: 10, rl: -15, rr: 10 },
        excited: { l: -20, r: -20, rl: 0, rr: 0 },
        cool: { l: 5, r: 5, rl: 5, rr: -5 },
        love: { l: -15, r: -15, rl: 10, rr: -10 },
    };
    const eb = eyebrows[emotion as EbKey] ?? eyebrows.neutral;

    return (
        <div
            ref={containerRef}
            className="relative flex items-center justify-center select-none pointer-events-none"
            style={{ width: size, height: size }}
        >
            {/* Ambient glow */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{ 
                    background: variant === 'teacher' ? 'radial-gradient(circle, rgba(142, 124, 195, 0.15) 0%, rgba(142, 124, 195, 0) 70%)' : 'rgba(250, 204, 21, 0.1)',
                    filter: 'blur(40px)'
                }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Floating container */}
            <motion.div
                className="relative z-10 w-full h-full"
                initial={{ y: 20, opacity: 0 }}
                animate={{
                    y: 0,
                    opacity: 1,
                    scale: isSpeaking ? [1, 1.02, 1] : 1,
                    rotate: 0,
                }}
                transition={{
                    y: { duration: 0 },
                    scale: { duration: 0.4, repeat: isSpeaking ? Infinity : 0, ease: 'easeInOut' },
                    rotate: { duration: 0 },
                    opacity: { duration: 0.5 },
                }}
            >
                {/*
                  viewBox 320×400:
                    Face  → center (160, 265) radius 148
                    Cap   → board top-point (160, 57) left (72, 100) right (248, 100) bottom (160, 143)
                           skull-band center (160, 120..135)
                  This keeps a clean 22px gap between cap bottom (y≈143) and face top (y≈265-148=117).
                  
                  For 'teacher' variant, we zoom in on the face to make expressions perfectly visible.
                */}
                <svg 
                    viewBox={variant === 'teacher' ? "10 185 300 190" : "0 0 320 400"} 
                    className="w-full h-full" 
                    style={{ overflow: 'visible' }}
                >
                    <defs>
                        {/* ── Face ── */}
                        <radialGradient id="emoFace" cx="36%" cy="28%" r="72%">
                            <stop offset="0%" stopColor="#FFFDE7" />
                            <stop offset="38%" stopColor="#FFF59D" />
                            <stop offset="82%" stopColor="#FBC02D" />
                            <stop offset="100%" stopColor="#F57F17" />
                        </radialGradient>
                        <radialGradient id="emoShade" cx="50%" cy="95%" r="55%">
                            <stop offset="0%" stopColor="#E65100" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#E65100" stopOpacity="0" />
                        </radialGradient>

                        {/* ── Eyes (Liquid High-Depth) ── */}
                        <radialGradient id="emoIris" cx="38%" cy="35%" r="62%">
                            <stop offset="0%" stopColor="#80DEEA" />
                            <stop offset="35%" stopColor="#0097A7" />
                            <stop offset="85%" stopColor="#006064" />
                            <stop offset="100%" stopColor="#001517" />
                        </radialGradient>

                        <radialGradient id="emoPupil" cx="45%" cy="45%" r="50%">
                            <stop offset="0%" stopColor="#1a1a1a" />
                            <stop offset="100%" stopColor="#000000" />
                        </radialGradient>

                        {/* ── Cap ── */}
                        <linearGradient id="eCapBoard" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4B5563" />
                            <stop offset="48%" stopColor="#1F2937" />
                            <stop offset="100%" stopColor="#090f1a" />
                        </linearGradient>
                        <linearGradient id="eCapBand" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="100%" stopColor="#000" />
                        </linearGradient>
                        <linearGradient id="eTCord" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FDE68A" />
                            <stop offset="60%" stopColor="#D97706" />
                            <stop offset="100%" stopColor="#92400E" />
                        </linearGradient>
                        <linearGradient id="eTBundle" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FDE68A" />
                            <stop offset="45%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#78350F" />
                        </linearGradient>

                        {/* ── Filters ── */}
                        <filter id="eBlush">
                            <feGaussianBlur stdDeviation="8" />
                        </filter>
                        <filter id="eCapGlow" x="-25%" y="-25%" width="150%" height="150%">
                            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000" floodOpacity="0.3" />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.8" />
                            </feComponentTransfer>
                        </filter>
                        <filter id="eLiquidEye">
                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <filter id="eMascotOuterGlow">
                            <feDropShadow dx="0" dy="12" stdDeviation="15" floodColor="#E65100" floodOpacity="0.15" />
                        </filter>
                    </defs>

                    {/* ════ FACE ════ */}
                    <g filter="url(#eMascotOuterGlow)">
                        <circle cx="160" cy="265" r="148" fill="url(#emoShade)" />
                        <circle cx="160" cy="265" r="148" fill="url(#emoFace)" />
                    </g>
                    {/* Top-left gloss */}
                    <ellipse cx="115" cy="190" rx="58" ry="40" fill="white" opacity="0.16"
                        transform="rotate(-18 115 190)" style={{ filter: 'blur(12px)' }} />
                    {/* Edge rim */}
                    <circle cx="160" cy="265" r="148" stroke="rgba(249,115,22,0.22)"
                        strokeWidth="3" fill="none" />

                    {/* Blush */}
                    <circle cx="52" cy="298" r="27" fill="#FF8A80" opacity="0.3" filter="url(#eBlush)" />
                    <circle cx="268" cy="298" r="27" fill="#FF8A80" opacity="0.3" filter="url(#eBlush)" />

                    {/* ════ FEATURES (follow mouse) ════ */}
                    <motion.g
                        animate={{ x: mousePosition.x * 0.3, y: mousePosition.y * 0.3 }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    >
                        {/* Eyebrows */}
                        {variant === 'classic' && (
                            <>
                                <motion.path d="M104 210 Q126 198 148 210"
                                    fill="none" stroke="#7C3A00" strokeWidth="5" strokeLinecap="round" opacity="0.7"
                                    animate={{ y: eb.l, rotate: eb.rl }} />
                                <motion.path d="M172 210 Q194 198 216 210"
                                    fill="none" stroke="#7C3A00" strokeWidth="5" strokeLinecap="round" opacity="0.7"
                                    animate={{ y: eb.r, rotate: eb.rr }} />
                            </>
                        )}

                        {/* Eyes */}
                        <motion.g
                            animate={{ x: mousePosition.x * 0.9, y: mousePosition.y * 0.9 }}
                            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
                        >
                            {/* Left eye */}
                            {isBlinking || emotion === 'winking' ? (
                                <path d={variant === 'teacher' ? "M110 240 Q138 260 166 240" : "M116 244 Q138 258 160 244"}
                                    stroke="#7C3A00" strokeWidth={variant === 'teacher' ? "8" : "6"} fill="none" strokeLinecap="round" />
                            ) : (
                                <g transform={variant === 'teacher' ? "translate(138,244) scale(1.15)" : "translate(138,244)"} filter="url(#eLiquidEye)">
                                    <ellipse cx="0" cy="0" rx="25" ry="30" fill="white" />
                                    <circle cx="6" cy="6" r="16" fill="url(#emoIris)" />
                                    <circle cx="8" cy="9" r="7" fill="url(#emoPupil)" />
                                    {/* Liquid Highlight Layers */}
                                    <circle cx="-7" cy="-10" r="8" fill="white" opacity="0.8" />
                                    <circle cx="-10" cy="-5" r="3" fill="white" opacity="0.4" />
                                    <circle cx="10" cy="-2" r="3" fill="white" opacity="0.6" />
                                </g>
                            )}
                            {/* Right eye */}
                            {isBlinking ? (
                                <path d={variant === 'teacher' ? "M154 240 Q182 260 210 240" : "M160 244 Q182 258 204 244"}
                                    stroke="#7C3A00" strokeWidth={variant === 'teacher' ? "8" : "6"} fill="none" strokeLinecap="round" />
                            ) : (
                                <g transform={variant === 'teacher' ? "translate(182,244) scale(1.15)" : "translate(182,244)"} filter="url(#eLiquidEye)">
                                    <ellipse cx="0" cy="0" rx="25" ry="30" fill="white" />
                                    <circle cx="-6" cy="6" r="16" fill="url(#emoIris)" />
                                    <circle cx="-8" cy="9" r="7" fill="url(#emoPupil)" />
                                    {/* Liquid Highlight Layers */}
                                    <circle cx="7" cy="-10" r="8" fill="white" opacity="0.8" />
                                    <circle cx="10" cy="-5" r="3" fill="white" opacity="0.4" />
                                    <circle cx="-10" cy="-2" r="3" fill="white" opacity="0.6" />
                                </g>
                            )}
                        </motion.g>

                        {/* Mouth */}
                        <motion.path
                            d={isSpeaking 
                                ? 'M136 320 Q160 360 184 320' // Speaking "O" shape deeper for teacher
                                : (emotion === 'excited'
                                    ? 'M132 315 Q160 345 188 315 Z'
                                    : 'M136 312 Q160 330 184 312')}
                            fill={isSpeaking || emotion === 'excited' ? '#7C3A00' : 'none'}
                            stroke="#7C3A00"
                            strokeWidth={isSpeaking || emotion === 'excited' ? '0' : (variant === 'teacher' ? '8' : '5.5')}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            animate={isSpeaking ? {
                                d: [
                                    'M140 315 Q160 325 180 315', 
                                    'M136 320 Q160 370 184 320', // Deeper resonance
                                    'M140 315 Q160 325 180 315'
                                ],
                                scaleX: [1, 0.9, 1],
                                scaleY: [1, 1.5, 1]
                            } : {
                                scaleX: 1,
                                scaleY: 1
                            }}
                            transition={{
                                duration: 0.2, // Slightly faster, punchier
                                repeat: isSpeaking ? Infinity : 0,
                                ease: "easeInOut"
                            }}
                        />

                        {/* Love hearts */}
                        {emotion === 'love' && (
                            <motion.g
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring' }}
                            >
                                <text x="90" y="224" fontSize="26">❤️</text>
                                <text x="200" y="224" fontSize="26">❤️</text>
                            </motion.g>
                        )}
                    </motion.g>

                    {/* ════ TEACHER ACCENTS (GLASSES & GLOW) ════ */}
                    {variant === 'teacher' && (
                        <motion.g
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            {/* Modern sleek frames */}
                            <g transform="translate(160, 246)">
                                {/* Connection piece */}
                                <path d="M-15 -5 Q0 -10 15 -5" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                                
                                {/* Left Frame */}
                                <g transform="translate(-55, 0)">
                                    <rect x="-42" y="-22" width="84" height="44" rx="12" fill="rgba(30, 41, 59, 0.05)" stroke="#1e293b" strokeWidth="4" />
                                    <path d="M-30 -10 L10 -10" stroke="white" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
                                </g>

                                {/* Right Frame */}
                                <g transform="translate(55, 0)">
                                    <rect x="-42" y="-22" width="84" height="44" rx="12" fill="rgba(30, 41, 59, 0.05)" stroke="#1e293b" strokeWidth="4" />
                                    <path d="M-30 -10 L10 -10" stroke="white" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
                                </g>
                            </g>
                        </motion.g>
                    )}

                    {/* Sunglasses */}
                    <AnimatePresence>
                        {emotion === 'cool' && (
                            <motion.g
                                initial={{ opacity: 0, scale: 1.2, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', bounce: 0.5 }}
                                transform="translate(160,244)"
                            >
                                <ellipse cx="-44" cy="0" rx="34" ry="26" fill="#000" />
                                <ellipse cx="44" cy="0" rx="34" ry="26" fill="#000" />
                                <rect x="-14" y="-4" width="28" height="8" rx="4" fill="#000" />
                                <circle cx="-55" cy="-8" r="5" fill="white" opacity="0.2" />
                                <circle cx="33" cy="-8" r="5" fill="white" opacity="0.2" />
                            </motion.g>
                        )}
                    </AnimatePresence>

                    {/* Thinking glasses */}
                    <AnimatePresence>
                        {emotion === 'thinking' && (
                            <motion.g
                                initial={{ opacity: 0, y: -30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transform="translate(160,244)"
                            >
                                <circle cx="-44" cy="0" r="32"
                                    fill="rgba(255,255,255,0.12)" stroke="#374151" strokeWidth="5" />
                                <circle cx="44" cy="0" r="32"
                                    fill="rgba(255,255,255,0.12)" stroke="#374151" strokeWidth="5" />
                                <path d="M-12 0 L12 0" stroke="#374151" strokeWidth="5" />
                                <circle cx="-28" cy="-13" r="10"
                                    fill="white" opacity="0.18" style={{ filter: 'blur(4px)' }} />
                            </motion.g>
                        )}
                    </AnimatePresence>
                </svg>
            </motion.div>
        </div>
    );
}