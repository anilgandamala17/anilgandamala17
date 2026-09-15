import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useTeachingStore } from '../stores/teachingStore';
import { useResourceStore } from '../stores/resourceStore';
import { useDoubtStore } from '../stores/doubtStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { useCurriculumStore } from '../stores/curriculumStore';
const NotesViewer = lazy(() => import('../components/studio/NotesViewer'));
const MindMapViewer = lazy(() => import('../components/studio/MindMapViewer'));
const FlashcardViewer = lazy(() => import('../components/studio/FlashcardViewer'));
const VerificationQuiz = lazy(() => import('../components/teaching/VerificationQuiz'));
const QuizVisual = lazy(() => import('../components/teaching/QuizVisual'));
const SummaryViewer = lazy(() => import('../components/studio/SummaryViewer'));
import { useSpeech, unlockAudioContext } from '../hooks/useSpeech';
import { useSessionControl } from '../hooks/useSessionControl';
import { useImmersiveTeaching } from '../hooks/useImmersiveTeaching';
import { useAutoHideControls } from '../hooks/useAutoHideControls';
import { useLiveCaptions } from '../hooks/useLiveCaptions';
import { analytics, setAnalyticsLessonContext } from '../services/analyticsService';
import type { ContentSource } from '../services/analyticsTypes';
import FloatingTeachingToolbar from '../components/teaching/fullscreen/FloatingTeachingToolbar';
import FullscreenBoardScaler from '../components/teaching/fullscreen/FullscreenBoardScaler';
import TeachingSettingsPopover from '../components/teaching/fullscreen/TeachingSettingsPopover';
import DoubtDrawer from '../components/teaching/fullscreen/DoubtDrawer';
import LessonContentGate from '../components/teaching/LessonContentGate';
import FullPageLoader from '../components/common/FullPageLoader';
import type { ChatMessage, Topic } from '../types';
import type { FeaturedToolItem, StudioToolId, ToolItem } from '../components/StudioPanel';

type StudioTabId = StudioToolId;

/** Human-readable names for supported teacher languages (drives the doubt-mode AI reply language). */
const DOUBT_LANGUAGE_NAMES: Record<string, string> = {
    'en-IN': 'English', 'hi-IN': 'Hindi', 'te-IN': 'Telugu', 'ta-IN': 'Tamil',
    'kn-IN': 'Kannada', 'ml-IN': 'Malayalam', 'bn-IN': 'Bengali', 'mr-IN': 'Marathi',
    'gu-IN': 'Gujarati', 'pa-IN': 'Punjabi', 'or-IN': 'Odia', 'od-IN': 'Odia',
};

/** Minimal typing for the Web Speech API recognition object (not in all TS lib versions). */
interface SpeechRecognitionLike {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start: () => void;
    stop: () => void;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
import {
    ChevronLeft, ChevronRight, Square, Maximize2, Minimize2, Settings, HelpCircle,
    FileText, CreditCard, Sparkles, Loader2, MessageCircle, Layers,
    Map as LucideMap, ArrowUp, Volume2, VolumeX, Home, Mic, PlayCircle, GraduationCap
} from 'lucide-react';
import { speakDoubtText, stopDoubtSpeech } from '../utils/doubtSpeech';
import { UserAvatar, displayNameForUser } from '../components/common/UserAvatar';
const QuizViewer = lazy(() => import('../components/studio/QuizViewer'));
import StudioPanel from '../components/StudioPanel';
import { toast } from '../stores/toastStore';
import { studentHomeForMode, studentRoutes } from '../utils/routes';
const SettingsPage = lazy(() => import('./SettingsPage'));
const ProfilePage = lazy(() => import('./ProfilePage'));
import { aiService } from '../services/aiService';
import ChatMessageBubble, { ChatThinkingIndicator } from '../components/teaching/ChatMessageBubble';
import { normalizeChatContent } from '../utils/chatFormat';
const DiagramCanvas = lazy(() => import('../components/teaching/DiagramCanvas'));
const CurriculumVideoPlayer = lazy(() => import('../components/teaching/CurriculumVideoPlayer'));
import Breadcrumbs, { BreadcrumbItem } from '../components/common/Breadcrumbs';
import SignOutButton from '../components/common/SignOutButton';
import EmojiMascot from '../components/mascot/EmojiMascot';
import { findTopicInfo } from '../utils/topicUtils';
import { GREEN_BOARD_FADE_DURATION_MS, subscribeToVisualMarkers } from '../utils/visualSyncEngine';
import { getFirstActiveDiagramId, getVisualsForTopic, parseDiagramMarkerKey } from '../data/visualRegistry';
import { coerceTtsLanguage } from '../constants/ttsLanguages';
import { getTopicVideoResource, isVideoOnlyTopic } from '../services/curriculumVideoService';
import { isImageLikeFile } from '../utils/imageVision';

async function extractUploadedText(file: File): Promise<string> {
    const { extractTextFromFile } = await import('../utils/documentParser');
    return extractTextFromFile(file);
}

export default function TeachingPage() {
    const { topicId } = useParams();
    const isVideoOnlyLesson = isVideoOnlyTopic(topicId);
    const navigate = useNavigate();
    const [activeModal, setActiveModal] = useState<'none' | 'settings' | 'profile'>('none');

    const {
        currentSession,
        currentStep,
        isPaused,
        isSpeaking,
        pause,
        resume,
        isInDoubtMode,
        enterDoubtMode,
        exitDoubtMode,
        resolveDoubt,
    } = useTeachingStore(useShallow(state => ({
        currentSession: state.currentSession,
        currentStep: state.currentStep,
        isPaused: state.isPaused,
        isSpeaking: state.isSpeaking,
        pause: state.pause,
        resume: state.resume,
        isInDoubtMode: state.isInDoubtMode,
        enterDoubtMode: state.enterDoubtMode,
        exitDoubtMode: state.exitDoubtMode,
        resolveDoubt: state.resolveDoubt,
    })));
    const { user, role } = useAuthStore(useShallow(state => ({ user: state.user, role: state.role })));

    const {
        notes,
        mindMaps,
        flashcards,
        isGeneratingNotes,
        isGeneratingMindMap,
        isGeneratingFlashcards,
        isGeneratingSummary,
        generateNotes,
        generateMindMap,
        generateFlashcards,
        updateFlashcardPerformance,
        summaries,
        generateSummary,
    } = useResourceStore(useShallow(state => ({
        notes: state.notes,
        mindMaps: state.mindMaps,
        flashcards: state.flashcards,
        isGeneratingNotes: state.isGeneratingNotes,
        isGeneratingMindMap: state.isGeneratingMindMap,
        isGeneratingFlashcards: state.isGeneratingFlashcards,
        isGeneratingSummary: state.isGeneratingSummary,
        generateNotes: state.generateNotes,
        generateMindMap: state.generateMindMap,
        generateFlashcards: state.generateFlashcards,
        updateFlashcardPerformance: state.updateFlashcardPerformance,
        summaries: state.summaries,
        generateSummary: state.generateSummary,
    })));

    const {
        showVerificationQuiz,
        currentQuiz,
        hideQuiz,
        confirmUnderstanding,
        activeDoubt,
    } = useDoubtStore(useShallow(state => ({
        showVerificationQuiz: state.showVerificationQuiz,
        currentQuiz: state.currentQuiz,
        hideQuiz: state.hideQuiz,
        confirmUnderstanding: state.confirmUnderstanding,
        activeDoubt: state.activeDoubt
    })));

    const { addSession } = useAnalyticsStore();
    const sessionStartTimeRef = useRef<number>(Date.now());
    const activeTopicForAnalyticsRef = useRef(topicId);

    // Reset per-topic session clock when the student switches topics without leaving the page.
    useEffect(() => {
        if (activeTopicForAnalyticsRef.current === topicId) return;
        const prevTopic = activeTopicForAnalyticsRef.current;
        const duration = Math.max(0, Math.round((Date.now() - sessionStartTimeRef.current) / 60000));
        if (prevTopic && duration >= 1) {
            useAnalyticsStore.getState().addSession({
                sessionId: `session_switch_${Date.now()}`,
                date: new Date().toISOString(),
                durationMinutes: duration,
                topicId: prevTopic,
                completionPercentage: Math.round(useTeachingStore.getState().getProgress()) || 0,
                doubtsCount: useTeachingStore.getState().currentSession?.doubts?.length || 0,
            });
        }
        activeTopicForAnalyticsRef.current = topicId;
        sessionStartTimeRef.current = Date.now();
    }, [topicId]);

    const { settings, updateAccessibility } = useSettingsStore(useShallow(state => ({
        settings: state.settings,
        updateAccessibility: state.updateAccessibility,
    })));
    const reduceAnimations = settings?.accessibility?.reduceAnimations ?? false;
    const textToSpeechEnabled = settings?.accessibility?.textToSpeech ?? false;
    const lessonTtsLanguage = coerceTtsLanguage(settings?.accessibility?.ttsLanguage);
    const topicContext = useMemo(() => findTopicInfo(topicId), [topicId]);
    const studentHomePath = studentHomeForMode(
        topicContext.type === 'competitive' ? 'competitive' : 'curriculum',
    );
    const goStudentHome = () => navigate(studentHomePath);
    const { profile } = useUserStore(useShallow(state => ({ profile: state.profile })));
    // Get user's profession and sub-profession for contextual teaching

    // Initialize chat with contextual greeting based on topic
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    /** Only reset chat when the route topic changes — not when session reloads, TTS language, or profile hydrates. */
    const chatSeededForTopicIdRef = useRef<string | null>(null);

    // Set initial chat message when topic loads (once per topicId)
    useEffect(() => {
        if (!topicId) {
            chatSeededForTopicIdRef.current = null;
            setChatMessages([]);
            return;
        }
        if (!currentSession?.topicName) return;

        if (chatSeededForTopicIdRef.current === topicId) return;

        chatSeededForTopicIdRef.current = topicId;
        const professionContext = profile?.profession?.name
            ? ` As someone in ${profile.profession.name}, I'll tailor the explanations to your field.`
            : '';
        setChatMessages([{
            id: `welcome-${topicId}`,
            type: 'ai',
            content: `Hello! I'm here to help you learn ${currentSession.topicName}.${professionContext} Feel free to ask any questions as we go through the lesson!`,
            timestamp: new Date().toISOString()
        }]);
    }, [topicId, currentSession?.topicName, profile?.profession?.name]);

    const [inputMessage, setInputMessage] = useState('');
    // Chat file upload state
    const [uploadedChatFiles, setUploadedChatFiles] = useState<Array<{ name: string; dataUrl?: string; type: string }>>([]);
    const chatFileInputRef = useRef<HTMLInputElement>(null);
    // Studio Panel viewer state
    const [studioInViewer, setStudioInViewer] = useState(false);
    // Hard Rule 15 — activeDiagramId drives DiagramCanvas; optional sub-part for SVG sync (e.g. mitochondria)
    const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);
    const [activeHighlightPart, setActiveHighlightPart] = useState<string | null>(null);
    const [lastUserAction, setLastUserAction] = useState<string | null>(null);
    const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
    const isMountedRef = useRef(true);
    const [isMobile, setIsMobile] = useState(false);
    /** Tablet range (768–1023px) where the three panels stack in a scrolling column. */
    const [isStacked, setIsStacked] = useState(false);

    // Mobile panel + layout state (needed before doubt/fullscreen handlers)
    const [mobilePanel, setMobilePanel] = useState<'home' | 'teach' | 'studio'>('teach');
    const [centerPanelVisible, setCenterPanelVisible] = useState(true);
    const [rightPanelVisible, setRightPanelVisible] = useState(true);
    const [chatPanelVisible, setChatPanelVisible] = useState(true);
    const [centerMaximized, setCenterMaximized] = useState(false);
    const [rightMaximized, setRightMaximized] = useState(false);
    const [chatMaximized, setChatMaximized] = useState(false);
    const immersiveOverlayRef = useRef<HTMLDivElement>(null);
    const floatingToolbarRef = useRef<HTMLDivElement>(null);
    const [toolbarReservePx, setToolbarReservePx] = useState(72);
    const [settingsPopoverOpen, setSettingsPopoverOpen] = useState(false);
    const [showCaptions, setShowCaptions] = useState(true);
    const [autoPlayLesson, setAutoPlayLesson] = useState(true);

    const getLayoutSnapshot = () => ({
        chatPanelVisible,
        rightPanelVisible,
        centerPanelVisible,
        mobilePanel,
    });

    const { isImmersiveFullscreen, enterImmersive, exitImmersive, getSnapshot } = useImmersiveTeaching({
        overlayRef: immersiveOverlayRef,
        blockEscapeExit: settingsPopoverOpen || activeModal === 'settings',
    });

    const immersiveDoubtOpen = isImmersiveFullscreen && isInDoubtMode;

    const controlsPinned = settingsPopoverOpen || immersiveDoubtOpen;
    const { controlsVisible, showControls } = useAutoHideControls({
        enabled: isImmersiveFullscreen,
        pinned: controlsPinned,
    });

    const handleEnterImmersive = () => {
        enterImmersive(getLayoutSnapshot());
        setCenterMaximized(false);
        setChatMaximized(false);
        setRightMaximized(false);
        showControls();
    };

    const handleExitImmersive = () => {
        exitImmersive();
        const snap = getSnapshot();
        if (snap) {
            setChatPanelVisible(snap.chatPanelVisible);
            setRightPanelVisible(snap.rightPanelVisible);
            setCenterPanelVisible(snap.centerPanelVisible);
            setMobilePanel(snap.mobilePanel);
        }
        setSettingsPopoverOpen(false);
    };

    // Measure floating toolbar height for board area calculation
    useEffect(() => {
        if (!isImmersiveFullscreen) return;
        const el = floatingToolbarRef.current;
        if (!el) return;

        const measure = () => {
            const rect = el.getBoundingClientRect();
            setToolbarReservePx(Math.ceil(rect.height) + 16);
        };

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [isImmersiveFullscreen, controlsVisible]);

    const [playbackTrigger, setPlaybackTrigger] = useState(0);
    /** True after user clicks Stop listening / board stop — Resume must bump playbackTrigger to restart TTS. */
    const needsPlaybackRestartRef = useRef(false);

    useEffect(() => {
        needsPlaybackRestartRef.current = false;
    }, [topicId]);

    const sessionMatchesRoute = Boolean(topicId && currentSession?.topicId === topicId);
    const currentStepData = sessionMatchesRoute
        ? (currentSession?.teachingSteps?.[currentStep] ?? null)
        : null;
    const attachmentStillLoading = uploadedChatFiles.some(f => !f.dataUrl);
    const { topicUnavailable, isPreloading, lessonContentState, retryLoad, isRetrying } = useSessionControl(topicId);
    const { isMuted, setIsMuted, isFetchingAudio } = useSpeech(currentStepData, playbackTrigger, {
        preferNatural: true,
        sessionTopicId: topicId,
        ignoreSession: isVideoOnlyLesson,
    });

    const captionStepKey = currentStepData
        ? `${currentStepData.id ?? currentStep}::${currentSession?.id ?? ''}`
        : null;
    const { captionText, hasCaption } = useLiveCaptions(
        isImmersiveFullscreen && showCaptions,
        captionStepKey,
    );

    useEffect(() => {
        if (topicId) setAnalyticsLessonContext(topicId, currentSession?.currentStep);
    }, [topicId, currentSession?.currentStep]);

    const progressBucketsSentRef = useRef<Set<number>>(new Set());
    useEffect(() => {
        progressBucketsSentRef.current = new Set();
        if (!topicId) return;
        analytics.teachingPageView(
            topicId,
            (currentSession?.contentSource as ContentSource | undefined) || undefined,
        );
        return () => {
            if (!topicId) return;
            const pct = typeof currentSession?.progress === 'number' ? currentSession.progress : undefined;
            analytics.lessonExit(topicId, pct);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per topic mount
    }, [topicId]);

    useEffect(() => {
        if (!topicId || !currentSession) return;
        const pct = Math.round(currentSession.progress || 0);
        for (const bucket of [25, 50, 75]) {
            if (pct >= bucket && !progressBucketsSentRef.current.has(bucket)) {
                progressBucketsSentRef.current.add(bucket);
                analytics.lessonProgress(topicId, bucket, currentSession.currentStep);
            }
        }
        if (pct >= 100 && !progressBucketsSentRef.current.has(100)) {
            progressBucketsSentRef.current.add(100);
            analytics.lessonCompleted(
                topicId,
                (currentSession.contentSource as ContentSource | undefined) || undefined,
            );
            useCurriculumStore.getState().recordTopicCompleteById(topicId);
        }
    }, [topicId, currentSession?.progress, currentSession?.currentStep, currentSession?.contentSource]);

    const prevPausedRef = useRef(isPaused);
    useEffect(() => {
        if (!topicId) return;
        if (isPaused && !prevPausedRef.current) {
            analytics.lessonPaused(topicId, currentSession?.currentStep);
        } else if (!isPaused && prevPausedRef.current) {
            analytics.lessonResumed(topicId, currentSession?.currentStep);
        }
        prevPausedRef.current = isPaused;
    }, [isPaused, topicId, currentSession?.currentStep]);

    // Flush step bookmark on refresh/close so resume survives unload races.
    useEffect(() => {
        const persistStepBookmark = () => {
            const store = useTeachingStore.getState();
            const tid = store.currentSession?.topicId;
            if (!tid || store.currentSession?.contentSource === 'cached') return;
            const lastStepByTopicId = {
                ...(store.lastStepByTopicId ?? {}),
                [tid]: store.currentStep,
            };
            useTeachingStore.setState({ lastStepByTopicId });
        };
        window.addEventListener('pagehide', persistStepBookmark);
        window.addEventListener('beforeunload', persistStepBookmark);
        return () => {
            window.removeEventListener('pagehide', persistStepBookmark);
            window.removeEventListener('beforeunload', persistStepBookmark);
        };
    }, []);

    const autoStartedSessionRef = useRef<string | null>(null);
    /** True after we armed autoplay but before real speech — gesture retries once (browser policy). */
    const needsAutoplayRetryRef = useRef(false);
    const gestureRetrySessionRef = useRef<string | null>(null);
    const autoPlayGateRef = useRef({
        autoPlayLesson,
        isMuted,
        isPaused,
        isInDoubtMode,
        textToSpeechEnabled,
        isVideoOnlyLesson,
        topicId,
        sessionId: currentSession?.id as string | undefined,
        sessionTopicId: currentSession?.topicId as string | undefined,
        contentSource: currentSession?.contentSource as string | undefined,
        hasSpoken: Boolean(currentStepData?.spokenContent),
    });
    autoPlayGateRef.current = {
        autoPlayLesson,
        isMuted,
        isPaused,
        isInDoubtMode,
        textToSpeechEnabled,
        isVideoOnlyLesson,
        topicId,
        sessionId: currentSession?.id,
        sessionTopicId: currentSession?.topicId,
        contentSource: currentSession?.contentSource,
        hasSpoken: Boolean(currentStepData?.spokenContent),
    };

    const canArmAutoplay = () => {
        const g = autoPlayGateRef.current;
        if (g.isVideoOnlyLesson) return false;
        if (!g.autoPlayLesson || g.isMuted || g.isPaused || g.isInDoubtMode || !g.textToSpeechEnabled) return false;
        if (!g.sessionId || g.sessionTopicId !== g.topicId) return false;
        if (!g.hasSpoken && g.contentSource !== 'cached') return false;
        return true;
    };

    // Unlock + retry autoplay on gesture (browser autoplay policy)
    useEffect(() => {
        const onGesture = () => {
            unlockAudioContext();
            const sid = autoPlayGateRef.current.sessionId;
            if (!needsAutoplayRetryRef.current || !canArmAutoplay() || !sid) return;
            if (gestureRetrySessionRef.current === sid) return;
            gestureRetrySessionRef.current = sid;
            setPlaybackTrigger((prev) => prev + 1);
        };
        const onAutoplayBlocked = () => {
            needsAutoplayRetryRef.current = true;
            // Allow the next gesture to re-arm playback for this session
            gestureRetrySessionRef.current = null;
        };
        window.addEventListener('pointerdown', onGesture, { capture: true });
        window.addEventListener('keydown', onGesture, { capture: true });
        window.addEventListener('speech-autoplay-blocked', onAutoplayBlocked);
        return () => {
            window.removeEventListener('pointerdown', onGesture, true);
            window.removeEventListener('keydown', onGesture, true);
            window.removeEventListener('speech-autoplay-blocked', onAutoplayBlocked);
        };
    }, []);

    // Clear retry flag once speech is actually live
    useEffect(() => {
        if (isSpeaking) {
            needsAutoplayRetryRef.current = false;
        }
    }, [isSpeaking]);

    // Auto-start lesson speech once per session when autoPlay is on
    useEffect(() => {
        if (isVideoOnlyLesson) return;
        if (!autoPlayLesson || isMuted || !textToSpeechEnabled || !currentSession?.id) return;
        if (currentSession.topicId !== topicId) return;
        if (!currentStepData?.spokenContent && currentSession.contentSource !== 'cached') return;
        if (autoStartedSessionRef.current === currentSession.id) return;
        if (isPaused || isInDoubtMode) return;

        autoStartedSessionRef.current = currentSession.id;
        needsAutoplayRetryRef.current = true;
        unlockAudioContext();
        const t = window.setTimeout(() => {
            setPlaybackTrigger((prev) => prev + 1);
        }, 350);
        return () => window.clearTimeout(t);
    }, [
        autoPlayLesson,
        isMuted,
        textToSpeechEnabled,
        currentSession?.id,
        currentSession?.topicId,
        currentSession?.contentSource,
        currentStepData?.spokenContent,
        topicId,
        isVideoOnlyLesson,
        isPaused,
        isInDoubtMode,
    ]);

    // Re-arm when Voice or Auto-play is turned back on mid-lesson
    const prevVoiceAutoRef = useRef({ voice: textToSpeechEnabled, auto: autoPlayLesson });
    useEffect(() => {
        const prev = prevVoiceAutoRef.current;
        const voiceTurnedOn = textToSpeechEnabled && !prev.voice;
        const autoTurnedOn = autoPlayLesson && !prev.auto;
        prevVoiceAutoRef.current = { voice: textToSpeechEnabled, auto: autoPlayLesson };
        if (!voiceTurnedOn && !autoTurnedOn) return;
        if (isVideoOnlyLesson) return;
        if (!canArmAutoplay()) return;
        unlockAudioContext();
        setPlaybackTrigger((p) => p + 1);
    }, [textToSpeechEnabled, autoPlayLesson, isVideoOnlyLesson]);

    // ── "Raise a Doubt" interactive teacher (chat panel) ─────────────────────
    const [doubtSpeaking, setDoubtSpeaking] = useState(false);
    /** Id of the chat message currently being spoken aloud (drives the bubble speaking indicator). */
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    /** Hands-free voice conversation with the AI teacher (auto listen → auto send → spoken reply → listen again). */
    const [isTeacherMode, setIsTeacherMode] = useState(false);
    /** Ref mirror of isTeacherMode so async speech/recognition callbacks read the live value. */
    const teacherModeRef = useRef(false);
    const doubtSpeechSeqRef = useRef(0);
    /** How many teacher answers were given for the current doubt session (drives adaptive re-explanation). */
    const doubtAnswerCountRef = useRef(0);
    const activeDoubtIdRef = useRef<string | null>(null);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    /** Latest transcript captured during the current listening turn (auto-sent when the student stops speaking). */
    const latestTranscriptRef = useRef('');
    /** Consecutive listening turns that ended with silence — stop auto-relistening after a couple. */
    const emptyListenCountRef = useRef(0);
    const chatInputRef = useRef<HTMLInputElement>(null);
    /** Chat scroll container — powers smart auto-scroll + "scroll to latest". */
    const chatScrollRef = useRef<HTMLDivElement>(null);
    /** True while the student is at (or near) the bottom of the conversation. */
    const chatNearBottomRef = useRef(true);
    const [showScrollLatest, setShowScrollLatest] = useState(false);

    const scrollChatToBottom = (smooth = true) => {
        const el = chatScrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    };

    const handleChatScroll = () => {
        const el = chatScrollRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        const near = distanceFromBottom < 80;
        chatNearBottomRef.current = near;
        setShowScrollLatest(prev => (prev === !near ? prev : !near));
    };
    /**
     * Latest-closure dispatchers for the voice loop. Recognition callbacks and TTS
     * .then() chains outlive the render they were created in; calling the captured
     * functions directly would freeze state (e.g. isInDoubtMode, chat history) at
     * that old render and break turn-taking. These refs are reassigned every render.
     */
    const startListeningRef = useRef<() => void>(() => { /* assigned each render */ });
    const sendMessageRef = useRef<(text: string) => void>(() => { /* assigned each render */ });

    const doubtTtsLanguage = settings?.accessibility?.ttsLanguage || 'en-IN';
    const doubtTtsSpeaker = settings?.accessibility?.ttsSpeaker || 'anushka';
    const doubtTtsSpeed = settings?.accessibility?.ttsSpeed ?? 1;
    const doubtTtsVoiceName = settings?.accessibility?.ttsVoice || '';
    const doubtLanguageName = DOUBT_LANGUAGE_NAMES[doubtTtsLanguage] || 'English';

    /** Speak a doubt-teacher message aloud (skipped while muted). Resolves when playback ends. */
    const speakForDoubt = async (text: string, messageId?: string) => {
        if (isMuted || isVideoOnlyLesson) return;
        const seq = ++doubtSpeechSeqRef.current;
        setDoubtSpeaking(true);
        if (messageId) setSpeakingMessageId(messageId);
        try {
            await speakDoubtText(text, {
                language: doubtTtsLanguage,
                speaker: doubtTtsSpeaker,
                speed: doubtTtsSpeed,
                voiceName: doubtTtsVoiceName,
            });
        } finally {
            if (seq === doubtSpeechSeqRef.current && isMountedRef.current) {
                setDoubtSpeaking(false);
                setSpeakingMessageId(null);
            }
        }
    };

    const stopListening = () => {
        latestTranscriptRef.current = '';
        try { recognitionRef.current?.stop(); } catch { /* ignore */ }
        recognitionRef.current = null;
        setIsListening(false);
    };

    /**
     * Start one listening turn. In teacher mode this powers automatic turn-taking:
     * the recognizer ends itself when the student pauses, the transcript auto-sends,
     * and the mic re-opens after the teacher finishes the spoken reply.
     */
    const startListening = () => {
        if (isVideoOnlyLesson) return;
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) {
            toast.info('Voice input is not supported in this browser — you can type your doubt instead.');
            return;
        }
        if (recognitionRef.current) return; // already listening
        stopDoubtSpeech(); // never transcribe the teacher's own voice
        setDoubtSpeaking(false);
        latestTranscriptRef.current = '';
        try {
            const rec = new Ctor();
            rec.lang = doubtTtsLanguage;
            rec.continuous = false;
            rec.interimResults = true;
            rec.onresult = (event) => {
                let transcript = '';
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0]?.transcript ?? '';
                }
                transcript = transcript.trim();
                if (transcript) {
                    latestTranscriptRef.current = transcript;
                    setInputMessage(transcript);
                }
            };
            rec.onend = () => {
                recognitionRef.current = null;
                if (!isMountedRef.current) return;
                setIsListening(false);
                const text = latestTranscriptRef.current.trim();
                latestTranscriptRef.current = '';
                // Hands-free turn-taking: silence ends the student's turn and sends the doubt
                if (teacherModeRef.current && useTeachingStore.getState().isInDoubtMode) {
                    if (text) {
                        emptyListenCountRef.current = 0;
                        sendMessageRef.current(text);
                    } else {
                        emptyListenCountRef.current += 1;
                        if (emptyListenCountRef.current <= 2) {
                            startListeningRef.current();
                        } else {
                            emptyListenCountRef.current = 0;
                            setChatMessages(prev => [...prev, {
                                id: `doubt-quiet-${Date.now()}`,
                                type: 'system',
                                content: "I couldn't hear you. Tap the mic when you're ready to speak, or type your doubt.",
                                timestamp: new Date().toISOString(),
                            }]);
                        }
                    }
                }
            };
            rec.onerror = () => {
                recognitionRef.current = null;
                if (isMountedRef.current) setIsListening(false);
            };
            recognitionRef.current = rec;
            rec.start();
            setIsListening(true);
        } catch {
            recognitionRef.current = null;
            setIsListening(false);
        }
    };

    /**
     * Raise a Doubt: pause the lesson at its exact position and open the chat panel.
     * Quiet by design — the teacher only starts speaking when the student activates
     * the Interactive AI Teacher button (or simply types a question).
     */
    const handleRaiseDoubt = (opts?: { silent?: boolean }) => {
        if (isInDoubtMode || !currentSession) return;
        unlockAudioContext();

        const doubtId = `doubt_${Date.now()}`;
        activeDoubtIdRef.current = doubtId;
        doubtAnswerCountRef.current = 0;
        enterDoubtMode({
            id: doubtId,
            sessionId: currentSession.id,
            question: '',
            timestamp: new Date().toISOString(),
            context: {
                stepNumber: currentStep,
                stepTitle: currentStepData?.title || '',
            },
            status: 'pending',
        });

        // Open the chat panel (same teacher turns to the student — no page change)
        if (!isImmersiveFullscreen) {
            if (isMobile) {
                setMobilePanel('home');
            } else {
                setCenterMaximized(false);
                setRightMaximized(false);
                setChatMaximized(false);
                setCenterPanelVisible(true);
                setChatPanelVisible(true);
            }
        }
        const focusTimeout = setTimeout(() => chatInputRef.current?.focus(), 400);
        timeoutRefs.current.push(focusTimeout);

        if (isImmersiveFullscreen) {
            showControls();
        }

        if (!opts?.silent) {
            setChatMessages(prev => [...prev, {
                id: `doubt-open-${Date.now()}`,
                type: 'system',
                content: isVideoOnlyLesson
                    ? 'Lesson paused. Type your doubt below.'
                    : 'Lesson paused. Tap the teacher button to talk with Aɪra hands-free, or type your doubt below.',
                timestamp: new Date().toISOString(),
            }]);
        }
    };

    /** Activate the hands-free voice-to-voice teacher: greet, then listen automatically. */
    const activateTeacherMode = () => {
        if (!currentSession || isVideoOnlyLesson) return;
        unlockAudioContext();
        if (!isInDoubtMode) handleRaiseDoubt({ silent: true }); // voice teacher implies the lesson pauses first
        teacherModeRef.current = true;
        setIsTeacherMode(true);
        emptyListenCountRef.current = 0;

        const greeting = "Hi! I'm here to help. What's your doubt? Just ask me in your own words, and I'll explain it step by step.";
        const greetingId = `teacher-greet-${Date.now()}`;
        setChatMessages(prev => [...prev, {
            id: greetingId,
            type: 'ai',
            content: greeting,
            timestamp: new Date().toISOString(),
        }]);
        void speakForDoubt(greeting, greetingId).then(() => {
            if (teacherModeRef.current && useTeachingStore.getState().isInDoubtMode && isMountedRef.current) {
                startListeningRef.current();
            }
        });
    };

    /** Turn off the hands-free conversation (doubt mode itself stays open for typing). */
    const deactivateTeacherMode = () => {
        teacherModeRef.current = false;
        setIsTeacherMode(false);
        stopListening();
        stopDoubtSpeech();
        setDoubtSpeaking(false);
    };

    /** Resume Lesson: close doubt mode and continue playback from the exact paused sentence. */
    const handleResumeLesson = () => {
        teacherModeRef.current = false;
        setIsTeacherMode(false);
        stopDoubtSpeech();
        stopListening();
        setDoubtSpeaking(false);
        if (activeDoubtIdRef.current) {
            resolveDoubt(activeDoubtIdRef.current);
            activeDoubtIdRef.current = null;
        }
        exitDoubtMode();
        setChatMessages(prev => [...prev, {
            id: `doubt-resume-${Date.now()}`,
            type: 'system',
            content: 'Doubt resolved — resuming the lesson right where we left off.',
            timestamp: new Date().toISOString(),
        }]);
        if (!isImmersiveFullscreen && isMobile) setMobilePanel('teach');
        unlockAudioContext();
        resume();
    };

    // Safety net: stop doubt speech / mic when leaving the page
    useEffect(() => {
        return () => {
            teacherModeRef.current = false;
            stopDoubtSpeech();
            try { recognitionRef.current?.stop(); } catch { /* ignore */ }
            useTeachingStore.getState().exitDoubtMode();
        };
    }, []);

    useEffect(() => {
        const handleFallbackNotice = (e: Event) => {
            const msg = (e as CustomEvent).detail?.message;
            if (msg) toast.info(msg);
        };
        window.addEventListener('tts-fallback-notice', handleFallbackNotice);
        return () => window.removeEventListener('tts-fallback-notice', handleFallbackNotice);
    }, []);

    // Visual Freeze Guarantee: Strictly pause all animations when paused
    useEffect(() => {
        if (isPaused || isInDoubtMode || isPreloading) {
            document.body.classList.add('visual-freeze-active');
        } else {
            document.body.classList.remove('visual-freeze-active');
        }
        return () => {
            document.body.classList.remove('visual-freeze-active');
        };
    }, [isPaused, isInDoubtMode, isPreloading]);

    // Extract user context for stable dependencies

    // Topic info (subject area + grade level) hoisted to component scope for use in all generators
    const topicInfo = useMemo(() => {
        try {
            const info = findTopicInfo(currentSession?.topicId ?? '');
            const topic = info.topic as Topic | null;
            return {
                subjectArea: info.subjectName ?? null,
                gradeLevel: info.streamName ?? null,
                topicDescription: topic?.description,
                chapterName: info.chapterName,
                subjectDescription: info.subjectDescription,
            };
        } catch {
            return {
                subjectArea: null,
                gradeLevel: null,
                topicDescription: undefined as string | undefined,
                chapterName: undefined as string | undefined,
                subjectDescription: undefined as string | undefined,
            };
        }
    }, [currentSession?.topicId]);

    // Mobile panel state (local) - Only one panel visible on mobile at a time
    // 'home' = Pre-teaching state (chat/questions), 'teach' = Teaching panel (default), 'studio' = Post-teaching resources
    const [activeStudioTab, setActiveStudioTab] = useState<StudioTabId>('notes');
    // Store previous visibility states before maximizing
    // (Removed in favor of purely CSS flex-based collapsing)
    const [completedQuizCount, setCompletedQuizCount] = useState(0);
    /** Live Studio quiz progress (answered / generated questions) — drives the featured card. */
    const [quizProgress, setQuizProgress] = useState<{ answered: number; total: number }>({ answered: 0, total: 0 });
    const [lastQuizScore, setLastQuizScore] = useState<number | null>(null);
    const [boardMedia, setBoardMedia] = useState<'video' | 'diagram'>('video');
    const topicVideo = topicId ? getTopicVideoResource(topicId) : null;

    useEffect(() => {
        if (isVideoOnlyLesson) {
            setBoardMedia('video');
            return;
        }
        setBoardMedia(topicVideo ? 'video' : 'diagram');
    }, [topicId, topicVideo?.id, isVideoOnlyLesson]);

    useEffect(() => {
        if (!isVideoOnlyLesson) return;
        stopDoubtSpeech();
        stopListening();
        teacherModeRef.current = false;
        setIsTeacherMode(false);
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, [isVideoOnlyLesson, topicId]);

    // Resources for session
    const sessionId = currentSession?.id || '';
    const sessionNotes = notes.filter(n => n.sessionId === sessionId);
    const sessionMindMaps = mindMaps.filter(m => m.sessionId === sessionId);
    const sessionFlashcards = flashcards.filter(f => f.sessionId === sessionId);
    const sessionSummaries = summaries.filter(s => s.sessionId === sessionId);

    /**
     * Stacked panels lay out in a column, so these ratios would size height instead of
     * width and squash each panel to a sliver (hiding footers like the quiz Next button).
     * Stacked panels keep their natural height and the container scrolls instead.
     */
    const panelFlex = (hidden: boolean, maximized: boolean, ratio: string) => {
        if (hidden) return '0 0 0px';
        if (maximized) return '1 1 100%';
        return isStacked ? '0 0 auto' : ratio;
    };
    const stackedPanelStyle: React.CSSProperties = isStacked
        ? { minHeight: 'min(80vh, 640px)', flexShrink: 0 }
        : { minHeight: 0 };

    const studioFeaturedTool = useMemo<FeaturedToolItem>(() => {
        const { answered, total } = quizProgress;
        const finished = total > 0 && answered >= total;
        const inProgress = answered > 0 && !finished;

        let statusLabel = 'Not started yet';
        if (lastQuizScore !== null) {
            statusLabel = `Last score ${lastQuizScore}%`;
        } else if (completedQuizCount > 0) {
            statusLabel = `${completedQuizCount} quiz${completedQuizCount === 1 ? '' : 'zes'} completed`;
        }

        return {
            id: 'quiz',
            title: 'Quiz',
            icon: HelpCircle,
            accentColor: '#8B5CF6',
            badge: completedQuizCount === 0 && answered === 0 ? 'New' : undefined,
            description: 'Check understanding with adaptive practice questions',
            progressCurrent: answered,
            progressTotal: total,
            statusLabel,
            ctaLabel: finished ? 'Retake quiz' : inProgress ? 'Continue quiz' : 'Start quiz',
        };
    }, [quizProgress, lastQuizScore, completedQuizCount]);

    const studioTools = useMemo<ToolItem[]>(() => [
        {
            id: 'notes',
            title: 'Notes',
            icon: FileText,
            accentColor: '#3B82F6',
            badge: sessionNotes.length > 0 ? 'Active' : undefined,
            countLabel: sessionNotes.length > 0
                ? `${sessionNotes.length} set${sessionNotes.length === 1 ? '' : 's'}`
                : undefined,
        },
        {
            id: 'map',
            title: 'Mind Map',
            icon: LucideMap,
            accentColor: '#14B8A6',
            countLabel: sessionMindMaps.length > 0
                ? `${sessionMindMaps.length} map${sessionMindMaps.length === 1 ? '' : 's'}`
                : undefined,
        },
        {
            id: 'flashcards',
            title: 'Flashcards',
            icon: CreditCard,
            accentColor: '#F59E0B',
            badge: 'New',
            countLabel: sessionFlashcards.length > 0
                ? `${sessionFlashcards.length} card${sessionFlashcards.length === 1 ? '' : 's'}`
                : undefined,
        },
        {
            id: 'quiz',
            title: 'Quiz',
            icon: HelpCircle,
            accentColor: '#8B5CF6',
            badge: 'New',
        },
        {
            id: 'summary',
            title: 'Summary',
            icon: Sparkles,
            accentColor: '#EC4899',
            countLabel: sessionSummaries.length > 0
                ? (sessionSummaries.length === 1 ? '1 summary' : `${sessionSummaries.length} summaries`)
                : undefined,
        },
    ], [
        sessionNotes.length,
        sessionMindMaps.length,
        sessionFlashcards.length,
        sessionSummaries.length,
    ]);

    const generatingToolId: StudioToolId | null = isGeneratingNotes
        ? 'notes'
        : isGeneratingMindMap
            ? 'map'
            : isGeneratingFlashcards
                ? 'flashcards'
                : isGeneratingSummary
                    ? 'summary'
                    : null;

    const handleStudioToolClick = (toolId: StudioToolId) => {
        if (generatingToolId === toolId) return;

        setActiveStudioTab(toolId);
        if (toolId === 'quiz') {
            setStudioInViewer(true);
            return;
        }
        if (toolId === 'notes' && sessionNotes.length > 0) {
            setStudioInViewer(true);
            return;
        }
        if (toolId === 'map' && sessionMindMaps.length > 0) {
            setStudioInViewer(true);
            return;
        }
        if (toolId === 'flashcards' && sessionFlashcards.length > 0) {
            setStudioInViewer(true);
            return;
        }
        if (toolId === 'summary' && sessionSummaries.length > 0) {
            setStudioInViewer(true);
            return;
        }
        if (toolId === 'summary') {
            void handleGenerateSummary();
        } else if (toolId === 'map') {
            void handleGenerateMindMap();
        } else if (toolId === 'flashcards') {
            void handleGenerateFlashcards();
        } else if (toolId === 'notes') {
            void handleGenerateNotes();
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        
        return () => {
            isMountedRef.current = false;
            timeoutRefs.current.forEach(clearTimeout);
            timeoutRefs.current = [];

            // Log flight time when leaving the teaching page
            const duration = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 60000));
            if (duration >= 1) { // Only log if they spent at least a minute
                useAnalyticsStore.getState().addSession({
                    sessionId: `session_exit_${Date.now()}`,
                    date: new Date().toISOString(),
                    durationMinutes: duration,
                    topicId: activeTopicForAnalyticsRef.current || topicId || 'unknown',
                    completionPercentage: Math.round(useTeachingStore.getState().getProgress()) || 0,
                    doubtsCount: useTeachingStore.getState().currentSession?.doubts?.length || 0,
                    // No quizScore: leaving the page is not a quiz attempt, and a placeholder 0
                    // would drag the learner's average score down.
                });
            }
        };
    }, [topicId]);

    // Visual Sync Engine: bridge from AI narration markers to green board state
    useEffect(() => {
        const unsub = subscribeToVisualMarkers((marker) => {
            if (!marker) return;
            
            // Handle explicit TEXT: markers
            if (marker.startsWith('TEXT:')) {
                setActiveHighlightPart(marker.substring(5));
                return;
            }
            
            const { lookupKey, highlightPart } = parseDiagramMarkerKey(marker);
            
            // Diagram switch + highlight part (e.g. concept_1.diagram_1.nucleus)
            if (lookupKey.includes('.')) {
                setActiveDiagramId(lookupKey);
                setActiveHighlightPart(highlightPart);
            } 
            // Simple keyword marker (e.g. 'nucleus', 'mitochondria') to highlight in current diagram
            else if (lookupKey) {
                setActiveHighlightPart(lookupKey);
            }
        });
        return unsub;
    }, []);

    // Reset activeVisual and activeDiagramId when step changes (Hard Rule 17: start from first concept)
    useEffect(() => {
        const session = useTeachingStore.getState().currentSession;
        if (session?.contentSource === 'cached') return;
        const firstId = topicId ? getFirstActiveDiagramId(topicId) : null;
        setActiveDiagramId(firstId);
        setActiveHighlightPart(null);
    }, [currentStep, topicId]);

    // Cached playback: clear highlight and diagram between segment transitions
    useEffect(() => {
        const onClearHighlight = () => setActiveHighlightPart(null);
        const onClearDiagram = () => {
            setActiveHighlightPart(null);
            const firstId = topicId ? getFirstActiveDiagramId(topicId) : null;
            setActiveDiagramId(firstId);
        };
        window.addEventListener('visual-clear-highlight', onClearHighlight);
        window.addEventListener('visual-clear-diagram', onClearDiagram);
        return () => {
            window.removeEventListener('visual-clear-highlight', onClearHighlight);
            window.removeEventListener('visual-clear-diagram', onClearDiagram);
        };
    }, [topicId]);

    // Speech logic moved to useSpeech hook

    // Smart auto-scroll: follow new/streaming messages only while the student
    // is already at the bottom; never yank them away from older messages.
    useEffect(() => {
        if (chatNearBottomRef.current) {
            scrollChatToBottom(false);
        }
    }, [chatMessages, isChatLoading]);



    const handleSendMessage = async (overrideText?: string) => {
        const outgoingText = (overrideText ?? inputMessage).trim();
        if (!outgoingText && uploadedChatFiles.length === 0) return;
        // Read live from the store: this function is also invoked from speech-recognition
        // callbacks, and doubt mode may have been entered after those closures were created.
        const inDoubtMode = useTeachingStore.getState().isInDoubtMode;
        if (uploadedChatFiles.some(f => !f.dataUrl)) {
            toast.info('Please wait for your file or image to finish loading.');
            return;
        }
        if (isChatLoading) return;

        // Visual feedback for user action
        const actionTimeoutId = setTimeout(() => setLastUserAction(null), 2000);
        timeoutRefs.current.push(actionTimeoutId);
        setLastUserAction('message-sent');

        // A new question interrupts the teacher's voice and the mic
        stopListening();
        if (doubtSpeaking) {
            stopDoubtSpeech();
            setDoubtSpeaking(false);
            setSpeakingMessageId(null);
        }

        // Build message content with file info
        let messageContent = outgoingText;
        if (uploadedChatFiles.length > 0) {
            const fileNames = uploadedChatFiles.map(f => f.name).join(', ');
            messageContent = messageContent
                ? `${messageContent}\n\n[Attached: ${fileNames}]`
                : `[Attached: ${fileNames}]`;
        }

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: messageContent,
            timestamp: new Date().toISOString(),
        };

        const sentMessage = outgoingText;
        const sentFiles = uploadedChatFiles;
        setChatMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setUploadedChatFiles([]);
        setIsChatLoading(true);

        const aiMessageId = (Date.now() + 1).toString();
        const placeholderAi: ChatMessage = {
            id: aiMessageId,
            type: 'ai',
            content: '',
            timestamp: new Date().toISOString(),
            isStreaming: true,
        };
        setChatMessages(prev => [...prev, placeholderAi]);

        const updateStream = (_delta: string, full: string) => {
            if (!isMountedRef.current) return;
            setChatMessages(prev => prev.map(m =>
                m.id === aiMessageId ? { ...m, content: full } : m
            ));
        };

        const finalizeAiMessage = (rawText: string) => {
            const finalContent = normalizeChatContent(rawText);
            setChatMessages(prev => prev.map(m =>
                m.id === aiMessageId
                    ? { ...m, content: finalContent, isStreaming: false }
                    : m
            ));
            return finalContent;
        };

        // Last 6 turns including this user message (fixes stale closure from pre-update chatMessages)
        const historySnapshot = [...chatMessages, userMessage].slice(-6).map(m => ({
            role: (m.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.content,
        }));

        try {
            let aiText: string;

            // ── DOCUMENT / IMAGE PATH ────────────────────────────────────────────
            if (sentFiles.length > 0) {
                const question = sentMessage || 'Please explain the content of this file.';

                const imageStillLoading = sentFiles.some(f => isImageLikeFile(f) && !f.dataUrl);
                if (imageStillLoading) {
                    aiText = 'Your image is still loading. Please wait a second and send again.';
                    finalizeAiMessage(aiText);
                } else {
                    const imageFile = sentFiles.find(f => isImageLikeFile(f) && f.dataUrl);
                    if (imageFile?.dataUrl) {
                        aiText = await aiService.streamDocumentQuestion(
                            `__IMAGE_BASE64__${imageFile.dataUrl}`,
                            question,
                            updateStream,
                        );
                    } else {
                        const docFile = sentFiles.find(f => !isImageLikeFile(f) && f.dataUrl);
                        if (docFile?.dataUrl) {
                            aiText = await aiService.streamDocumentQuestion(
                                docFile.dataUrl,
                                question,
                                updateStream,
                            );
                        } else {
                            aiText = 'Your file is still being processed. Please wait a moment and try again.';
                            finalizeAiMessage(aiText);
                        }
                    }
                }
            } else if (inDoubtMode) {
                doubtAnswerCountRef.current += 1;
                aiText = await aiService.streamAnswerDoubt({
                    question: sentMessage,
                    topicName: currentSession?.topicName ?? null,
                    chapterName: topicInfo.chapterName ?? null,
                    stepTitle: currentStepData?.title ?? null,
                    stepContent: currentStepData?.content ?? '',
                    subjectArea: topicInfo.subjectArea,
                    gradeLevel: topicInfo.gradeLevel,
                    conversationHistory: historySnapshot,
                    userProfession: profile?.profession?.name ?? null,
                    attemptNumber: doubtAnswerCountRef.current,
                    preferredLanguageName: doubtLanguageName,
                }, updateStream);
            } else {
                aiText = await aiService.streamChatMessage({
                    userMessage: sentMessage,
                    topicName: currentSession?.topicName ?? null,
                    chapterName: topicInfo.chapterName ?? null,
                    stepTitle: currentStepData?.title ?? null,
                    stepContent: currentStepData?.content ?? '',
                    subjectArea: topicInfo.subjectArea,
                    gradeLevel: topicInfo.gradeLevel,
                    conversationHistory: historySnapshot,
                    userProfession: profile?.profession?.name ?? null,
                }, updateStream);
            }

            if (!isMountedRef.current) return;

            let finalContent: string;
            if (aiText.includes('still loading') || aiText.includes('still being processed')) {
                finalContent = aiText;
            } else {
                finalContent = finalizeAiMessage(aiText);
            }

            if (inDoubtMode) {
                void speakForDoubt(finalContent, aiMessageId).then(() => {
                    if (teacherModeRef.current && useTeachingStore.getState().isInDoubtMode && isMountedRef.current) {
                        startListeningRef.current();
                    }
                });
            }
        } catch (err) {
            if (!isMountedRef.current) return;
            console.warn('[TeachingPage] Chat request failed:', err);
            const fallbackText = `Sorry, I had trouble connecting to the AI service. Please try again in a moment!`;
            finalizeAiMessage(fallbackText);
            if (inDoubtMode) {
                void speakForDoubt(fallbackText, aiMessageId).then(() => {
                    if (teacherModeRef.current && useTeachingStore.getState().isInDoubtMode && isMountedRef.current) {
                        startListeningRef.current();
                    }
                });
            }
        } finally {
            if (isMountedRef.current) setIsChatLoading(false);
        }
    };

    // Re-point the voice-loop dispatchers at this render's closures (fresh state every render)
    startListeningRef.current = startListening;
    sendMessageRef.current = (text: string) => { void handleSendMessage(text); };

    // Cleanup all timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
            timeoutRefs.current = [];
        };
    }, []);

    // Track mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768; // md breakpoint
            setIsMobile(mobile);
            // md → lg: panels stack vertically, so width ratios must not drive height.
            setIsStacked(!mobile && window.innerWidth < 1024);
            // Prefer immersive body class for scroll lock; only lock body on mobile when not immersive
            if (document.body.classList.contains('immersive-teaching-active')) {
                document.body.style.overflow = 'hidden';
            } else if (mobile) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => {
            window.removeEventListener('resize', checkMobile);
            document.body.style.overflow = '';
        };
    }, []);

    // Mobile: keep panel defaults; immersive mode works on all viewports
    useEffect(() => {
        if (!isMobile) return;
        setCenterMaximized(false);
        setRightMaximized(false);
        setChatMaximized(false);
        if (!isImmersiveFullscreen) {
            setCenterPanelVisible(true);
            setRightPanelVisible(true);
            setChatPanelVisible(true);
        }
    }, [isMobile, isImmersiveFullscreen]);



    const handleGenerateNotes = async () => {
        if (!currentSession || !currentSession.teachingSteps || currentSession.teachingSteps.length === 0) {
            toast.warning('No content available to generate notes from.');
            return;
        }
        try {
            const content = currentSession.teachingSteps
                .map(s => {
                    const parts: string[] = [];
                    if (s.title) parts.push(`## ${s.title}`);
                    if (s.content) parts.push(s.content);
                    if (s.spokenContent && s.spokenContent !== s.content) {
                        parts.push(s.spokenContent);
                    }
                    if (s.keyConcepts && s.keyConcepts.length > 0) {
                        parts.push(`Key concepts: ${s.keyConcepts.join(', ')}`);
                    }
                    return parts.join('\n\n');
                })
                .filter(Boolean);

            if (content.length === 0) {
                toast.warning('No content available to generate notes from.');
                return;
            }

            const keyConcepts = currentSession.teachingSteps
                .flatMap(s => s.keyConcepts || [])
                .filter(Boolean);

            await generateNotes(currentSession.id, currentSession.topicName, content, {
                subjectArea: topicInfo.subjectArea || undefined,
                gradeLevel: topicInfo.gradeLevel || undefined,
                chapterName: topicInfo.chapterName,
                topicDescription: topicInfo.topicDescription,
                subjectDescription: topicInfo.subjectDescription,
                keyConcepts,
            });
            setActiveStudioTab('notes');
            setStudioInViewer(true);
        } catch (error) {
            if (error instanceof Error && /already generating/i.test(error.message)) return;
            toast.error('Failed to generate notes. Please try again.');
            console.error('Error generating notes:', error);
        }
    };

    const handleGenerateMindMap = async () => {
        if (!currentSession || !currentSession.teachingSteps || currentSession.teachingSteps.length === 0) {
            toast.warning('No content available to generate mind map from.');
            return;
        }
        try {
            const concepts = currentSession.teachingSteps.map(s => s.title).filter(Boolean);
            const lessonContent = currentSession.teachingSteps.map(s => s.content || '').filter(Boolean);
            if (concepts.length === 0) {
                toast.warning('No concepts available to generate mind map from.');
                return;
            }
            await generateMindMap(
                currentSession.id,
                currentSession.topicName,
                topicInfo.subjectArea || 'General',
                topicInfo.gradeLevel || 'School',
                concepts,
                lessonContent
            );
            setActiveStudioTab('map');
            setStudioInViewer(true);
        } catch (error) {
            if (error instanceof Error && /already generating/i.test(error.message)) return;
            toast.error('Failed to generate mind map. Please try again.');
            console.error('Error generating mind map:', error);
        }
    };

    const handleGenerateFlashcards = async () => {
        if (!currentSession || !currentSession.teachingSteps || currentSession.teachingSteps.length === 0) {
            toast.warning('No content available to generate flashcards from.');
            return;
        }
        try {
            // Extract comprehensive content for better flashcard generation
            const content = currentSession.teachingSteps
                .map(s => {
                    const parts = [];
                    if (s.content) parts.push(s.content);
                    if (s.spokenContent && s.spokenContent !== s.content) {
                        parts.push(s.spokenContent);
                    }
                    // Include key concepts if available
                    if (s.keyConcepts && s.keyConcepts.length > 0) {
                        parts.push(`Key concepts: ${s.keyConcepts.join(', ')}`);
                    }
                    return parts.join('\n\n');
                })
                .filter(Boolean);

            if (content.length === 0) {
                toast.warning('No content available to generate flashcards from.');
                return;
            }
            await generateFlashcards(
                currentSession.id,
                currentSession.topicName,
                topicInfo.subjectArea || 'General',
                topicInfo.gradeLevel || 'School',
                content
            );
            setActiveStudioTab('flashcards');
            setStudioInViewer(true);
        } catch (error) {
            if (error instanceof Error && /already generating/i.test(error.message)) return;
            toast.error('Failed to generate flashcards. Please try again.');
            console.error('Error generating flashcards:', error);
        }
    };

    const handleGenerateSummary = async () => {
        if (!currentSession || !currentSession.teachingSteps || currentSession.teachingSteps.length === 0) {
            toast.warning('No content available to generate summary from.');
            return;
        }
        try {
            const content = currentSession.teachingSteps
                .map(s => {
                    const parts = [];
                    if (s.content) parts.push(s.content);
                    if (s.spokenContent && s.spokenContent !== s.content) {
                        parts.push(s.spokenContent);
                    }
                    return parts.join('\n\n');
                })
                .filter(Boolean);

            if (content.length === 0) {
                toast.warning('No content available to generate summary from.');
                return;
            }
            await generateSummary(currentSession.id, currentSession.topicName, content);
            setActiveStudioTab('summary');
            setStudioInViewer(true);
        } catch (error) {
            if (error instanceof Error && /already generating/i.test(error.message)) return;
            toast.error('Failed to generate summary. Please try again.');
            console.error('Error generating summary:', error);
        }
    };


    if (lessonContentState.phase === 'loading') {
        return <FullPageLoader message="Preparing your lesson" stage="Fetching content and board" />;
    }

    if (lessonContentState.phase === 'preparing' || lessonContentState.phase === 'failed') {
        return (
            <LessonContentGate
                variant={lessonContentState.phase === 'failed' ? 'failed' : 'preparing'}
                topicName={lessonContentState.topicName ?? 'This topic'}
                status={lessonContentState.status}
                message={lessonContentState.message}
                onRetry={retryLoad}
                onBack={() => navigate(studentRoutes.curriculum)}
                isRetrying={isRetrying}
            />
        );
    }

    if (isPreloading) {
        return <FullPageLoader message="Preparing visuals" stage="Loading board" />;
    }

    if (topicId && topicUnavailable) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center p-4 safe-top safe-bottom safe-x min-h-[100dvh]" style={{ background: 'var(--teaching-page-gradient-start)' }}>
                <p className="text-gray-700 dark:text-slate-200 font-medium mb-4 text-center text-sm sm:text-base">This topic is not available.</p>
                <button
                    onClick={goStudentHome}
                    className="touch-target px-5 py-3 rounded-xl text-white font-medium transition-colors min-h-[44px]"
                    style={{ backgroundColor: 'var(--teaching-accent)' }}
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }


    return (
        <div
            className={`flex flex-col overflow-hidden w-full ${isMobile ? 'fixed inset-0 min-h-[100dvh]' : 'h-screen min-h-[100dvh]'}`}
            style={{
                background: `linear-gradient(135deg, var(--teaching-page-gradient-start) 0%, var(--teaching-page-gradient-end) 100%)`,
            }}
        >
            <header
                className={`flex items-center justify-between sticky top-0 z-50 shrink-0 border-b border-transparent safe-top ${isImmersiveFullscreen ? 'hidden' : ''}`}
                style={{
                    height: 'clamp(48px, 10vh, 64px)',
                    paddingLeft: 'max(var(--teaching-content-padding-x), var(--safe-left))',
                    paddingRight: 'max(var(--teaching-content-padding-x), var(--safe-right))',
                    background: 'var(--teaching-header-bg)',
                    backdropFilter: 'saturate(180%) blur(12px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(12px)',
                }}
            >
                <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <button
                            type="button"
                            onClick={goStudentHome}
                            className="touch-target p-2 rounded-xl text-[var(--teaching-panel-text)] hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors sm:hidden flex items-center justify-center min-w-[44px] min-h-[44px]"
                            aria-label="Home"
                        >
                            <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                            type="button"
                            onClick={goStudentHome}
                            className="shrink-0 cursor-pointer hidden sm:flex items-center justify-center w-9 h-9 rounded-xl hover:bg-purple-100 dark:hover:bg-slate-800 text-purple-600 dark:text-purple-400 transition-all active:scale-95"
                            aria-label="Home"
                            title="Go to Dashboard"
                        >
                            <Home className="w-5 h-5" />
                        </button>
                        <Breadcrumbs
                            role={role}
                            homePath={studentHomePath}
                            items={((): BreadcrumbItem[] => {
                                const ctx = findTopicInfo(topicId);
                                const items: BreadcrumbItem[] = [];
                                if (ctx.type === 'curriculum') {
                                    items.push({
                                        label: 'Curriculum',
                                        onClick: () => navigate(studentRoutes.curriculum)
                                    });
                                    if (ctx.streamName && ctx.gradeId) {
                                        items.push({
                                            label: ctx.streamName,
                                            onClick: () => navigate(studentRoutes.curriculum, { state: { gradeId: ctx.gradeId } })
                                        });
                                    }
                                    if (ctx.subjectName && ctx.gradeId && ctx.subjectId) {
                                        items.push({
                                            label: ctx.subjectName,
                                            onClick: () => navigate(studentRoutes.curriculum, { state: { gradeId: ctx.gradeId, subjectId: ctx.subjectId } })
                                        });
                                    }
                                    if (ctx.topic) items.push({ label: ctx.topic.name });
                                } else {
                                    if (ctx.streamName) items.push({ label: ctx.streamName });
                                    if (ctx.subjectName) items.push({ label: ctx.subjectName });
                                    if (ctx.topic) items.push({ label: ctx.topic.name });
                                }
                                return items;
                            })()}
                            className="hidden sm:flex"
                        />
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                if (isMuted) {
                                    unlockAudioContext();
                                } else {
                                    if (typeof window !== 'undefined' && window.speechSynthesis) {
                                        window.speechSynthesis.cancel();
                                    }
                                    stopDoubtSpeech();
                                    setDoubtSpeaking(false);
                                }
                                setIsMuted((m) => !m);
                            }}
                            className="touch-target p-2 rounded-xl text-[var(--teaching-panel-text)] hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-green-600" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveModal('settings')}
                            className="touch-target p-2 rounded-xl text-[var(--teaching-panel-text)] hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                            aria-label="Settings"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5 shrink-0" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveModal('profile')}
                            className="touch-target min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shrink-0 ml-1 cursor-pointer"
                            aria-label={`Profile — ${displayNameForUser(user)}`}
                            title={displayNameForUser(user)}
                        >
                            <UserAvatar
                                user={user}
                                size={36}
                                className="ring-1 ring-black/5 dark:ring-white/10"
                                fallbackStyle={{ backgroundColor: 'var(--teaching-avatar-red)' }}
                            />
                        </button>
                        <SignOutButton className="touch-target p-2 rounded-xl transition-colors hover:bg-white/50 dark:hover:bg-slate-800/50 flex items-center justify-center min-w-[44px] min-h-[44px]" />
                    </div>
                </div>
            </header>

            {/* Mobile Panel Tabs — single-column switching, touch-friendly */}
            <div className={`md:hidden flex bg-white/70 dark:bg-slate-900/80 z-20 relative safe-x padding-safe-top ${isImmersiveFullscreen ? 'hidden' : ''}`} style={{ paddingBottom: 'var(--space-xs)' }}>
                {[
                    { id: 'home', icon: MessageCircle, label: 'Chat' },
                    { id: 'teach', icon: Sparkles, label: 'Teaching' },
                    { id: 'studio', icon: Layers, label: 'Studio' },
                ].map((panel) => (
                    <button
                        key={panel.id}
                        onClick={() => setMobilePanel(panel.id as typeof mobilePanel)}
                        className={`flex-1 py-3 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-all min-h-[48px] rounded-xl touch-manipulation ${mobilePanel === panel.id
                            ? 'text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        aria-label={`Switch to ${panel.label} panel`}
                        aria-pressed={mobilePanel === panel.id}
                    >
                        <panel.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span>{panel.label}</span>
                    </button>
                ))}
            </div>

            <main
                className={`flex-1 flex flex-col min-h-0 w-full ${isMobile ? 'min-h-[50vh]' : ''}`}
                style={{ overflow: 'hidden' }}
            >
                <motion.div
                    layout
                    className={`flex-1 w-full flex overflow-y-auto overflow-x-hidden lg:overflow-hidden relative min-h-0 ${isMobile ? 'flex-col' : 'lg:flex-row flex-col items-stretch'}`}
                    animate={isMobile ? {} : {
                        paddingTop: (centerMaximized || rightMaximized || chatMaximized || isImmersiveFullscreen) ? 0 : 'var(--teaching-content-margin-y)',
                        paddingBottom: (centerMaximized || rightMaximized || chatMaximized || isImmersiveFullscreen) ? 0 : 'var(--teaching-content-margin-y)',
                        paddingLeft: (centerMaximized || rightMaximized || chatMaximized || isImmersiveFullscreen) ? 0 : 'max(var(--teaching-content-padding-x), var(--safe-left))',
                        paddingRight: (centerMaximized || rightMaximized || chatMaximized || isImmersiveFullscreen) ? 0 : 'max(var(--teaching-content-padding-x), var(--safe-right))',
                        gap: (centerMaximized || rightMaximized || chatMaximized || isImmersiveFullscreen) ? 0 : 'var(--teaching-panels-gap)',
                        background: (centerMaximized || rightMaximized || chatMaximized || isImmersiveFullscreen) ? 'var(--teaching-panel-bg)' : 'transparent',
                    }}
                    style={isMobile ? { minHeight: 0, paddingLeft: 'var(--safe-left)', paddingRight: 'var(--safe-right)' } : {
                        height: '100%',
                        minHeight: 0,
                        position: 'relative',
                    }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                >
                    {/* Collapsed Chat Panel Expander (desktop/tablet only) */}
                    <AnimatePresence mode="popLayout">
                        {!isMobile && !chatPanelVisible && !chatMaximized && !centerMaximized && !rightMaximized && !isImmersiveFullscreen && (
                            <motion.div
                                layout
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 40 }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex flex-col items-center justify-center border-r border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 overflow-hidden order-1 lg:order-1"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setChatPanelVisible(true);
                                        setChatMaximized(false);
                                    }}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                                    title="Expand Chat Panel"
                                    aria-label="Expand Chat Panel"
                                >
                                    <ChevronRight className="w-5 h-5 shrink-0" />
                                </button>
                                <span className="text-xs text-gray-500 dark:text-gray-400 writing-mode-vertical mt-2 whitespace-nowrap font-bold uppercase tracking-widest">Chat</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══════════════════════ CHAT PANEL (Left — 23%) ═══════════════════════ */}
                    <AnimatePresence mode="popLayout">
                        {(chatPanelVisible || immersiveDoubtOpen) && (() => {
                    const chatPanelBody = (
                        <>
                        {/* Panel Header — centered title with minimize / maximize controls */}
                        {!immersiveDoubtOpen && (
                        <div
                            className="hidden md:flex items-center justify-center shrink-0 border-b bg-transparent relative"
                            style={{
                                minHeight: chatMaximized ? '56px' : 'clamp(48px, 8vh, 60px)',
                                height: chatMaximized ? '56px' : 'clamp(48px, 8vh, 60px)',
                                borderColor: 'var(--teaching-panel-divider)',
                                borderRadius: chatMaximized ? 0 : 'var(--teaching-panel-radius) var(--teaching-panel-radius) 0 0',
                                background: chatMaximized ? 'rgba(245, 244, 248, 0.97)' : undefined,
                                backdropFilter: chatMaximized ? 'saturate(180%) blur(10px)' : undefined,
                            }}
                        >
                            {!chatMaximized && (
                                <h2 className="text-base sm:text-lg font-medium text-[var(--teaching-panel-text)] truncate px-2" style={{ letterSpacing: '0.01em' }}>Chat Panel</h2>
                            )}
                            {chatMaximized && (
                                <h2 className="text-base font-medium text-[var(--teaching-panel-text)]" style={{ letterSpacing: '0.01em' }}>Chat Panel</h2>
                            )}
                            {!isMobile && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {!chatMaximized && (
                                        <motion.button
                                            type="button"
                                            onClick={() => setChatPanelVisible(false)}
                                            className="rounded-lg transition-colors flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 touch-target min-w-[40px] min-h-[40px]"
                                            whileTap={{ scale: 0.92 }}
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                                            aria-label="Minimize Chat Panel"
                                            title="Minimize Chat Panel"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </motion.button>
                                    )}
                                    <motion.button
                                        type="button"
                                        onClick={() => {
                                            if (chatMaximized) {
                                                setChatMaximized(false);
                                            } else {
                                                setChatMaximized(true);
                                                setCenterMaximized(false);
                                                setRightMaximized(false);
                                            }
                                        }}
                                        className={`rounded-lg transition-colors flex items-center justify-center touch-target min-w-[40px] min-h-[40px] ${chatMaximized
                                            ? 'p-2.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-[var(--teaching-panel-divider)] text-[var(--teaching-panel-text)] shadow-sm'
                                            : 'p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                            }`}
                                        whileTap={{ scale: 0.92 }}
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                                        aria-label={chatMaximized ? 'Exit full screen' : 'Full screen Chat Panel'}
                                        title={chatMaximized ? 'Exit full screen' : 'Full screen'}
                                    >
                                        {chatMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                    </motion.button>
                                </div>
                            )}
                        </div>
                        )}

                        {/* Doubt Mode banner — non-immersive only (DoubtDrawer header has Resume) */}
                        <AnimatePresence>
                            {isInDoubtMode && !immersiveDoubtOpen && (
                                <motion.div
                                    initial={reduceAnimations ? false : { opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={reduceAnimations ? undefined : { opacity: 0, height: 0 }}
                                    transition={{ duration: reduceAnimations ? 0 : 0.35, ease: 'easeInOut' }}
                                    className="shrink-0 overflow-hidden border-b"
                                    style={{ borderColor: 'var(--teaching-panel-divider)' }}
                                >
                                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/30">
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 min-w-0">
                                            {doubtSpeaking ? (
                                                <button
                                                    type="button"
                                                    onClick={() => { stopDoubtSpeech(); setDoubtSpeaking(false); setSpeakingMessageId(null); }}
                                                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                                                    title="Stop the teacher's voice"
                                                    aria-label="Stop speaking"
                                                >
                                                    <Volume2 className="w-4 h-4 shrink-0 animate-pulse text-purple-600 dark:text-purple-300" />
                                                    <span className="truncate">Aɪra is speaking...</span>
                                                </button>
                                            ) : isListening ? (
                                                <>
                                                    <Mic className="w-4 h-4 shrink-0 animate-pulse text-red-500" />
                                                    <span className="truncate">Listening — just speak, no need to press send</span>
                                                </>
                                            ) : (
                                                <>
                                                    <HelpCircle className="w-4 h-4 shrink-0" />
                                                    <span className="truncate">{isTeacherMode ? 'Teacher Mode — hands-free conversation' : 'Doubt Mode — lesson paused'}</span>
                                                </>
                                            )}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleResumeLesson}
                                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
                                            aria-label="Resume Lesson"
                                        >
                                            <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                                            Resume Lesson
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Immersive status lives in the portaled DoubtDrawer */}

                        {/* Chat Messages — scrollable, smart auto-scroll, responsive padding */}
                        <div
                            ref={chatScrollRef}
                            onScroll={handleChatScroll}
                            className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 sm:space-y-5 min-h-0"
                            style={{ padding: 'clamp(12px, 3vw, var(--space-lg))' }}
                        >
                            {chatMessages.map((msg) => (
                                <ChatMessageBubble
                                    key={msg.id}
                                    message={msg}
                                    reduceAnimations={reduceAnimations}
                                    isSpeaking={speakingMessageId === msg.id}
                                />
                            ))}
                            {isChatLoading && !chatMessages.some(m => m.isStreaming) && (
                                <ChatThinkingIndicator />
                            )}
                        </div>

                        {/* Scroll to latest — shown when the student scrolls up */}
                        <AnimatePresence>
                            {showScrollLatest && (
                                <motion.button
                                    type="button"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: reduceAnimations ? 0 : 0.2 }}
                                    className="chat-scroll-latest"
                                    onClick={() => {
                                        chatNearBottomRef.current = true;
                                        setShowScrollLatest(false);
                                        scrollChatToBottom(!reduceAnimations);
                                    }}
                                    aria-label="Scroll to latest message"
                                >
                                    <ArrowUp className="w-3.5 h-3.5 rotate-180" />
                                    Scroll to latest
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Chat Input Bar — sticky glassmorphism pill with file upload */}
                        <div
                            className="shrink-0 border-t chat-input-glass"
                            style={{
                                padding: '10px 12px',
                                borderColor: 'var(--teaching-panel-divider)',
                            }}
                        >
                            {/* File preview chips */}
                            {uploadedChatFiles.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {uploadedChatFiles.map((f, i) => (
                                        <div key={i} className="flex items-center gap-1 bg-purple-50 border border-purple-200 rounded-lg px-2 py-1 text-xs text-purple-700 max-w-[140px]">
                                            {f.type.startsWith('image/') && f.dataUrl
                                                ? <img src={f.dataUrl} alt={f.name} className="w-5 h-5 rounded object-cover shrink-0" />
                                                : <FileText className="w-3.5 h-3.5 shrink-0" />
                                            }
                                            <span className="truncate">{f.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setUploadedChatFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                className="text-purple-400 hover:text-purple-700 shrink-0 ml-0.5"
                                                aria-label="Remove file"
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div
                                className="flex items-center gap-2 rounded-2xl border px-3 transition-all focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-200/60"
                                style={{
                                    background: 'var(--teaching-panel-bg-alt, #f6f5fa)',
                                    borderColor: isChatLoading ? 'var(--teaching-accent)' : 'var(--teaching-panel-divider)',
                                    minHeight: '48px',
                                }}
                            >
                                {/* Hidden file input */}
                                <input
                                    ref={chatFileInputRef}
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    multiple
                                    className="hidden"
                                    onChange={async (e) => {
                                        const files = Array.from(e.target.files || []);
                                        for (const file of files) {
                                            if (isImageLikeFile(file)) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    setUploadedChatFiles(prev => [...prev, {
                                                        name: file.name,
                                                        dataUrl: ev.target?.result as string,
                                                        type: file.type || 'image/jpeg',
                                                    }]);
                                                };
                                                reader.onerror = () => {
                                                    toast.error(`Could not read image: ${file.name}`);
                                                };
                                                reader.readAsDataURL(file);
                                            } else {
                                                try {
                                                    setUploadedChatFiles(prev => [...prev, { name: file.name, type: file.type }]);

                                                    const extractedText = await extractUploadedText(file);
                                                    const text =
                                                        extractedText.trim().length > 0
                                                            ? extractedText
                                                            : '[No extractable text in this document.]';

                                                    let assigned = false;
                                                    setUploadedChatFiles(prev =>
                                                        prev.map((f) => {
                                                            if (
                                                                !assigned &&
                                                                f.name === file.name &&
                                                                f.dataUrl === undefined
                                                            ) {
                                                                assigned = true;
                                                                return { ...f, dataUrl: text };
                                                            }
                                                            return f;
                                                        })
                                                    );
                                                } catch (err) {
                                                    console.error(`Failed to parse ${file.name}:`, err);
                                                    toast.error(`Could not read text from ${file.name}`);
                                                    let removed = false;
                                                    setUploadedChatFiles((prev) =>
                                                        prev.filter((f) => {
                                                            if (
                                                                !removed &&
                                                                f.name === file.name &&
                                                                f.dataUrl === undefined
                                                            ) {
                                                                removed = true;
                                                                return false;
                                                            }
                                                            return true;
                                                        })
                                                    );
                                                }
                                            }
                                        }
                                        // Reset input so same file can be selected again
                                        e.target.value = '';
                                    }}
                                />
                                {/* Upload button */}
                                <button
                                    type="button"
                                    onClick={() => chatFileInputRef.current?.click()}
                                    disabled={isChatLoading}
                                    className="shrink-0 flex items-center justify-center rounded-full w-8 h-8 text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-all disabled:opacity-40"
                                    title="Attach image or document"
                                    aria-label="Attach file"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41A2 2 0 0 1 6.59 14.59L15.78 5.4" />
                                    </svg>
                                </button>
                                {/* Voice input (mic) */}
                                {!isVideoOnlyLesson && (
                                <button
                                    type="button"
                                    onClick={() => (isListening ? stopListening() : startListening())}
                                    disabled={isChatLoading}
                                    className={`shrink-0 flex items-center justify-center rounded-full w-8 h-8 transition-all disabled:opacity-40 ${isListening
                                        ? 'text-red-500 bg-red-50 dark:bg-red-900/30 animate-pulse'
                                        : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'
                                        }`}
                                    title={isListening ? 'Stop voice input' : 'Speak your question'}
                                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                                )}
                                {/* Text input */}
                                <input
                                    ref={chatInputRef}
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && !attachmentStillLoading && handleSendMessage()}
                                    placeholder={isListening ? 'Listening... speak your doubt' : isChatLoading ? 'AI is thinking...' : isInDoubtMode ? 'Ask your doubt — speak or type...' : 'Ask anything or attach a file...'}
                                    disabled={isChatLoading}
                                    className="flex-1 min-w-0 bg-transparent border-none outline-none focus:ring-0 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 py-2 disabled:cursor-wait"
                                    style={{ color: 'var(--teaching-panel-text)' }}
                                />
                                {/* Send button */}
                                <button
                                    type="button"
                                    onClick={() => handleSendMessage()}
                                    disabled={isChatLoading || attachmentStillLoading || (!inputMessage.trim() && uploadedChatFiles.length === 0)}
                                    className="shrink-0 flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                                    style={{
                                        width: 36,
                                        height: 36,
                                        background: 'var(--teaching-accent, #7c3aed)',
                                    }}
                                    aria-label="Send message"
                                >
                                    {isChatLoading
                                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        : <ArrowUp className="w-4 h-4 text-white" />
                                    }
                                </button>
                                {/* Interactive AI Teacher — hands-free voice conversation */}
                                {!isVideoOnlyLesson && (
                                <button
                                    type="button"
                                    onClick={() => (isTeacherMode ? deactivateTeacherMode() : activateTeacherMode())}
                                    disabled={!currentSession}
                                    className={`shrink-0 flex items-center justify-center rounded-full transition-all active:scale-90 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${isTeacherMode ? 'ring-2 ring-purple-300' : ''}`}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                                        boxShadow: isTeacherMode ? '0 0 14px rgba(124, 58, 237, 0.65)' : '0 2px 8px rgba(124, 58, 237, 0.3)',
                                    }}
                                    title={isTeacherMode ? 'Voice Teaching Mode is ON — click to stop' : 'Interactive AI Teacher'}
                                    aria-label={isTeacherMode ? 'Stop Interactive AI Teacher' : 'Start Interactive AI Teacher'}
                                    aria-pressed={isTeacherMode}
                                >
                                    <GraduationCap className={`w-4 h-4 text-white ${isTeacherMode ? 'animate-pulse' : ''}`} />
                                </button>
                                )}
                            </div>
                        </div>
                        </>
                    );

                    if (immersiveDoubtOpen) {
                        // Render via portal outside AnimatePresence (see below) — returning
                        // createPortal from AnimatePresence never mounts the drawer.
                        return null;
                    }

                    return (
                    <motion.div
                        layout
                        initial={isMobile ? { opacity: 0 } : { opacity: 0, flex: '0 0 0px' }}
                        animate={isMobile ? { opacity: mobilePanel === 'home' ? 1 : 0 } : {
                            opacity: ((centerMaximized || rightMaximized || isImmersiveFullscreen) && !chatMaximized) ? 0 : 1,
                            flex: panelFlex((centerMaximized || rightMaximized || isImmersiveFullscreen) && !chatMaximized, chatMaximized, '23 23 0%'),
                            borderRadius: chatMaximized ? 0 : 'var(--teaching-panel-radius)',
                            boxShadow: chatMaximized ? 'none' : 'var(--teaching-panel-shadow)',
                        }}
                        exit={isMobile ? { opacity: 0 } : { opacity: 0, flex: '0 0 0px' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300, duration: reduceAnimations ? 0 : 0.35 }}
                        className={`${isMobile ? 'absolute inset-0 w-full h-full' : 'relative min-w-0'} flex flex-col z-30 lg:z-auto order-2 lg:order-1 ${mobilePanel === 'home' ? 'flex' : 'hidden lg:flex md:flex'}`}
                        style={isMobile ? {
                            display: mobilePanel === 'home' ? 'flex' : 'none',
                            pointerEvents: mobilePanel === 'home' ? 'auto' : 'none'
                        } : {
                            background: 'var(--teaching-panel-bg)',
                            overflow: 'hidden',
                            alignSelf: 'stretch',
                            padding: 0,
                            ...stackedPanelStyle,
                        }}
                    >
                        {chatPanelBody}
                    </motion.div>
                    );
                        })()}
                    </AnimatePresence>

                    {/* Immersive doubt drawer is rendered inside the teaching overlay (not here) */}

                    {/* ═══════════════════════ TEACHING PANEL (Center — 55%) ═══════════════════════ */}
                    <AnimatePresence mode="popLayout">
                        {centerPanelVisible && (
                            <motion.div
                                ref={immersiveOverlayRef}
                                layout
                                initial={isMobile ? { opacity: 0 } : { opacity: 0, flex: '0 0 0px' }}
                                animate={isMobile ? { opacity: mobilePanel === 'teach' ? 1 : 0 } : {
                                    opacity: (rightMaximized || chatMaximized) && !isImmersiveFullscreen ? 0 : 1,
                                    flex: isImmersiveFullscreen ? '0 0 0px' : panelFlex(rightMaximized || chatMaximized, centerMaximized, rightPanelVisible ? '55 55 0%' : '75 75 0%'),
                                    borderRadius: isImmersiveFullscreen || centerMaximized ? 0 : 20,
                                    boxShadow: isImmersiveFullscreen || centerMaximized ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                                }}
                                exit={isMobile ? { opacity: 0 } : { opacity: 0, flex: '0 0 0px' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 300, duration: reduceAnimations ? 0 : 0.35 }}
                                className={`${isMobile ? 'absolute inset-0 w-full h-full' : 'relative min-w-0'} flex flex-col order-1 lg:order-2 ${mobilePanel === 'teach' ? 'flex' : 'hidden lg:flex md:flex'} ${isImmersiveFullscreen ? 'immersive-teaching-overlay' : ''} ${immersiveDoubtOpen ? 'immersive-doubt-open' : ''}`}
                                style={isImmersiveFullscreen ? {
                                    position: 'fixed',
                                    inset: 0,
                                    zIndex: 60,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    pointerEvents: 'auto',
                                } : isMobile ? {
                                    display: mobilePanel === 'teach' ? 'flex' : 'none',
                                    pointerEvents: mobilePanel === 'teach' ? 'auto' : 'none'
                                } : {
                                    background: 'var(--teaching-panel-bg)',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    height: isStacked ? 'auto' : '100%',
                                    alignSelf: 'stretch',
                                    ...stackedPanelStyle,
                                }}
                            >
                                {/* Panel Header — hidden in immersive mode (floating toolbar replaces it) */}
                                {!isImmersiveFullscreen && (
                                <motion.div
                                    className="hidden md:flex items-center justify-center shrink-0 border-b bg-transparent relative"
                                    style={{
                                        height: centerMaximized ? '56px' : '60px',
                                        borderColor: 'var(--teaching-panel-divider)',
                                        borderRadius: centerMaximized ? 0 : 'var(--teaching-panel-radius) var(--teaching-panel-radius) 0 0',
                                        background: centerMaximized ? 'rgba(245, 244, 248, 0.97)' : undefined,
                                        backdropFilter: centerMaximized ? 'saturate(180%) blur(10px)' : undefined,
                                    }}
                                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                >
                                    {!centerMaximized && (
                                        <h2 className="text-[19px] font-medium text-[var(--teaching-panel-text)]" style={{ letterSpacing: '0.01em' }}>Teaching Panel</h2>
                                    )}
                                    <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 sm:gap-4">
                                        <div
                                            className="font-semibold tabular-nums text-[var(--teaching-panel-text)]"
                                            style={{ fontSize: centerMaximized ? '13px' : '12px', letterSpacing: centerMaximized ? '0.02em' : '0.05em' }}
                                        >
                                            {centerMaximized ? `Step ${currentStep + 1} of ${currentSession?.totalSteps || 15}` : `STEP ${currentStep + 1}/${currentSession?.totalSteps || 15}`}
                                        </div>
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                if (isImmersiveFullscreen) {
                                                    handleExitImmersive();
                                                } else {
                                                    handleEnterImmersive();
                                                }
                                            }}
                                            className={`rounded-lg transition-colors flex items-center justify-center ${centerMaximized || isImmersiveFullscreen
                                                ? 'p-2.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-[var(--teaching-panel-divider)] text-[var(--teaching-panel-text)] shadow-sm'
                                                : 'p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                                }`}
                                            whileTap={{ scale: 0.92 }}
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                                            aria-label={isImmersiveFullscreen ? 'Exit full screen' : 'Full screen'}
                                        >
                                            {isImmersiveFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-5 h-5" />}
                                        </motion.button>
                                    </div>
                                </motion.div>
                                )}

                                {/* Mobile fullscreen toggle */}
                                {isMobile && !isImmersiveFullscreen && (
                                    <div className="flex md:hidden justify-end px-3 py-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleEnterImmersive}
                                            className="touch-target flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--teaching-panel-text)] hover:bg-gray-100 dark:hover:bg-slate-800"
                                            aria-label="Enter full screen teaching mode"
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                            Fullscreen
                                        </button>
                                    </div>
                                )}

                                {/* Teaching Panel Row 2 — hidden in immersive mode */}
                                {!isImmersiveFullscreen && (
                                <div
                                    className="flex flex-row items-center justify-between gap-4 shrink-0"
                                    style={{
                                        padding: centerMaximized ? 'clamp(12px, 2vw, var(--space-lg))' : 'clamp(10px, 2vw, var(--space-md))',
                                        background: 'var(--teaching-panel-bg-alt)',
                                    }}
                                >
                                    {/* AI Smiley + Topic Name */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        {!centerMaximized && (
                                            <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] md:w-[80px] md:h-[80px] rounded-full shrink-0 flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 relative">
                                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                                    {/* Background within the circle */}
                                                </div>
                                                <div className="relative z-10 w-full h-full flex items-center justify-center">
                                                    <EmojiMascot size={90} variant="teacher" isSpeaking={isSpeaking && !isPaused} emotion={isFetchingAudio && !isSpeaking ? 'thinking' : (isSpeaking ? 'happy' : 'neutral')} />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <h1 className="text-base sm:text-lg font-semibold leading-tight truncate" style={{ color: 'var(--teaching-panel-text)' }}>
                                                {currentSession?.topicName || 'Topic'}
                                            </h1>
                                            <p className="text-xs sm:text-sm font-normal truncate" style={{ color: 'var(--teaching-panel-text-muted)' }}>
                                                {findTopicInfo(topicId).subjectName || 'Subject'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Start/Stop Listening button and Raise Doubt */}
                                    {(() => {
                                        const hasNarration = !isVideoOnlyLesson && !!currentStepData?.spokenContent;
                                        const isLivePlayback = !isVideoOnlyLesson && (isSpeaking || isFetchingAudio) && !isPaused;
                                        const showResumeListening = isPaused && hasNarration;
                                        const showStopListening = isLivePlayback;
                                        const showStartListening = !isLivePlayback && !isPaused && hasNarration;
                                        return (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRaiseDoubt()}
                                                    disabled={isInDoubtMode || !currentSession}
                                                    className={`touch-target px-4 sm:px-5 h-[40px] rounded-full flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm active:scale-95 ${!isInDoubtMode && currentSession
                                                        ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 dark:text-purple-300'
                                                        : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed opacity-60'
                                                        }`}
                                                    aria-label="Raise Doubt"
                                                    title="Pause the lesson and ask the AI teacher"
                                                >
                                                    <HelpCircle className="w-4 h-4 shrink-0" />
                                                    <span className="hidden sm:inline">{isInDoubtMode ? 'Doubt Mode' : 'Raise Doubt'}</span>
                                                </button>

                                                {!isVideoOnlyLesson && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        unlockAudioContext();
                                                        if (showStopListening) {
                                                            needsPlaybackRestartRef.current = false;
                                                            pause();
                                                            return;
                                                        }
                                                        if (showResumeListening) {
                                                            resume();
                                                            return;
                                                        }
                                                        if (showStartListening) {
                                                            needsPlaybackRestartRef.current = false;
                                                            // Clear any stale mute state so manual Start always works
                                                            if (!textToSpeechEnabled) {
                                                                updateAccessibility({ textToSpeech: true });
                                                            }
                                                            if (setIsMuted) setIsMuted(false);
                                                            setPlaybackTrigger(prev => prev + 1);
                                                        }
                                                    }}
                                                    disabled={!showStopListening && !showResumeListening && !showStartListening}
                                                    className={`touch-target px-4 sm:px-6 h-[40px] rounded-full flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${showStopListening
                                                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                        }`}
                                                    aria-label={showStopListening ? 'Stop listening' : showResumeListening ? 'Resume listening' : 'Start listening'}
                                                >
                                                    {showStopListening ? (
                                                        <>
                                                            {isFetchingAudio && !isSpeaking ? (
                                                                <svg className="h-4 w-4 shrink-0 animate-spin text-white" viewBox="0 0 40 40" fill="none" aria-hidden>
                                                                    <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="52 36" opacity="0.95" />
                                                                </svg>
                                                            ) : (
                                                                <Square className="w-4 h-4 fill-current shrink-0" />
                                                            )}
                                                            <span>{isFetchingAudio && !isSpeaking ? 'Buffering' : 'Stop Listening'}</span>
                                                        </>
                                                    ) : showResumeListening ? (
                                                        <>
                                                            <Volume2 className="w-4 h-4 shrink-0" />
                                                            <span>Resume Listening</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Volume2 className="w-4 h-4 shrink-0" />
                                                            <span>Start Listening</span>
                                                        </>
                                                    )}
                                                </button>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                                )}

                                {isImmersiveFullscreen && (() => {
                                    const hasNarration = !isVideoOnlyLesson && !!currentStepData?.spokenContent;
                                    const isLivePlayback = !isVideoOnlyLesson && (isSpeaking || isFetchingAudio) && !isPaused;
                                    const showResumeListening = isPaused && hasNarration;
                                    const showStopListening = isLivePlayback;
                                    const showStartListening = !isLivePlayback && !isPaused && hasNarration;
                                    return (
                                        <>
                                            <FloatingTeachingToolbar
                                                ref={floatingToolbarRef}
                                                visible={controlsVisible}
                                                reduceAnimations={reduceAnimations}
                                                subjectName={findTopicInfo(topicId).subjectName || 'Subject'}
                                                topicName={currentSession?.topicName || 'Topic'}
                                                currentStep={currentStep}
                                                totalSteps={currentSession?.totalSteps || 15}
                                                isInDoubtMode={isInDoubtMode}
                                                showStopListening={showStopListening}
                                                showResumeListening={showResumeListening}
                                                showStartListening={showStartListening}
                                                onRaiseDoubt={() => handleRaiseDoubt()}
                                                onPauseResume={() => {
                                                    unlockAudioContext();
                                                    if (showStopListening) {
                                                        needsPlaybackRestartRef.current = false;
                                                        pause();
                                                        return;
                                                    }
                                                    if (showResumeListening) {
                                                        resume();
                                                        return;
                                                    }
                                                    if (showStartListening) {
                                                        needsPlaybackRestartRef.current = false;
                                                        if (!textToSpeechEnabled) {
                                                            updateAccessibility({ textToSpeech: true });
                                                        }
                                                        if (setIsMuted) setIsMuted(false);
                                                        setPlaybackTrigger(prev => prev + 1);
                                                    }
                                                }}
                                                onSettings={() => {
                                                    setSettingsPopoverOpen(true);
                                                    showControls();
                                                }}
                                                onMinimize={handleExitImmersive}
                                                showListeningControls={!isVideoOnlyLesson}
                                            />
                                            <TeachingSettingsPopover
                                                open={settingsPopoverOpen}
                                                onClose={() => setSettingsPopoverOpen(false)}
                                                reduceAnimations={reduceAnimations}
                                                showCaptions={showCaptions}
                                                onShowCaptionsChange={setShowCaptions}
                                                autoPlay={autoPlayLesson}
                                                onAutoPlayChange={setAutoPlayLesson}
                                                onOpenFullSettings={() => setActiveModal('settings')}
                                                videoSoundtrackHint={isVideoOnlyLesson}
                                            />
                                        </>
                                    );
                                })()}

                                {/* Main content area — green board */}
                                <motion.div
                                    className="flex-1 flex flex-col min-h-0 relative items-center justify-center overflow-hidden"
                                    style={{
                                        padding: isImmersiveFullscreen ? 0 : centerMaximized ? '4px clamp(20px, 3vw, var(--space-xxl)) 20px' : '4px var(--space-lg) var(--space-lg) var(--space-lg)',
                                        background: isImmersiveFullscreen ? 'var(--teaching-board-bg)' : centerMaximized ? 'linear-gradient(180deg, var(--teaching-panel-bg-alt) 0%, #EEECF4 100%)' : 'var(--teaching-panel-bg-alt)',
                                    }}
                                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                >
                                    <FullscreenBoardScaler
                                        enabled={isImmersiveFullscreen}
                                        toolbarReservePx={toolbarReservePx}
                                    >
                                    <AnimatePresence mode="wait">
                                        {!currentStepData ? (
                                            <motion.div
                                                key="loader"
                                                initial={reduceAnimations ? false : { opacity: 0 }}
                                                animate={{ opacity: 0.7 }}
                                                exit={reduceAnimations ? undefined : { opacity: 0 }}
                                                transition={{ duration: reduceAnimations ? 0 : 0.2 }}
                                                className="teaching-board flex flex-col items-center justify-center shadow-lg"
                                                style={{
                                                    borderRadius: isImmersiveFullscreen && isMobile ? 8 : isImmersiveFullscreen || centerMaximized ? 16 : 'var(--teaching-board-radius)',
                                                    height: '100%',
                                                    width: '100%',
                                                    minHeight: isImmersiveFullscreen ? 0 : 'var(--teaching-board-min-height)',
                                                }}
                                            >
                                                <div className="text-center flex-1 flex items-center justify-center">
                                                    <div className="w-12 h-12 border-[6px] border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key={topicVideo ? `board-media-${topicVideo.id}` : currentStep}
                                                initial={reduceAnimations ? false : isImmersiveFullscreen ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: 4 }}
                                                animate={isImmersiveFullscreen ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                                                exit={reduceAnimations ? undefined : isImmersiveFullscreen ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: -4 }}
                                                transition={reduceAnimations ? { duration: 0 } : { duration: GREEN_BOARD_FADE_DURATION_MS / 1000, ease: 'easeInOut' }}
                                                className="flex flex-col min-h-0 w-full"
                                                style={{
                                                    height: '100%',
                                                    width: '100%',
                                                    minHeight: isImmersiveFullscreen ? 0 : 'var(--teaching-board-min-height)',
                                                }}
                                            >
                                                <motion.div
                                                    className="teaching-board flex flex-col relative overflow-hidden cursor-pointer"
                                                    onClick={() => {
                                                        if (isImmersiveFullscreen) {
                                                            showControls();
                                                            return;
                                                        }
                                                        if (isVideoOnlyLesson) return;
                                                        unlockAudioContext();
                                                        const hasNarr = !!currentStepData?.spokenContent;
                                                        const live = (isSpeaking || isFetchingAudio) && !isPaused;
                                                        const resumeEl = isPaused && hasNarr;
                                                        const startEl = !live && !isPaused && hasNarr;
                                                        if (live) {
                                                            needsPlaybackRestartRef.current = false;
                                                            pause();
                                                            toast.success('Speech stopped');
                                                        } else if (resumeEl) {
                                                            resume();
                                                            toast.success('Speech resumed');
                                                        } else if (startEl) {
                                                            needsPlaybackRestartRef.current = false;
                                                            setPlaybackTrigger(prev => prev + 1);
                                                        }
                                                    }}
                                                    style={{
                                                        borderRadius: isImmersiveFullscreen && isMobile ? 8 : isImmersiveFullscreen || centerMaximized ? 16 : 'var(--teaching-board-radius)',
                                                        boxShadow: isImmersiveFullscreen || centerMaximized ? '0 12px 48px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04)' : '0 12px 40px -8px rgba(0,0,0,0.15)',
                                                        height: '100%',
                                                        width: '100%',
                                                        minHeight: isImmersiveFullscreen ? 0 : undefined,
                                                    }}
                                                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                                >
                                                    {/* Visual content area — board shows diagram only; speech syncs via [VISUAL:...] highlights */}
                                                    <div className="flex-1 relative flex items-center justify-center min-h-0" style={{ padding: 0 }}>
                                                        <div className="relative z-10 w-full h-full">
                                                            {(() => {
                                                                if (!currentStepData || !topicId) return null;
                                                                const boardFallback = (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 rounded-2xl">
                                                                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
                                                                        <p className="text-sm text-slate-300 font-medium">Loading Interactive Visuals...</p>
                                                                    </div>
                                                                );

                                                                if (isVideoOnlyLesson) {
                                                                    if (!topicVideo) {
                                                                        return (
                                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-6 text-center bg-[#0a0e1a] rounded-2xl">
                                                                                <p className="text-base font-semibold text-white">Video unavailable</p>
                                                                                <p className="text-sm text-slate-400">
                                                                                    This lesson video could not be loaded. The file is missing from the app.
                                                                                </p>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <div className="w-full h-full">
                                                                            <Suspense fallback={boardFallback}>
                                                                                <CurriculumVideoPlayer
                                                                                    resource={topicVideo}
                                                                                    ttsLanguage={lessonTtsLanguage}
                                                                                    active={!isPaused && !isInDoubtMode}
                                                                                    onUserPlay={() => {
                                                                                        if (isSpeaking && !isPaused) pause();
                                                                                        stopDoubtSpeech();
                                                                                        if (typeof window !== 'undefined' && window.speechSynthesis) {
                                                                                            window.speechSynthesis.cancel();
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </Suspense>
                                                                        </div>
                                                                    );
                                                                }

                                                                // Topic-lock: load only visuals from Visual Registry for this topic
                                                                const visualsEntry = getVisualsForTopic(topicId);

                                                                if (!visualsEntry) {
                                                                    console.error(`Visual Registry Integrity Violation: No entry for ${topicId}. Blocking render.`);
                                                                    return (
                                                                        <div className="flex flex-col items-center justify-center p-8 text-center">
                                                                            <p className="text-white/60 font-medium italic">High-fidelity visual content is strictly required by Rule 1. This topic is currently restricted.</p>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                            {(() => {
                                                                                const isQuizStep = (currentStepData.type === 'practice' || currentStepData.type === 'assessment') && !!currentStepData.quiz;
                                                                                const showLessonVideo = Boolean(topicVideo) && boardMedia === 'video' && !isQuizStep;
                                                                                return (
                                                                                    <div className="relative w-full h-full">
                                                                                        {topicVideo && (
                                                                                            <div
                                                                                                className={showLessonVideo ? 'w-full h-full' : 'hidden'}
                                                                                                aria-hidden={!showLessonVideo}
                                                                                            >
                                                                                                <Suspense fallback={boardFallback}>
                                                                                                <CurriculumVideoPlayer
                                                                                                    resource={topicVideo}
                                                                                                    ttsLanguage={lessonTtsLanguage}
                                                                                                    active={showLessonVideo}
                                                                                                    onUserPlay={() => {
                                                                                                        if (isSpeaking && !isPaused) pause();
                                                                                                    }}
                                                                                                    onShowDiagram={() => setBoardMedia('diagram')}
                                                                                                />
                                                                                                </Suspense>
                                                                                            </div>
                                                                                        )}
                                                                                        {isQuizStep && currentStepData.quiz ? (
                                                                                            <Suspense fallback={boardFallback}>
                                                                                            <QuizVisual
                                                                                                quiz={currentStepData.quiz}
                                                                                                onComplete={(correct) => {
                                                                                                    if (correct) toast.success('Excellent!');

                                                                                                    addSession({
                                                                                                        sessionId: `session_${Date.now()}`,
                                                                                                        date: new Date().toISOString(),
                                                                                                        durationMinutes: Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 60000)),
                                                                                                        topicId: topicId || 'unknown',
                                                                                                        completionPercentage: 100,
                                                                                                        doubtsCount: currentSession?.doubts?.length || 0,
                                                                                                        quizScore: correct ? 100 : 0
                                                                                                    });
                                                                                                }}
                                                                                            />
                                                                                            </Suspense>
                                                                                        ) : !showLessonVideo ? (
                                                                                            <div className="relative w-full h-full">
                                                                                                {topicVideo && (
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => setBoardMedia('video')}
                                                                                                        className="absolute top-2 right-2 z-20 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-black/55 text-white hover:bg-black/75"
                                                                                                    >
                                                                                                        Show video
                                                                                                    </button>
                                                                                                )}
                                                                                                <Suspense fallback={boardFallback}>
                                                                                                <DiagramCanvas
                                                                                                    topicId={topicId}
                                                                                                    activeDiagramId={activeDiagramId}
                                                                                                    highlightPartId={activeHighlightPart}
                                                                                                    stepContent={currentStepData.content}
                                                                                                    stepId={currentStepData.id || ''}
                                                                                                    isSpeaking={isSpeaking && !isPaused}
                                                                                                    isPaused={isPaused}
                                                                                                />
                                                                                                </Suspense>
                                                                                            </div>
                                                                                        ) : null}
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>

                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    </FullscreenBoardScaler>
                                    {isImmersiveFullscreen && showCaptions && !isInDoubtMode && currentStepData && !isVideoOnlyLesson && (
                                        <div className="teaching-immersive-captions" aria-live="polite">
                                            <p className="teaching-immersive-captions__title">
                                                {currentStepData.title || `Step ${currentStep + 1}`}
                                            </p>
                                            <p className="teaching-immersive-captions__snippet">
                                                {hasCaption
                                                    ? captionText
                                                    : (isSpeaking || isFetchingAudio)
                                                        ? 'Listening…'
                                                        : 'Captions will follow the teacher’s voice'}
                                            </p>
                                        </div>
                                    )}

                                    {immersiveDoubtOpen && (
                                        <DoubtDrawer
                                            open
                                            isMobile={isMobile}
                                            reduceAnimations={reduceAnimations}
                                            onResumeLesson={handleResumeLesson}
                                            onClose={handleResumeLesson}
                                        >
                                            <div className="flex flex-col min-h-0 flex-1 h-full overflow-hidden">
                                                <div
                                                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 border-b"
                                                    style={{ borderColor: 'var(--teaching-panel-divider)', background: 'rgba(168, 85, 247, 0.08)' }}
                                                >
                                                    {doubtSpeaking ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => { stopDoubtSpeech(); setDoubtSpeaking(false); setSpeakingMessageId(null); }}
                                                            className="flex items-center gap-1.5 hover:opacity-80"
                                                            aria-label="Stop speaking"
                                                        >
                                                            <Volume2 className="w-4 h-4 shrink-0 animate-pulse" />
                                                            Aɪra is speaking...
                                                        </button>
                                                    ) : isListening ? (
                                                        <>
                                                            <Mic className="w-4 h-4 shrink-0 animate-pulse text-red-500" />
                                                            Listening — speak or type below
                                                        </>
                                                    ) : (
                                                        <>
                                                            <HelpCircle className="w-4 h-4 shrink-0" />
                                                            {isTeacherMode ? 'Teacher Mode — hands-free' : 'Ask your doubt below'}
                                                        </>
                                                    )}
                                                </div>
                                                <div
                                                    ref={chatScrollRef}
                                                    onScroll={handleChatScroll}
                                                    className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 sm:space-y-5 min-h-0"
                                                    style={{ padding: 'clamp(12px, 3vw, var(--space-lg))' }}
                                                >
                                                    {chatMessages.map((msg) => (
                                                        <ChatMessageBubble
                                                            key={msg.id}
                                                            message={msg}
                                                            reduceAnimations={reduceAnimations}
                                                            isSpeaking={speakingMessageId === msg.id}
                                                        />
                                                    ))}
                                                    {isChatLoading && !chatMessages.some(m => m.isStreaming) && (
                                                        <ChatThinkingIndicator />
                                                    )}
                                                </div>
                                                <div
                                                    className="shrink-0 border-t chat-input-glass"
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderColor: 'var(--teaching-panel-divider)',
                                                    }}
                                                >
                                                    <div
                                                        className="flex items-center gap-2 rounded-2xl border px-3 transition-all focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-200/60"
                                                        style={{
                                                            background: 'var(--teaching-panel-bg-alt, #f6f5fa)',
                                                            borderColor: isChatLoading ? 'var(--teaching-accent)' : 'var(--teaching-panel-divider)',
                                                            minHeight: '48px',
                                                        }}
                                                    >
                                                        {!isVideoOnlyLesson && (
                                                        <button
                                                            type="button"
                                                            onClick={() => (isListening ? stopListening() : startListening())}
                                                            disabled={isChatLoading}
                                                            className={`shrink-0 flex items-center justify-center rounded-full w-8 h-8 transition-all disabled:opacity-40 ${isListening
                                                                ? 'text-red-500 bg-red-50 dark:bg-red-900/30 animate-pulse'
                                                                : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'
                                                                }`}
                                                            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                                                        >
                                                            <Mic className="w-4 h-4" />
                                                        </button>
                                                        )}
                                                        <input
                                                            ref={chatInputRef}
                                                            type="text"
                                                            value={inputMessage}
                                                            onChange={(e) => setInputMessage(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && !attachmentStillLoading && handleSendMessage()}
                                                            placeholder={isListening ? 'Listening... speak your doubt' : isChatLoading ? 'AI is thinking...' : 'Ask your doubt — speak or type...'}
                                                            disabled={isChatLoading}
                                                            className="flex-1 min-w-0 bg-transparent border-none outline-none focus:ring-0 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 py-2 disabled:cursor-wait"
                                                            style={{ color: 'var(--teaching-panel-text)' }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSendMessage()}
                                                            disabled={isChatLoading || attachmentStillLoading || (!inputMessage.trim() && uploadedChatFiles.length === 0)}
                                                            className="shrink-0 flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                                                            style={{
                                                                width: 36,
                                                                height: 36,
                                                                background: 'var(--teaching-accent, #7c3aed)',
                                                            }}
                                                            aria-label="Send message"
                                                        >
                                                            {isChatLoading
                                                                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                                                                : <ArrowUp className="w-4 h-4 text-white" />
                                                            }
                                                        </button>
                                                        {!isVideoOnlyLesson && (
                                                        <button
                                                            type="button"
                                                            onClick={() => (isTeacherMode ? deactivateTeacherMode() : activateTeacherMode())}
                                                            disabled={!currentSession}
                                                            className={`shrink-0 flex items-center justify-center rounded-full transition-all active:scale-90 hover:scale-110 disabled:opacity-40 ${isTeacherMode ? 'ring-2 ring-purple-300' : ''}`}
                                                            style={{
                                                                width: 36,
                                                                height: 36,
                                                                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                                                            }}
                                                            aria-label={isTeacherMode ? 'Stop Interactive AI Teacher' : 'Start Interactive AI Teacher'}
                                                            aria-pressed={isTeacherMode}
                                                        >
                                                            <GraduationCap className={`w-4 h-4 text-white ${isTeacherMode ? 'animate-pulse' : ''}`} />
                                                        </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </DoubtDrawer>
                                    )}
                                </motion.div>


                                {/* Visual Feedback Overlay */}
                                <AnimatePresence>
                                    {lastUserAction && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                            className="absolute bottom-32 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900/90 text-white rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 z-50 pointer-events-none border border-white/10"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                                            <span className="text-sm font-bold capitalize">{lastUserAction.replace('-', ' ')}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Collapsed Panel Expanders (desktop/tablet only) — hidden when Studio is maximized */}
                    <AnimatePresence mode="popLayout">
                        {!isMobile && !centerPanelVisible && !centerMaximized && !rightMaximized && !chatMaximized && !isImmersiveFullscreen && (
                            <motion.div
                                layout
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 40 }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex flex-col items-center justify-center border-l border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 overflow-hidden"
                            >
                                <button
                                    onClick={() => {
                                        setCenterPanelVisible(true);
                                        setCenterMaximized(false);
                                    }}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                                    title="Expand Teaching Panel"
                                >
                                    <ChevronRight className="w-5 h-5 shrink-0" />
                                </button>
                                <span className="text-xs text-gray-500 dark:text-gray-400 writing-mode-vertical mt-2 whitespace-nowrap font-bold uppercase tracking-widest">Teaching</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══════════════════════ STUDIO PANEL (Right — 22%) ═══════════════════════ */}
                    {/* Positioned bottom in tablet stack (order-3) */}
                    <AnimatePresence mode="popLayout">
                        {rightPanelVisible && (
                            <motion.div
                                layout
                                initial={isMobile ? { opacity: 0 } : { opacity: 0, flex: '0 0 0px' }}
                                animate={isMobile ? { opacity: mobilePanel === 'studio' ? 1 : 0 } : { 
                                    opacity: (centerMaximized || chatMaximized || isImmersiveFullscreen) ? 0 : 1,
                                    flex: panelFlex(centerMaximized || chatMaximized || isImmersiveFullscreen, rightMaximized, centerPanelVisible ? '22 22 0%' : '75 75 0%'),
                                    borderRadius: rightMaximized ? 0 : 20,
                                    boxShadow: rightMaximized ? 'none' : 'var(--teaching-panel-shadow)',
                                }}
                                exit={isMobile ? { opacity: 0 } : { opacity: 0, flex: '0 0 0px' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 300, duration: reduceAnimations ? 0 : 0.3 }}
                                className={`${isMobile ? 'absolute inset-0 w-full h-full' : 'relative min-w-0'} flex flex-col z-30 lg:z-auto order-3 ${mobilePanel === 'studio' ? 'flex' : 'hidden lg:flex md:flex'}`}
                                style={isMobile ? {
                                    display: mobilePanel === 'studio' ? 'flex' : 'none',
                                    pointerEvents: mobilePanel === 'studio' ? 'auto' : 'none'
                                } : {
                                    background: 'var(--teaching-panel-bg)',
                                    overflow: 'hidden',
                                    alignSelf: 'stretch',
                                    ...stackedPanelStyle,
                                }}
                            >
                                {/* Panel Header — centered title; relative so maximize button positions correctly */}
                                <div
                                    className="hidden md:flex items-center justify-center shrink-0 border-b bg-transparent relative"
                                    style={{
                                        height: rightMaximized ? '56px' : '60px',
                                        borderColor: 'var(--teaching-panel-divider)',
                                        borderRadius: rightMaximized ? 0 : 'var(--teaching-panel-radius) var(--teaching-panel-radius) 0 0',
                                        background: rightMaximized ? 'var(--teaching-header-bg)' : undefined,
                                        backdropFilter: rightMaximized ? 'saturate(180%) blur(10px)' : undefined,
                                    }}
                                >
                                    {!rightMaximized && (
                                        <h2 className="text-[19px] font-medium text-[var(--teaching-panel-text)]" style={{ letterSpacing: '0.01em' }}>Studio Panel</h2>
                                    )}
                                    {!isMobile && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <motion.button
                                                type="button"
                                                onClick={() => {
                                                    if (rightMaximized) {
                                                        setRightMaximized(false);
                                                    } else {
                                                        setRightMaximized(true);
                                                        setCenterMaximized(false);
                                                        setChatMaximized(false);
                                                    }
                                                }}
                                                className={`rounded-lg transition-colors flex items-center justify-center touch-target min-w-[44px] min-h-[44px] ${rightMaximized
                                                    ? 'p-2.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-[var(--teaching-panel-divider)] text-[var(--teaching-panel-text)] shadow-sm'
                                                    : 'p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600'
                                                    }`}
                                                whileTap={{ scale: 0.92 }}
                                                whileHover={{ scale: 1.02 }}
                                                transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                                                aria-label={rightMaximized ? 'Exit full screen' : 'Full screen'}
                                                title={rightMaximized ? 'Exit full screen' : 'Full screen'}
                                            >
                                                {rightMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                            </motion.button>
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar tools list or Viewer */}
                                <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[var(--teaching-panel-bg-alt)] dark:bg-slate-950/20">
                                    {studioInViewer ? (
                                        // Active Viewer Mode - Full Panel
                                        <div className="flex-1 flex flex-col min-h-0">
                                            {/* Viewer Sub-header */}
                                            <div className="px-4 py-3 border-b flex items-center justify-between bg-white/50 dark:bg-slate-900/60 backdrop-blur-sm" style={{ borderColor: 'var(--teaching-panel-divider)' }}>
                                                <button
                                                    onClick={() => setStudioInViewer(false)}
                                                    className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-300 hover:text-[var(--teaching-accent)] transition-colors"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                    Back to Tools
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                                                        {activeStudioTab === 'notes' ? 'Notes' :
                                                            activeStudioTab === 'map' ? 'Mind Map' :
                                                                activeStudioTab === 'flashcards' ? 'Flashcards' :
                                                                    activeStudioTab === 'quiz' ? 'Quiz' : 'Summary'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Viewer Content — scroll only inside the tool viewer, keep footers reachable */}
                                            <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-0 sm:p-0">
                                                <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}>
                                                    {activeStudioTab === 'notes' && sessionNotes.length > 0 && (
                                                        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                                                            <NotesViewer note={sessionNotes[sessionNotes.length - 1]} />
                                                        </div>
                                                    )}
                                                    {activeStudioTab === 'map' && sessionMindMaps.length > 0 && (
                                                        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                                                            <MindMapViewer mindMap={sessionMindMaps[sessionMindMaps.length - 1]} />
                                                        </div>
                                                    )}
                                                    {activeStudioTab === 'flashcards' && sessionFlashcards.length > 0 && (
                                                        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                                                            <FlashcardViewer flashcards={sessionFlashcards} topicName={currentSession?.topicName || 'Topic'} onPerformanceUpdate={updateFlashcardPerformance} />
                                                        </div>
                                                    )}
                                                    {activeStudioTab === 'quiz' && (
                                                        // Absolute fill pins the viewer to the panel box, so its sticky
                                                        // footer (Next / Finish) can never be pushed out of view.
                                                        <div className="relative flex-1 min-h-0">
                                                          <div className="absolute inset-0 flex flex-col">
                                                            <QuizViewer
                                                                topic={currentSession?.topicName || 'General'}
                                                                subjectArea={topicInfo.subjectArea || 'General'}
                                                                gradeLevel={topicInfo.gradeLevel || 'School'}
                                                                topicDescription={topicInfo.topicDescription}
                                                                chapterName={topicInfo.chapterName}
                                                                subjectDescription={topicInfo.subjectDescription}
                                                                lessonContent={currentSession?.teachingSteps?.map(s => s.content || '').filter(Boolean) || []}
                                                                onBack={() => setStudioInViewer(false)}
                                                                onProgress={setQuizProgress}
                                                                onComplete={(score: number) => {
                                                                    setCompletedQuizCount(prev => prev + 1);
                                                                    setLastQuizScore(score);
                                                                    // Log full studio quiz to analytics
                                                                    addSession({
                                                                        sessionId: `studio_quiz_${Date.now()}`,
                                                                        date: new Date().toISOString(),
                                                                        durationMinutes: Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 60000)),
                                                                        topicId: topicId || 'unknown',
                                                                        completionPercentage: 100,
                                                                        doubtsCount: currentSession?.doubts?.length || 0,
                                                                        quizScore: score
                                                                    });
                                                                }}
                                                            />
                                                          </div>
                                                        </div>
                                                    )}
                                                    {activeStudioTab === 'summary' && sessionSummaries.length > 0 && (
                                                        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                                                            <SummaryViewer summary={sessionSummaries[sessionSummaries.length - 1]} />
                                                        </div>
                                                    )}
                                                </Suspense>
                                            </div>
                                        </div>
                                    ) : (
                                        <StudioPanel
                                            tools={studioTools}
                                            featuredTool={studioFeaturedTool}
                                            activeToolId={activeStudioTab}
                                            onToolClick={handleStudioToolClick}
                                            onFeaturedCta={() => handleStudioToolClick('quiz')}
                                            generatingToolId={generatingToolId}
                                            wide={rightMaximized}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Collapsed Right Panel Expander (desktop/tablet only) — hidden when teaching is maximized */}
                    <AnimatePresence>
                        {!isMobile && !rightPanelVisible && !rightMaximized && !centerMaximized && !chatMaximized && !isImmersiveFullscreen && (
                            <motion.div
                                layout
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 40 }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex flex-col items-center justify-center border-l border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 overflow-hidden"
                            >
                                <button
                                    onClick={() => {
                                        setRightPanelVisible(true);
                                        setRightMaximized(false);
                                    }}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-600 dark:text-slate-400 shrink-0"
                                    title="Expand Studio Panel"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-xs text-gray-500 dark:text-slate-400 writing-mode-vertical mt-2 font-bold uppercase tracking-widest whitespace-nowrap">Studio</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>

            {/* Verification Quiz Modal */}
            <AnimatePresence>
                {showVerificationQuiz && currentQuiz && (() => {
                    const quizNode = (
                    <Suspense fallback={null}>
                        <VerificationQuiz
                            quiz={currentQuiz}
                            overlayMode={isImmersiveFullscreen ? 'absolute' : 'fixed'}
                            onComplete={() => {
                                if (activeDoubt) {
                                    confirmUnderstanding(activeDoubt.id);
                                }
                                // Log verification quiz success to analytics
                                addSession({
                                    sessionId: `vquiz_${Date.now()}`,
                                    date: new Date().toISOString(),
                                    durationMinutes: Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 60000)),
                                    topicId: topicId || 'unknown',
                                    completionPercentage: 100,
                                    doubtsCount: currentSession?.doubts?.length || 0,
                                    quizScore: 100 // Verification completion implies success
                                });
                                resume();
                            }}
                            onSkip={() => {
                                hideQuiz();
                                resume();
                            }}
                        />
                    </Suspense>
                    );
                    if (isImmersiveFullscreen && immersiveOverlayRef.current) {
                        return createPortal(quizNode, immersiveOverlayRef.current);
                    }
                    return quizNode;
                })()}
            </AnimatePresence>

            {/* Modal Overlays — settings portal into immersive overlay so browser fullscreen keeps them visible */}
            {activeModal === 'settings' && (() => {
                const settingsModal = (
                    <div className="absolute inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto w-full h-full flex flex-col">
                        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-purple-600" /></div>}>
                            <SettingsPage onClose={() => setActiveModal('none')} />
                        </Suspense>
                    </div>
                );
                if (isImmersiveFullscreen && immersiveOverlayRef.current) {
                    return createPortal(settingsModal, immersiveOverlayRef.current);
                }
                return (
                    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto w-full h-full flex flex-col">
                        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-purple-600" /></div>}>
                            <SettingsPage onClose={() => setActiveModal('none')} />
                        </Suspense>
                    </div>
                );
            })()}
            {activeModal === 'profile' && (
                <div
                    className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto overscroll-contain w-full h-full flex flex-col"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-purple-600" /></div>}>
                        <ProfilePage onClose={() => setActiveModal('none')} />
                    </Suspense>
                </div>
            )}
        </div>
    );
}
