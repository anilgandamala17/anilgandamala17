import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import type { Exam } from '../../data/mockData';
import { EXAM_THEMES, EXAM_IMAGES } from '../../data/examThemes';
import { EXAM_META } from '../../data/examMeta';

interface ExamCardProps {
    exam: Exam;
    index?: number;
    badge?: string;
    onSelect: (exam: Exam) => void;
}

export default function ExamCard({ exam, index = 0, badge, onSelect }: ExamCardProps) {
    const theme = EXAM_THEMES[exam.id] || EXAM_THEMES.gate;
    const bgImageUrl = EXAM_IMAGES[exam.id] || EXAM_IMAGES.gate;
    const meta = EXAM_META[exam.id];

    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.4), type: 'spring', damping: 22 }}
            className="h-full"
        >
            <button
                type="button"
                onClick={() => onSelect(exam)}
                className="comp-exam-card group relative flex h-full min-h-[340px] w-full flex-col overflow-hidden rounded-[1.9rem] text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                    {
                        ['--exam-accent' as string]: theme.color,
                    } as React.CSSProperties
                }
            >
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                        style={{ backgroundImage: `url(${bgImageUrl})` }}
                    />
                    <div
                        className="absolute inset-0 transition-opacity duration-500"
                        style={{
                            background: `linear-gradient(160deg, ${theme.color}dd 0%, ${theme.color}88 35%, rgba(8,12,24,0.72) 100%)`,
                        }}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,8,18,0.94)_0%,rgba(4,8,18,0.48)_50%,rgba(4,8,18,0.08)_100%)]" />
                    <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.45),transparent_52%)]" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                </div>

                <div className="relative z-10 flex h-full flex-col p-5 sm:p-6">
                    <div className="mb-auto flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/40 bg-white/95 text-[var(--exam-accent)] shadow-xl backdrop-blur-md transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105 dark:bg-slate-950/90"
                            >
                                {React.cloneElement(theme.icon as React.ReactElement, {
                                    className: 'h-7 w-7',
                                })}
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
                                    Aɪra exam track
                                </div>
                                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-white/90">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                                    Verified pattern
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {(badge || meta?.tier) && (
                                <span className="rounded-full border border-white/25 bg-black/25 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                                    {badge || meta?.tier}
                                </span>
                            )}
                            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-md transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-white group-hover:text-slate-900">
                                <ArrowUpRight className="h-4.5 w-4.5" />
                            </span>
                        </div>
                    </div>

                    <div className="mt-12 text-white">
                        <div className="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-white/60">
                            {meta?.category || 'competitive'} pathway
                        </div>
                        <h3 className="font-display text-3xl font-black tracking-[-0.045em] drop-shadow-lg transition-transform duration-300 group-hover:translate-x-1 sm:text-[2.15rem]">
                            {exam.name}
                        </h3>
                        <p className="mt-2 line-clamp-2 max-w-[92%] text-sm font-medium leading-relaxed text-white/76">
                            {meta?.tagline || 'Adaptive practice aligned to the official exam pattern.'}
                        </p>

                        <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/15 bg-black/20 backdrop-blur-xl">
                            <span className="flex items-center gap-2 border-r border-white/15 px-3.5 py-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                                    <Layers className="h-3.5 w-3.5" />
                                </span>
                                <span>
                                    <span className="block text-sm font-black tabular-nums">{exam.subjects.length}</span>
                                    <span className="block text-[8px] font-bold uppercase tracking-widest text-white/55">Subjects</span>
                                </span>
                            </span>
                            <span className="flex items-center gap-2 px-3.5 py-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                                    <Clock className="h-3.5 w-3.5" />
                                </span>
                                <span>
                                    <span className="block text-sm font-black tabular-nums">{exam.timeMinutes}</span>
                                    <span className="block text-[8px] font-bold uppercase tracking-widest text-white/55">Minutes</span>
                                </span>
                            </span>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/68">
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            {meta?.focus || 'Exam-ready practice'}
                        </div>
                    </div>
                </div>
            </button>
        </motion.div>
    );
}
