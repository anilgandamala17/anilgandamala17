import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, DEFAULT_TTS_LANGUAGE } from '@/stores/settingsStore';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';
import { getRoutesForRole, studentRoutes } from '@/utils/routes';
import SignOutButton from '@/components/common/SignOutButton';
import { useCurriculumStore } from '@/features/curriculum/stores/curriculumStore';
import { schoolGrades } from '@/features/curriculum/data/schoolCurriculum';
import {
    ArrowLeft, User, BookOpen, Eye, Bot, Shield, Save, Volume2
} from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import {
    getHumanVoiceScore,
    pickBestHumanVoice,
    filterNaturalVoices,
    isVoiceCompatibleWithLanguage,
} from '@/utils/voice';
import { unlockAudioContext } from '@/utils/audioUnlock';
import { clearVoiceCache } from '@/features/teaching/hooks/useSpeech';
import { fetchTtsAudioBlob } from '@/utils/ttsClient';
import { analytics } from '@/services/analyticsService';
import { TTS_LANGUAGE_OPTIONS } from '@/constants/ttsLanguages';

type SettingsTab = 'account' | 'learning' | 'accessibility' | 'ai' | 'privacy';

const TTS_SPEAKER_OPTIONS = [
    { value: 'anushka', label: 'Anushka — Warm Female', group: 'Premium (v2)' },
    { value: 'manisha', label: 'Manisha — Professional Female', group: 'Premium (v2)' },
    { value: 'vidya', label: 'Vidya — Clear Female', group: 'Premium (v2)' },
    { value: 'arya', label: 'Arya — Calm Female', group: 'Premium (v2)' },
    { value: 'abhilash', label: 'Abhilash — Professional Male', group: 'Premium (v2)' },
    { value: 'karun', label: 'Karun — Deep Male', group: 'Premium (v2)' },
    { value: 'hitesh', label: 'Hitesh — Clear Male', group: 'Premium (v2)' },
    { value: 'ritu', label: 'Ritu — Bright Female', group: 'Standard (v3)' },
    { value: 'priya', label: 'Priya — Gentle Female', group: 'Standard (v3)' },
    { value: 'neha', label: 'Neha — Soft Female', group: 'Standard (v3)' },
    { value: 'pooja', label: 'Pooja — Friendly Female', group: 'Standard (v3)' },
    { value: 'simran', label: 'Simran — Energetic Female', group: 'Standard (v3)' },
    { value: 'kavya', label: 'Kavya — Neutral Female', group: 'Standard (v3)' },
    { value: 'ishita', label: 'Ishita — Youthful Female', group: 'Standard (v3)' },
    { value: 'shreya', label: 'Shreya — Confident Female', group: 'Standard (v3)' },
    { value: 'roopa', label: 'Roopa — Mature Female', group: 'Standard (v3)' },
    { value: 'tanya', label: 'Tanya — Modern Female', group: 'Standard (v3)' },
    { value: 'shruti', label: 'Shruti — Melodic Female', group: 'Standard (v3)' },
    { value: 'suhani', label: 'Suhani — Sweet Female', group: 'Standard (v3)' },
    { value: 'kavitha', label: 'Kavitha — Articulate Female', group: 'Standard (v3)' },
    { value: 'rupali', label: 'Rupali — Expressive Female', group: 'Standard (v3)' },
    { value: 'amelia', label: 'Amelia — English Female', group: 'Standard (v3)' },
    { value: 'sophia', label: 'Sophia — English Female', group: 'Standard (v3)' },
    { value: 'aditya', label: 'Aditya — Confident Male', group: 'Standard (v3)' },
    { value: 'rahul', label: 'Rahul — Warm Male', group: 'Standard (v3)' },
    { value: 'rohan', label: 'Rohan — Young Male', group: 'Standard (v3)' },
    { value: 'amit', label: 'Amit — Calm Male', group: 'Standard (v3)' },
    { value: 'dev', label: 'Dev — Dynamic Male', group: 'Standard (v3)' },
    { value: 'ratan', label: 'Ratan — Mature Male', group: 'Standard (v3)' },
    { value: 'varun', label: 'Varun — Energetic Male', group: 'Standard (v3)' },
    { value: 'manan', label: 'Manan — Thoughtful Male', group: 'Standard (v3)' },
    { value: 'sumit', label: 'Sumit — Steady Male', group: 'Standard (v3)' },
    { value: 'kabir', label: 'Kabir — Expressive Male', group: 'Standard (v3)' },
    { value: 'aayan', label: 'Aayan — Youthful Male', group: 'Standard (v3)' },
    { value: 'shubh', label: 'Shubh — Bright Male', group: 'Standard (v3)' },
    { value: 'ashutosh', label: 'Ashutosh — Authoritative Male', group: 'Standard (v3)' },
    { value: 'advait', label: 'Advait — Scholarly Male', group: 'Standard (v3)' },
    { value: 'anand', label: 'Anand — Friendly Male', group: 'Standard (v3)' },
    { value: 'tarun', label: 'Tarun — Crisp Male', group: 'Standard (v3)' },
    { value: 'sunny', label: 'Sunny — Cheerful Male', group: 'Standard (v3)' },
    { value: 'mani', label: 'Mani — Traditional Male', group: 'Standard (v3)' },
    { value: 'gokul', label: 'Gokul — Gentle Male', group: 'Standard (v3)' },
    { value: 'vijay', label: 'Vijay — Bold Male', group: 'Standard (v3)' },
    { value: 'mohit', label: 'Mohit — Relaxed Male', group: 'Standard (v3)' },
    { value: 'rehan', label: 'Rehan — Smooth Male', group: 'Standard (v3)' },
    { value: 'soham', label: 'Soham — Natural Male', group: 'Standard (v3)' },
    { value: 'default', label: 'Auto (Best for Language)', group: 'Auto' },
] as const;

const SAMPLE_TTS_TEXT_BY_LANGUAGE: Record<string, string> = {
    'en-IN': 'Hello! I am your AI teacher. I will explain each concept step by step.',
    'hi-IN': 'नमस्ते! मैं आपकी एआई शिक्षिका हूँ। मैं हर विषय को सरल तरीके से समझाऊँगी।',
    'te-IN': 'నమస్కారం! నేను మీ ఏఐ టీచర్ ని. ప్రతి అంశాన్ని సులభంగా వివరిస్తాను.',
    'ta-IN': 'வணக்கம்! நான் உங்கள் ஏஐ ஆசிரியர். ஒவ்வொரு கருத்தையும் தெளிவாக விளக்குவேன்.',
    'ml-IN': 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ എഐ അധ്യാപികയാണ്. ഓരോ ആശയവും വ്യക്തമായി വിശദീകരിക്കും.',
    'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಎಐ ಶಿಕ್ಷಕಿ. ಪ್ರತಿಯೊಂದು ವಿಷಯವನ್ನು ಸರಳವಾಗಿ ವಿವರಿಸುತ್ತೇನೆ.',
};

export default function SettingsPage({ onClose }: { onClose?: () => void }) {
    const { t } = useTranslation();
    const {
        settings,
        updateSettings,
        updateAccessibility,
        updateAiTutor,
        updatePrivacy,
    } = useSettingsStore();
    useUserStore(); // no-op just to keep hook if it was needed, actually let's remove it if totally unused
    const { role } = useAuthStore();
    const routes = getRoutesForRole(role);

    const [activeTab, setActiveTab] = useState<SettingsTab>('account');
    const [saved, setSaved] = useState(false);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [isTestingAi, setIsTestingAi] = useState(false);
    const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        analytics.settingsViewed();
    }, []);

    // Curriculum Store (for Student Learning Settings)
    const {
        selectedGrade,
        setSelectedGrade,
        selectedSubject,
        setSelectedSubject
    } = useCurriculumStore();

    // Load available voices
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                // Filter to only show natural-sounding voices based on AI language or App language
                const lang = settings.accessibility.ttsLanguage || DEFAULT_TTS_LANGUAGE;
                const languageMatchedVoices = voices.filter((voice) => isVoiceCompatibleWithLanguage(voice, lang));
                const candidateVoices = languageMatchedVoices.length > 0 ? languageMatchedVoices : voices;
                const naturalOnly = filterNaturalVoices(candidateVoices, lang);
                // Fall back to all voices sorted by score if no natural voices found
                if (naturalOnly.length > 0) {
                    setAvailableVoices(naturalOnly);
                } else {
                    const sorted = [...candidateVoices].sort((a, b) => {
                        const scoreA = getHumanVoiceScore(a, lang);
                        const scoreB = getHumanVoiceScore(b, lang);
                        return scoreB - scoreA || a.name.localeCompare(b.name);
                    });
                    setAvailableVoices(sorted);
                }
            };

            loadVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
            }
            return () => {
                if (window.speechSynthesis.onvoiceschanged !== undefined) {
                    window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
                }
            };
        }
    }, [settings.accessibility.ttsLanguage]);

    const handleSave = () => {
        setSaved(true);
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
        savedTimeoutRef.current = setTimeout(() => {
            setSaved(false);
            savedTimeoutRef.current = null;
        }, 2000);
    };

    useEffect(() => {
        return () => {
            if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
            previewAudioRef.current?.pause();
            previewAudioRef.current = null;
            // Cancel any ongoing speech when navigating away from settings
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    useEffect(() => {
        if (!settings.accessibility.ttsVoice) return;
        const ttsLang = settings.accessibility.ttsLanguage || DEFAULT_TTS_LANGUAGE;
        const selectedVoiceStillExists = availableVoices.some(v =>
            v.name === settings.accessibility.ttsVoice &&
            isVoiceCompatibleWithLanguage(v, ttsLang)
        );
        if (!selectedVoiceStillExists) {
            updateAccessibility({ ttsVoice: '' });
        }
    }, [availableVoices, settings.accessibility.ttsLanguage, settings.accessibility.ttsVoice, updateAccessibility]);

    // Filter Tabs by Role
    const allTabs = [
        { id: 'account', icon: User, label: t('account'), roles: ['student', 'teacher', 'admin'] },
        { id: 'learning', icon: BookOpen, label: t('learning'), roles: ['student'] },
        { id: 'accessibility', icon: Eye, label: t('accessibility'), roles: ['student', 'teacher'] },
        { id: 'ai', icon: Bot, label: t('aiTutor'), roles: ['student'] },
        { id: 'privacy', icon: Shield, label: t('privacy'), roles: ['student', 'teacher', 'admin'] },
    ] as const;

    const tabs = allTabs.filter(t => (t.roles as unknown as string[]).includes(role || 'student'));

    // Prevent access to invalid tabs
    useEffect(() => {
        if (!tabs.some(t => t.id === activeTab)) {
            setActiveTab('account');
        }
    }, [role, activeTab, tabs]);

    const handleTestAiVoice = async () => {
        if (isTestingAi) return;
        setIsTestingAi(true);

        // Unlock audio on mobile — this runs inside a user gesture (button tap)
        unlockAudioContext();
        clearVoiceCache();

        const ttsLanguage = settings.accessibility.ttsLanguage || DEFAULT_TTS_LANGUAGE;
        const ttsSpeaker = settings.accessibility.ttsSpeaker || 'default';
        const ttsVoiceName = settings.accessibility.ttsVoice || '';
        const ttsSpeed = settings.accessibility.ttsSpeed || 1;
        const sampleText = SAMPLE_TTS_TEXT_BY_LANGUAGE[ttsLanguage] || SAMPLE_TTS_TEXT_BY_LANGUAGE[DEFAULT_TTS_LANGUAGE];

        previewAudioRef.current?.pause();
        previewAudioRef.current = null;
        window.speechSynthesis.cancel();

        let usedBackend = false;

        try {
            const audioBlob = await fetchTtsAudioBlob({
                text: sampleText,
                language: ttsLanguage,
                speaker: ttsSpeaker,
                pace: ttsSpeed,
            });

            if (audioBlob.size > 0) {
                const audioUrl = URL.createObjectURL(audioBlob);
                await new Promise<void>((resolve, reject) => {
                    const audio = new Audio(audioUrl);
                    audio.preload = 'auto';
                    audio.setAttribute('playsinline', 'true');
                    previewAudioRef.current = audio;
                    let started = false;
                    const cleanup = (ok: boolean) => {
                        previewAudioRef.current = null;
                        URL.revokeObjectURL(audioUrl);
                        if (ok) resolve();
                        else reject(new Error('Preview playback failed'));
                    };
                    audio.onplay = () => { started = true; };
                    audio.onended = () => cleanup(true);
                    audio.onerror = () => cleanup(started);
                    // Handle stall on slow mobile connections
                    let stallTimer: ReturnType<typeof setTimeout> | null = null;
                    audio.onstalled = () => { stallTimer = setTimeout(() => cleanup(started), 5000); };
                    audio.onplaying = () => {
                        started = true;
                        if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
                    };
                    const p = audio.play();
                    if (p) p.catch(() => cleanup(false));
                });
                usedBackend = true;
            }
        } catch {
            // Backend unavailable; browser fallback below.
        }

        if (!usedBackend) {
            try {
                const isMobileDev = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || ('ontouchstart' in window && navigator.maxTouchPoints > 1);
                const isIOSDev = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

                // On mobile, split sample text into small chunks to avoid iOS 15s cutoff
                const CHUNK_LIMIT = 180;
                let chunks: string[];
                if (isMobileDev) {
                    const sentences = sampleText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [sampleText];
                    chunks = [];
                    let cur = '';
                    for (const s of sentences) {
                        const t = s.trim();
                        if (!t) continue;
                        if ((cur + ' ' + t).trim().length > CHUNK_LIMIT) {
                            if (cur) chunks.push(cur.trim());
                            cur = t;
                        } else { cur = (cur ? cur + ' ' : '') + t; }
                    }
                    if (cur.trim()) chunks.push(cur.trim());
                    if (chunks.length === 0) chunks = [sampleText];
                } else {
                    chunks = [sampleText];
                }

                const langBase = (ttsLanguage || '').split('-')[0].toLowerCase();
                const isNonEnglish = !!langBase && langBase !== 'en';
                const bestVoice = pickBestHumanVoice(window.speechSynthesis.getVoices(), {
                    language: ttsLanguage,
                    preferredName: ttsVoiceName,
                });
                const voiceMatchesLang = !!(bestVoice && isVoiceCompatibleWithLanguage(bestVoice, ttsLanguage));

                if (isNonEnglish && !voiceMatchesLang) {
                    const langLabel = TTS_LANGUAGE_OPTIONS.find(l => l.value === ttsLanguage)?.label || ttsLanguage;
                    toast.error(
                        `Voice preview for ${langLabel} needs Sarvam TTS (set SARVAM_API_KEY on the landing app and keep it running on :3000 so /api/tts works), or install a ${langLabel} system voice.`,
                        8000
                    );
                    setIsTestingAi(false);
                    return;
                }

                for (const chunk of chunks) {
                    await new Promise<void>((resolve) => {
                        const synth = window.speechSynthesis;
                        if (isIOSDev) synth.cancel();

                        const utterance = new SpeechSynthesisUtterance(chunk);
                        utterance.rate = ttsSpeed;
                        utterance.lang = ttsLanguage;

                        if (bestVoice) {
                            utterance.voice = bestVoice;
                        }
                        utterance.onend = () => resolve();
                        utterance.onerror = (e) => {
                            if (e.error === 'interrupted' || e.error === 'canceled') { resolve(); return; }
                            if (chunk === chunks[0]) toast.error('Browser voice playback failed.');
                            resolve();
                        };

                        synth.speak(utterance);

                        // iOS keepalive
                        if (isIOSDev) {
                            const keepAlive = setInterval(() => {
                                if (!synth.speaking) { clearInterval(keepAlive); return; }
                                synth.pause(); synth.resume();
                            }, 10000);
                            const origEnd = utterance.onend;
                            utterance.onend = (ev) => { clearInterval(keepAlive); if (origEnd) (origEnd as (ev: SpeechSynthesisEvent) => void)(ev); };
                            utterance.onerror = (ev) => {
                                clearInterval(keepAlive);
                                if (ev.error === 'interrupted' || ev.error === 'canceled') { resolve(); return; }
                                resolve();
                            };
                        }

                        // Android safety timeout
                        if (isMobileDev && !isIOSDev) {
                            const estMs = (chunk.length / 5) * (1000 / ttsSpeed) + 3000;
                            const timer = setTimeout(() => { if (synth.speaking) synth.cancel(); resolve(); }, Math.min(estMs, 30000));
                            const origEnd = utterance.onend;
                            utterance.onend = (ev) => { clearTimeout(timer); if (origEnd) (origEnd as (ev: SpeechSynthesisEvent) => void)(ev); };
                        }
                    });
                }

            } catch (err) {
                console.error('Voice test failed:', err);
                toast.error('Voice test failed.');
            }
        }

        setIsTestingAi(false);
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Atmospheric Background Blobs */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 min-h-screen">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md shadow-sm sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
                    {onClose ? (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                        </button>
                    ) : (
                        <Link
                            to={role === 'student' ? studentRoutes.modeSelection : routes.dashboard}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                        </Link>
                    )}
                    <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">{t('settings')}</h1>
                    <div className="flex-1" />
                    <SignOutButton className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors" />
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        <Save className="w-4 h-4" />
                        {saved ? 'Saved!' : t('save')}
                    </button>
                </div>
            </header>

            <PageTransition className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col md:flex-row gap-4 sm:gap-6">
                {/* Desktop Sidebar */}
                <div className="hidden md:block w-56 shrink-0">
                    <nav className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl shadow-sm p-2 sticky top-20">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-300 relative group ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-200 dark:shadow-none translate-x-1'
                                    : 'text-gray-600 dark:text-slate-300 hover:bg-white hover:shadow-md dark:hover:bg-slate-800/80 hover:-translate-y-0.5'
                                    }`}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-purple-500'}`} />
                                <span className="font-bold tracking-tight">{tab.label}</span>
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activePointer"
                                        className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"
                                    />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Mobile Tab Bar */}
                <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-white/90 dark:bg-slate-900/80 text-gray-600 dark:text-slate-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4 shrink-0" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl border border-white/50 dark:border-white/10 text-gray-800 dark:text-slate-100 min-h-[400px]"
                    >
                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold">Account Settings</h2>
                                <div className="grid gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Language</label>
                                        <select
                                            value={settings.language}
                                            onChange={(e) => updateSettings({ language: e.target.value })}
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 rounded-lg"
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Español</option>
                                            <option value="fr">Français</option>
                                            <option value="de">Deutsch</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Theme</label>
                                        <div className="flex gap-2">
                                            {['light', 'dark', 'system'].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => updateSettings({ theme: t as 'light' | 'dark' | 'system' })}
                                                    className={`flex-1 py-2 rounded-lg border transition-colors ${settings.theme === t ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200' : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'accessibility' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold">Accessibility</h2>
                                <div className="grid gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Font Size</label>
                                        <select
                                            value={settings.accessibility.fontSize}
                                            onChange={(e) => updateAccessibility({ fontSize: e.target.value as 'small' | 'medium' | 'large' })}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 rounded-lg text-gray-800 dark:text-slate-100"
                                        >
                                            <option value="small">Small</option>
                                            <option value="medium">Medium</option>
                                            <option value="large">Large</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center justify-between">
                                            <span>Text to Speech</span>
                                            <input
                                                type="checkbox"
                                                checked={settings.accessibility.textToSpeech}
                                                onChange={(e) => updateAccessibility({ textToSpeech: e.target.checked })}
                                                className="w-5 h-5"
                                            />
                                        </label>
                                    </div>

                                    {settings.accessibility.textToSpeech && (
                                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                            <h3 className="font-medium text-sm flex items-center gap-2">
                                                Teacher Voice
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-normal">
                                                    {TTS_LANGUAGE_OPTIONS.find(l => l.value === (settings.accessibility.ttsLanguage || DEFAULT_TTS_LANGUAGE))?.label || (settings.accessibility.ttsLanguage || DEFAULT_TTS_LANGUAGE)}
                                                </span>
                                            </h3>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs mb-1 font-medium">Language</label>
                                                    <select
                                                        value={settings.accessibility.ttsLanguage || DEFAULT_TTS_LANGUAGE}
                                                        onChange={(e) => {
                                                            clearVoiceCache();
                                                            updateAccessibility({ ttsLanguage: e.target.value, ttsVoice: '' });
                                                        }}
                                                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 rounded-lg text-gray-800 dark:text-slate-100"
                                                    >
                                                        <optgroup label="English">
                                                            {TTS_LANGUAGE_OPTIONS.filter(l => l.group === 'English').map((lang) => (
                                                                <option key={lang.value} value={lang.value}>{lang.label}</option>
                                                            ))}
                                                        </optgroup>
                                                        <optgroup label="Indian Languages">
                                                            {TTS_LANGUAGE_OPTIONS.filter(l => l.group === 'Indic').map((lang) => (
                                                                <option key={lang.value} value={lang.value}>{lang.label}</option>
                                                            ))}
                                                        </optgroup>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs mb-1 font-medium">AI Speaker (Sarvam AI)</label>
                                                    <select
                                                        value={settings.accessibility.ttsSpeaker || 'anushka'}
                                                        onChange={(e) => updateAccessibility({ ttsSpeaker: e.target.value })}
                                                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 rounded-lg text-gray-800 dark:text-slate-100"
                                                    >
                                                        <optgroup label="Premium Voices (Best Quality)">
                                                            {TTS_SPEAKER_OPTIONS.filter(s => s.group === 'Premium (v2)').map((speaker) => (
                                                                <option key={speaker.value} value={speaker.value}>{speaker.label}</option>
                                                            ))}
                                                        </optgroup>
                                                        <optgroup label="Standard Voices (More Options)">
                                                            {TTS_SPEAKER_OPTIONS.filter(s => s.group === 'Standard (v3)').map((speaker) => (
                                                                <option key={speaker.value} value={speaker.value}>{speaker.label}</option>
                                                            ))}
                                                        </optgroup>
                                                        <optgroup label="Automatic">
                                                            {TTS_SPEAKER_OPTIONS.filter(s => s.group === 'Auto').map((speaker) => (
                                                                <option key={speaker.value} value={speaker.value}>{speaker.label}</option>
                                                            ))}
                                                        </optgroup>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs mb-1 font-medium">
                                                    Browser Fallback Voice
                                                    {availableVoices.length === 0 && (
                                                        <span className="ml-2 text-amber-600 dark:text-amber-400 font-normal">
                                                            (no matching voices on this device)
                                                        </span>
                                                    )}
                                                </label>
                                                <div className="flex gap-2">
                                                    <select
                                                        value={settings.accessibility.ttsVoice || ''}
                                                        onChange={(e) => {
                                                            clearVoiceCache();
                                                            updateAccessibility({ ttsVoice: e.target.value });
                                                        }}
                                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 rounded-lg text-gray-800 dark:text-slate-100"
                                                    >
                                                        <option value="">Auto-select best voice</option>
                                                        {availableVoices.map((voice) => (
                                                            <option key={voice.name} value={voice.name}>
                                                                {voice.name} ({voice.lang})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={handleTestAiVoice}
                                                        disabled={isTestingAi}
                                                        className={`px-3 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-1 shrink-0 ${isTestingAi ? 'bg-gray-400 cursor-wait' : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90'}`}
                                                    >
                                                        <Volume2 className="w-4 h-4" />
                                                        {isTestingAi ? 'Playing...' : 'Test'}
                                                    </button>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                                    Used when AI backend is unavailable. {availableVoices.length} voice{availableVoices.length !== 1 ? 's' : ''} found for selected language.
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="block text-xs font-medium">Speech Speed</label>
                                                    <span className="text-xs text-gray-500 dark:text-slate-400">{(settings.accessibility.ttsSpeed || 1).toFixed(1)}x</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={0.5}
                                                    max={2}
                                                    step={0.1}
                                                    value={settings.accessibility.ttsSpeed || 1}
                                                    onChange={(e) => updateAccessibility({ ttsSpeed: Number(e.target.value) })}
                                                    className="w-full accent-purple-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'learning' && role === 'student' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold">Learning Preferences</h2>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg space-y-4 border border-purple-100 dark:border-purple-900/40">
                                    <h3 className="font-medium text-purple-800 dark:text-purple-200">Class / Grade Level</h3>
                                    <p className="text-sm text-purple-600 dark:text-purple-300 mb-2">Select your current grade to receive appropriate curriculum recommendations.</p>
                                    <select
                                        value={(typeof selectedGrade === 'string' ? selectedGrade : selectedGrade?.id) || ''}
                                        onChange={(e) => {
                                            setSelectedGrade(e.target.value);
                                        }}
                                        className="w-full p-2 border border-purple-200 dark:border-purple-800/70 bg-white dark:bg-slate-900/60 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-slate-100"
                                    >
                                        <option value="" disabled>Select your Class/Grade</option>
                                        {schoolGrades.map(g => <option key={g.id} value={g.id}>{g.name} ({g.ageGroup})</option>)}
                                    </select>

                                    {/* Dynamic Subject Selection */}
                                    {selectedGrade && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="pt-2"
                                        >
                                            <h3 className="font-medium text-purple-800 dark:text-purple-200 mt-2 border-t pt-4 border-purple-200 dark:border-purple-800/70">Select Subject</h3>
                                            <select
                                                value={selectedSubject?.id || ''}
                                                onChange={(e) => setSelectedSubject(e.target.value)}
                                                className="w-full mt-2 p-2 border border-purple-200 dark:border-purple-800/70 bg-white dark:bg-slate-900/60 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-slate-100"
                                            >
                                                <option value="" disabled>Select a Subject</option>
                                                {selectedGrade.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </motion.div>
                                    )}

                                    {/* Dynamic Topic Selection */}
                                    {selectedGrade && selectedSubject && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="pt-2"
                                        >
                                            <h3 className="font-medium text-purple-800 dark:text-purple-200 mt-2 border-t pt-4 border-purple-200 dark:border-purple-800/70">Jump to Topic</h3>
                                            <p className="text-sm text-purple-600 dark:text-purple-300 mb-2">Selecting a topic will take you directly to the learning session.</p>
                                            <select
                                                value=""
                                                onChange={(e) => {
                                                    const topicId = e.target.value;
                                                    if (topicId) {
                                                        if (onClose) onClose();
                                                        navigate(studentRoutes.learn(topicId));
                                                    }
                                                }}
                                                className="w-full p-2 border border-purple-200 dark:border-purple-800/70 bg-white dark:bg-slate-900/60 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-slate-100"
                                            >
                                                <option value="" disabled>Choose a Topic...</option>
                                                {selectedSubject.chapters.map(chapter => (
                                                    <optgroup key={chapter.id} label={chapter.name}>
                                                        {chapter.topics.map(topic => (
                                                            <option key={topic.id} value={topic.id}>
                                                                {topic.name}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai' && role === 'student' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold">AI Tutor Configuration</h2>
                                <select
                                    value={settings.aiTutor.personality}
                                    onChange={(e) => updateAiTutor({ personality: e.target.value as 'encouraging' | 'direct' })}
                                    className="w-full p-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 rounded-lg text-gray-800 dark:text-slate-100"
                                >
                                    <option value="encouraging">Encouraging</option>
                                    <option value="direct">Direct</option>
                                </select>
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold">Privacy</h2>
                                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span>Enable Analytics</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.privacy.analyticsEnabled}
                                        onChange={(e) => updatePrivacy({ analyticsEnabled: e.target.checked })}
                                        className="w-5 h-5"
                                    />
                                </label>
                            </div>
                        )}
                    </motion.div>
                </div>
            </PageTransition>
        </div>
    </div>
);
}
