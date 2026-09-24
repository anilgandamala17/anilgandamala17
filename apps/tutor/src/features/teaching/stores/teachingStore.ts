import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TeachingState, TeachingSession, TeachingStep, Doubt, Collaborator } from '@/types';
import type { LessonPosition } from '@/types/contentPipeline';

interface TeachingStore extends TeachingState {
    lastStepByTopicId: Record<string, number>;
    lastLessonPosition: Record<string, LessonPosition>;
    // Session management
    startSession: (session: TeachingSession) => void;
    endSession: () => void;

    // Step control
    goToStep: (step: number) => void;
    nextStep: () => void;
    previousStep: () => void;
    completeStep: (stepId: string) => void;

    // Teaching control
    pause: () => void;
    resume: () => void;
    setSpeaking: (speaking: boolean) => void;

    // Doubt handling
    enterDoubtMode: (doubt: Doubt) => void;
    exitDoubtMode: () => void;
    resolveDoubt: (doubtId: string) => void;

    // Collaboration
    addCollaborator: (collaborator: Collaborator) => void;
    removeCollaborator: (id: string) => void;
    toggleScreenShare: () => void;

    // Utilities
    getProgress: () => number;
    getCurrentStepData: () => TeachingStep | null;
    saveLessonPosition: (topicId: string, position: LessonPosition) => void;
    getLessonPosition: (topicId: string) => LessonPosition | undefined;
    clearLessonPosition: (topicId: string) => void;
}

export const useTeachingStore = create<TeachingStore>()(persist((set, get) => ({
    currentSession: null,
    currentStep: 0,
    isPaused: false,
    isInDoubtMode: false,
    isSpeaking: false,
    collaborators: [],
    isScreenSharing: false,
    lastStepByTopicId: {},
    lastLessonPosition: {},

    startSession: (session) => {
        const isCached = session.contentSource === 'cached';
        const { lastStepByTopicId } = get() as { lastStepByTopicId?: Record<string, number> };
        const savedStep = isCached ? 0 : lastStepByTopicId?.[session.topicId];
        const stepsLen = session.teachingSteps?.length ?? 0;
        const step = isCached
            ? 0
            : savedStep != null && stepsLen > 0 && savedStep >= 0 && savedStep < stepsLen
                ? savedStep
                : session.currentStep ?? 0;
        set({
            currentSession: { ...session, currentStep: step },
            currentStep: step,
            isPaused: false,
            isInDoubtMode: false,
        });
    },

    endSession: () => {
        const topicId = get().currentSession?.topicId;
        if (topicId) get().clearLessonPosition(topicId);
        set({
            currentSession: null,
            currentStep: 0,
            isPaused: false,
            isInDoubtMode: false,
            isSpeaking: false,
        });
    },

    goToStep: (step) => set((state) => {
        if (!state.currentSession || !state.currentSession.teachingSteps || state.currentSession.teachingSteps.length === 0) return state;
        if (state.currentSession.contentSource === 'cached') return state;
        const maxStep = state.currentSession.teachingSteps.length - 1;
        const newStep = Math.max(0, Math.min(step, maxStep));
        const lastStepByTopicId = (state as { lastStepByTopicId?: Record<string, number> }).lastStepByTopicId ?? {};
        return {
            currentStep: newStep,
            isPaused: false,
            currentSession: { ...state.currentSession, currentStep: newStep },
            lastStepByTopicId: { ...lastStepByTopicId, [state.currentSession.topicId]: newStep },
        };
    }),

    nextStep: () => {
        const state = get();
        if (state.currentSession?.contentSource === 'cached') return;
        if (state.currentSession && state.currentSession.teachingSteps && state.currentSession.teachingSteps.length > 0) {
            const nextStepIndex = state.currentStep + 1;
            if (nextStepIndex < state.currentSession.teachingSteps.length) {
                set((currentState) => {
                    if (!currentState.currentSession || !currentState.currentSession.teachingSteps || currentState.currentSession.teachingSteps.length === 0) return currentState;
                    const maxStep = currentState.currentSession.teachingSteps.length - 1;
                    const newStep = Math.max(0, Math.min(nextStepIndex, maxStep));
                    const lastStepByTopicId = (currentState as { lastStepByTopicId?: Record<string, number> }).lastStepByTopicId ?? {};
                    return {
                        currentStep: newStep,
                        isPaused: false,
                        currentSession: { ...currentState.currentSession, currentStep: newStep },
                        lastStepByTopicId: { ...lastStepByTopicId, [currentState.currentSession.topicId]: newStep },
                    };
                });
            }
        }
    },

    previousStep: () => {
        const state = get();
        if (state.currentStep > 0) {
            get().goToStep(state.currentStep - 1);
        }
    },

    completeStep: (stepId) => set((state) => {
        if (!state.currentSession || !state.currentSession.teachingSteps) return state;
        const updatedSteps = state.currentSession.teachingSteps.map(step =>
            step.id === stepId ? { ...step, completed: true } : step
        );
        return {
            currentSession: {
                ...state.currentSession,
                teachingSteps: updatedSteps,
            }
        };
    }),

    pause: () => set({ isPaused: true }),

    resume: () => set({ isPaused: false }),

    setSpeaking: (speaking) => set({ isSpeaking: speaking }),

    enterDoubtMode: (doubt) => set((state) => {
        if (!state.currentSession) return state;
        return {
            isInDoubtMode: true,
            isPaused: true,
            currentSession: {
                ...state.currentSession,
                doubts: [...(state.currentSession.doubts || []), doubt],
            }
        };
    }),

    exitDoubtMode: () => set({ isInDoubtMode: false }),

    resolveDoubt: (doubtId) => set((state) => {
        if (!state.currentSession || !state.currentSession.doubts) return state;
        const updatedDoubts = state.currentSession.doubts.map(d =>
            d.id === doubtId ? { ...d, status: 'resolved' as const } : d
        );
        return {
            currentSession: {
                ...state.currentSession,
                doubts: updatedDoubts,
            }
        };
    }),

    addCollaborator: (collaborator) => set((state) => ({
        collaborators: [...state.collaborators, collaborator],
    })),

    removeCollaborator: (id) => set((state) => ({
        collaborators: state.collaborators.filter(c => c.id !== id),
    })),

    toggleScreenShare: () => set((state) => ({
        isScreenSharing: !state.isScreenSharing
    })),

    getProgress: () => {
        const state = get();
        if (!state.currentSession || !state.currentSession.teachingSteps || state.currentSession.teachingSteps.length === 0) return 0;
        const completedSteps = state.currentSession.teachingSteps.filter(s => s.completed).length;
        return (completedSteps / state.currentSession.teachingSteps.length) * 100;
    },

    getCurrentStepData: () => {
        const state = get();
        if (!state.currentSession || !state.currentSession.teachingSteps) return null;
        if (state.currentStep < 0 || state.currentStep >= state.currentSession.teachingSteps.length) return null;
        return state.currentSession.teachingSteps[state.currentStep] || null;
    },

    saveLessonPosition: (topicId, position) => set((state) => ({
        lastLessonPosition: { ...state.lastLessonPosition, [topicId]: position },
    })),

    getLessonPosition: (topicId) => get().lastLessonPosition[topicId],

    clearLessonPosition: (topicId) => set((state) => {
        const next = { ...state.lastLessonPosition };
        delete next[topicId];
        return { lastLessonPosition: next };
    }),
}), {
    name: 'teaching-storage',
    partialize: (state) => ({
        lastStepByTopicId: state.lastStepByTopicId ?? {},
        lastLessonPosition: state.lastLessonPosition ?? {},
    }),
}));

/** True once teaching-storage has rehydrated from localStorage (safe to restore progress). */
export function waitForTeachingStoreHydration(): Promise<void> {
    if (useTeachingStore.persist.hasHydrated()) return Promise.resolve();
    return new Promise((resolve) => {
        const unsub = useTeachingStore.persist.onFinishHydration(() => {
            unsub();
            resolve();
        });
    });
}
