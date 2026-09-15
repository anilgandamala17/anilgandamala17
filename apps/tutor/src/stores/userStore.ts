import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, LearningStyle, LearningPreferences, Profession, MemoryEntry } from '../types';

interface UserStore {
    profile: UserProfile | null;
    onboardingStep: number;
    selectedProfession: Profession | null;
    selectedSubProfession: string | null;

    // Actions
    setProfile: (profile: UserProfile) => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
    setOnboardingStep: (step: number) => void;
    selectProfession: (profession: Profession | null) => void;
    selectSubProfession: (subProfession: string) => void;
    updateLearningStyle: (style: Partial<LearningStyle>) => void;
    updateLearningPreferences: (prefs: Partial<LearningPreferences>) => void;

    // AI Memory Actions
    addMemory: (memory: Omit<MemoryEntry, 'id' | 'timestamp'>) => void;
    clearMemories: () => void;

    completeOnboarding: () => void;
    resetOnboarding: () => void;
}

/** Zeros mean "not measured yet" — only the style check may fill these in. */
const defaultLearningStyle: LearningStyle = {
    visual: 0,
    auditory: 0,
    kinesthetic: 0,
    preferredPace: 'normal',
    interactivityLevel: 'medium',
};

const defaultLearningPreferences: LearningPreferences = {
    teachingStyle: 'friendly',
    explanationDepth: 'comprehensive',
    sessionLength: 'medium',
    quizFrequency: 'after_topic',
    reviewStrategy: 'spaced_repetition',
};

function createDefaultProfile(): UserProfile {
    return {
        userId: 'user_' + Date.now(),
        name: 'User',
        email: '',
        displayName: 'User',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        profession: null,
        subProfession: null,
        experienceLevel: 'beginner',
        verificationStatus: 'none',
        learningStyle: defaultLearningStyle,
        learningPreferences: defaultLearningPreferences,
        learningGoals: [],
        weeklyCommitmentHours: 5,
        totalLearningHours: 0,
        topicsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
    };
}

export const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            profile: null,
            onboardingStep: 0,
            selectedProfession: null,
            selectedSubProfession: null,

            setProfile: (profile) => set({ profile }),

            // Edits can happen before onboarding ever runs, so seed a profile rather than dropping them.
            updateProfile: (updates) => set((state) => ({
                profile: { ...(state.profile ?? createDefaultProfile()), ...updates },
            })),

            setOnboardingStep: (step) => set({ onboardingStep: step }),

            selectProfession: (profession) => set({
                selectedProfession: profession,
                selectedSubProfession: null,
            }),

            selectSubProfession: (subProfession) => set({
                selectedSubProfession: subProfession
            }),

            updateLearningStyle: (style) => set((state) => {
                const profile = state.profile ?? createDefaultProfile();
                return {
                    profile: {
                        ...profile,
                        learningStyle: {
                            ...profile.learningStyle,
                            ...style,
                            assessedAt: new Date().toISOString(),
                        },
                    },
                };
            }),

            updateLearningPreferences: (prefs) => set((state) => ({
                profile: state.profile ? {
                    ...state.profile,
                    learningPreferences: { ...state.profile.learningPreferences, ...prefs },
                } : null,
            })),

            addMemory: (memory) => set((state) => {
                if (!state.profile) return state;
                const newMemory: MemoryEntry = {
                    ...memory,
                    id: 'mem_' + Date.now() + Math.random().toString(36).substr(2, 5),
                    timestamp: new Date().toISOString(),
                };
                return {
                    profile: {
                        ...state.profile,
                        memories: [...(state.profile.memories || []), newMemory]
                    }
                };
            }),

            clearMemories: () => set((state) => ({
                profile: state.profile ? { ...state.profile, memories: [] } : null
            })),

            completeOnboarding: () => set((state) => ({
                profile: {
                    ...(state.profile ?? createDefaultProfile()),
                    profession: state.selectedProfession,
                    subProfession: state.selectedSubProfession,
                },
                onboardingStep: -1,
            })),

            resetOnboarding: () => set({
                onboardingStep: 0,
                selectedProfession: null,
                selectedSubProfession: null,
            }),
        }),
        {
            name: 'ai-tutor-user',
        }
    )
);
