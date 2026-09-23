import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, FileText, Brain, Target, CheckCircle, XCircle, RefreshCw, Trophy, Calendar, BrainCircuit, Clock, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { COMPETITIVE_EXAMS, Exam, ExamSubject, Paper } from '../../data/mockData';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Question } from '../../data/competitiveQuestions';
import { aiExamGenerator, resolvePaperLength } from '../../services/aiExamGenerator';
import { buildFullExamSession } from '../../services/buildFullExamSession';
import { CompetitiveExamGenerationError } from '../../services/competitiveExamApi';
import { EXAM_THEMES } from '../../data/examThemes';
import ExamCard from './ExamCard';
import LiveExamPanel from './LiveExamPanel';
import { useCompetitiveStore } from '../../stores/competitiveStore';
import { PremiumMetricCard, PremiumSelectionCard } from './CompetitiveCards';
import type { WeeklyExamSession } from '../../types/weeklyExam';
import { isSessionLive } from '../../services/weeklyExamSchedule';
import { toast } from '../../stores/toastStore';
import {
    clearExamDraft,
    findExam,
    findPaper,
    findSubject,
    FULL_PAPER_SUBJECT_ID,
    loadExamDraft,
    normalizeExamStep,
    saveExamDraft,
    saveExplainPayload,
    type ExamDraft,
    type ExamFlowStep,
} from '../../lib/competitiveRoute';
import type { CompetitiveQuestion } from '../../utils/competitiveTeaching';
import { analytics } from '../../services/analyticsService';
import { studentRoutes } from '../../utils/routes';


interface ExamFlowProps {
    isDashboardView?: boolean;
    onExamStateChange?: (isActive: boolean) => void;
    flowType?: 'standard' | 'pyq' | 'mock' | 'weekly';
    weeklySession?: WeeklyExamSession | null;
}

export default function ExamFlow({
    isDashboardView = false,
    onExamStateChange,
    flowType = 'standard',
    weeklySession = null,
}: ExamFlowProps = {}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const recordAttempt = useCompetitiveStore((s) => s.recordAttempt);
    const weeklyAutoStartedRef = useRef(false);
    const generationIdRef = useRef(0);
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            generationIdRef.current += 1;
        };
    }, []);
    const paperFlow = flowType === 'pyq' || (flowType === 'weekly' && weeklySession?.mode === 'pyq');
    const mockFlow = flowType === 'mock' || (flowType === 'weekly' && weeklySession?.mode === 'mock');

    /** Weekly windows with a fixed subject stay single-subject; everything else is a full CBT paper. */
    const useFullPaper =
        !(flowType === 'weekly' && Boolean(weeklySession?.subjectId)) &&
        (flowType === 'standard' || flowType === 'pyq' || flowType === 'mock' || flowType === 'weekly');

    /**
     * The flow is addressed entirely by the URL, so a refresh or a back button
     * press lands on the same screen instead of resetting to the catalog.
     */
    const step = normalizeExamStep(searchParams.get('step'));
    const selectedExam = useMemo(() => findExam(searchParams.get('exam')), [searchParams]);
    const selectedSubject = useMemo(
        () => findSubject(selectedExam, searchParams.get('subject')),
        [selectedExam, searchParams],
    );
    const selectedPaper = useMemo(
        () => findPaper(selectedExam, searchParams.get('paper')),
        [selectedExam, searchParams],
    );

    const updateFlowParams = useCallback(
        (updates: Record<string, string | null>, options: { replace?: boolean } = {}) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    Object.entries(updates).forEach(([key, value]) => {
                        if (value === null) next.delete(key);
                        else next.set(key, value);
                    });
                    return next;
                },
                { replace: options.replace ?? false },
            );
        },
        [setSearchParams],
    );

    const goToStep = useCallback(
        (
            next: ExamFlowStep,
            updates: Record<string, string | null> = {},
            options: { replace?: boolean } = {},
        ) => {
            const base: Record<string, string | null> =
                next === 'exam'
                    ? { step: null, exam: null, subject: null, paper: null }
                    : { step: next };
            updateFlowParams({ ...base, ...updates }, options);
        },
        [updateFlowParams],
    );

    /**
     * A live paper cannot live in the URL, so it is mirrored into sessionStorage
     * and read back synchronously on the first render of a resumed session.
     */
    const initialDraftRef = useRef<ExamDraft | null | undefined>(undefined);
    if (initialDraftRef.current === undefined) {
        const params = new URLSearchParams(window.location.search);
        const urlStep = normalizeExamStep(params.get('step'));
        const examId = params.get('exam') ?? undefined;
        const subjectId = params.get('subject') ?? undefined;
        const paperYear = params.get('paper') ?? undefined;
        const preferFull = !subjectId || subjectId === FULL_PAPER_SUBJECT_ID;
        const draft =
            urlStep === 'solving' || urlStep === 'result'
                ? loadExamDraft(
                      flowType,
                      examId,
                      preferFull ? FULL_PAPER_SUBJECT_ID : subjectId,
                      paperYear,
                  ) ?? (preferFull ? null : loadExamDraft(flowType, examId, subjectId, paperYear))
                : null;
        const draftOk =
            draft &&
            draft.examId === examId &&
            (preferFull
                ? draft.scope === 'full' || draft.subjectId === FULL_PAPER_SUBJECT_ID
                : draft.subjectId === subjectId);
        initialDraftRef.current = draftOk ? draft : null;
    }
    const initialDraft = initialDraftRef.current;

    // A resumed scorecard was already written to analytics before the reload,
    // so it must not be counted a second time.
    const recordedRef = useRef(initialDraft?.step === 'result');

    // Exam Logic State
    const [questions, setQuestions] = useState<Question[]>(() => initialDraft?.questions ?? []);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
        () => initialDraft?.currentQuestionIndex ?? 0,
    );
    const [userAnswers, setUserAnswers] = useState<number[]>(() => initialDraft?.userAnswers ?? []); // Index of selected option per question

    // Real Exam Interface Status Tracking
    const [visitedQuestions, setVisitedQuestions] = useState<boolean[]>(
        () => initialDraft?.visitedQuestions ?? [],
    );
    const [markedForReview, setMarkedForReview] = useState<boolean[]>(
        () => initialDraft?.markedForReview ?? [],
    );
    const [bookmarked, setBookmarked] = useState<boolean[]>(() => initialDraft?.bookmarked ?? []);
    const [eliminated, setEliminated] = useState<Record<number, number[]>>(
        () => initialDraft?.eliminated ?? {},
    );
    const [notes, setNotes] = useState<Record<number, string>>(() => initialDraft?.notes ?? {});

    const [showExplanation, setShowExplanation] = useState(false);
    /** Remaining seconds while solving (countdown). Also stores elapsed on result. */
    const [timer, setTimer] = useState(() => initialDraft?.timer ?? 0);
    const [elapsedSeconds, setElapsedSeconds] = useState(() => initialDraft?.elapsedSeconds ?? 0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationLabel, setGenerationLabel] = useState<string | null>(null);
    const [integrityOpen, setIntegrityOpen] = useState(false);
    const pendingStartRef = useRef<{
        exam: Exam;
        subject: ExamSubject | null;
        paper: Paper | null;
        full: boolean;
    } | null>(null);
    const [explainBuildingId, setExplainBuildingId] = useState<string | null>(null);
    const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
    const [subjectFilter, setSubjectFilter] = useState<string | null>(
        () => initialDraft?.subjectFilter ?? null,
    );
    const timerRef = useRef(timer);
    const elapsedRef = useRef(elapsedSeconds);
    timerRef.current = timer;
    elapsedRef.current = elapsedSeconds;

    const flowTypeRef = useRef(flowType);
    const selectedExamRef = useRef(selectedExam);
    const selectedSubjectRef = useRef(selectedSubject);
    const selectedPaperRef = useRef(selectedPaper);
    const questionsRef = useRef(questions);
    const currentQuestionIndexRef = useRef(currentQuestionIndex);
    const userAnswersRef = useRef(userAnswers);
    const visitedQuestionsRef = useRef(visitedQuestions);
    const markedForReviewRef = useRef(markedForReview);
    const bookmarkedRef = useRef(bookmarked);
    const eliminatedRef = useRef(eliminated);
    const notesRef = useRef(notes);
    flowTypeRef.current = flowType;
    selectedExamRef.current = selectedExam;
    selectedSubjectRef.current = selectedSubject;
    selectedPaperRef.current = selectedPaper;
    questionsRef.current = questions;
    currentQuestionIndexRef.current = currentQuestionIndex;
    userAnswersRef.current = userAnswers;
    visitedQuestionsRef.current = visitedQuestions;
    markedForReviewRef.current = markedForReview;
    bookmarkedRef.current = bookmarked;
    eliminatedRef.current = eliminated;
    notesRef.current = notes;

    // Hook to inform parent (CompetitiveDashboard) when we enter/exit exam mode
    useEffect(() => {
        onExamStateChange?.(step === 'solving' || step === 'result');
    }, [step, onExamStateChange]);

    // Leaving the section entirely must release the immersive layout.
    useEffect(() => () => onExamStateChange?.(false), [onExamStateChange]);

    /**
     * Repairs URLs that cannot be rendered — a hand-edited link, a stale
     * bookmark, or a resumed tab whose exam draft has expired.
     * Never bounce Available/PYQ/Mock into Choose Your Subjects.
     */
    useEffect(() => {
        if (isGenerating) return;

        // Legacy bookmarks: skip Choose Subjects for full-paper flows
        if (step === 'subject' && useFullPaper) {
            if (!selectedExam) {
                goToStep('exam', {}, { replace: true });
                return;
            }
            if (paperFlow || mockFlow) {
                goToStep('paper', { exam: selectedExam.id, subject: null }, { replace: true });
            } else {
                // Available exams: stay on catalog — user re-selects to start full paper
                goToStep('exam', { exam: null, subject: null, paper: null }, { replace: true });
            }
            return;
        }

        if (step === 'subject' && !selectedExam) {
            goToStep('exam', {}, { replace: true });
            return;
        }
        if (step === 'paper' && !selectedExam) {
            goToStep('exam', {}, { replace: true });
            return;
        }
        if (step === 'paper' && flowType === 'standard') {
            goToStep(selectedExam ? 'exam' : 'exam', {}, { replace: true });
            return;
        }
        if ((step === 'solving' || step === 'result') && questions.length === 0) {
            if (!selectedExam) goToStep('exam', {}, { replace: true });
            else if (useFullPaper && (paperFlow || mockFlow))
                goToStep('paper', { exam: selectedExam.id, subject: null }, { replace: true });
            else if (useFullPaper) goToStep('exam', {}, { replace: true });
            else if (!selectedSubject) goToStep('exam', {}, { replace: true });
            else goToStep(paperFlow ? 'paper' : 'subject', {}, { replace: true });
        }
    }, [
        step,
        selectedExam,
        selectedSubject,
        questions.length,
        isGenerating,
        flowType,
        paperFlow,
        mockFlow,
        useFullPaper,
        goToStep,
    ]);

    const handleTimeTick = useCallback((remaining: number, elapsed: number) => {
        timerRef.current = remaining;
        elapsedRef.current = elapsed;
    }, []);

    const persistExamDraft = useCallback(() => {
        const exam = selectedExamRef.current;
        const subject = selectedSubjectRef.current;
        const qs = questionsRef.current;
        if (!exam || !qs.length) return;
        const full = useFullPaper || !subject;
        saveExamDraft({
            version: 3,
            scope: full ? 'full' : 'subject',
            flowType: flowTypeRef.current,
            examId: exam.id,
            subjectId: full ? FULL_PAPER_SUBJECT_ID : subject!.id,
            paperYear: selectedPaperRef.current ? String(selectedPaperRef.current.year) : undefined,
            step: 'solving',
            questions: qs,
            currentQuestionIndex: currentQuestionIndexRef.current,
            userAnswers: userAnswersRef.current,
            visitedQuestions: visitedQuestionsRef.current,
            markedForReview: markedForReviewRef.current,
            bookmarked: bookmarkedRef.current,
            eliminated: eliminatedRef.current,
            notes: notesRef.current,
            timer: timerRef.current,
            elapsedSeconds: elapsedRef.current,
            subjectFilter,
            savedAt: Date.now(),
        });
    }, [useFullPaper, subjectFilter]);

    // A reload mid-paper would silently discard the attempt without a prompt.
    useEffect(() => {
        if (step !== 'solving') return;
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            persistExamDraft();
            event.preventDefault();
            event.returnValue = '';
        };
        const handlePageHide = () => persistExamDraft();
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [step, persistExamDraft]);

    useEffect(() => {
        if (!questions.length) return;
        if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
            setCurrentQuestionIndex(Math.min(Math.max(0, currentQuestionIndex), questions.length - 1));
        }
    }, [questions.length, currentQuestionIndex]);

    const flushClockAndSubmit = useCallback(() => {
        setTimer(timerRef.current);
        setElapsedSeconds(elapsedRef.current);
        goToStep('result');
    }, [goToStep]);

    // Autosave draft while solving (immediate on change + periodic for timer ticks).
    useEffect(() => {
        if (step !== 'solving' || !selectedExam || !questions.length) return;
        if (!useFullPaper && !selectedSubject) return;
        persistExamDraft();
        const intervalHandle = window.setInterval(persistExamDraft, 5000);
        return () => window.clearInterval(intervalHandle);
    }, [
        step,
        selectedExam,
        selectedSubject,
        questions.length,
        currentQuestionIndex,
        userAnswers,
        visitedQuestions,
        markedForReview,
        bookmarked,
        eliminated,
        notes,
        selectedPaper,
        subjectFilter,
        useFullPaper,
        persistExamDraft,
    ]);

    // Persist attempt once when results open
    useEffect(() => {
        if (step !== 'result' || !selectedExam || recordedRef.current) return;
        if (!questions.length) return;
        if (!useFullPaper && !selectedSubject) return;
        recordedRef.current = true;
        let correctCount = 0;
        let incorrectCount = 0;
        userAnswers.forEach((ans, idx) => {
            if (ans < 0 || ans === undefined) return;
            if (questions[idx] && ans === questions[idx].correctAnswer) correctCount += 1;
            else incorrectCount += 1;
        });
        const netScore = correctCount * 4 - incorrectCount;
        const subjectId = useFullPaper ? FULL_PAPER_SUBJECT_ID : selectedSubject!.id;
        const subjectName = useFullPaper ? 'Full examination' : selectedSubject!.name;
        recordAttempt({
            examId: selectedExam.id,
            examName: selectedExam.name,
            subjectId,
            subjectName,
            mode:
                flowType === 'weekly'
                    ? 'weekly'
                    : flowType === 'pyq'
                      ? 'pyq'
                      : flowType === 'mock'
                        ? 'mock'
                        : 'standard',
            score: correctCount,
            correctCount,
            incorrectCount,
            netScore,
            total: questions.length,
            timeSeconds: elapsedRef.current || elapsedSeconds || Math.max(0, (selectedExam.timeMinutes * 60) - (timerRef.current || timer)),
            paperYear: selectedPaper ? String(selectedPaper.year) : undefined,
        });
        let skipped = 0;
        userAnswers.forEach((ans) => {
            if (ans < 0 || ans === undefined) skipped += 1;
        });
        analytics.testCompleted({
            examId: selectedExam.id,
            subjectId,
            score: netScore,
            totalQuestions: questions.length,
            correctAnswers: correctCount,
            incorrectAnswers: incorrectCount,
            skippedQuestions: skipped,
            timeSpentSeconds:
                elapsedRef.current ||
                elapsedSeconds ||
                Math.max(0, selectedExam.timeMinutes * 60 - (timerRef.current || timer)),
            flowType,
        });
        saveExamDraft({
            version: 3,
            scope: useFullPaper ? 'full' : 'subject',
            flowType,
            examId: selectedExam.id,
            subjectId,
            paperYear: selectedPaper ? String(selectedPaper.year) : undefined,
            step: 'result',
            questions,
            currentQuestionIndex,
            userAnswers,
            visitedQuestions,
            markedForReview,
            bookmarked,
            eliminated,
            notes,
            timer: timerRef.current,
            elapsedSeconds: elapsedRef.current,
            subjectFilter,
            savedAt: Date.now(),
        });
    }, [
        step,
        selectedExam,
        selectedSubject,
        selectedPaper,
        questions,
        currentQuestionIndex,
        userAnswers,
        visitedQuestions,
        markedForReview,
        bookmarked,
        eliminated,
        notes,
        elapsedSeconds,
        timer,
        flowType,
        recordAttempt,
        useFullPaper,
        subjectFilter,
    ]);

    const resetExam = useCallback(() => {
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setVisitedQuestions([]);
        setMarkedForReview([]);
        setBookmarked([]);
        setEliminated({});
        setNotes({});
        setShowExplanation(false);
        setTimer(0);
        setElapsedSeconds(0);
        setReviewFilter('all');
        setSubjectFilter(null);
        recordedRef.current = false;
        clearExamDraft(
            flowType,
            selectedExam?.id,
            useFullPaper ? FULL_PAPER_SUBJECT_ID : selectedSubject?.id,
            selectedPaper ? String(selectedPaper.year) : undefined,
        );
    }, [flowType, selectedExam?.id, selectedSubject?.id, selectedPaper, useFullPaper]);

    const exitToSelection = useCallback(() => {
        if (step === 'solving' && selectedExam) {
            analytics.testAbandoned({
                examId: selectedExam.id,
                questionNumber: currentQuestionIndexRef.current + 1,
                flowType,
            });
        }
        resetExam();
        weeklyAutoStartedRef.current = false;
        if (flowType === 'weekly') {
            updateFlowParams(
                {
                    weeklySession: null,
                    challenge: null,
                    step: null,
                    exam: null,
                    subject: null,
                    paper: null,
                },
                { replace: true },
            );
            return;
        }
        if ((flowType === 'pyq' || flowType === 'mock') && selectedExam) {
            goToStep('paper', { exam: selectedExam.id, subject: null, paper: null });
        } else {
            goToStep('exam');
        }
    }, [flowType, goToStep, resetExam, selectedExam, step, updateFlowParams]);

    const handleBack = () => {
        if (step === 'result') {
            exitToSelection();
        } else if (step === 'solving') {
            const confirmQuit = window.confirm('Leave this exam? Your answers for this attempt will be discarded.');
            if (confirmQuit) exitToSelection();
        } else if (step === 'paper') {
            if (flowType === 'weekly' && weeklySession?.subjectId) exitToSelection();
            else goToStep('exam', { subject: null, paper: null });
        } else if (step === 'subject') {
            if (flowType === 'weekly' && weeklySession?.examId) exitToSelection();
            else goToStep('exam');
        }
    };

    const handleExamSelect = (exam: Exam) => {
        analytics.examSelected(exam.id, exam.name);
        if (useFullPaper && (flowType === 'standard' || (flowType === 'weekly' && !weeklySession?.subjectId && mockFlow))) {
            requestStartFullExam(exam, null);
            return;
        }
        if (useFullPaper && (paperFlow || mockFlow)) {
            goToStep('paper', { exam: exam.id, subject: null, paper: null });
            return;
        }
        goToStep('subject', { exam: exam.id, subject: null, paper: null });
    };

    const resolveExamYear = (exam: Exam, paper: Paper | null | undefined) => {
        if (paper?.year != null) return String(paper.year);
        return String(exam.papers?.[0]?.year ?? new Date().getFullYear() - 1);
    };

    const applyQuestionsAndStartSolving = (
        finalQuestions: Question[],
        exam: Exam,
        subject: ExamSubject | null,
        paper: Paper | null,
        full: boolean,
    ) => {
        setQuestions(finalQuestions);
        setUserAnswers(new Array(finalQuestions.length).fill(-1));
        const initialVisited = new Array(finalQuestions.length).fill(false);
        if (finalQuestions.length > 0) initialVisited[0] = true;
        setVisitedQuestions(initialVisited);
        setMarkedForReview(new Array(finalQuestions.length).fill(false));
        setBookmarked(new Array(finalQuestions.length).fill(false));
        setEliminated({});
        setNotes({});
        setSubjectFilter(null);
        setElapsedSeconds(0);
        recordedRef.current = false;

        const durationSeconds = full
            ? Math.max(20 * 60, exam.timeMinutes * 60)
            : Math.max(
                  20 * 60,
                  Math.round(
                      (exam.timeMinutes * 60 * (finalQuestions.length || 1)) /
                          Math.max(1, exam.subjects.reduce((s, sub) => s + sub.questionsCount, 0)),
                  ),
              );
        setTimer(durationSeconds);

        const subjectId = full ? FULL_PAPER_SUBJECT_ID : subject!.id;
        saveExamDraft({
            version: 3,
            scope: full ? 'full' : 'subject',
            flowType,
            examId: exam.id,
            subjectId,
            paperYear: paper ? String(paper.year) : undefined,
            step: 'solving',
            questions: finalQuestions,
            currentQuestionIndex: 0,
            userAnswers: new Array(finalQuestions.length).fill(-1),
            visitedQuestions: initialVisited,
            markedForReview: new Array(finalQuestions.length).fill(false),
            bookmarked: new Array(finalQuestions.length).fill(false),
            eliminated: {},
            notes: {},
            timer: durationSeconds,
            elapsedSeconds: 0,
            subjectFilter: null,
            savedAt: Date.now(),
        });
        goToStep('solving', {
            exam: exam.id,
            subject: full ? null : subject!.id,
            paper: paper ? String(paper.year) : null,
        });
        analytics.testStarted({
            examId: exam.id,
            subjectId,
            testId: paper
                ? `${exam.id}-${subjectId}-${paper.year}`
                : `${exam.id}-${subjectId}`,
            totalQuestions: finalQuestions.length,
            flowType,
        });
    };

    /** Full multi-subject CBT paper. */
    const generateAndStartFullExam = async (exam: Exam, paperOverride?: Paper | null) => {
        if (flowType === 'weekly') {
            if (!weeklySession || !isSessionLive(weeklySession)) {
                window.alert('This weekly exam window has closed.');
                exitToSelection();
                return;
            }
        }
        const generationId = ++generationIdRef.current;
        setIsGenerating(true);
        setGenerationLabel('Preparing full examination…');
        try {
            const year = resolveExamYear(exam, paperOverride !== undefined ? paperOverride : selectedPaper);
            const mode = paperFlow ? 'pyq' : mockFlow ? 'mock' : 'standard';
            const finalQuestions = await buildFullExamSession({
                exam,
                examYear: year,
                mode,
                shouldContinue: () =>
                    isMountedRef.current && generationId === generationIdRef.current,
                onProgress: (p) => {
                    setGenerationLabel(
                        p.phase === 'fallback'
                            ? `Loading ${p.subjectName} (offline)…`
                            : `Building ${p.subjectName} (${p.subjectIndex + 1}/${p.subjectTotal})…`,
                    );
                },
            });
            if (!isMountedRef.current || generationId !== generationIdRef.current) return;
            if (!finalQuestions.length) {
                weeklyAutoStartedRef.current = false;
                toast.error('Could not build a full examination. Please try again.');
                return;
            }
            applyQuestionsAndStartSolving(
                finalQuestions,
                exam,
                null,
                paperOverride !== undefined ? paperOverride : selectedPaper,
                true,
            );
        } catch (error) {
            console.error('Failed to generate full exam:', error);
            if (isMountedRef.current && generationId === generationIdRef.current) {
                weeklyAutoStartedRef.current = false;
                toast.error('Could not generate the full examination. Please try again.');
            }
        } finally {
            if (isMountedRef.current && generationId === generationIdRef.current) {
                setIsGenerating(false);
                setGenerationLabel(null);
            }
        }
    };

    /** Single-subject generation (weekly subject-scoped windows only). */
    const generateAndStartExam = async (exam: Exam, subject: ExamSubject, paperOverride?: Paper | null) => {
        if (flowType === 'weekly') {
            if (!weeklySession || !isSessionLive(weeklySession)) {
                window.alert('This weekly exam window has closed.');
                exitToSelection();
                return;
            }
        }
        const generationId = ++generationIdRef.current;
        setIsGenerating(true);
        setGenerationLabel(`Building ${subject.name}…`);
        try {
            const year = resolveExamYear(exam, paperOverride !== undefined ? paperOverride : selectedPaper);
            const count = resolvePaperLength(
                subject.questionsCount,
                paperFlow ? 'pyq' : mockFlow ? 'mock' : 'standard',
            );
            const finalQuestions = await aiExamGenerator.generateAIExamPaper({
                examId: exam.id,
                examName: exam.name,
                subjectId: subject.id,
                subjectName: subject.name,
                count,
                examYear: year,
                mode: paperFlow ? 'pyq' : 'mock',
            });
            if (!isMountedRef.current || generationId !== generationIdRef.current) return;
            if (!finalQuestions.length) {
                weeklyAutoStartedRef.current = false;
                toast.error('Could not build a unique question paper. Please try again.');
                return;
            }
            applyQuestionsAndStartSolving(
                finalQuestions,
                exam,
                subject,
                paperOverride !== undefined ? paperOverride : selectedPaper,
                false,
            );
        } catch (error) {
            console.error('Failed to generate exam questions:', error);
            if (isMountedRef.current && generationId === generationIdRef.current) {
                weeklyAutoStartedRef.current = false;
                if (error instanceof CompetitiveExamGenerationError && error.code === 'INSUFFICIENT_CONTENT') {
                    toast.error(
                        error.message ||
                            'Not enough valid questions are available for the selected exam and subject.',
                    );
                } else {
                    toast.error('Could not generate the exam paper. Please try again.');
                }
            }
        } finally {
            if (isMountedRef.current && generationId === generationIdRef.current) {
                setIsGenerating(false);
                setGenerationLabel(null);
            }
        }
    };

    const requestStartFullExam = (exam: Exam, paper: Paper | null) => {
        pendingStartRef.current = { exam, subject: null, paper, full: true };
        setIntegrityOpen(true);
    };

    const requestStartExam = (exam: Exam, subject: ExamSubject, paper: Paper | null) => {
        pendingStartRef.current = { exam, subject, paper, full: false };
        setIntegrityOpen(true);
    };

    const cancelIntegrity = () => {
        pendingStartRef.current = null;
        setIntegrityOpen(false);
        weeklyAutoStartedRef.current = false;
    };

    const confirmIntegrity = () => {
        const pending = pendingStartRef.current;
        pendingStartRef.current = null;
        setIntegrityOpen(false);
        if (!pending) return;
        if (pending.full) {
            void generateAndStartFullExam(pending.exam, pending.paper);
        } else if (pending.subject) {
            void generateAndStartExam(pending.exam, pending.subject, pending.paper);
        }
    };

    useEffect(() => {
        if (!integrityOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') cancelIntegrity();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [integrityOpen]);

    // Weekly mock deep-link: exam + subject preselected → generate immediately while live
    useEffect(() => {
        if (flowType !== 'weekly' || !weeklySession) return;
        if (!isSessionLive(weeklySession)) return;
        if (!mockFlow || !selectedExam || !selectedSubject) return;
        if (step !== 'subject' || questions.length > 0 || isGenerating) return;
        if (weeklyAutoStartedRef.current) return;
        weeklyAutoStartedRef.current = true;
        requestStartExam(selectedExam, selectedSubject, null);
    }, [
        flowType,
        weeklySession,
        mockFlow,
        selectedExam,
        selectedSubject,
        step,
        questions.length,
        isGenerating,
    ]);

    const handleSubjectSelect = async (subject: ExamSubject) => {
        if (!selectedExam || isGenerating) return;
        // Only weekly subject-scoped windows still use Choose Subject
        if (flowType === 'weekly' && weeklySession?.mode === 'mock') {
            updateFlowParams({ subject: subject.id, paper: null }, { replace: true });
            requestStartExam(selectedExam, subject, null);
        } else if (flowType === 'weekly') {
            goToStep('paper', { subject: subject.id, paper: null });
        }
    };

    const handlePaperSelect = (paper: Paper) => {
        if (isGenerating || !selectedExam) return;
        updateFlowParams({ paper: String(paper.year) }, { replace: true });
        if (useFullPaper) {
            requestStartFullExam(selectedExam, paper);
            return;
        }
        if (selectedSubject) {
            requestStartExam(selectedExam, selectedSubject, paper);
        }
    };

    const handleAnswerSelect = useCallback((optionIndex: number) => {
        if (showExplanation) return;
        const idx = currentQuestionIndexRef.current;
        const examId = selectedExamRef.current?.id;
        const q = questionsRef.current[idx];
        const prevAnswer = userAnswersRef.current[idx];
        if (examId && prevAnswer !== optionIndex) {
            analytics.questionAttempted({
                examId,
                questionNumber: idx + 1,
                questionId: q?.id,
                flowType: flowTypeRef.current,
            });
            if (q && optionIndex === q.correctAnswer) {
                analytics.answerCorrect({
                    examId,
                    questionNumber: idx + 1,
                    flowType: flowTypeRef.current,
                });
            } else if (q) {
                analytics.answerIncorrect({
                    examId,
                    questionNumber: idx + 1,
                    flowType: flowTypeRef.current,
                });
            }
        }
        setUserAnswers((prev) => {
            const next = [...prev];
            next[idx] = optionIndex;
            return next;
        });
    }, [showExplanation]);

    const currentQuestionId = questions[currentQuestionIndex]?.id;
    useEffect(() => {
        if (step !== 'solving' || !selectedExam) return;
        analytics.questionViewed({
            examId: selectedExam.id,
            questionNumber: currentQuestionIndex + 1,
            questionId: currentQuestionId,
            flowType,
        });
    }, [step, selectedExam, currentQuestionIndex, currentQuestionId, flowType]);

    const navigateToQuestion = useCallback((index: number) => {
        setCurrentQuestionIndex(index);
        setVisitedQuestions((prev) => {
            const next = [...prev];
            next[index] = true;
            return next;
        });
    }, []);

    const handleClearResponse = useCallback(() => {
        const idx = currentQuestionIndexRef.current;
        setUserAnswers((prev) => {
            const next = [...prev];
            next[idx] = -1;
            return next;
        });
    }, []);

    const handleSaveAndNext = useCallback(() => {
        const idx = currentQuestionIndexRef.current;
        setMarkedForReview((prev) => {
            const next = [...prev];
            next[idx] = false;
            return next;
        });
        if (idx < questionsRef.current.length - 1) {
            const nextIndex = idx + 1;
            setCurrentQuestionIndex(nextIndex);
            setVisitedQuestions((visited) => {
                const next = [...visited];
                next[nextIndex] = true;
                return next;
            });
        }
    }, []);

    const handleSubmitExam = useCallback(() => {
        if (!window.confirm('Submit this exam? You cannot change answers after submitting.')) return;
        flushClockAndSubmit();
    }, [flushClockAndSubmit]);

    const handleMarkAndNext = useCallback(() => {
        const idx = currentQuestionIndexRef.current;
        setMarkedForReview((prev) => {
            const next = [...prev];
            next[idx] = true;
            return next;
        });
        if (idx < questionsRef.current.length - 1) {
            const nextIndex = idx + 1;
            setCurrentQuestionIndex(nextIndex);
            setVisitedQuestions((visited) => {
                const next = [...visited];
                next[nextIndex] = true;
                return next;
            });
        }
    }, []);

    const handlePrevious = useCallback(() => {
        const idx = currentQuestionIndexRef.current;
        if (idx > 0) {
            setCurrentQuestionIndex(idx - 1);
            setVisitedQuestions((visited) => {
                const next = [...visited];
                next[idx - 1] = true;
                return next;
            });
        }
    }, []);

    const handleToggleBookmark = useCallback(() => {
        const idx = currentQuestionIndexRef.current;
        setBookmarked((prev) => {
            const next = [...prev];
            next[idx] = !next[idx];
            return next;
        });
    }, []);

    const handleNoteChange = useCallback((text: string) => {
        const idx = currentQuestionIndexRef.current;
        setNotes((prev) => ({ ...prev, [idx]: text }));
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const calculateScore = () => {
        let correct = 0;
        try {
            userAnswers.forEach((ans, idx) => {
                const q = questions[idx];
                if (q && typeof q.correctAnswer === 'number' && ans === q.correctAnswer) {
                    correct++;
                }
            });
        } catch (e) {
            console.error('Score calculation failed:', e);
        }
        return correct;
    };

    const activeTheme = selectedExam && EXAM_THEMES[selectedExam.id] ? EXAM_THEMES[selectedExam.id] : EXAM_THEMES['gate'];
    const correctCount = calculateScore();
    const attemptedCount = userAnswers.filter((answer) => answer !== -1).length;
    const incorrectCount = Math.max(0, attemptedCount - correctCount);
    const unattemptedCount = Math.max(0, questions.length - attemptedCount);
    const accuracyPercent = questions.length
        ? Math.round((correctCount / questions.length) * 100)
        : 0;
    const attemptPercent = questions.length
        ? Math.round((attemptedCount / questions.length) * 100)
        : 0;
    const rawScore = correctCount * 4 - incorrectCount;
    const maxScore = questions.length * 4;
    const timeTakenSeconds =
        elapsedSeconds || Math.max(0, (selectedExam?.timeMinutes || 0) * 60 - timer);
    const reviewItems = questions
        .map((question, index) => {
            const answer = userAnswers[index];
            const status: 'correct' | 'incorrect' | 'unattempted' =
                answer === -1
                    ? 'unattempted'
                    : answer === question.correctAnswer
                      ? 'correct'
                      : 'incorrect';
            return { question, index, status };
        })
        .filter((item) => reviewFilter === 'all' || item.status === reviewFilter);

    return (
        <div className={`relative w-full ${isDashboardView && step === 'solving' ? 'min-h-0' : ''}`}>
            <AnimatePresence mode="wait">
                {isGenerating && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm"
                    >
                        <div className="w-20 h-20 mb-6 relative flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-orange-200 dark:border-orange-900 rounded-full animate-ping opacity-75" />
                            <div className="absolute inset-0 border-4 border-orange-600 dark:border-orange-400 rounded-full border-t-transparent animate-spin" />
                            <BrainCircuit className="w-8 h-8 text-orange-600 dark:text-orange-400 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                            {useFullPaper ? 'Building full examination…' : 'Generating AI Exam…'}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 max-w-sm text-center">
                            {generationLabel ||
                                'Crafting high-quality, syllabus-aligned questions for a fresh practice experience.'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {integrityOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="exam-integrity-title"
                    >
                        <button
                            type="button"
                            className="absolute inset-0 cursor-default"
                            aria-label="Dismiss integrity notice"
                            onClick={cancelIntegrity}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-7"
                            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h3 id="exam-integrity-title" className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                Academic integrity
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                Attempt this exam honestly, as you would in a real exam hall. Do not copy from AI chatbots, websites, notes, or another person. Your answers should reflect your own understanding.
                            </p>
                            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={cancelIntegrity}
                                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmIntegrity}
                                    autoFocus
                                    className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
                                >
                                    I understand, start exam
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header / Breadcrumbs — hidden during live exam for immersion */}
            {step !== 'solving' && (
            <div className="flex items-center justify-between gap-3 mb-8 p-1.5 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-sm overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-3">
                    {(step !== 'exam') && (
                        <button
                            onClick={handleBack}
                            className="p-2 lg:p-3 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/40 rounded-2xl transition-all active:scale-95 flex items-center gap-2 group border border-slate-200 dark:border-slate-700 hover:border-orange-200 shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4 text-orange-600 dark:text-orange-400 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Back to Exams</span>
                        </button>
                    )}

                    <div className="flex items-center gap-2 h-8 px-2 whitespace-nowrap">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'exam' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>Exams</span>
    
                        {selectedExam && (
                            <>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'subject' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>{selectedExam.name}</span>
                            </>
                        )}
    
                        {selectedSubject && (
                            <>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'paper' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>{selectedSubject.name}</span>
                            </>
                        )}
    
                        {selectedPaper && (
                            <>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'result' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>{selectedPaper.year}</span>
                            </>
                        )}
    
                        {step === 'result' && (
                            <>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: activeTheme.color }}>Report</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Quick Selection Dropdown */}
                {step === 'exam' && (
                    <div className="lg:hidden pr-2">
                        <select 
                            onChange={(e) => {
                                const exam = COMPETITIVE_EXAMS.find(ex => ex.id === e.target.value);
                                if (exam) handleExamSelect(exam);
                            }}
                            className="text-xs font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-orange-500"
                            value=""
                        >
                            <option value="" disabled>Quick Select Exam</option>
                            {COMPETITIVE_EXAMS.map(exam => (
                                <option key={exam.id} value={exam.id}>{exam.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            )}

            {/* Content Display */}
            <div className="relative">
                {/* Step 1: Exam Selection */}
                {step === 'exam' && (
                    <motion.div
                        key="exam"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                    >
                        <div className="mb-8 hidden lg:block">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">
                                {flowType === 'weekly'
                                    ? 'Weekly exam'
                                    : flowType === 'mock'
                                      ? 'Full-length mocks'
                                      : flowType === 'pyq'
                                        ? 'Previous year papers'
                                        : 'Available exams'}
                            </h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                                {flowType === 'weekly'
                                    ? weeklySession?.title ||
                                      'Complete the published weekend assessment while the live window is open.'
                                    : flowType === 'mock'
                                      ? 'Timed simulation papers with exam-style pressure and negative marking.'
                                      : flowType === 'pyq'
                                        ? 'Authentic year-tagged papers to master recurring patterns.'
                                        : 'Choose your target examination — each card carries a distinct identity and syllabus path.'}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {COMPETITIVE_EXAMS.map((exam, i) => (
                                <ExamCard
                                    key={exam.id}
                                    exam={exam}
                                    index={i}
                                    badge={
                                        flowType === 'weekly'
                                            ? 'Weekly'
                                            : flowType === 'mock'
                                              ? 'Mock'
                                              : flowType === 'pyq'
                                                ? 'PYQ'
                                                : undefined
                                    }
                                    onSelect={handleExamSelect}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Subject Selection — weekly subject-scoped only */}
                {step === 'subject' && selectedExam && !useFullPaper && (
                    <motion.div
                        key="subject"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                    >
                        <div className="mb-10 flex flex-col items-center text-center">
                            <span className="px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest mb-4 border border-orange-100 dark:border-orange-800/50">
                                Domain Selection
                            </span>
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-3">Choose Your Subject</h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl">Focus your practice sessions on specific core disciplines for the {selectedExam.name} examination.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {selectedExam.subjects.map((subject, i) => {
                                const theme = EXAM_THEMES[selectedExam.id] || EXAM_THEMES['gate'];
                                
                                const SUBJECT_IMAGES: Record<string, string> = {
                                    'phy': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop',
                                    'physics': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop',
                                    'chem': '/tutor-media/images/subjects/chemistry.png',
                                    'chemistry': '/tutor-media/images/subjects/chemistry.png',
                                    'math': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
                                    'mathematics': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
                                    'bot': '/tutor-media/images/subjects/botany.png',
                                    'botany': '/tutor-media/images/subjects/botany.png',
                                    'zoo': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=800&auto=format&fit=crop',
                                    'zoology': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=800&auto=format&fit=crop',
                                    'mat': 'https://images.unsplash.com/photo-1558021212-51b6ecfa0db9?q=80&w=800&auto=format&fit=crop',
                                    'sat-sci': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop',
                                    'sat-sst': 'https://images.unsplash.com/photo-1447069387366-2a3b0638ca3d?q=80&w=800&auto=format&fit=crop',
                                    'sat-math': 'https://images.unsplash.com/photo-1454165833767-027ffea9e778?q=80&w=800&auto=format&fit=crop',
                                    'sci': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop',
                                    'eng': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
                                    'english': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
                                    'intel': 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=800&auto=format&fit=crop', // Intelligence/puzzle
                                    'gk': 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&w=800&auto=format&fit=crop', // General Knowledge/Globe
                                    'arith': 'https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?q=80&w=800&auto=format&fit=crop', // Arithmetic/Calculator
                                    'hin': 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=800&auto=format&fit=crop', // Hindi/Culture
                                    'sst': 'https://images.unsplash.com/photo-1447069387366-2a3b0638ca3d?q=80&w=800&auto=format&fit=crop', // Social Science/History
                                    'lang': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop', // Language
                                    'default': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop'
                                };
                                const bgUrl = SUBJECT_IMAGES[subject.id.trim().toLowerCase()] || SUBJECT_IMAGES[subject.name.trim().toLowerCase()] || SUBJECT_IMAGES['default'];

                                return (
                                    <PremiumSelectionCard
                                        key={subject.id}
                                        title={subject.name}
                                        eyebrow={`${selectedExam.name} domain`}
                                        description="Exam-pattern practice with adaptive difficulty and live performance tracking."
                                        meta={`${subject.questionsCount} practice questions`}
                                        icon={<BrainCircuit className="h-5 w-5" />}
                                        accent={theme.color}
                                        image={bgUrl}
                                        index={i}
                                        badge={
                                            flowType === 'weekly'
                                                ? 'Weekly'
                                                : flowType === 'mock'
                                                  ? 'Mock track'
                                                  : 'Subject'
                                        }
                                        onClick={() => handleSubjectSelect(subject)}
                                    />
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Paper Selection */}
                {step === 'paper' && selectedExam && (
                    <motion.div
                        key="paper"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                    >
                        <div className="comp-surface-card group relative mb-10 overflow-hidden p-6 sm:p-10">
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-150" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: activeTheme.color }}>
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Question Repository</span>
                                    </div>
                                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-3">Previous Year Papers</h2>
                                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                                        Select a year to open the complete {selectedExam.name} examination with all subjects in one session.
                                    </p>
                                </div>
                                <div className="flex bg-slate-50 dark:bg-slate-800/80 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 gap-8">
                                    <div className="text-center">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Papers</div>
                                        <div className="text-3xl font-black text-gray-900 dark:text-white">{selectedExam.papers.length}</div>
                                    </div>
                                    <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
                                    <div className="text-center">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Time Limit</div>
                                        <div className="text-3xl font-black text-gray-900 dark:text-white">{selectedExam.timeMinutes}m</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {selectedExam.papers.map((paper: Paper, i: number) => {
                                const theme = EXAM_THEMES[selectedExam?.id || 'gate'];
                                return (
                                    <PremiumSelectionCard
                                        key={`${paper.year}-${paper.shift || '1'}`}
                                        title={String(paper.year)}
                                        eyebrow="Previous year paper"
                                        description={`${selectedExam.name} official-pattern archive for timed simulation.`}
                                        meta={`Shift ${paper.shift || '1'} · ${selectedExam.timeMinutes} minutes`}
                                        icon={<Calendar className="h-5 w-5" />}
                                        accent={theme.color}
                                        index={i}
                                        compact
                                        badge="PYQ"
                                        onClick={() => handlePaperSelect(paper)}
                                    />
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Step 5: Live examination panel */}
                {step === 'solving' && questions.length > 0 && selectedExam && (useFullPaper || selectedSubject) && (
                    <motion.div
                        key="solving"
                        initial={{ opacity: 0, scale: 0.985 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.985 }}
                    >
                        <LiveExamPanel
                            exam={selectedExam}
                            subjectName={
                                useFullPaper ? 'Full examination' : selectedSubject?.name || 'Subject'
                            }
                            subjects={selectedExam.subjects}
                            subjectFilter={subjectFilter}
                            onSubjectFilterChange={setSubjectFilter}
                            isFullPaper={useFullPaper}
                            questions={questions}
                            currentQuestionIndex={currentQuestionIndex}
                            userAnswers={userAnswers}
                            visitedQuestions={visitedQuestions}
                            markedForReview={markedForReview}
                            timeLeftSeconds={timer}
                            isLowTime={timer <= 5 * 60}
                            elapsedSeconds={elapsedSeconds}
                            bookmarked={bookmarked}
                            notes={notes}
                            onAnswerSelect={handleAnswerSelect}
                            onNavigate={navigateToQuestion}
                            onClear={handleClearResponse}
                            onSaveAndNext={handleSaveAndNext}
                            onMarkAndNext={handleMarkAndNext}
                            onPrevious={handlePrevious}
                            onSubmit={handleSubmitExam}
                            onToggleBookmark={handleToggleBookmark}
                            onNoteChange={handleNoteChange}
                            onTimeTick={handleTimeTick}
                            onTimeExpired={flushClockAndSubmit}
                        />
                    </motion.div>
                )}

                {/* Step 6: Result Screen */}
                {step === 'result' && (
                    <div className="space-y-8 opacity-100 transition-all duration-500">
                        <section
                            className="exam-result-hero"
                            style={{ '--result-accent': activeTheme.color } as React.CSSProperties}
                        >
                            <div className="exam-result-hero__glow" />
                            <header className="exam-result-hero__header">
                                <div className="exam-result-hero__status">
                                    <span><Trophy className="h-4 w-4" /></span>
                                    <div>
                                        <p>Assessment completed</p>
                                        <h2>Performance report</h2>
                                    </div>
                                </div>
                                <div className="exam-result-hero__identity">
                                    <span>{selectedExam?.name || 'Session'}</span>
                                    <span>
                                        {useFullPaper
                                            ? 'Full examination'
                                            : selectedSubject?.name || 'Subject'}
                                    </span>
                                    {selectedPaper?.year && <span>{selectedPaper.year}</span>}
                                </div>
                            </header>

                            <div className="exam-result-hero__body">
                                <motion.div
                                    className="exam-score-dial"
                                    initial={{ opacity: 0, scale: 0.82 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                                    style={{
                                        background: `conic-gradient(${activeTheme.color} ${accuracyPercent * 3.6}deg, color-mix(in srgb, ${activeTheme.color} 10%, transparent) 0deg)`,
                                    }}
                                >
                                    <div className="exam-score-dial__inner">
                                        <span>Net score</span>
                                        <strong>{rawScore}</strong>
                                        <small>out of {maxScore}</small>
                                    </div>
                                </motion.div>

                                <div className="exam-result-summary">
                                    <p className="exam-result-summary__eyebrow">AIra assessment intelligence</p>
                                    <h3>
                                        {accuracyPercent >= 80
                                            ? 'Excellent command of this test.'
                                            : accuracyPercent >= 60
                                              ? 'Strong attempt with clear room to advance.'
                                              : 'A useful baseline for your next focused revision.'}
                                    </h3>
                                    <p className="exam-result-summary__copy">
                                        You attempted {attemptedCount} of {questions.length} questions with {accuracyPercent}% overall accuracy.
                                        Review the answer analysis below to strengthen weak concepts.
                                    </p>
                                    <div className="exam-result-breakdown">
                                        <div><span className="is-correct"><CheckCircle className="h-4 w-4" /></span><strong>{correctCount}</strong><small>Correct</small></div>
                                        <div><span className="is-wrong"><XCircle className="h-4 w-4" /></span><strong>{incorrectCount}</strong><small>Incorrect</small></div>
                                        <div><span className="is-skipped"><FileText className="h-4 w-4" /></span><strong>{unattemptedCount}</strong><small>Unattempted</small></div>
                                    </div>
                                </div>
                            </div>

                            <div className="exam-result-metrics">
                                <PremiumMetricCard
                                    icon={<Target className="h-5 w-5" />}
                                    value={`${accuracyPercent}%`}
                                    label="Overall accuracy"
                                    accent="#059669"
                                    detail={`${correctCount} correct answers`}
                                />
                                <PremiumMetricCard
                                    icon={<CheckCircle className="h-5 w-5" />}
                                    value={`${attemptPercent}%`}
                                    label="Attempt rate"
                                    accent={activeTheme.color}
                                    detail={`${attemptedCount} of ${questions.length} attempted`}
                                />
                                <PremiumMetricCard
                                    icon={<Clock className="h-5 w-5" />}
                                    value={formatTime(timeTakenSeconds)}
                                    label="Time invested"
                                    accent="#2563eb"
                                    detail={`${questions.length ? Math.round(timeTakenSeconds / questions.length) : 0}s average per question`}
                                />
                            </div>

                            <div className="exam-result-actions">
                                <button type="button" onClick={exitToSelection} className="exam-result-actions__secondary">
                                    <ArrowLeft className="h-4 w-4" /> Choose another test
                                </button>
                                <button
                                    type="button"
                                    disabled={isGenerating}
                                    onClick={() => {
                                        if (!selectedExam) return;
                                        resetExam();
                                        if (useFullPaper) {
                                            requestStartFullExam(
                                                selectedExam,
                                                paperFlow || mockFlow ? selectedPaper : null,
                                            );
                                        } else if (selectedSubject) {
                                            requestStartExam(
                                                selectedExam,
                                                selectedSubject,
                                                paperFlow ? selectedPaper : null,
                                            );
                                        }
                                    }}
                                    className="exam-result-actions__primary"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                    {isGenerating ? 'Generating…' : 'Retake assessment'}
                                </button>
                            </div>
                        </section>

                        {/* Detailed Answer Sheet Section */}
                        <section className="answer-review-section">
                            <header className="answer-review-header">
                                <div className="answer-review-header__copy">
                                    <span><FileText className="h-5 w-5" /></span>
                                    <div>
                                        <p>Response analysis</p>
                                        <h3>Answer review</h3>
                                        <small>Compare every response and study the reasoning behind the correct answer.</small>
                                    </div>
                                </div>
                                <div className="answer-review-filters" role="tablist" aria-label="Filter reviewed answers">
                                    {([
                                        ['all', 'All', questions.length],
                                        ['correct', 'Correct', correctCount],
                                        ['incorrect', 'Incorrect', incorrectCount],
                                        ['unattempted', 'Skipped', unattemptedCount],
                                    ] as const).map(([value, label, count]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            role="tab"
                                            aria-selected={reviewFilter === value}
                                            onClick={() => setReviewFilter(value)}
                                            className={reviewFilter === value ? 'is-active' : ''}
                                        >
                                            <span>{label}</span>
                                            <strong>{count}</strong>
                                        </button>
                                    ))}
                                </div>
                            </header>

                            <AnimatePresence mode="popLayout">
                                <div className="answer-review-list">
                                    {reviewItems.map(({ question: q, index: idx, status }, position) => {
                                        const explanationSteps = (q.explanation || '')
                                            .split('\n')
                                            .map((item) => item.trim())
                                            .filter(Boolean);
                                        const stepsToRender = explanationSteps.length
                                            ? explanationSteps
                                            : ['Review the core concept and compare each option before selecting the final answer.'];
                                        const selectedAnswer = userAnswers[idx];

                                        return (
                                            <motion.article
                                                layout
                                                key={q.id}
                                                initial={{ opacity: 0, y: 18 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ delay: Math.min(position * 0.045, 0.25), type: 'spring', damping: 24 }}
                                                className={`answer-review-card answer-review-card--${status}`}
                                            >
                                                <div className="answer-review-card__rail" />
                                                <header className="answer-review-card__header">
                                                    <div className="answer-review-card__labels">
                                                        <span className="answer-review-card__number">Question {idx + 1}</span>
                                                        <span className={`answer-review-card__status answer-review-card__status--${status}`}>
                                                            {status === 'correct' ? <CheckCircle className="h-3.5 w-3.5" /> : status === 'incorrect' ? <XCircle className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                                            {status === 'correct' ? 'Correct' : status === 'incorrect' ? 'Incorrect' : 'Unattempted'}
                                                        </span>
                                                        <span className="answer-review-card__difficulty">{q.difficulty}</span>
                                                    </div>
                                                    <span className="answer-review-card__marks">
                                                        {status === 'correct' ? '+4 marks' : status === 'incorrect' ? '−1 mark' : '0 marks'}
                                                    </span>
                                                </header>

                                                <div className="answer-review-card__question">
                                                    <p>{q.subjectName || selectedSubject?.name} · {q.topic}</p>
                                                    <h4>{q.text}</h4>
                                                </div>

                                                <div className="answer-comparison">
                                                    <div className={`answer-comparison__item answer-comparison__item--${status}`}>
                                                        <div className="answer-comparison__label">
                                                            <span>Your response</span>
                                                            <small>{status === 'correct' ? 'Matched' : status === 'incorrect' ? 'Needs review' : 'Not answered'}</small>
                                                        </div>
                                                        <div className="answer-comparison__answer">
                                                            <strong>{selectedAnswer !== -1 ? String.fromCharCode(65 + selectedAnswer) : '—'}</strong>
                                                            <span>{
                                                                selectedAnswer >= 0 && selectedAnswer < q.options.length
                                                                    ? q.options[selectedAnswer]
                                                                    : 'No option selected'
                                                            }</span>
                                                        </div>
                                                    </div>
                                                    <div className="answer-comparison__item answer-comparison__item--solution">
                                                        <div className="answer-comparison__label">
                                                            <span>Correct answer</span>
                                                            <small>Verified solution</small>
                                                        </div>
                                                        <div className="answer-comparison__answer">
                                                            <strong>{
                                                                typeof q.correctAnswer === 'number' && q.correctAnswer >= 0
                                                                    ? String.fromCharCode(65 + q.correctAnswer)
                                                                    : '—'
                                                            }</strong>
                                                            <span>{
                                                                typeof q.correctAnswer === 'number' &&
                                                                q.correctAnswer >= 0 &&
                                                                q.correctAnswer < q.options.length
                                                                    ? q.options[q.correctAnswer]
                                                                    : '—'
                                                            }</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="answer-explanation">
                                                    <header className="answer-explanation__header">
                                                        <span style={{ backgroundColor: activeTheme.color }}><Brain className="h-5 w-5" /></span>
                                                        <div>
                                                            <p style={{ color: activeTheme.color }}>Expert explanation</p>
                                                            <h5>Understand the reasoning</h5>
                                                        </div>
                                                        <span className="answer-explanation__step-count">{stepsToRender.length} steps</span>
                                                    </header>

                                                    <div className="answer-explanation__steps">
                                                        {stepsToRender.map((stepText, stepIndex) => (
                                                            <div key={`${q.id}-step-${stepIndex}`} className="answer-explanation__step">
                                                                <span style={{ color: activeTheme.color, borderColor: `${activeTheme.color}35` }}>
                                                                    {stepIndex + 1}
                                                                </span>
                                                                <p>{stepText}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <footer className="answer-explanation__footer">
                                                        <div>
                                                            <Sparkles className="h-4 w-4" style={{ color: activeTheme.color }} />
                                                            <span>Need a lecturer-style walkthrough?</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            disabled={explainBuildingId === q.id}
                                                            onClick={async () => {
                                                                if (explainBuildingId) return;
                                                                const { icon: _icon, ...serializableTheme } = activeTheme;
                                                                void _icon;
                                                                setExplainBuildingId(q.id);
                                                                try {
                                                                    const { generateAITeachingSteps, areValidTeachingSteps } = await import('../../utils/competitiveTeaching');
                                                                    const competitiveQuestion = q as unknown as CompetitiveQuestion;
                                                                    const teachingSteps = await generateAITeachingSteps(
                                                                        competitiveQuestion,
                                                                        selectedExam?.name,
                                                                        userAnswers[idx],
                                                                    );
                                                                    if (!areValidTeachingSteps(teachingSteps)) {
                                                                        throw new Error('Could not build the AI explanation.');
                                                                    }
                                                                    const payload = {
                                                                        competitiveQuestion: q,
                                                                        theme: serializableTheme,
                                                                        userAnswer: userAnswers[idx],
                                                                        examName: selectedExam?.name,
                                                                        returnTo: `${location.pathname}${location.search}`,
                                                                        teachingSteps,
                                                                    };
                                                                    saveExplainPayload(payload);
                                                                    navigate(studentRoutes.competitiveExplain, { state: payload });
                                                                } catch (err) {
                                                                    toast.error(
                                                                        err instanceof Error
                                                                            ? err.message
                                                                            : 'Could not build the AI explanation. Please try again.',
                                                                    );
                                                                } finally {
                                                                    setExplainBuildingId(null);
                                                                }
                                                            }}
                                                            style={{ backgroundColor: activeTheme.color }}
                                                        >
                                                            {explainBuildingId === q.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Sparkles className="h-4 w-4" />
                                                            )}
                                                            {explainBuildingId === q.id ? 'Building explanation…' : 'Explain with AI'}
                                                            {explainBuildingId !== q.id && <ChevronRight className="h-4 w-4" />}
                                                        </button>
                                                    </footer>
                                                </div>
                                            </motion.article>
                                        );
                                    })}
                                </div>
                            </AnimatePresence>
                        </section>
                    </div>
                )}
            </div>

            {/* Diagnostic Helper (Removed from user view since fixed) */}
        </div>
    );
}
