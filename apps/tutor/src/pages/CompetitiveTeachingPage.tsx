import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft, ChevronLeft, ChevronRight, Volume2, VolumeX,
    CheckCircle2, BookOpen, BrainCircuit, Lightbulb,
    FlaskConical, Calculator, Target, RefreshCw, Loader2,
    PlayCircle, BarChart3, HelpCircle, XCircle, Settings2, Ruler
} from 'lucide-react';
import { useSpeech, unlockAudioContext } from '../hooks/useSpeech';
import { useTeachingStore } from '../stores/teachingStore';
import { studentRoutes } from '../utils/routes';
import SignOutButton from '../components/common/SignOutButton';
import { loadExplainPayload, saveExplainPayload, type ExplainPayload } from '../lib/competitiveRoute';
import { toast } from '../stores/toastStore';
import { analytics } from '../services/analyticsService';
import {
    formatExamMath,
    isOptionAnalysisStepTitle,
    parseOptionAnalysisReasons,
} from '../utils/examText';

import {
    type AITeachingStep,
    type CompetitiveQuestion,
    areValidTeachingSteps,
    generateAITeachingSteps,
    questionHasOptions,
    stripSpeechForTts,
} from '../utils/competitiveTeaching';

/** Professional Indian female Sarvam v2 voice (manisha) for AI Explanation.
 *  forceEnable keeps speech on even if Accessibility TTS is off.
 *  Auto-arms when the lecture is ready; Listen/Replay restarts if the browser blocked autoplay.
 */
const COMPETITIVE_EXPLAIN_TTS = {
    forceEnable: true,
    paceOverride: 0.98,
    speakerOverride: 'manisha',
    langOverride: 'en-IN',
    preferNatural: true,
} as const;

interface ThemeConfig {
    color: string;
    bgColor: string;
    gradient: string;
}

function stepIconFor(visualType: AITeachingStep['visualType'] | string): LucideIcon {
    switch (visualType) {
        case 'concept':
            return BrainCircuit;
        case 'formula':
            return Ruler;
        case 'solution':
            return Settings2;
        case 'answer':
            return CheckCircle2;
        case 'insight':
            return Lightbulb;
        default:
            return BookOpen;
    }
}

// ─── Visual Highlighting Function ──────────────────────────────────────────
function highlightText(text: string, highlights?: string[], color?: string): React.ReactNode {
    if (!highlights || highlights.length === 0 || !text) return text;
    const sorted = [...highlights].filter(Boolean).sort((a, b) => b.length - a.length);
    if (sorted.length === 0) return text;
    
    const escaped = sorted.map(h => h.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    
    const parts = text.split(regex);
    return parts.map((part, i) => {
        const matches = sorted.some(h => h.toLowerCase() === part.toLowerCase());
        if (matches) {
            return (
                <motion.mark
                    key={i}
                    initial={{ backgroundColor: 'rgba(253, 224, 71, 0)' }}
                    animate={{ backgroundColor: 'rgba(253, 224, 71, 0.25)' }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="px-1 py-0.5 rounded font-bold dark:text-yellow-200 border-b-2"
                    style={{ 
                        borderColor: color || '#f59e0b',
                        color: color || '#d97706',
                        background: 'transparent'
                    }}
                >
                    {part}
                </motion.mark>
            );
        }
        return part;
    });
}

// ─── Visual Aid Components ────────────────────────────────────────────────────
function QuestionStemCard({
    question,
    themeColor,
    label = 'The Question',
}: {
    question: CompetitiveQuestion;
    themeColor: string;
    label?: string;
}) {
    const hasOptions = questionHasOptions(question);
    const stem = formatExamMath(question.text);
    return (
        <div className="comp-surface-card p-5">
            <div className="mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: themeColor }} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: themeColor }}>
                    {label}
                </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {stem}
            </p>
            {hasOptions && (
                <div className="mt-4 space-y-2">
                    {question.options.map((opt, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                                {String.fromCharCode(65 + i)}
                            </span>
                            <span>{formatExamMath(opt)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ConceptVisual({ question, themeColor }: { question: CompetitiveQuestion; themeColor: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
        >
            <QuestionStemCard
                question={question}
                themeColor={themeColor}
                label={question.examYear === 'Practice' ? 'Question from your ask' : 'The Question'}
            />
            <div
                className="comp-surface-card overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${themeColor}15, ${themeColor}05)` }}
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: themeColor }}>
                            <BrainCircuit className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Core Concept</p>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-200">{question.topic}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['Key Principle', 'Exam Relevance', 'Difficulty'].map((label, i) => (
                            <div key={i} className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                                <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">{label}</p>
                                <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                                    {i === 0 ? question.topic : i === 1 ? question.subjectName : question.difficulty}
                                </p>
                            </div>
                        ))}
                    </div>
                    {question.examYear && (
                        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                            <Target className="w-3.5 h-3.5" />
                            Appeared in {question.examYear}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function FormulaVisual({ content, themeColor, highlights }: { content: string; themeColor: string; highlights?: string[] }) {
    // Extract any formula-like lines from content
    const lines = content.split('\n').filter(l => l.includes('=') || l.includes('∴') || l.includes('∵') || l.match(/\d+\s*[+\-×÷*/]\s*\d+/));
    const displayLines = lines.slice(0, 4);

    if (displayLines.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 p-5 font-mono"
            style={{ borderColor: `${themeColor}40`, background: `linear-gradient(135deg, ${themeColor}08, transparent)` }}
        >
            <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4" style={{ color: themeColor }} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: themeColor }}>Key Formula / Calculation</span>
            </div>
            <div className="space-y-2">
                {displayLines.map((line, i) => (
                    <div key={i} className="px-4 py-2 rounded-lg bg-white/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 text-sm font-semibold">
                        {highlightText(line.trim(), highlights, themeColor)}
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function SolutionVisual({ steps, themeColor, highlights }: { steps: string[]; themeColor: string; highlights?: string[] }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
        >
            {steps.slice(0, 5).map((step, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="comp-surface-card flex items-start gap-3 p-4"
                >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5" style={{ backgroundColor: themeColor }}>
                        {i + 1}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                        {highlightText(step, highlights, themeColor)}
                    </p>
                </motion.div>
            ))}
        </motion.div>
    );
}

const AnswerVisual = memo(function AnswerVisual({ question, userAnswer }: { question: CompetitiveQuestion; userAnswer?: number }) {
    if (!questionHasOptions(question)) {
        return (
            <div className="comp-surface-card p-5">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {formatExamMath(question.text)}
                </p>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Open question — final answer and process are in the lecture steps (no multiple-choice options).
                </p>
            </div>
        );
    }

    const knownKey =
        typeof question.correctAnswer === 'number' &&
        question.correctAnswer >= 0 &&
        question.correctAnswer < question.options.length;

    return (
        <div className="space-y-3">
            {question.options.map((opt, i) => {
                const isCorrect = knownKey && i === question.correctAnswer;
                const isUserSelected = userAnswer !== undefined && userAnswer !== null && userAnswer !== -1 && i === userAnswer;
                
                let borderColor = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900';
                let bgBadge = 'bg-slate-100 dark:bg-slate-800 text-slate-500';
                let textColor = 'text-slate-600 dark:text-slate-400';
                
                if (isCorrect) {
                    borderColor = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
                    bgBadge = 'bg-emerald-500 text-white';
                    textColor = 'text-emerald-800 dark:text-emerald-300';
                } else if (isUserSelected) {
                    borderColor = 'border-rose-500 bg-rose-50 dark:bg-rose-950/20';
                    bgBadge = 'bg-rose-500 text-white';
                    textColor = 'text-rose-800 dark:text-rose-300';
                } else if (userAnswer !== undefined && userAnswer !== -1) {
                    borderColor = 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/20 opacity-50';
                }

                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${borderColor}`}
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${bgBadge}`}>
                            {String.fromCharCode(65 + i)}
                        </div>
                        <p className={`flex-1 text-sm font-semibold ${textColor}`}>{formatExamMath(opt)}</p>
                        {isCorrect && (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <span>Correct</span>
                            </div>
                        )}
                        {!isCorrect && isUserSelected && (
                            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-bold">
                                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                                <span>Your Answer</span>
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
});

const InsightVisual = memo(function InsightVisual({ content, themeColor, highlights }: { content: string; themeColor: string; highlights?: string[] }) {
    const bullets = content.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().startsWith('*')).slice(0, 4);
    const displayItems = bullets.length > 0 ? bullets.map(b => b.replace(/^[-•*]\s*/, '')) : [content.substring(0, 200)];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="comp-surface-card p-5"
            style={{ background: `linear-gradient(135deg, ${themeColor}12, ${themeColor}04)`, borderColor: `${themeColor}30` }}
        >
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5" style={{ color: themeColor }} />
                <span className="text-sm font-black" style={{ color: themeColor }}>Pro Tips for Exams</span>
            </div>
            <div className="space-y-3">
                {displayItems.map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60">
                        <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" style={{ color: themeColor }} />
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {highlightText(item, highlights, themeColor)}
                        </p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
});

const OptionAnalysisVisual = memo(function OptionAnalysisVisual({
    question,
    content,
    userAnswer,
    themeColor,
    highlights,
}: {
    question: CompetitiveQuestion;
    content: string;
    userAnswer?: number;
    themeColor: string;
    highlights?: string[];
}) {
    const parsed = parseOptionAnalysisReasons(content);
    const byLetter = new Map(parsed.map((p) => [p.letter, p.reason]));
    const knownKey =
        typeof question.correctAnswer === 'number' &&
        question.correctAnswer >= 0 &&
        question.correctAnswer < question.options.length;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <HelpCircle className="w-4 h-4" style={{ color: themeColor }} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: themeColor }}>
                    Why each option
                </span>
            </div>
            {question.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isCorrect = knownKey && i === question.correctAnswer;
                const isUserSelected =
                    userAnswer !== undefined && userAnswer !== null && userAnswer !== -1 && i === userAnswer;
                const reason = byLetter.get(letter) || '';

                let border = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900';
                let badge = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
                if (isCorrect) {
                    border = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/25';
                    badge = 'bg-emerald-500 text-white';
                } else if (isUserSelected) {
                    border = 'border-rose-500 bg-rose-50 dark:bg-rose-950/25';
                    badge = 'bg-rose-500 text-white';
                }

                return (
                    <motion.div
                        key={letter}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={`rounded-2xl border-2 p-3.5 sm:p-4 ${border}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${badge}`}>
                                {letter}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                        {formatExamMath(opt)}
                                    </p>
                                    {isCorrect && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Correct
                                        </span>
                                    )}
                                    {!isCorrect && isUserSelected && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-rose-600 dark:text-rose-400">
                                            <XCircle className="w-3.5 h-3.5" />
                                            Your answer
                                        </span>
                                    )}
                                    {!isCorrect && !isUserSelected && knownKey && (
                                        <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                                            Incorrect
                                        </span>
                                    )}
                                </div>
                                {reason ? (
                                    <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                                        {highlightText(reason.replace(/\*+/g, ''), highlights, themeColor)}
                                    </p>
                                ) : (
                                    <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                                        See the lecture for why Option {letter} {isCorrect ? 'is correct' : 'does not match this stem'}.
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
});

// ─── Markdown Content Renderer ───────────────────────────────────────────────
const ContentRenderer = memo(function ContentRenderer({ text, highlights, themeColor }: { text: string; highlights?: string[]; themeColor?: string }) {
    const lines = formatExamMath(text).split('\n');
    return (
        <div className="space-y-2">
            {lines.map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2" />;
                if (line.startsWith('## ')) return (
                    <h2 key={i} className="text-xl font-black text-slate-900 dark:text-white mt-4 mb-2">
                        {highlightText(line.replace('## ', ''), highlights, themeColor)}
                    </h2>
                );
                if (line.startsWith('### ')) return (
                    <h3 key={i} className="text-lg font-black text-slate-800 dark:text-slate-200 mt-3 mb-1">
                        {highlightText(line.replace('### ', ''), highlights, themeColor)}
                    </h3>
                );
                if (line.startsWith('---')) return <hr key={i} className="my-3 border-slate-200 dark:border-slate-700" />;

                // Process inline bold/italic
                const processed = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                    j % 2 === 1
                        ? <strong key={j} className="font-black text-slate-900 dark:text-white">{highlightText(part, highlights, themeColor)}</strong>
                        : highlightText(part, highlights, themeColor)
                );

                const isOptionLine = /^\s*[-*•]?\s*(\*\*)?Option\s+[A-Z]/i.test(line.trim());
                return (
                    <p
                        key={i}
                        className={`text-slate-700 dark:text-slate-300 leading-relaxed text-base ${
                            isOptionLine ? 'mt-3 rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40' : ''
                        }`}
                    >
                        {processed}
                    </p>
                );
            })}
        </div>
    );
});

function ExplainSpeechControls({
    themeColor,
    isMuted,
    onToggleMute,
}: {
    themeColor: string;
    isMuted: boolean;
    onToggleMute: () => void;
}) {
    const isSpeaking = useTeachingStore((s) => s.isSpeaking);
    return (
        <>
            <AnimatePresence>
                {isSpeaking && (
                    <div
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold"
                        style={{ backgroundColor: themeColor }}
                    >
                        <div className="flex items-center gap-1 h-3">
                            <span className="block w-0.5 h-full bg-white rounded-full animate-voice-bar-1" />
                            <span className="block w-0.5 h-full bg-white rounded-full animate-voice-bar-2" />
                            <span className="block w-0.5 h-full bg-white rounded-full animate-voice-bar-3" />
                        </div>
                        <span className="ml-1">Speaking</span>
                    </div>
                )}
            </AnimatePresence>
            <button
                onClick={onToggleMute}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                title={isMuted ? 'Unmute voice' : 'Mute voice'}
            >
                {isMuted
                    ? <VolumeX className="w-4 h-4" />
                    : <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-orange-500' : ''}`} />
                }
            </button>
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CompetitiveTeachingPage() {
    const location = useLocation();
    const navigate = useNavigate();
    type ExplainState = {
        competitiveQuestion?: CompetitiveQuestion;
        theme?: ThemeConfig;
        userAnswer?: number;
        examName?: string;
        returnTo?: string;
        teachingSteps?: AITeachingStep[];
    };

    /**
     * Router state is lost on a hard reload, so the payload is mirrored into
     * session storage when the lesson is opened and read back here.
     */
    const stateData = useMemo<ExplainState | null>(() => {
        const routerState = location.state as ExplainState | null;
        if (routerState?.competitiveQuestion) {
            saveExplainPayload(routerState as ExplainPayload);
            return routerState;
        }
        return (loadExplainPayload() as ExplainState | null) ?? null;
    }, [location.state]);

    const question = stateData?.competitiveQuestion;
    const theme = stateData?.theme || { color: '#ea580c', bgColor: 'rgba(234,88,12,0.15)', gradient: 'from-orange-500 to-amber-600' };
    const userAnswer = stateData?.userAnswer;
    const examName = stateData?.examName;
    const preloadedSteps = Array.isArray(stateData?.teachingSteps) ? stateData!.teachingSteps! : null;
    const explanationSource =
        (stateData?.returnTo || '').includes('section=questionary') ? 'questionary' : 'exam_review';

    const explanationStartedRef = useRef(false);
    const explanationTerminalRef = useRef(false);
    const currentStepRef = useRef(0);
    const stepsRef = useRef<AITeachingStep[]>([]);

    const [steps, setSteps] = useState<AITeachingStep[]>(() =>
        areValidTeachingSteps(preloadedSteps) ? preloadedSteps : []
    );
    const [isGenerating, setIsGenerating] = useState(
        () => !areValidTeachingSteps(preloadedSteps)
    );
    const [currentStep, setCurrentStep] = useState(0);
    const [playbackTrigger, setPlaybackTrigger] = useState(0);
    /** Gate TTS until lecture is ready / Listen — browsers may block autoplay after navigate. */
    const [voiceArmed, setVoiceArmed] = useState(false);
    const autoArmedForQuestionRef = useRef<string | null>(null);
    const stepsQuestionIdRef = useRef<string | null>(null);
    currentStepRef.current = currentStep;
    stepsRef.current = steps;

    /** Always resolves to a real competitive screen, never off the app. */
    const navigateBack = useCallback(() => {
        navigate(stateData?.returnTo || studentRoutes.competitive, { replace: true });
    }, [navigate, stateData?.returnTo]);

    const goBackToCompetitive = useCallback(() => {
        if (!explanationTerminalRef.current && question) {
            explanationTerminalRef.current = true;
            analytics.explanationExit({
                source: explanationSource,
                subjectId: question.subjectId,
                stepIndex: currentStepRef.current,
            });
        }
        navigateBack();
    }, [explanationSource, navigateBack, question]);

    const completeExplanation = useCallback(() => {
        if (!explanationTerminalRef.current && question) {
            explanationTerminalRef.current = true;
            analytics.explanationCompleted({
                source: explanationSource,
                subjectId: question.subjectId,
                stepCount: stepsRef.current.length,
            });
        }
        navigateBack();
    }, [explanationSource, navigateBack, question]);

    // Reset store states on mount and unmount to prevent leftover curriculum audio
    useEffect(() => {
        const store = useTeachingStore.getState();
        store.endSession();
        store.resume();
        store.setSpeaking(false);
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        return () => {
            window.dispatchEvent(new CustomEvent('stop-speech'));
        };
    }, []);

    // Reset step index when the question identity changes
    useEffect(() => {
        setCurrentStep(0);
        setVoiceArmed(false);
        setPlaybackTrigger(0);
        autoArmedForQuestionRef.current = null;
        stepsQuestionIdRef.current = null;
        explanationStartedRef.current = false;
        explanationTerminalRef.current = false;
    }, [question?.id]);

    // Fire once when the lecture is ready to play.
    useEffect(() => {
        if (!question || isGenerating || steps.length === 0) return;
        if (explanationStartedRef.current) return;
        explanationStartedRef.current = true;
        analytics.explanationStarted({
            source: explanationSource,
            subjectId: question.subjectId,
        });
    }, [question, isGenerating, steps.length, explanationSource]);

    // If the user leaves without Done/Back handlers, still count an exit.
    useEffect(() => {
        return () => {
            if (!explanationTerminalRef.current && explanationStartedRef.current && question) {
                explanationTerminalRef.current = true;
                analytics.explanationExit({
                    source: explanationSource,
                    subjectId: question.subjectId,
                    stepIndex: currentStepRef.current,
                });
            }
        };
    }, [explanationSource, question]);

    // ── Use valid preloaded steps; otherwise generate on mount (ExamFlow / freeform)
    useEffect(() => {
        let cancelled = false;
        if (!question) {
            setIsGenerating(false);
            return;
        }
        if (areValidTeachingSteps(preloadedSteps)) {
            stepsQuestionIdRef.current = question.id;
            setSteps(preloadedSteps);
            setIsGenerating(false);
            return;
        }
        setIsGenerating(true);
        generateAITeachingSteps(question, examName, userAnswer)
            .then((aiSteps) => {
                if (cancelled) return;
                const next = areValidTeachingSteps(aiSteps) ? aiSteps : [];
                if (!next.length) {
                    toast.error('Could not build the AI explanation. Please try again.');
                    stepsQuestionIdRef.current = null;
                    setSteps([]);
                    return;
                }
                stepsQuestionIdRef.current = question.id;
                setSteps(next);
            })
            .catch(() => {
                if (cancelled) return;
                toast.error('Could not build the AI explanation. Please try again.');
                stepsQuestionIdRef.current = null;
                setSteps([]);
            })
            .finally(() => {
                if (!cancelled) setIsGenerating(false);
            });
        return () => {
            cancelled = true;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerate when question identity changes
    }, [question?.id, examName, userAnswer, preloadedSteps?.length]);

    // Auto-start teacher voice once per question when the lecture is ready.
    useEffect(() => {
        if (isGenerating || !question?.id || steps.length === 0) return;
        if (stepsQuestionIdRef.current !== question.id) return;
        if (autoArmedForQuestionRef.current === question.id) return;
        const firstSpeech = (steps[0]?.speech || steps[0]?.content || '').trim();
        if (!firstSpeech) return;
        autoArmedForQuestionRef.current = question.id;
        setVoiceArmed(true);
        setPlaybackTrigger((prev) => prev + 1);
    }, [isGenerating, question?.id, steps]);

    const currentStepData = steps[currentStep];
    const spokenForStep = currentStepData
        ? (currentStepData.speech || stripSpeechForTts(currentStepData.content || '')).trim()
        : '';

    const { isMuted, setIsMuted } = useSpeech(
        voiceArmed && currentStepData && spokenForStep
            ? { id: `${question?.id || 'q'}-${currentStepData.id}`, spokenContent: spokenForStep }
            : null,
        playbackTrigger,
        { ...COMPETITIVE_EXPLAIN_TTS, ignoreSession: true },
    );

    const totalSteps = steps.length;
    const progressPct = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

    // Parse solution walkthrough lines: "Step N:", "1.", "1)", "- item"
    const getSolutionSteps = (content: string): string[] => {
        const lines = formatExamMath(content)
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
            .filter((l) => !l.startsWith('##') && !l.startsWith('---'));

        const labeled = lines
            .map((l) => {
                const step = l.match(/^Step\s*\d+\s*[:.)-]\s*(.+)$/i);
                if (step) return step[1].trim();
                const num = l.match(/^\d+\s*[.)]\s+(.+)$/);
                if (num) return num[1].trim();
                const bullet = l.match(/^[-*•]\s+(.+)$/);
                if (bullet) return bullet[1].replace(/^\*\*(.+?)\*\*:?\s*/, '$1: ').trim();
                return '';
            })
            .filter(Boolean);

        if (labeled.length >= 2) return labeled;
        // Fallback: non-heading body lines so the visual still has content
        return lines.filter((l) => !/^#{1,3}\s/.test(l)).slice(0, 8);
    };

    const walkthroughSteps = useMemo(() => {
        if (!currentStepData || currentStepData.visualType !== 'solution') return [] as string[];
        const parsed = getSolutionSteps(currentStepData.content);
        if (parsed.length > 0) return parsed;
        return questionHasOptions(question)
            ? ['Identify the concept being tested', 'Apply the relevant formula or reasoning', 'Check each answer option', 'Eliminate wrong options', 'Confirm final answer']
            : ['Identify the concept being tested', 'List knowns and unknowns', 'Apply the relevant formula or reasoning', 'Arrive at the final answer', 'Check units and edge cases'];
    }, [currentStepData, question]);

    const armVoiceAndReplay = () => {
        unlockAudioContext();
        setVoiceArmed(true);
        if (isMuted) setIsMuted(false);
        // User gesture — reliable unlock if autoplay was blocked on navigate.
        setPlaybackTrigger((prev) => prev + 1);
    };

    const goToStep = (idx: number) => {
        const next = Math.max(0, Math.min(idx, Math.max(0, steps.length - 1)));
        setCurrentStep(next);
        if (voiceArmed) setPlaybackTrigger((prev) => prev + 1);
    };

    // ── No question guard
    if (!question && !isGenerating) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Question Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Please go back and select a question to explain.</p>
                    <button onClick={goBackToCompetitive} className="rounded-2xl bg-orange-600 px-8 py-3 font-bold text-white shadow-lg shadow-orange-500/30 transition-colors hover:bg-orange-700">
                        Back to Competitive
                    </button>
                </div>
            </div>
        );
    }

    // ── AI Loading Screen
    if (isGenerating) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-sm"
                >
                    <div
                        className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
                        style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}cc)` }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                            <BrainCircuit className="w-10 h-10 text-white" />
                        </motion.div>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">AI Teacher Preparing</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Generating a personalized step-by-step explanation for this {question?.difficulty} question…
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: theme.color }} />
                        <span className="text-sm font-semibold" style={{ color: theme.color }}>Analyzing question…</span>
                    </div>

                    {/* Animated dots */}
                    <div className="flex justify-center gap-2 mt-8">
                        {['Concept', 'Solution', 'Strategy'].map((lbl, i) => (
                            <motion.div
                                key={i}
                                className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: theme.color }}
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                            >
                                {lbl}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="competitive-mode relative flex min-h-screen flex-col">

            {/* ── Ambient Background ── */}
            <div className="pointer-events-none fixed inset-0">
                <div
                    className="absolute right-0 top-0 h-96 w-96 rounded-full opacity-20 blur-[120px]"
                    style={{ background: theme.color }}
                />
                <div
                    className="absolute bottom-0 left-0 h-64 w-64 rounded-full opacity-10 blur-[100px]"
                    style={{ background: theme.color }}
                />
            </div>

            {/* ── Header ── */}
            <header className="sticky top-0 z-40 border-b border-[var(--comp-border)] bg-[var(--comp-elevated)]/85 px-4 py-3 backdrop-blur-xl sm:px-6">
                <div className="mx-auto flex max-w-5xl items-center gap-3">
                    <button
                        onClick={goBackToCompetitive}
                        className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    {/* Exam badge */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}cc)` }}>
                        <Target className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-black text-gray-900 dark:text-white truncate leading-tight">{question?.topic}</h1>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{question?.subjectName} · {totalSteps} Steps · AI Explanation</p>
                    </div>

                    {/* Step counter — compact on mobile too */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <PlayCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{currentStep + 1} / {totalSteps}</span>
                    </div>

                    <ExplainSpeechControls
                        themeColor={theme.color}
                        isMuted={isMuted}
                        onToggleMute={() => {
                            if (isMuted) {
                                unlockAudioContext();
                                setIsMuted(false);
                                setVoiceArmed(true);
                                setPlaybackTrigger((prev) => prev + 1);
                            } else {
                                setIsMuted(true);
                                window.dispatchEvent(new CustomEvent('stop-speech'));
                            }
                        }}
                    />
                    <SignOutButton />
                </div>
            </header>

            {/* ── Progress Bar ── */}
            <div className="h-1 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: theme.color }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>

            {/* ── Step Tab Bar ── */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-800/60 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex gap-1 py-2.5 overflow-x-auto scrollbar-hide">
                        {steps.map((step, idx) => {
                            const isDone = idx < currentStep;
                            const isActive = idx === currentStep;
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => { goToStep(idx); }}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${isActive
                                        ? 'text-white shadow-md'
                                        : isDone
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    style={isActive ? { backgroundColor: theme.color, boxShadow: `0 4px 12px -2px ${theme.color}50` } : {}}
                                >
                                    {isDone
                                        ? <CheckCircle2 className="w-3 h-3" />
                                        : (() => {
                                            const StepIcon = stepIconFor(step.visualType);
                                            return <StepIcon className="h-3 w-3" />;
                                        })()
                                    }
                                    <span>{step.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Main Content Area ── */}
            <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-10 relative z-10">
                <AnimatePresence mode="wait">
                    {currentStepData && (
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -24 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="space-y-6"
                        >
                            {/* Step header */}
                            <div className="flex items-start gap-4">
                                <motion.div
                                    initial={{ scale: 0.5, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg sm:h-16 sm:w-16"
                                    style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}cc)` }}
                                >
                                    {(() => {
                                        const StepIcon = stepIconFor(currentStepData.visualType);
                                        return <StepIcon className="h-6 w-6 sm:h-7 sm:w-7" />;
                                    })()}
                                </motion.div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-0.5" style={{ color: theme.color }}>
                                        Step {currentStep + 1} of {totalSteps}
                                    </p>
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight break-words">
                                        {currentStepData.title}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 break-words">
                                        {currentStepData.subtitle}
                                    </p>
                                </div>

                                {/* Replay / Listen — arms TTS on first tap (gesture-safe after async navigate) */}
                                <button
                                    onClick={armVoiceAndReplay}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex-shrink-0 mt-1"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>{voiceArmed ? 'Replay' : 'Listen'}</span>
                                </button>
                            </div>

                            {/* Main 2-column layout on tablet+ */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

                                {/* Left: Content (3/5 on large) */}
                                <div className="lg:col-span-3">
                                    <div className="comp-surface-card h-full p-4 sm:p-6 md:p-8">
                                        <ContentRenderer text={currentStepData.content || ''} highlights={currentStepData.highlights} themeColor={theme.color} />
                                    </div>
                                </div>

                                {/* Right: Visual Aid (2/5 on large) */}
                                <div className="lg:col-span-2 space-y-4">
                                    {currentStepData.visualType === 'concept' && question && (
                                        <ConceptVisual question={question} themeColor={theme.color} />
                                    )}
                                    {currentStepData.visualType === 'formula' && (
                                        <>
                                            {question && (
                                                <QuestionStemCard question={question} themeColor={theme.color} />
                                            )}
                                            <FormulaVisual content={currentStepData.content} themeColor={theme.color} highlights={currentStepData.highlights} />
                                        </>
                                    )}
                                    {currentStepData.visualType === 'solution' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <FlaskConical className="w-4 h-4" style={{ color: theme.color }} />
                                                <span className="text-xs font-black uppercase tracking-widest" style={{ color: theme.color }}>Visual Walkthrough</span>
                                            </div>
                                            <SolutionVisual
                                                steps={walkthroughSteps}
                                                themeColor={theme.color}
                                                highlights={currentStepData.highlights}
                                            />
                                        </div>
                                    )}
                                    {currentStepData.visualType === 'answer' && question && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <BarChart3 className="w-4 h-4" style={{ color: theme.color }} />
                                                <span className="text-xs font-black uppercase tracking-widest" style={{ color: theme.color }}>
                                                    {questionHasOptions(question) ? 'Answer Breakdown' : 'Your Question'}
                                                </span>
                                            </div>
                                            <AnswerVisual question={question} userAnswer={userAnswer} />
                                        </div>
                                    )}
                                    {currentStepData.visualType === 'insight' && (
                                        question &&
                                        questionHasOptions(question) &&
                                        (isOptionAnalysisStepTitle(currentStepData.title) ||
                                            parseOptionAnalysisReasons(currentStepData.content).length >= 2)
                                            ? (
                                                <OptionAnalysisVisual
                                                    question={question}
                                                    content={currentStepData.content}
                                                    userAnswer={userAnswer}
                                                    themeColor={theme.color}
                                                    highlights={currentStepData.highlights}
                                                />
                                            )
                                            : (
                                                <InsightVisual content={currentStepData.content} themeColor={theme.color} highlights={currentStepData.highlights} />
                                            )
                                    )}

                                    {/* Difficulty badge */}
                                    {question && (
                                        <div
                                            className="flex items-center gap-3 p-4 rounded-2xl border"
                                            style={{ borderColor: `${theme.color}30`, background: `${theme.color}08` }}
                                        >
                                            <Target className="w-4 h-4 flex-shrink-0" style={{ color: theme.color }} />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficulty</p>
                                                <p className="text-sm font-black" style={{ color: theme.color }}>{question.difficulty}</p>
                                            </div>
                                            <div className="ml-auto">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</p>
                                                <p className="text-sm font-black text-slate-700 dark:text-slate-300">{question.subjectName}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Navigation ── */}
                <div className="flex items-center justify-between mt-6 sm:mt-8 gap-2 sm:gap-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                    <motion.button
                        onClick={() => { goToStep(currentStep - 1); }}
                        disabled={currentStep === 0}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-4 sm:px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Previous</span>
                    </motion.button>

                    {/* Step dots — scroll on narrow screens */}
                    <div className="flex max-w-[42vw] sm:max-w-none items-center gap-2 overflow-x-auto px-1 py-1 scrollbar-none">
                        {steps.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => { goToStep(idx); }}
                                className={`shrink-0 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-5 h-2.5' : 'w-2.5 h-2.5 opacity-40 hover:opacity-70'}`}
                                style={{ backgroundColor: theme.color }}
                                aria-label={`Go to step ${idx + 1}`}
                            />
                        ))}
                    </div>

                    {currentStep < totalSteps - 1 ? (
                        <motion.button
                            onClick={() => { goToStep(currentStep + 1); }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-lg transition-all"
                            style={{ backgroundColor: theme.color, boxShadow: `0 8px 20px -5px ${theme.color}50` }}
                        >
                            <span>Next Step</span>
                            <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={completeExplanation}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-lg transition-all"
                            style={{ backgroundColor: '#10b981', boxShadow: '0 8px 24px -5px rgba(16,185,129,0.45)' }}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Done!</span>
                        </motion.button>
                    )}
                </div>
            </main>
        </div>
    );
}
