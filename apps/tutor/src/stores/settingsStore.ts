import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, SettingsTemplate } from '@/types';
import {
    DEFAULT_TTS_LANGUAGE,
    coerceTtsLanguage,
} from '../constants/ttsLanguages';

export { DEFAULT_TTS_LANGUAGE } from '../constants/ttsLanguages';

interface SettingsStore {
    settings: AppSettings;
    templates: SettingsTemplate[];

    // Update settings
    updateSettings: (updates: Partial<AppSettings>) => void;
    updateNotifications: (updates: Partial<AppSettings['notifications']>) => void;
    updateAccessibility: (updates: Partial<AppSettings['accessibility']>) => void;
    updatePrivacy: (updates: Partial<AppSettings['privacy']>) => void;
    updateAiTutor: (updates: Partial<AppSettings['aiTutor']>) => void;

    // Templates
    applyTemplate: (templateId: string) => void;
    saveAsTemplate: (name: string, description: string) => void;
    deleteTemplate: (templateId: string) => void;

    // Export/Import
    exportSettings: () => string;
    importSettings: (json: string) => boolean;
    resetToDefaults: () => void;
}

/** Spoken lesson + Sarvam locale. New users and merged settings use English until changed under Accessibility → Teacher language. */
// DEFAULT_TTS_LANGUAGE re-exported from constants/ttsLanguages

const defaultSettings: AppSettings = {
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    theme: 'light',

    notifications: {
        studyReminders: true,
        reminderTime: '19:00',
        goalAchievements: true,
        reviewReminders: true,
        emailDigest: 'daily',
    },

    accessibility: {
        fontSize: 'medium',
        highContrast: false,
        reduceAnimations: false,
        textToSpeech: true,
        ttsSpeed: 1.0,
        ttsVoice: '',
        ttsLanguage: DEFAULT_TTS_LANGUAGE,
        ttsSpeaker: 'anushka',
    },

    privacy: {
        analyticsEnabled: true,
        shareProgress: false,
        dataRetentionMonths: 24,
    },

    aiTutor: {
        personality: 'encouraging',
        responseStyle: 'detailed',
        analogiesEnabled: true,
        clinicalExamplesEnabled: true,
    },
};

const builtInTemplates: SettingsTemplate[] = [
    {
        id: 'beginner',
        name: 'Beginner Friendly',
        description: 'Slower pace with more detailed explanations',
        isBuiltIn: true,
        settings: {
            aiTutor: {
                personality: 'encouraging',
                responseStyle: 'detailed',
                analogiesEnabled: true,
                clinicalExamplesEnabled: true,
            },
        },
    },
    {
        id: 'professional',
        name: 'Professional',
        description: 'Focused and efficient learning',
        isBuiltIn: true,
        settings: {
            aiTutor: {
                personality: 'direct',
                responseStyle: 'concise',
                analogiesEnabled: false,
                clinicalExamplesEnabled: true,
            },
        },
    },
    {
        id: 'accessible',
        name: 'High Accessibility',
        description: 'Enhanced accessibility features',
        isBuiltIn: true,
        settings: {
            accessibility: {
                fontSize: 'large',
                highContrast: true,
                reduceAnimations: true,
                textToSpeech: true,
                ttsSpeed: 0.9,
                ttsVoice: 'default',
                ttsLanguage: DEFAULT_TTS_LANGUAGE,
                ttsSpeaker: 'anushka',
            },
        },
    },
];

const VALID_SARVAM_SPEAKERS = new Set([
    'anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun', 'hitesh',
    'aditya', 'ritu', 'priya', 'neha', 'rahul', 'pooja', 'rohan', 'simran',
    'kavya', 'amit', 'dev', 'ishita', 'shreya', 'ratan', 'varun', 'manan',
    'sumit', 'roopa', 'kabir', 'aayan', 'shubh', 'ashutosh', 'advait',
    'amelia', 'sophia', 'anand', 'tanya', 'tarun', 'sunny', 'mani', 'gokul',
    'vijay', 'shruti', 'suhani', 'mohit', 'kavitha', 'rehan', 'soham', 'rupali',
]);

function migrateSpeaker(settings: AppSettings): AppSettings {
    const speaker = settings.accessibility?.ttsSpeaker;
    if (speaker && speaker !== 'default' && !VALID_SARVAM_SPEAKERS.has(speaker)) {
        return {
            ...settings,
            accessibility: { ...settings.accessibility, ttsSpeaker: 'anushka' },
        };
    }
    return settings;
}

/** Deep-merge nested slices so older persisted data gets default `ttsLanguage` (English) and other new keys. */
function mergeRehydratedSettings(partial: AppSettings): AppSettings {
    const merged: AppSettings = {
        ...defaultSettings,
        ...partial,
        notifications: { ...defaultSettings.notifications, ...partial.notifications },
        accessibility: { ...defaultSettings.accessibility, ...partial.accessibility },
        privacy: { ...defaultSettings.privacy, ...partial.privacy },
        aiTutor: { ...defaultSettings.aiTutor, ...partial.aiTutor },
    };
    merged.accessibility.ttsLanguage = coerceTtsLanguage(merged.accessibility.ttsLanguage);
    return migrateSpeaker(merged);
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            settings: defaultSettings,
            templates: builtInTemplates,

            updateSettings: (updates) => set((state) => ({
                settings: { ...state.settings, ...updates },
            })),

            updateNotifications: (updates) => set((state) => ({
                settings: {
                    ...state.settings,
                    notifications: { ...state.settings.notifications, ...updates },
                },
            })),

            updateAccessibility: (updates) => set((state) => {
                const nextUpdates = { ...updates };
                if (nextUpdates.ttsLanguage) {
                    nextUpdates.ttsLanguage = coerceTtsLanguage(nextUpdates.ttsLanguage);
                }
                const merged = { ...state.settings.accessibility, ...nextUpdates };
                if (nextUpdates.ttsLanguage && !nextUpdates.ttsSpeaker) {
                    const current = state.settings.accessibility.ttsSpeaker;
                    if (!current || current === 'default' || !VALID_SARVAM_SPEAKERS.has(current)) {
                        merged.ttsSpeaker = 'anushka';
                    }
                }
                return { settings: { ...state.settings, accessibility: merged } };
            }),

            updatePrivacy: (updates) => set((state) => ({
                settings: {
                    ...state.settings,
                    privacy: { ...state.settings.privacy, ...updates },
                },
            })),

            updateAiTutor: (updates) => set((state) => ({
                settings: {
                    ...state.settings,
                    aiTutor: { ...state.settings.aiTutor, ...updates },
                },
            })),

            applyTemplate: (templateId) => {
                const template = get().templates.find(t => t.id === templateId);
                if (template) {
                    set((state) => ({
                        settings: {
                            ...state.settings,
                            ...template.settings,
                            notifications: { ...state.settings.notifications, ...template.settings.notifications },
                            accessibility: { ...state.settings.accessibility, ...template.settings.accessibility },
                            privacy: { ...state.settings.privacy, ...template.settings.privacy },
                            aiTutor: { ...state.settings.aiTutor, ...template.settings.aiTutor },
                        },
                    }));
                }
            },

            saveAsTemplate: (name, description) => set((state) => ({
                templates: [
                    ...state.templates,
                    {
                        id: 'custom_' + Date.now(),
                        name,
                        description,
                        isBuiltIn: false,
                        settings: state.settings,
                    },
                ],
            })),

            deleteTemplate: (templateId) => set((state) => ({
                templates: state.templates.filter(t => t.id !== templateId || t.isBuiltIn),
            })),

            exportSettings: () => JSON.stringify(get().settings, null, 2),

            importSettings: (json) => {
                try {
                    const raw = JSON.parse(json) as Record<string, unknown>;
                    if (!raw || typeof raw !== 'object') return false;
                    const merged = { ...defaultSettings };
                    const allowedTop: (keyof AppSettings)[] = ['language', 'timezone', 'theme', 'notifications', 'accessibility', 'privacy', 'aiTutor'];
                    for (const key of allowedTop) {
                        const val = raw[key];
                        if (key === 'language' || key === 'timezone' || key === 'theme') {
                            if (typeof val === 'string') (merged as Record<string, unknown>)[key] = val;
                        } else if (val != null && typeof val === 'object' && !Array.isArray(val)) {
                            (merged as Record<string, unknown>)[key] = { ...(defaultSettings[key] as object), ...val };
                        }
                    }
                    set({ settings: merged as AppSettings });
                    return true;
                } catch {
                    return false;
                }
            },

            resetToDefaults: () => set({ settings: defaultSettings }),
        }),
        {
            name: 'ai-tutor-settings',
            onRehydrateStorage: () => (state) => {
                if (state?.settings) {
                    state.settings = mergeRehydratedSettings(state.settings);
                }
            },
        }
    )
);
