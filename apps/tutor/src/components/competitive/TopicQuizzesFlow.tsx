import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, FileText, ArrowLeft, Award, BrainCircuit, Clock } from 'lucide-react';
import { schoolGrades } from '../../data/schoolCurriculum';
import type { SchoolSubject, Chapter } from '../../types';
import { Question } from '../../data/competitiveQuestions';
import { aiExamGenerator } from '../../services/aiExamGenerator';
import { PremiumMetricCard, PremiumSelectionCard } from './CompetitiveCards';
import { toast } from '../../stores/toastStore';
import { loadQuizDraft, saveQuizDraft, clearQuizDraft, type QuizDraft } from '../../lib/competitiveRoute';
import { analytics } from '../../services/analyticsService';

type QuizStep = 'subject' | 'chapter' | 'solving' | 'result';
const QUIZ_FLOW = 'quiz' as const;

function normalizeQuizStep(value: string | null): QuizStep {
    return value === 'chapter' || value === 'solving' || value === 'result' ? value : 'subject';
}

export default function TopicQuizzesFlow() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Defaulting to Class 12 Science for Competitive Topic Quizzes
    const defaultGrade = schoolGrades.find(g => g.id === 'grade-12-science') || schoolGrades[0];

    // Selection and step live in the URL so a refresh resumes the same quiz.
    const step = normalizeQuizStep(searchParams.get('step'));
    const selectedSubject = useMemo<SchoolSubject | null>(
        () => defaultGrade?.subjects.find(s => s.id === searchParams.get('subject')) ?? null,
        [defaultGrade, searchParams],
    );
    const selectedChapter = useMemo<Chapter | null>(
        () => selectedSubject?.chapters.find(c => c.id === searchParams.get('chapter')) ?? null,
        [selectedSubject, searchParams],
    );

    const updateParams = useCallback(
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
        (next: QuizStep, updates: Record<string, string | null> = {}, options: { replace?: boolean } = {}) => {
            const base: Record<string, string | null> =
                next === 'subject' ? { step: null, subject: null, chapter: null } : { step: next };
            updateParams({ ...base, ...updates }, options);
        },
        [updateParams],
    );

    // Generated questions cannot live in the URL, so a resumed tab reads them
    // back from session storage on the very first render.
    const initialDraftRef = useRef<QuizDraft | null | undefined>(undefined);
    const generationIdRef = useRef(0);
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            generationIdRef.current += 1;
        };
    }, []);

    if (initialDraftRef.current === undefined) {
        const params = new URLSearchParams(window.location.search);
        const urlStep = normalizeQuizStep(params.get('step'));
        const subjectId = params.get('subject') ?? undefined;
        const chapterId = params.get('chapter') ?? undefined;
        const draft =
            urlStep === 'solving' || urlStep === 'result'
                ? loadQuizDraft(subjectId, chapterId)
                : null;
        initialDraftRef.current =
            draft && draft.subjectId === subjectId && draft.chapterId === chapterId ? draft : null;
    }
    const initialDraft = initialDraftRef.current;

    // Quiz State
    const [questions, setQuestions] = useState<Question[]>(() => initialDraft?.questions ?? []);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => initialDraft?.currentQuestionIndex ?? 0);
    const [userAnswers, setUserAnswers] = useState<number[]>(() => initialDraft?.userAnswers ?? []);
    const [showExplanation, setShowExplanation] = useState(() => {
        const answer = initialDraft?.userAnswers?.[initialDraft?.currentQuestionIndex ?? 0];
        return answer !== undefined && answer !== -1;
    });
    const [timer, setTimer] = useState(() => initialDraft?.timer ?? 0);
    const [isGenerating, setIsGenerating] = useState(false);
    const quizCompletedForChapterRef = useRef<string | null>(null);
    const quizStartedForChapterRef = useRef<string | null>(null);

    // Timer Effect
    useEffect(() => {
        if (step !== 'solving') return;
        const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [step]);

    // Autosave so a reload keeps the generated quiz and the answers given so far
    useEffect(() => {
        if ((step !== 'solving' && step !== 'result') || !selectedSubject || !selectedChapter) return;
        if (!questions.length) return;
        saveQuizDraft({
            version: 1,
            subjectId: selectedSubject.id,
            chapterId: selectedChapter.id,
            step,
            questions,
            currentQuestionIndex,
            userAnswers,
            timer,
            savedAt: Date.now(),
        });
    }, [step, selectedSubject, selectedChapter, questions, currentQuestionIndex, userAnswers, timer]);

    // Repair URLs that cannot render — stale links or an expired quiz draft.
    useEffect(() => {
        if (isGenerating) return;
        if (step === 'chapter' && !selectedSubject) {
            goToStep('subject', {}, { replace: true });
        } else if ((step === 'solving' || step === 'result') && !questions.length) {
            goToStep(selectedSubject ? 'chapter' : 'subject', { chapter: null }, { replace: true });
        }
    }, [step, selectedSubject, questions.length, isGenerating, goToStep]);

    // Fire test_started once when entering a solving session for a chapter.
    useEffect(() => {
        if (step !== 'solving' || !selectedSubject || !selectedChapter || !questions.length) return;
        const key = `${selectedSubject.id}:${selectedChapter.id}`;
        if (quizStartedForChapterRef.current === key) return;
        quizStartedForChapterRef.current = key;
        quizCompletedForChapterRef.current = null;
        analytics.testStarted({
            examId: `quiz_${selectedChapter.id}`,
            subjectId: selectedSubject.id,
            topicId: selectedChapter.id,
            totalQuestions: questions.length,
            flowType: QUIZ_FLOW,
        });
    }, [step, selectedSubject, selectedChapter, questions.length]);

    useEffect(() => {
        if (step !== 'solving' || !selectedChapter || !questions.length) return;
        const q = questions[currentQuestionIndex];
        analytics.questionViewed({
            examId: `quiz_${selectedChapter.id}`,
            questionNumber: currentQuestionIndex + 1,
            questionId: q?.id,
            flowType: QUIZ_FLOW,
        });
    }, [step, selectedChapter?.id, currentQuestionIndex, questions]);

    // Fire test_completed once when the result screen opens.
    useEffect(() => {
        if (step !== 'result' || !selectedSubject || !selectedChapter || !questions.length) return;
        const key = `${selectedSubject.id}:${selectedChapter.id}`;
        if (quizCompletedForChapterRef.current === key) return;
        quizCompletedForChapterRef.current = key;
        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;
        userAnswers.forEach((answer, index) => {
            if (answer === -1) unattempted++;
            else if (answer === questions[index]?.correctAnswer) correct++;
            else incorrect++;
        });
        analytics.testCompleted({
            examId: `quiz_${selectedChapter.id}`,
            subjectId: selectedSubject.id,
            topicId: selectedChapter.id,
            score: correct * 4 - incorrect,
            totalQuestions: questions.length,
            correctAnswers: correct,
            incorrectAnswers: incorrect,
            skippedQuestions: unattempted,
            timeSpentSeconds: timer,
            flowType: QUIZ_FLOW,
        });
    }, [step, selectedSubject, selectedChapter, questions, userAnswers, timer]);

    const resetQuiz = useCallback(() => {
        setQuestions([]);
        setUserAnswers([]);
        setCurrentQuestionIndex(0);
        setShowExplanation(false);
        setTimer(0);
        clearQuizDraft(selectedSubject?.id, selectedChapter?.id);
        quizStartedForChapterRef.current = null;
    }, [selectedSubject?.id, selectedChapter?.id]);

    const handleBack = () => {
        if (step === 'result') {
            resetQuiz();
            goToStep('chapter', { chapter: null });
        } else if (step === 'solving') {
            const confirmQuit = window.confirm("Are you sure you want to quit the quiz? Progress will be lost.");
            if (confirmQuit) {
                if (selectedChapter) {
                    analytics.testAbandoned({
                        examId: `quiz_${selectedChapter.id}`,
                        questionNumber: currentQuestionIndex + 1,
                        flowType: QUIZ_FLOW,
                        subjectId: selectedSubject?.id,
                        topicId: selectedChapter.id,
                    });
                }
                resetQuiz();
                goToStep('chapter', { chapter: null });
            }
        } else if (step === 'chapter') {
            goToStep('subject');
        }
    };

    const handleSubjectSelect = (subject: SchoolSubject) => {
        goToStep('chapter', { subject: subject.id, chapter: null });
    };

    const handleChapterSelect = async (chapter: Chapter) => {
        if (!selectedSubject || isGenerating) return;
        const generationId = ++generationIdRef.current;
        updateParams({ chapter: chapter.id }, { replace: true });
        setIsGenerating(true);
        try {
            const generatedQuiz = await aiExamGenerator.generateAITopicQuiz(
                selectedSubject.name,
                chapter.name,
                10
            );

            if (!isMountedRef.current || generationId !== generationIdRef.current) return;

            if (!generatedQuiz.length) {
                toast.error('Could not generate unique chapter questions. Please try again.');
                return;
            }

            setQuestions(generatedQuiz);
            setUserAnswers(new Array(generatedQuiz.length).fill(-1));
            setCurrentQuestionIndex(0);
            setShowExplanation(false);
            setTimer(0);
            saveQuizDraft({
                version: 1,
                subjectId: selectedSubject.id,
                chapterId: chapter.id,
                step: 'solving',
                questions: generatedQuiz,
                currentQuestionIndex: 0,
                userAnswers: new Array(generatedQuiz.length).fill(-1),
                timer: 0,
                savedAt: Date.now(),
            });
            goToStep('solving', { chapter: chapter.id });
        } catch (error) {
            console.error("Failed to generate topic quiz:", error);
            if (isMountedRef.current && generationId === generationIdRef.current) {
                toast.error('Could not generate this quiz. Please try again.');
            }
        } finally {
            if (isMountedRef.current && generationId === generationIdRef.current) {
                setIsGenerating(false);
            }
        }
    };

    const handleAnswerSelect = (optionIndex: number) => {
        if (showExplanation) return;
        if (selectedChapter) {
            const q = questions[currentQuestionIndex];
            const examId = `quiz_${selectedChapter.id}`;
            analytics.questionAttempted({
                examId,
                questionNumber: currentQuestionIndex + 1,
                questionId: q?.id,
                flowType: QUIZ_FLOW,
            });
            if (q && optionIndex === q.correctAnswer) {
                analytics.answerCorrect({
                    examId,
                    questionNumber: currentQuestionIndex + 1,
                    flowType: QUIZ_FLOW,
                });
            } else if (q) {
                analytics.answerIncorrect({
                    examId,
                    questionNumber: currentQuestionIndex + 1,
                    flowType: QUIZ_FLOW,
                });
            }
        }
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setUserAnswers(newAnswers);
        // Picking an option locks the answer and reveals the explanation + Next,
        // so there is no extra "Check" step between answering and moving on.
        setShowExplanation(true);
    };

    /** Answered questions stay revealed when navigating back and forth. */
    const goToQuestion = (index: number) => {
        const clamped = Math.min(Math.max(index, 0), questions.length - 1);
        setCurrentQuestionIndex(clamped);
        setShowExplanation(userAnswers[clamped] !== undefined && userAnswers[clamped] !== -1);
    };

    const calculateScore = () => {
        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;
        
        userAnswers.forEach((answer, index) => {
            if (answer === -1) unattempted++;
            else if (answer === questions[index].correctAnswer) correct++;
            else incorrect++;
        });

        // +4 for correct, -1 for incorrect
        return { correct, incorrect, unattempted, total: (correct * 4) - incorrect };
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full relative">
            <AnimatePresence mode="wait">
                
                {/* AI Generating State Overlay */}
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
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Generating AI Topic Quiz...</h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 max-w-sm text-center">
                            Crafting high-quality, perfectly aligned practice questions for {selectedChapter?.name}.
                        </p>
                    </motion.div>
                )}

                {/* Step 1: Subject Selection */}
                {step === 'subject' && (
                    <motion.div
                        key="subject"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="pb-10"
                    >
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Topic-wise Quizzes</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Select a core subject from the Class 11/12 Science curriculum to practice specific chapters.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                            {defaultGrade.subjects.map((subject, i) => {
                                // High-quality educational images tailored for each core subject
                                const SUBJECT_IMAGES: Record<string, string> = {
                                    'physics': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop',
                                    'chemistry': '/tutor-media/images/subjects/chemistry.png',
                                    'mathematics': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
                                    'biology': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=800&auto=format&fit=crop',
                                    'english': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
                                    'computer science': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop',
                                    'science': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop',
                                    'social science': 'https://images.unsplash.com/photo-1447069387366-2a3b0638ca3d?q=80&w=800&auto=format&fit=crop',
                                    'hindi': 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop',
                                    'default': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop'
                                };
                                
                                const bgUrl = SUBJECT_IMAGES[subject.name.trim().toLowerCase()] || SUBJECT_IMAGES[subject.id.trim().toLowerCase()] || SUBJECT_IMAGES['default'];

                                return (
                                    <PremiumSelectionCard
                                        key={subject.id}
                                        title={subject.name}
                                        eyebrow="Adaptive topic practice"
                                        description="Chapter-level AI quizzes with instant answer analysis and exam-focused feedback."
                                        meta={`${subject.chapters.length} syllabus topics`}
                                        icon={<BrainCircuit className="h-5 w-5" />}
                                        accent={subject.color}
                                        image={bgUrl}
                                        index={i}
                                        badge="10 Q sets"
                                        onClick={() => handleSubjectSelect(subject)}
                                    />
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Chapter Selection */}
                {step === 'chapter' && selectedSubject && (
                    <motion.div
                        key="chapter"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={handleBack}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </button>
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">{selectedSubject.name} Quizzes</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Select a chapter to start a rapid 10-question practice test.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedSubject.chapters.map((chapter, i) => (
                                <PremiumSelectionCard
                                    key={chapter.id}
                                    title={chapter.name}
                                    eyebrow={`Chapter ${chapter.chapterNumber}`}
                                    description="AI-generated exam questions with immediate explanations."
                                    meta="10 questions · instant review"
                                    icon={<FileText className="h-5 w-5" />}
                                    accent={selectedSubject.color}
                                    index={i}
                                    compact
                                    onClick={() => handleChapterSelect(chapter)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Solving Quiz (Simplified Exam Interface) */}
                {step === 'solving' && selectedChapter && questions.length > 0 && (
                    <motion.div
                        key="solving"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="comp-surface-card relative mx-auto flex h-full min-h-[450px] w-full max-w-4xl flex-col overflow-hidden sm:min-h-[600px]"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <button onClick={handleBack} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                                </button>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight truncate">{selectedChapter.name}</h3>
                                    <p className="text-[10px] sm:text-xs text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-bold border border-orange-100 dark:border-orange-800 flex-shrink-0">
                                <Clock className="w-3.5 h-3.5 sm:w-4 h-4" />
                                <span className="text-xs sm:text-sm">{formatTime(timer)}</span>
                            </div>
                        </div>

                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
                            <motion.div className="h-full bg-orange-500" animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-h-0 p-5 md:p-10 overflow-y-auto">
                            <div className="mb-8">
                                <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 mb-4 tracking-wider uppercase">
                                    {questions[currentQuestionIndex].difficulty}
                                </div>
                                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-relaxed break-words">
                                    {questions[currentQuestionIndex].text}
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {questions[currentQuestionIndex].options.map((option, idx) => {
                                    const isSelected = userAnswers[currentQuestionIndex] === idx;
                                    const isCorrect = showExplanation && idx === questions[currentQuestionIndex].correctAnswer;
                                    const isWrong = showExplanation && isSelected && !isCorrect;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswerSelect(idx)}
                                            disabled={showExplanation}
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4
                                                ${isSelected && !showExplanation ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100 shadow-sm' : ''}
                                                ${!isSelected && !showExplanation ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}
                                                ${isCorrect ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20 text-green-900 dark:text-green-100' : ''}
                                                ${isWrong ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20 text-red-900 dark:text-red-100' : ''}
                                                ${showExplanation && !isCorrect && !isWrong ? 'border-slate-200 dark:border-slate-800 opacity-50' : ''}
                                            `}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors
                                                ${isSelected && !showExplanation ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}
                                                ${isCorrect ? 'bg-green-500 text-white' : ''}
                                                ${isWrong ? 'bg-red-500 text-white' : ''}
                                            `}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="font-medium text-sm md:text-base break-words">{option}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {showExplanation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-8 p-5 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl"
                                >
                                    <h4 className="font-bold text-orange-900 dark:text-orange-300 mb-2 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> Explanation
                                    </h4>
                                    <p className="text-sm text-orange-800/80 dark:text-orange-200/80 leading-relaxed break-words">
                                        {questions[currentQuestionIndex].explanation}
                                    </p>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className="shrink-0 px-5 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
                            <button
                                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                                disabled={currentQuestionIndex === 0}
                                className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm"
                            >
                                Previous
                            </button>

                            {currentQuestionIndex === questions.length - 1 ? (
                                <button
                                    onClick={() => goToStep('result')}
                                    disabled={!showExplanation}
                                    className="px-6 py-2 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 shadow-md transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Finish
                                </button>
                            ) : (
                                <button
                                    onClick={() => goToQuestion(currentQuestionIndex + 1)}
                                    disabled={!showExplanation}
                                    className="px-6 py-2 rounded-xl font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-md transition-colors flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Step 4: Result */}
                {step === 'result' && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-2xl mx-auto text-center py-8 sm:py-12 px-4"
                    >
                        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-6 border-4 border-white dark:border-slate-900 shadow-xl">
                            <Award className="w-10 h-10 sm:w-12 sm:h-12" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2">Quiz Completed!</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 sm:mb-10">You've finished the {selectedChapter?.name} practice quiz.</p>

                        <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4 mb-10">
                            <PremiumMetricCard
                                label="Correct"
                                value={String(calculateScore().correct)}
                                icon={<Award className="h-5 w-5" />}
                                accent="#059669"
                                detail="Accurate responses"
                            />
                            <PremiumMetricCard
                                label="Incorrect"
                                value={String(calculateScore().incorrect)}
                                icon={<FileText className="h-5 w-5" />}
                                accent="#e11d48"
                                detail="Review these concepts"
                            />
                            <PremiumMetricCard
                                label="Net score"
                                value={String(calculateScore().total)}
                                icon={<BrainCircuit className="h-5 w-5" />}
                                accent={selectedSubject?.color || '#4f46e5'}
                                detail="+4 / −1 marking"
                            />
                        </div>

                        <button
                            onClick={() => {
                                resetQuiz();
                                goToStep('chapter', { chapter: null });
                            }}
                            className="px-8 py-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                        >
                            Take Another Quiz
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
