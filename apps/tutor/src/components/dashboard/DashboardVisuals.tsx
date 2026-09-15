/* eslint-disable react-refresh/only-export-components -- mascot + dashboard visuals share one module */
import React from 'react';
import { motion } from 'framer-motion';

export const AɪraMascot: React.FC<{ size?: number | string }> = ({ size = 200 }) => {
    const width = typeof size === 'number' ? size * 1.2 : size;
    const height = typeof size === 'number' ? size * 1.4 : 'auto';

    return (
        <motion.div
            style={{ width, height, aspectRatio: typeof size === 'string' ? '320/380' : undefined }}
            className="relative flex items-center justify-center transition-all duration-700"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
            <svg viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
                <defs>
                    {/* ── FACE ── */}
                    <radialGradient id="faceGrad" cx="38%" cy="32%" r="70%">
                        <stop offset="0%" stopColor="#FFFDE7" />
                        <stop offset="35%" stopColor="#FFF59D" />
                        <stop offset="80%" stopColor="#FBC02D" />
                        <stop offset="100%" stopColor="#F57F17" />
                    </radialGradient>
                    <radialGradient id="faceShadow" cx="50%" cy="100%" r="60%">
                        <stop offset="0%" stopColor="#E65100" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#E65100" stopOpacity="0" />
                    </radialGradient>

                    {/* ── EYES ── */}
                    <radialGradient id="irisGrad" cx="40%" cy="38%" r="60%">
                        <stop offset="0%" stopColor="#80DEEA" />
                        <stop offset="55%" stopColor="#0097A7" />
                        <stop offset="100%" stopColor="#006064" />
                    </radialGradient>

                    {/* ── CAP ── */}
                    {/* Mortarboard top-face: lit from top-left */}
                    <linearGradient id="boardTop" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4B5563" />
                        <stop offset="50%" stopColor="#1F2937" />
                        <stop offset="100%" stopColor="#0a0f1a" />
                    </linearGradient>
                    {/* Skull cap band: dark cylinder */}
                    <linearGradient id="bandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#000" />
                    </linearGradient>
                    {/* Tassel cord */}
                    <linearGradient id="tCord" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FDE68A" />
                        <stop offset="60%" stopColor="#D97706" />
                        <stop offset="100%" stopColor="#92400E" />
                    </linearGradient>
                    {/* Tassel bundle */}
                    <linearGradient id="tBundle" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FDE68A" />
                        <stop offset="45%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#78350F" />
                    </linearGradient>

                    {/* ── FILTERS ── */}
                    <filter id="blushBlur">
                        <feGaussianBlur stdDeviation="7" />
                    </filter>
                    <filter id="capGlow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.25" />
                    </filter>
                </defs>

                {/* ════════════════════════════
                    FACE  (center 160,240  r=130)
                ════════════════════════════ */}
                {/* Face shadow at bottom */}
                <circle cx="160" cy="240" r="130" fill="url(#faceShadow)" />
                {/* Face base */}
                <circle cx="160" cy="240" r="130" fill="url(#faceGrad)" />
                {/* Top gloss */}
                <ellipse cx="118" cy="170" rx="58" ry="38" fill="white" opacity="0.22" transform="rotate(-18 118 170)" style={{ filter: 'blur(10px)' }} />
                {/* Rim */}
                <circle cx="160" cy="240" r="130" stroke="rgba(249,115,22,0.3)" strokeWidth="3" fill="none" />

                {/* ── BLUSH ── */}
                <circle cx="68" cy="280" r="26" fill="#FF8A80" opacity="0.32" filter="url(#blushBlur)" />
                <circle cx="252" cy="280" r="26" fill="#FF8A80" opacity="0.32" filter="url(#blushBlur)" />

                {/* ── EYES ── */}
                {/* Left eye */}
                <g transform="translate(110, 228)">
                    <ellipse cx="0" cy="0" rx="26" ry="32" fill="white" />
                    <circle cx="6" cy="7" r="18" fill="url(#irisGrad)" />
                    <circle cx="9" cy="10" r="8" fill="#001a1a" />
                    <circle cx="-8" cy="-9" r="7" fill="white" />
                    <circle cx="11" cy="-2" r="3" fill="white" opacity="0.7" />
                    {/* Blink overlay */}
                    <motion.ellipse cx="0" cy="0" rx="27" ry="33" fill="url(#faceGrad)"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: [0, 0, 1.05, 0, 0] }}
                        transition={{ duration: 4, repeat: Infinity, times: [0, 0.44, 0.5, 0.56, 1] }}
                    />
                </g>
                {/* Right eye */}
                <g transform="translate(210, 228)">
                    <ellipse cx="0" cy="0" rx="26" ry="32" fill="white" />
                    <circle cx="-6" cy="7" r="18" fill="url(#irisGrad)" />
                    <circle cx="-9" cy="10" r="8" fill="#001a1a" />
                    <circle cx="8" cy="-9" r="7" fill="white" />
                    <circle cx="-11" cy="-2" r="3" fill="white" opacity="0.7" />
                    <motion.ellipse cx="0" cy="0" rx="27" ry="33" fill="url(#faceGrad)"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: [0, 0, 1.05, 0, 0] }}
                        transition={{ duration: 4, repeat: Infinity, times: [0, 0.44, 0.5, 0.56, 1] }}
                    />
                </g>

                {/* ── SMILE ── */}
                <motion.path
                    d="M128 295 Q160 325 192 295"
                    stroke="#7C3A00"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ scaleY: [1, 1.25, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                />

                {/* ════════════════════════════
                    GRADUATION CAP
                    Anchored so band sits at y≈112
                    (just touching the head top arc)
                ════════════════════════════ */}
                <motion.g
                    animate={{ rotate: [-1.5, 1.5, -1.5], y: [0, -3, 0] }}
                    transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ transformOrigin: '160px 112px' }}
                    filter="url(#capGlow)"
                >
                    {/* -- SKULL-CAP BAND (cylinder sitting on head) -- */}
                    {/* Back (darker) rim */}
                    <ellipse cx="160" cy="112" rx="58" ry="17" fill="#0a0f18" />
                    {/* Cylinder side */}
                    <path d="M102 112 Q160 142 218 112 L218 128 Q160 158 102 128 Z" fill="url(#bandGrad)" />
                    {/* Front rim highlight */}
                    <ellipse cx="160" cy="128" rx="58" ry="14" fill="#1e293b" />
                    <ellipse cx="160" cy="127" rx="58" ry="13" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

                    {/* -- MORTARBOARD SQUARE (isometric diamond view) -- */}
                    {/* Underside / thickness */}
                    <path d="M50 90 L160 145 L270 90 L270 99 L160 154 L50 99 Z" fill="#000" />
                    {/* Top face */}
                    <path d="M50 90 L160 35 L270 90 L160 145 Z" fill="url(#boardTop)" />
                    {/* Lit left-edge highlight */}
                    <path d="M50 90 L160 35 L270 90" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2" strokeLinecap="round" />
                    {/* Subtle left-face fill */}
                    <path d="M50 90 L160 35 L160 145 Z" fill="rgba(255,255,255,0.05)" />
                    {/* Subtle right-face shadow */}
                    <path d="M270 90 L160 35 L160 145 Z" fill="rgba(0,0,0,0.08)" />

                    {/* -- CENTER BUTTON -- */}
                    <circle cx="160" cy="90" r="7" fill="#0f172a" />
                    <circle cx="157" cy="87" r="3" fill="rgba(255,255,255,0.18)" />

                    {/* -- TASSEL -- */}
                    <motion.g
                        animate={{ rotate: [-8, 8, -8], x: [0, 3, 0] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ transformOrigin: '160px 90px' }}
                    >
                        {/* Cord (silk) */}
                        <path d="M160 90 C220 90 265 100 270 170" stroke="url(#tCord)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                        {/* Cord highlight */}
                        <path d="M160 90 C220 90 265 100 270 170" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                        {/* Bundle */}
                        <g transform="translate(270,170)">
                            {/* Drop shadow */}
                            <ellipse cx="1" cy="42" rx="9" ry="3.5" fill="black" opacity="0.2" />
                            {/* Outer shadow layer */}
                            <path d="M-11 0 L11 0 L15 40 Q0 50 -15 40 Z" fill="rgba(0,0,0,0.22)" />
                            {/* Main bundle */}
                            <path d="M-9 0 L9 0 L13 37 Q0 47 -13 37 Z" fill="url(#tBundle)" />
                            {/* Highlight strand */}
                            <line x1="-2" y1="3" x2="-4" y2="35" stroke="rgba(255,255,255,0.32)" strokeWidth="1.2" strokeLinecap="round" />
                            {/* Shadow strand */}
                            <line x1="5" y1="3" x2="7" y2="33" stroke="rgba(0,0,0,0.2)" strokeWidth="1.2" strokeLinecap="round" />
                            {/* Knob */}
                            <ellipse cx="0" cy="0" rx="11" ry="7" fill="#D97706" />
                            <ellipse cx="-2" cy="-2" rx="6" ry="4" fill="#FDE68A" opacity="0.6" />
                        </g>
                    </motion.g>
                </motion.g>
            </svg>

            {/* Floating shadow */}
            <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-4 rounded-full bg-black/15 blur-xl"
                animate={{ scaleX: [1, 0.82, 1], opacity: [0.18, 0.1, 0.18] }}
                transition={{ duration: 3.5, repeat: Infinity }}
            />
        </motion.div>
    );
};

export const AchievementStar: React.FC<{ size?: number; color?: string; className?: string }> = ({ size = 40, color = '#FACC15', className = '' }) => {
    return (
        <motion.div
            style={{ width: size, height: size }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.2, rotate: 15 }}
            className={className}
        >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill={color} stroke="white" strokeWidth="1" strokeLinejoin="round" />
                <defs>
                    <linearGradient id="starHL" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" stopOpacity="0.5" />
                        <stop offset="1" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d="M12 4L14.5 9L20 10L16 14L17 19.5L12 17L7 19.5L8 14L4 10L9.5 9L12 4Z" fill="url(#starHL)" />
            </svg>
        </motion.div>
    );
};
