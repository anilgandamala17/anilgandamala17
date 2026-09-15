import { create } from 'zustand';
import type { Doubt, DoubtResolution, QuizQuestion } from '../types';
import { memoryService } from '../services/memoryService';
import { aiService } from '../services/aiService';
import { useDocumentStore } from './documentStore';
import { useTeachingStore } from './teachingStore';
import { findTopicInfo } from '../utils/topicUtils';
import { analytics } from '../services/analyticsService';

interface DoubtStore {
    doubts: Doubt[];
    activeDoubt: Doubt | null;
    isResolvingDoubt: boolean;
    showVerificationQuiz: boolean;
    currentQuiz: QuizQuestion | null;
    quizTimeoutId: ReturnType<typeof setTimeout> | null; // Track timeout for cleanup

    // Actions
    raiseDoubt: (question: string, sessionId: string, stepNumber: number, stepTitle: string) => Doubt;
    setActiveDoubt: (doubt: Doubt | null) => void;
    startResolvingDoubt: (doubtId: string) => void;
    resolveDoubt: (doubtId: string, resolution: DoubtResolution) => void;
    showQuiz: (quiz: QuizQuestion) => void;
    hideQuiz: () => void;
    confirmUnderstanding: (doubtId: string) => void;
    getSessionDoubts: (sessionId: string) => Doubt[];
    clearSessionDoubts: (sessionId: string) => void;
}

// Mock AI resolution generator
const generateMockResolution = (question: string): DoubtResolution => {
    const explanations: Record<string, DoubtResolution> = {
        'p wave': {
            explanation: 'The P wave represents atrial depolarization - the electrical signal that causes both atria to contract and push blood into the ventricles. It\'s the first deflection seen on a normal ECG trace. A normal P wave should be:\n\n• Duration: 0.08-0.10 seconds\n• Amplitude: Less than 2.5mm\n• Upright in leads I, II, aVF\n• Inverted in aVR',
            visualAids: ['p-wave-diagram', 'atrial-conduction-animation'],
            examples: [
                'In atrial enlargement, P waves become tall (>2.5mm) or wide (>0.12s)',
                'In atrial fibrillation, P waves are replaced by fibrillatory waves',
            ],
            quizQuestion: {
                id: 'q1',
                question: 'What cardiac event does the P wave represent?',
                type: 'multiple_choice',
                options: ['Ventricular depolarization', 'Atrial depolarization', 'Ventricular repolarization', 'Atrial repolarization'],
                correctAnswer: 1,
                explanation: 'The P wave represents atrial depolarization, which occurs when the electrical impulse spreads through both atria.',
            },
            resolvedAt: new Date().toISOString(),
            understandingConfirmed: false,
        },
        'qrs': {
            explanation: 'The QRS complex represents ventricular depolarization - the electrical activation of both ventricles. It\'s the most prominent wave on the ECG because the ventricles have much more muscle mass than the atria.\n\nKey features:\n• Normal duration: <0.12 seconds (3 small squares)\n• A widened QRS suggests conduction delay (bundle branch block)\n• The shape varies based on which lead you\'re viewing',
            visualAids: ['qrs-complex-diagram', 'ventricular-conduction'],
            examples: [
                'Left bundle branch block shows a wide QRS with "M" pattern in V5-V6',
                'Right bundle branch block shows RSR\' pattern in V1',
            ],
            resolvedAt: new Date().toISOString(),
            understandingConfirmed: false,
        },
        default: {
            explanation: 'Great question! Let me explain this concept in more detail.\n\nThe electrocardiogram (ECG) is a fundamental diagnostic tool that records the heart\'s electrical activity. Each component of the ECG waveform represents a specific phase of the cardiac cycle.',
            visualAids: ['ecg-overview'],
            examples: [
                'The cardiac cycle consists of systole (contraction) and diastole (relaxation)',
                'Each heartbeat is initiated by the SA node, the heart\'s natural pacemaker',
            ],
            resolvedAt: new Date().toISOString(),
            understandingConfirmed: false,
        },
    };

    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('p wave')) {
        return explanations['p wave'];
    } else if (lowerQuestion.includes('qrs')) {
        return explanations['qrs'];
    }
    return explanations['default'];
};

export const useDoubtStore = create<DoubtStore>((set, get) => ({
    doubts: [],
    activeDoubt: null,
    isResolvingDoubt: false,
    showVerificationQuiz: false,
    currentQuiz: null,
    quizTimeoutId: null,

    raiseDoubt: (question, sessionId, stepNumber, stepTitle) => {
        const doubt: Doubt = {
            id: `doubt_${Date.now()}`,
            sessionId,
            question,
            timestamp: new Date().toISOString(),
            context: {
                stepNumber,
                stepTitle,
            },
            status: 'pending',
        };

        set((state) => ({
            doubts: [...state.doubts, doubt],
            activeDoubt: doubt,
        }));

        // Auto-start resolving after a short delay
        // Note: This timeout completes quickly (500ms), so cleanup is handled automatically
        setTimeout(() => {
            const currentState = get();
            // Only resolve if this doubt is still the active one
            if (currentState.activeDoubt?.id === doubt.id) {
                currentState.startResolvingDoubt(doubt.id);
            }
        }, 500);

        return doubt;
    },

    setActiveDoubt: (doubt) => set({ activeDoubt: doubt }),

    startResolvingDoubt: (doubtId) => {
        set((state) => ({
            isResolvingDoubt: true,
            doubts: state.doubts.map((d) =>
                d.id === doubtId ? { ...d, status: 'resolving' } : d
            ),
        }));

        const doubt = get().doubts.find((d) => d.id === doubtId);
        if (!doubt) return;

        // Check if a document is loaded — if so, use real AI
        const documentState = useDocumentStore.getState();
        if (documentState.status === 'ready' && documentState.fileText) {
            // Real AI-powered document Q&A
            aiService.answerDocumentQuestion(documentState.fileText, doubt.question)
                .then((answer) => {
                    const currentState = get();
                    const currentDoubt = currentState.doubts.find((d) => d.id === doubtId);
                    if (currentDoubt && currentDoubt.status === 'resolving') {
                        const resolution: DoubtResolution = {
                            explanation: answer,
                            examples: [],
                            resolvedAt: new Date().toISOString(),
                            understandingConfirmed: false,
                        };
                        currentState.resolveDoubt(doubtId, resolution);
                    }
                })
                .catch(() => {
                    const currentState = get();
                    const currentDoubt = currentState.doubts.find((d) => d.id === doubtId);
                    if (currentDoubt && currentDoubt.status === 'resolving') {
                        const resolution: DoubtResolution = {
                            explanation: "I wasn't able to answer right now. Please try again.",
                            examples: [],
                            resolvedAt: new Date().toISOString(),
                            understandingConfirmed: false,
                        };
                        currentState.resolveDoubt(doubtId, resolution);
                    }
                });
        } else {
            // Teaching / curriculum doubts: same tutor pipeline as Chat Panel (no mock ECG defaults)
            const teaching = useTeachingStore.getState();
            const session = teaching.currentSession;
            const stepIdx = teaching.currentStep;
            const stepData = session?.teachingSteps?.[stepIdx];
            let chapterName: string | null = null;
            let subjectArea: string | null = null;
            let gradeLevel: string | null = null;
            try {
                if (session?.topicId) {
                    const info = findTopicInfo(session.topicId);
                    chapterName = info.chapterName ?? null;
                    subjectArea = info.subjectName ?? null;
                    gradeLevel = info.streamName ?? null;
                }
            } catch {
                /* ignore */
            }

            aiService
                .sendChatMessage({
                    userMessage: doubt.question,
                    topicName: session?.topicName ?? null,
                    chapterName,
                    stepTitle: stepData?.title ?? doubt.context.stepTitle,
                    stepContent: stepData?.content ?? '',
                    subjectArea,
                    gradeLevel,
                    conversationHistory: [],
                    userProfession: null,
                })
                .then((answer) => {
                    const currentState = get();
                    const currentDoubt = currentState.doubts.find((d) => d.id === doubtId);
                    if (currentDoubt && currentDoubt.status === 'resolving') {
                        analytics.aiAnswerReceived(useTeachingStore.getState().currentSession?.topicId, true);
                        currentState.resolveDoubt(doubtId, {
                            explanation: answer,
                            examples: [],
                            resolvedAt: new Date().toISOString(),
                            understandingConfirmed: false,
                        });
                    }
                })
                .catch(() => {
                    const currentState = get();
                    const currentDoubt = currentState.doubts.find((d) => d.id === doubtId);
                    if (currentDoubt && currentDoubt.status === 'resolving') {
                        analytics.aiTeacherError('resolve_failed', useTeachingStore.getState().currentSession?.topicId);
                        const resolution = generateMockResolution(doubt.question);
                        currentState.resolveDoubt(doubtId, resolution);
                    }
                });
        }
    },

    resolveDoubt: (doubtId, resolution) => {
        const doubt = get().doubts.find(d => d.id === doubtId);
        if (doubt) {
            memoryService.saveDoubtMemory(doubt, resolution.explanation);
        }

        set((state) => ({
            isResolvingDoubt: false,
            doubts: state.doubts.map((d) =>
                d.id === doubtId ? { ...d, resolution, status: 'resolved' } : d
            ),
            activeDoubt: state.activeDoubt?.id === doubtId
                ? { ...state.activeDoubt, resolution, status: 'resolved' }
                : state.activeDoubt,
        }));

        // Show verification quiz if available
        if (resolution.quizQuestion) {
            // Clear any existing timeout
            const currentState = get();
            if (currentState.quizTimeoutId) {
                clearTimeout(currentState.quizTimeoutId);
            }

            const timeoutId = setTimeout(() => {
                const state = get();
                // Only show quiz if still in resolved state
                const currentDoubt = state.doubts.find((d) => d.id === doubtId);
                if (currentDoubt && currentDoubt.status === 'resolved' && currentDoubt.resolution?.quizQuestion) {
                    const quiz = currentDoubt.resolution.quizQuestion;
                    if (quiz) {
                        state.showQuiz(quiz);
                    }
                }
                // Clear timeout ID after execution
                set({ quizTimeoutId: null });
            }, 1000);

            set({ quizTimeoutId: timeoutId });
        }
    },

    showQuiz: (quiz) => set({ showVerificationQuiz: true, currentQuiz: quiz }),

    hideQuiz: () => {
        const state = get();
        // Clear any pending timeout
        if (state.quizTimeoutId) {
            clearTimeout(state.quizTimeoutId);
        }
        set({ showVerificationQuiz: false, currentQuiz: null, quizTimeoutId: null });
    },

    confirmUnderstanding: (doubtId) => {
        set((state) => ({
            doubts: state.doubts.map((d) =>
                d.id === doubtId && d.resolution
                    ? { ...d, resolution: { ...d.resolution, understandingConfirmed: true } }
                    : d
            ),
            showVerificationQuiz: false,
            currentQuiz: null,
        }));
    },

    getSessionDoubts: (sessionId) => {
        return get().doubts.filter((d) => d.sessionId === sessionId);
    },

    clearSessionDoubts: (sessionId) => {
        set((state) => ({
            doubts: state.doubts.filter((d) => d.sessionId !== sessionId),
            activeDoubt: state.activeDoubt?.sessionId === sessionId ? null : state.activeDoubt,
        }));
    },
}));
