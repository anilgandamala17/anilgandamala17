import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp,
    BrainCircuit,
    Camera,
    ImagePlus,
    Loader2,
    Mic,
    MicOff,
    Plus,
    Sparkles,
    X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveExplainPayload } from '@/features/competitive/lib/competitiveRoute';
import { studentRoutes } from '@/utils/routes';
import { isImageLikeFile, prepareDataUrlForVisionApi } from '@/utils/imageVision';
import { aiService, type ExtractedExamQuestion } from '@/services/aiService';
import { analytics } from '@/services/analyticsService';
import { toast } from '@/stores/toastStore';
import type { CompetitiveQuestion } from '@/features/competitive/utils/competitiveTeaching';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import {
    assertCleanExtractedQuestion,
    formatExamMath,
    sanitizeOptionText,
    splitStemAndOptions,
} from '@/utils/examText';

const SUGGESTIONS = [
    'Explain the photoelectric effect with a worked example',
    'How do I solve quadratic equations using the discriminant?',
    'What is Le Chatelier’s principle and when does it apply?',
    'Walk me through Kirchhoff’s laws in a simple circuit',
] as const;

const FREEFORM_THEME = {
    color: '#ea580c',
    bgColor: 'rgba(234, 88, 12, 0.12)',
    gradient: 'from-orange-500 to-amber-600',
};

const SUBJECT_MAP: Record<string, { id: string; name: string }> = {
    math: { id: 'math', name: 'Mathematics' },
    mathematics: { id: 'math', name: 'Mathematics' },
    physics: { id: 'phy', name: 'Physics' },
    phy: { id: 'phy', name: 'Physics' },
    chemistry: { id: 'chem', name: 'Chemistry' },
    chem: { id: 'chem', name: 'Chemistry' },
    biology: { id: 'bio', name: 'Biology' },
    bio: { id: 'bio', name: 'Biology' },
    english: { id: 'eng', name: 'English' },
    eng: { id: 'eng', name: 'English' },
    general: { id: 'general', name: 'General' },
};

function stripOptionLabel(o: string) {
    return sanitizeOptionText(o);
}

function parseTypedQuestion(raw: string): { stem: string; options: string[] } {
    const text = raw.trim();
    const optsMatch = text.match(/\n\s*Options?\s*:\s*\n([\s\S]+)$/i);
    if (optsMatch) {
        const stem = formatExamMath(text.slice(0, optsMatch.index).trim());
        const optionLines = optsMatch[1]
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
            .map(stripOptionLabel)
            .filter(Boolean);
        if (optionLines.length >= 2) {
            return { stem: stem || formatExamMath(text), options: optionLines };
        }
    }
    const split = splitStemAndOptions(text);
    return {
        stem: split.stem,
        options: split.options.length >= 2 ? split.options : [],
    };
}

function resolveSubject(guess?: string) {
    const key = (guess || 'general').trim().toLowerCase();
    return SUBJECT_MAP[key] || SUBJECT_MAP.general;
}

function buildFreeformQuestion(input: {
    text: string;
    options?: string[] | null;
    correctAnswer?: number | null;
    subjectGuess?: string;
}): CompetitiveQuestion {
    let opts = Array.isArray(input.options)
        ? input.options.map(sanitizeOptionText).filter(Boolean)
        : [];
    const peeled = splitStemAndOptions(input.text.trim());
    const stem = peeled.stem;
    if (opts.length < 2 && peeled.options.length >= 2) {
        opts = peeled.options;
    }
    const hasMcq = opts.length >= 2;
    const subject = resolveSubject(input.subjectGuess);
    const key =
        hasMcq &&
        typeof input.correctAnswer === 'number' &&
        input.correctAnswer >= 0 &&
        input.correctAnswer < opts.length
            ? Math.floor(input.correctAnswer)
            : -1;

    return {
        id: `freeform_${Date.now()}`,
        text: stem,
        options: hasMcq ? opts : [],
        correctAnswer: key,
        explanation: '',
        topic: 'General',
        difficulty: 'Medium',
        examYear: 'Practice',
        subjectId: subject.id,
        subjectName: subject.name,
    };
}

type Attachment = { name: string; dataUrl: string };

export default function QuestionaryExplanationFlow() {
    const navigate = useNavigate();
    const [draft, setDraft] = useState('');
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [statusLabel, setStatusLabel] = useState('Analyzing question…');
    const [attachMenuOpen, setAttachMenuOpen] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraStarting, setCameraStarting] = useState(false);
    const [cameraPreview, setCameraPreview] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const attachMenuRef = useRef<HTMLDivElement>(null);

    const speech = useSpeechRecognition({
        lang: 'en-IN',
        onFinalTranscript: (text) => {
            setDraft((prev) => {
                const next = prev.trim() ? `${prev.trim()} ${text}` : text;
                return next;
            });
            textareaRef.current?.focus();
        },
    });

    const trimmed = draft.trim();
    const canSend = (trimmed.length > 0 || Boolean(attachment)) && !submitting;

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const max =
            typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
                ? 96
                : 72;
        el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    }, [draft, speech.interim]);

    useEffect(() => {
        if (!attachMenuOpen) return;
        const onDoc = (e: MouseEvent) => {
            if (!attachMenuRef.current?.contains(e.target as Node)) {
                setAttachMenuOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setAttachMenuOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        window.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            window.removeEventListener('keydown', onKey);
        };
    }, [attachMenuOpen]);

    const stopCameraStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    }, []);

    const closeCamera = useCallback(() => {
        stopCameraStream();
        setCameraOpen(false);
        setCameraStarting(false);
        setCameraError(null);
        setCameraPreview(null);
    }, [stopCameraStream]);

    useEffect(() => () => stopCameraStream(), [stopCameraStream]);

    const onPickImage = (file: File | undefined) => {
        if (!file) return;
        if (!isImageLikeFile(file)) {
            toast.error('Please attach an image (PNG, JPG, WebP, HEIC where supported).');
            return;
        }
        if (file.size > 12 * 1024 * 1024) {
            toast.error('Image is too large. Please use a photo under 12 MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
            const raw = String(reader.result || '');
            if (!raw.startsWith('data:')) {
                toast.error('Could not read that image. Try another file.');
                return;
            }
            try {
                const dataUrl = await prepareDataUrlForVisionApi(raw);
                setAttachment({ name: file.name, dataUrl });
            } catch {
                setAttachment({ name: file.name, dataUrl: raw });
            }
        };
        reader.onerror = () => toast.error('Could not read that image. Try another file.');
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setAttachMenuOpen(false);
    };

    const openCamera = async () => {
        setAttachMenuOpen(false);
        setCameraOpen(true);
        setCameraPreview(null);
        setCameraError(null);
        setCameraStarting(true);
        stopCameraStream();
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraStarting(false);
            setCameraError('Camera is not available in this browser.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => undefined);
            }
            setCameraStarting(false);
        } catch (err) {
            setCameraStarting(false);
            const name = err instanceof DOMException ? err.name : '';
            if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                setCameraError('Camera permission was denied.');
            } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
                setCameraError('No camera device was found.');
            } else {
                setCameraError('Could not open the camera. Try uploading a photo instead.');
            }
        }
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) {
            toast.error('Camera is not ready yet.');
            return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            toast.error('Could not capture the photo.');
            return;
        }
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCameraPreview(dataUrl);
        stopCameraStream();
    };

    const confirmCameraPhoto = async () => {
        if (!cameraPreview) return;
        try {
            const dataUrl = await prepareDataUrlForVisionApi(cameraPreview);
            setAttachment({ name: `camera-${Date.now()}.jpg`, dataUrl });
        } catch {
            setAttachment({ name: `camera-${Date.now()}.jpg`, dataUrl: cameraPreview });
        }
        closeCamera();
    };

    const retakeCamera = () => {
        setCameraPreview(null);
        void openCamera();
    };

    const submitQuestion = useCallback(async () => {
        if (submitting) return;
        const text = draft.trim();
        if (!text && !attachment) return;

        speech.stop();
        setSubmitting(true);
        setStatusLabel(attachment ? 'Reading question from image…' : 'Analyzing question…');

        try {
            let extracted: ExtractedExamQuestion;

            if (attachment) {
                extracted = await aiService.extractExamQuestionFromImage(
                    attachment.dataUrl,
                    text || undefined,
                );
            } else {
                const parsed = parseTypedQuestion(text);
                extracted = {
                    questionText: parsed.stem,
                    options: parsed.options.length >= 2 ? parsed.options : null,
                    correctAnswerIndex: null,
                };
            }

            assertCleanExtractedQuestion({
                questionText: extracted.questionText,
                options: extracted.options,
            });

            setStatusLabel('Building your full AI explanation…');
            const competitiveQuestion = buildFreeformQuestion({
                text: formatExamMath(extracted.questionText),
                options: extracted.options,
                correctAnswer: extracted.correctAnswerIndex,
                subjectGuess: extracted.subjectGuess,
            });

            const { generateAITeachingSteps, areValidTeachingSteps } = await import(
                '@/features/competitive/utils/competitiveTeaching'
            );
            const teachingSteps = await generateAITeachingSteps(
                competitiveQuestion,
                'Free-form',
                -1,
            );
            if (!areValidTeachingSteps(teachingSteps)) {
                throw new Error('Could not build the AI explanation. Please try again.');
            }

            setStatusLabel('Opening your explanation…');

            const hasOptions = Array.isArray(extracted.options) && extracted.options.length >= 2;
            analytics.explanationQuestionSubmitted({
                hasImage: Boolean(attachment),
                hasOptions,
            });

            const payload = {
                competitiveQuestion,
                theme: FREEFORM_THEME,
                userAnswer: -1,
                examName: 'Free-form',
                returnTo: `${studentRoutes.competitive}?section=questionary`,
                teachingSteps,
            };
            saveExplainPayload(payload);
            navigate(studentRoutes.competitiveExplain, { state: payload });
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Could not analyze that question. Please try again.';
            toast.error(message);
            setSubmitting(false);
            setStatusLabel('Analyzing question…');
        }
    }, [attachment, draft, navigate, speech, submitting]);

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void submitQuestion();
        }
    };

    const displayDraft = draft;

    return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
            <div className="mb-3 shrink-0 sm:mb-4">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
                    AI Explanation
                </p>
                <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                    <BrainCircuit className="h-5 w-5 shrink-0 text-orange-500 sm:h-6 sm:w-6" />
                    <span className="truncate">Ask anything</span>
                </h2>
                <p className="mt-1 max-w-2xl text-xs font-medium text-gray-500 dark:text-slate-400 sm:text-[13px]">
                    Type a question, attach a photo, or speak — Aɪra opens the step-by-step AI teacher.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-orange-200/60 bg-gradient-to-b from-white via-orange-50/25 to-white shadow-[0_20px_48px_-28px_rgba(234,88,12,0.35)] dark:border-orange-900/40 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 sm:rounded-3xl"
            >
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 py-4 text-center sm:px-8 sm:py-6">
                    {submitting ? (
                        <div className="flex max-w-md flex-col items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
                                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                            </div>
                            <div>
                                <p className="text-base font-bold text-slate-900 dark:text-white">
                                    {statusLabel}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Hang tight — the explanation panel opens only when the full lecture is ready
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full max-w-xl flex-col items-center gap-3 sm:gap-4">
                            <div className="relative">
                                <div
                                    className="absolute inset-0 scale-125 rounded-3xl bg-orange-400/20 blur-2xl"
                                    aria-hidden
                                />
                                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30 sm:h-14 sm:w-14">
                                    <Sparkles className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white sm:text-lg">
                                    What should we explain?
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[13px]">
                                    Paste an MCQ, ask a concept, upload or capture a photo, or use the mic.
                                </p>
                            </div>
                            <div className="flex w-full flex-wrap justify-center gap-1.5 sm:gap-2">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => {
                                            setDraft(s);
                                            textareaRef.current?.focus();
                                        }}
                                        className="max-w-full rounded-full border border-slate-200/90 bg-white/80 px-2.5 py-1.5 text-left text-[10px] font-semibold text-slate-600 transition-colors hover:border-orange-300 hover:text-orange-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-orange-700 dark:hover:text-orange-300 sm:px-3 sm:py-2 sm:text-[11px]"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 border-t border-orange-100/50 bg-white/80 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/85 sm:px-5 sm:pb-3 sm:pt-3 lg:px-6">
                    <div className="mx-auto w-full max-w-3xl">
                        {attachment && !submitting && (
                            <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/90 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900/80 sm:rounded-2xl sm:px-2.5 sm:py-2">
                                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600 sm:h-10 sm:w-10">
                                    <img
                                        src={attachment.dataUrl}
                                        alt={attachment.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200 sm:text-xs">
                                        {attachment.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400">Ready to extract question</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAttachment(null)}
                                    className="touch-manipulation rounded-lg p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    aria-label="Remove image"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {speech.errorMessage && !submitting ? (
                            <p className="mb-1.5 px-1 text-[11px] font-medium text-rose-600 dark:text-rose-400" role="status">
                                {speech.errorMessage}
                            </p>
                        ) : null}
                        {speech.isListening ? (
                            <p className="mb-1.5 px-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400" role="status" aria-live="polite">
                                Listening…{speech.interim ? ` “${speech.interim}”` : ' speak in English, then edit and send.'}
                            </p>
                        ) : null}

                        <form
                            className="w-full"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void submitQuestion();
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.heic,.heif"
                                className="hidden"
                                onChange={(e) => onPickImage(e.target.files?.[0])}
                            />
                            <div
                                className={`flex w-full min-w-0 items-end gap-0.5 rounded-2xl border bg-slate-50/95 px-1.5 py-1.5 shadow-sm transition-[box-shadow,border-color] focus-within:border-orange-400 focus-within:shadow-[0_0_0_3px_rgba(249,115,22,0.18)] dark:bg-slate-900/90 dark:focus-within:border-orange-500 sm:gap-1 sm:rounded-3xl sm:px-2 sm:py-1.5 ${
                                    submitting
                                        ? 'border-orange-300/70 dark:border-orange-700/50'
                                        : 'border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                <div className="relative shrink-0" ref={attachMenuRef}>
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => setAttachMenuOpen((v) => !v)}
                                        aria-label="Attach"
                                        aria-expanded={attachMenuOpen}
                                        aria-haspopup="menu"
                                        className="touch-manipulation flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-600 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-orange-950/40 dark:hover:text-orange-400 sm:rounded-2xl"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                    <AnimatePresence>
                                        {attachMenuOpen && (
                                            <motion.div
                                                role="menu"
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 6 }}
                                                className="absolute bottom-[calc(100%+0.4rem)] left-0 z-20 min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                                            >
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-orange-50 dark:text-slate-200 dark:hover:bg-orange-950/40"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <ImagePlus className="h-4 w-4 text-orange-500" />
                                                    Upload Photo
                                                </button>
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-orange-50 dark:text-slate-200 dark:hover:bg-orange-950/40"
                                                    onClick={() => void openCamera()}
                                                >
                                                    <Camera className="h-4 w-4 text-orange-500" />
                                                    Take Picture
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="min-w-0 flex-1 self-center py-0.5 sm:py-1">
                                    <label htmlFor="ai-explain-composer" className="sr-only">
                                        Ask a question for AI explanation
                                    </label>
                                    <textarea
                                        id="ai-explain-composer"
                                        ref={textareaRef}
                                        rows={1}
                                        value={displayDraft}
                                        disabled={submitting}
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={onKeyDown}
                                        placeholder={
                                            attachment
                                                ? 'Optional note (e.g. explain Q2)…'
                                                : 'Ask AI to explain this question…'
                                        }
                                        className="max-h-[72px] w-full resize-none overflow-y-auto bg-transparent text-[15px] font-medium leading-snug text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-slate-100 dark:placeholder:text-slate-500 sm:max-h-24 lg:text-base"
                                    />
                                </div>

                                <button
                                    type="button"
                                    disabled={submitting || !speech.supported}
                                    onClick={() => {
                                        if (speech.status === 'unsupported') {
                                            toast.error('Speech recognition is not supported here.');
                                            return;
                                        }
                                        speech.toggle();
                                    }}
                                    aria-label={speech.isListening ? 'Stop listening' : 'Start voice input'}
                                    aria-pressed={speech.isListening}
                                    className={`touch-manipulation mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors sm:mb-0 sm:h-11 sm:w-11 ${
                                        speech.isListening
                                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                                            : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600 dark:text-slate-400 dark:hover:bg-orange-950/40'
                                    } disabled:opacity-40`}
                                >
                                    {speech.isListening ? (
                                        <MicOff className="h-5 w-5" />
                                    ) : (
                                        <Mic className="h-5 w-5" />
                                    )}
                                </button>

                                <button
                                    type="submit"
                                    disabled={!canSend}
                                    aria-label="Send question"
                                    className="touch-manipulation mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 transition-transform hover:scale-[1.04] active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:from-slate-700 dark:disabled:to-slate-700 dark:disabled:text-slate-500 sm:mb-0 sm:h-11 sm:w-11"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {cameraOpen && (
                    <motion.div
                        className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Take picture"
                    >
                        <button type="button" className="absolute inset-0" aria-label="Close camera" onClick={closeCamera} />
                        <motion.div
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 24, opacity: 0 }}
                            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-3 text-white shadow-2xl"
                        >
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-sm font-bold">Take Picture</p>
                                <button type="button" onClick={closeCamera} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {cameraError ? (
                                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                                    <p>{cameraError}</p>
                                    <button
                                        type="button"
                                        className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold"
                                        onClick={() => {
                                            closeCamera();
                                            fileInputRef.current?.click();
                                        }}
                                    >
                                        Upload photo instead
                                    </button>
                                </div>
                            ) : cameraPreview ? (
                                <div className="space-y-3">
                                    <img src={cameraPreview} alt="Captured" className="max-h-[50vh] w-full rounded-xl object-contain" />
                                    <div className="flex gap-2">
                                        <button type="button" onClick={retakeCamera} className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-bold">
                                            Retake
                                        </button>
                                        <button type="button" onClick={() => void confirmCameraPhoto()} className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-bold">
                                            Use photo
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
                                        {cameraStarting ? (
                                            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Starting camera…
                                            </div>
                                        ) : null}
                                        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                                    </div>
                                    <button
                                        type="button"
                                        disabled={cameraStarting}
                                        onClick={capturePhoto}
                                        className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold disabled:opacity-50"
                                    >
                                        Capture
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
