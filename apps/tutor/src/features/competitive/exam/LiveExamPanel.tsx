import React, { createContext, memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    Clock,
    Flag,
    Maximize2,
    Minimize2,
    ChevronLeft,
    ChevronRight,
    Bookmark,
    CheckCircle2,
    Eraser,
    FileText,
    Grid3X3,
    PanelRightOpen,
    Send,
    ShieldCheck,
    X,
} from 'lucide-react';
import type { Question } from '@/features/competitive/data/competitiveQuestions';
import type { Exam, ExamSubject } from '@/data/mockData';
import { EXAM_THEMES } from '@/features/competitive/data/examThemes';

export interface LiveExamPanelProps {
    exam: Exam;
    subjectName: string;
    subjects?: ExamSubject[];
    subjectFilter?: string | null;
    onSubjectFilterChange?: (subjectId: string | null) => void;
    isFullPaper?: boolean;
    questions: Question[];
    currentQuestionIndex: number;
    userAnswers: number[];
    visitedQuestions: boolean[];
    markedForReview: boolean[];
    timeLeftSeconds: number;
    isLowTime?: boolean;
    bookmarked: boolean[];
    notes: Record<number, string>;
    onAnswerSelect: (optionIndex: number) => void;
    onNavigate: (index: number) => void;
    onClear: () => void;
    onSaveAndNext: () => void;
    onMarkAndNext: () => void;
    onPrevious: () => void;
    onSubmit: () => void;
    onToggleBookmark: () => void;
    onNoteChange: (text: string) => void;
    onTimeTick?: (remaining: number, elapsed: number) => void;
    onTimeExpired?: () => void;
    elapsedSeconds?: number;
}

function formatClock(totalSeconds: number) {
    const s = Math.max(0, totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

const ExamTimeContext = createContext({ remaining: 0, isLowTime: false });

function ExamTimeProvider({
    initialRemaining,
    initialElapsed = 0,
    onTick,
    onExpire,
    children,
}: {
    initialRemaining: number;
    initialElapsed?: number;
    onTick?: (remaining: number, elapsed: number) => void;
    onExpire?: () => void;
    children: React.ReactNode;
}) {
    const [remaining, setRemaining] = useState(initialRemaining);
    const remainingRef = useRef(initialRemaining);
    const elapsedRef = useRef(initialElapsed);
    const expireRef = useRef(onExpire);
    const tickRef = useRef(onTick);
    expireRef.current = onExpire;
    tickRef.current = onTick;
    remainingRef.current = remaining;

    // Sync when a new session starts or a draft is restored (parent timer state is stable during countdown).
    useEffect(() => {
        remainingRef.current = initialRemaining;
        elapsedRef.current = initialElapsed;
        setRemaining(initialRemaining);
    }, [initialRemaining, initialElapsed]);

    useEffect(() => {
        const interval = setInterval(() => {
            const next = remainingRef.current - 1;
            elapsedRef.current += 1;
            remainingRef.current = Math.max(0, next);
            setRemaining(remainingRef.current);
            tickRef.current?.(remainingRef.current, elapsedRef.current);
            if (next <= 0) {
                clearInterval(interval);
                expireRef.current?.();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const value = useMemo(
        () => ({ remaining, isLowTime: remaining <= 5 * 60 }),
        [remaining],
    );
    return <ExamTimeContext.Provider value={value}>{children}</ExamTimeContext.Provider>;
}

function ExamMobileTimer() {
    const { remaining, isLowTime } = useContext(ExamTimeContext);
    return (
        <div className={`exam-mobile-timer ${isLowTime ? 'exam-mobile-timer--low' : ''}`}>
            <Clock className="h-3.5 w-3.5" />
            <strong>{formatClock(remaining)}</strong>
        </div>
    );
}

function ExamPaletteTimer() {
    const { remaining, isLowTime } = useContext(ExamTimeContext);
    return (
        <div className={`exam-palette__timer ${isLowTime ? 'exam-palette__timer--low' : ''}`}>
            <div>
                {isLowTime ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                <span>Time remaining</span>
            </div>
            <strong>{formatClock(remaining)}</strong>
        </div>
    );
}

function LiveExamPanel({
    exam,
    subjectName,
    subjects = [],
    subjectFilter = null,
    onSubjectFilterChange,
    isFullPaper = false,
    questions,
    currentQuestionIndex,
    userAnswers,
    visitedQuestions,
    markedForReview,
    timeLeftSeconds,
    bookmarked,
    notes,
    onAnswerSelect,
    onNavigate,
    onClear,
    onSaveAndNext,
    onMarkAndNext,
    onPrevious,
    onSubmit,
    onToggleBookmark,
    onNoteChange,
    onTimeTick,
    onTimeExpired,
    elapsedSeconds = 0,
}: LiveExamPanelProps) {
    const theme = EXAM_THEMES[exam.id] || EXAM_THEMES.gate;
    const questionCount = questions.length;
    const safeIndex = questionCount
        ? Math.min(Math.max(0, currentQuestionIndex), questionCount - 1)
        : 0;
    const q = questions[safeIndex];
    const panelRef = useRef<HTMLDivElement>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showPalette, setShowPalette] = useState(false);

    const answeredCount = useMemo(
        () => userAnswers.filter((a) => a !== -1).length,
        [userAnswers],
    );
    const markedCount = useMemo(
        () => markedForReview.filter(Boolean).length,
        [markedForReview],
    );
    const visitedCount = useMemo(
        () => visitedQuestions.filter(Boolean).length,
        [visitedQuestions],
    );

    const paletteIndices = useMemo(() => {
        if (!subjectFilter) return questions.map((_, i) => i);
        return questions
            .map((question, i) => (question.subjectId === subjectFilter ? i : -1))
            .filter((i) => i >= 0);
    }, [questions, subjectFilter]);

    const stemImages = useMemo(() => {
        if (!q) return [] as string[];
        const urls = [...(q.imageUrls || [])];
        if (q.imageUrl) urls.unshift(q.imageUrl);
        return [...new Set(urls.filter(Boolean))];
    }, [q]);

    const displayNumber = q?.questionNumber ?? safeIndex + 1;

    useEffect(() => {
        const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onFs);
        return () => document.removeEventListener('fullscreenchange', onFs);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)) {
                return;
            }
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const key = e.key.toLowerCase();
            const letterIdx = 'abcd'.indexOf(key);
            if (letterIdx >= 0 && letterIdx < (q?.options.length ?? 0)) {
                e.preventDefault();
                onAnswerSelect(letterIdx);
                return;
            }
            if (e.key === 'ArrowRight' || key === 'n') {
                e.preventDefault();
                onSaveAndNext();
                return;
            }
            if (e.key === 'ArrowLeft' || key === 'p') {
                e.preventDefault();
                onPrevious();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [q?.options.length, onAnswerSelect, onSaveAndNext, onPrevious]);

    const toggleFullscreen = async () => {
        const el = panelRef.current;
        if (!el) return;
        try {
            if (!document.fullscreenElement) await el.requestFullscreen();
            else await document.exitFullscreen();
        } catch {
            /* fullscreen may be blocked */
        }
    };

    if (!q) return null;

    const estMinutes =
        q.difficulty === 'Hard' ? 3 : q.difficulty === 'Medium' ? 2 : 1;

    const palette = (
        <>
            <div className="exam-palette__stats">
                <PaletteStat value={answeredCount} label="Answered" tone="answered" />
                <PaletteStat value={markedCount} label="Marked" tone="marked" />
                <PaletteStat value={questions.length - answeredCount} label="Remaining" tone="remaining" />
            </div>

            {isFullPaper && subjects.length > 0 && onSubjectFilterChange ? (
                <div className="exam-palette__filter">
                    <label htmlFor="exam-subject-filter" className="sr-only">
                        Filter questions by subject
                    </label>
                    <select
                        id="exam-subject-filter"
                        value={subjectFilter ?? ''}
                        onChange={(e) =>
                            onSubjectFilterChange(e.target.value ? e.target.value : null)
                        }
                        className="exam-palette__filter-select"
                    >
                        <option value="">All Subjects</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
            ) : null}

            <div className="exam-palette__heading">
                <div>
                    <p>Question navigator</p>
                    <span>
                        {subjectFilter
                            ? `${paletteIndices.length} in filter · ${visitedCount} visited overall`
                            : `${visitedCount} of ${questions.length} visited`}
                    </span>
                </div>
                <Grid3X3 className="h-4 w-4" />
            </div>

            <div className="exam-palette__grid custom-scrollbar" role="listbox" aria-label="Question palette">
                {paletteIndices.map((i) => {
                    const isAnswered = userAnswers[i] !== -1;
                    const isMarked = markedForReview[i];
                    const isVisited = visitedQuestions[i];
                    const isCurrent = safeIndex === i;
                    let state = 'idle';
                    if (isAnswered && isMarked) state = 'answered-marked';
                    else if (isAnswered) state = 'answered';
                    else if (isMarked) state = 'marked';
                    else if (isVisited) state = 'visited';
                    const num = questions[i]?.questionNumber ?? i + 1;

                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => {
                                onNavigate(i);
                                setShowPalette(false);
                            }}
                            className={`exam-palette__question exam-palette__question--${state} ${
                                isCurrent ? 'exam-palette__question--current' : ''
                            }`}
                            aria-label={`Question ${num}, ${state.replace('-', ' ')}`}
                            aria-current={isCurrent ? 'step' : undefined}
                        >
                            {num}
                            {bookmarked[i] && <span className="exam-palette__bookmark" />}
                        </button>
                    );
                })}
            </div>

            <div className="exam-palette__legend">
                <LegendDot className="border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800" label="Unanswered" />
                <LegendDot className="bg-emerald-500" label="Answered" />
                <LegendDot className="bg-violet-500" label="Marked" />
                <LegendDot className="exam-legend-answered-marked" label="Answered + marked" />
                <LegendDot className="ring-2 ring-orange-500 bg-orange-100 dark:bg-orange-900/40" label="Current" />
            </div>

            <div className="exam-palette__autosave">
                <ShieldCheck className="h-4 w-4" />
                <span>Answers are auto-saved</span>
            </div>

            <button type="button" onClick={onSubmit} className="exam-submit-button">
                <Send className="h-4 w-4" />
                Review & submit test
            </button>
        </>
    );

    return (
        <ExamTimeProvider
            initialRemaining={timeLeftSeconds}
            initialElapsed={elapsedSeconds}
            onTick={onTimeTick}
            onExpire={onTimeExpired}
        >
        <div
            ref={panelRef}
            className={`live-exam-panel ${fullscreen ? 'live-exam-panel--fullscreen' : ''}`}
            style={{ '--exam-accent': theme.color } as React.CSSProperties}
        >
            <section className="exam-workspace">
                <header className="exam-command-bar">
                    <div className="exam-command-bar__identity">
                        <span className="exam-command-bar__seal">
                            <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <p>{exam.name}</p>
                            <span>
                                {isFullPaper ? 'Full paper' : subjectName}
                                {q.subjectName && isFullPaper ? ` · ${q.subjectName}` : ''} · Live assessment
                            </span>
                        </div>
                    </div>

                    <div className="exam-command-bar__status">
                        <span className="hidden sm:inline-flex">
                            <ShieldCheck className="h-3.5 w-3.5" /> Secure session
                        </span>
                        <ExamMobileTimer />
                        <button
                            type="button"
                            onClick={() => setShowPalette(true)}
                            className="exam-icon-button lg:hidden"
                            aria-label="Open question palette"
                        >
                            <PanelRightOpen className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="exam-icon-button"
                            aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'}
                        >
                            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                    </div>
                </header>

                <div className="exam-progress-track">
                    <motion.div
                        style={{ background: `linear-gradient(90deg, ${theme.color}, ${theme.color}bb)` }}
                        initial={false}
                        animate={{ width: `${((safeIndex + 1) / questions.length) * 100}%` }}
                        transition={{ ease: 'easeOut', duration: 0.35 }}
                    />
                </div>

                <div className="exam-question-meta">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="exam-question-number">Question {displayNumber}</span>
                        <span className="exam-meta-chip">{q.difficulty}</span>
                        {q.subjectName ? (
                            <span className="exam-meta-chip">{q.subjectName}</span>
                        ) : null}
                        <span className="exam-meta-chip hidden sm:inline-flex">~{estMinutes} min</span>
                        {q.examYear && <span className="exam-meta-chip exam-meta-chip--pyq">PYQ {q.examYear}</span>}
                    </div>
                    <div className="exam-marking-scheme">
                        <span>+4 correct</span>
                        <span>−1 incorrect</span>
                    </div>
                </div>

                <div className="exam-mobile-question-strip lg:hidden">
                    {paletteIndices.map((i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onNavigate(i)}
                            className={`${i === safeIndex ? 'is-current' : ''} ${
                                userAnswers[i] !== -1 ? 'is-answered' : ''
                            }`}
                        >
                            {questions[i]?.questionNumber ?? i + 1}
                        </button>
                    ))}
                </div>

                <main className="exam-question-scroll custom-scrollbar">
                    <div className="exam-question-content">
                        <div className="exam-question-copy">
                            <p className="exam-question-copy__index">
                                Q{displayNumber} of {questions.length}
                            </p>
                            <h2>{q.text}</h2>
                            {stemImages.length > 0 ? (
                                <div className="exam-stem-images">
                                    {stemImages.map((src) => (
                                        <StemImage key={src} src={src} />
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="exam-options">
                            {q.options.map((option, idx) => {
                                const selected = userAnswers[safeIndex] === idx;
                                return (
                                    <motion.button
                                        key={idx}
                                        type="button"
                                        onClick={() => onAnswerSelect(idx)}
                                        whileTap={{ scale: 0.995 }}
                                        className={`exam-option ${selected ? 'exam-option--selected' : ''}`}
                                    >
                                        <span className="exam-option__letter">{String.fromCharCode(65 + idx)}</span>
                                        <span className="exam-option__text">{option}</span>
                                        {selected && <CheckCircle2 className="exam-option__check" />}
                                    </motion.button>
                                );
                            })}
                        </div>

                        <AnimatePresence initial={false}>
                            {(showNotes || notes[safeIndex]) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="exam-notes"
                                >
                                    <label>
                                        <FileText className="h-4 w-4" /> Private rough notes
                                    </label>
                                    <textarea
                                        value={notes[safeIndex] || ''}
                                        onChange={(e) => onNoteChange(e.target.value)}
                                        rows={3}
                                        placeholder="Write a formula, shortcut, or reminder…"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                <footer className="exam-action-bar">
                    <div className="exam-action-bar__tools">
                        <button type="button" onClick={onPrevious} disabled={safeIndex === 0}>
                            <ChevronLeft className="h-4 w-4" /><span>Previous</span>
                        </button>
                        <button type="button" onClick={onMarkAndNext} className="is-mark">
                            <Flag className="h-4 w-4" /><span>Mark & next</span>
                        </button>
                        <button type="button" onClick={onClear}>
                            <Eraser className="h-4 w-4" /><span>Clear</span>
                        </button>
                        <button
                            type="button"
                            onClick={onToggleBookmark}
                            className={bookmarked[safeIndex] ? 'is-bookmarked' : ''}
                        >
                            <Bookmark className="h-4 w-4" /><span>Bookmark</span>
                        </button>
                        <button type="button" onClick={() => setShowNotes((v) => !v)}>
                            <FileText className="h-4 w-4" /><span>Notes</span>
                        </button>
                    </div>
                    <button type="button" onClick={onSaveAndNext} className="exam-primary-action">
                        <span>{safeIndex === questions.length - 1 ? 'Save & review' : 'Save & next'}</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </footer>
            </section>

            <aside className="exam-palette hidden lg:flex">
                <ExamPaletteTimer />
                {palette}
            </aside>

            <AnimatePresence>
                {showPalette && (
                    <motion.div
                        className="exam-mobile-drawer lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Question palette"
                    >
                        <button
                            type="button"
                            className="exam-mobile-drawer__backdrop"
                            onClick={() => setShowPalette(false)}
                            aria-label="Close question palette"
                        />
                        <motion.aside
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            className="exam-mobile-drawer__sheet"
                        >
                            <div className="exam-mobile-drawer__handle" />
                            <div className="exam-mobile-drawer__header">
                                <div>
                                    <p>Question palette</p>
                                    <span>{exam.name} · {subjectName}</span>
                                </div>
                                <button type="button" onClick={() => setShowPalette(false)} aria-label="Close palette">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-5">
                                <ExamPaletteTimer />
                                {palette}
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        </ExamTimeProvider>
    );
}

function StemImage({ src }: { src: string }) {
    const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
    return (
        <figure className="exam-stem-image">
            {status === 'loading' ? <div className="exam-stem-image__skeleton" aria-hidden /> : null}
            {status !== 'error' ? (
                <img
                    src={src}
                    alt="Question figure"
                    loading="lazy"
                    decoding="async"
                    className={status === 'ok' ? 'is-visible' : 'is-hidden'}
                    onLoad={() => setStatus('ok')}
                    onError={() => setStatus('error')}
                />
            ) : (
                <figcaption className="exam-stem-image__fallback">Figure unavailable</figcaption>
            )}
        </figure>
    );
}

function LegendDot({ className, label }: { className: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className={`h-3.5 w-3.5 rounded ${className}`} />
            <span>{label}</span>
        </div>
    );
}

function PaletteStat({
    value,
    label,
    tone,
}: {
    value: number;
    label: string;
    tone: 'answered' | 'marked' | 'remaining';
}) {
    return (
        <div className={`exam-palette-stat exam-palette-stat--${tone}`}>
            <strong>{value}</strong>
            <span>{label}</span>
        </div>
    );
}

export default memo(LiveExamPanel);

