import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useTeachingStore } from '../stores/teachingStore';
import { useSettingsStore, DEFAULT_TTS_LANGUAGE } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { getCourseContent, clearGeneratedCourseCache } from '../data/courseRegistry';
import { findTopicInfo, formatTopicName } from '../utils/topicUtils';
import { fetchGreetingAudio, clearLessonMemoryCacheForTopic } from '../services/cachedLessonService';
import { normalizeTeachingStyle, type ContentStatus } from '../types/contentPipeline';
import { emitVisualMarker, ensureSegmentHasVisual, validateSessionVisuals, extractMarkerIdsFromSteps } from '../utils/visualSyncEngine';
import { getVisualsForTopic, validateTopicVisualsForPublish } from '../data/visualRegistry';
import { getTopicVideoResource, isVideoOnlyTopic } from '../services/curriculumVideoService';
import { preloadService } from '../utils/visualPreloadService';
import { studentRoutes } from '../utils/routes';
import { toast } from '../stores/toastStore';
import type { Question } from '../data/competitiveQuestions';
import type { TeachingSession, Topic } from '../types';
import { analytics } from '../services/analyticsService';
import type { ContentSource, CacheStatus } from '../services/analyticsTypes';
import { coerceTtsLanguage, ttsLanguageLabel } from '../constants/ttsLanguages';
import { clearVoiceCache } from './useSpeech';

/** Theme passed via router state (icon omitted for structured clone). */
type SerializableCompetitiveTheme = {
    color: string;
    bgColor: string;
    gradient: string;
    bgImage: string;
};

export type LessonContentPhase = 'idle' | 'loading' | 'ready' | 'preparing' | 'failed';

export interface LessonContentState {
    phase: LessonContentPhase;
    topicName?: string;
    status?: ContentStatus;
    message?: string;
}

const INITIAL_LESSON_CONTENT: LessonContentState = { phase: 'loading' };

/** Survives StrictMode remount — one preparing toast per topic+status per tab session */
const preparingToastShown = new Set<string>();

export function useSessionControl(topicId: string | undefined) {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        currentSession,
        startSession,
    } = useTeachingStore(useShallow(state => ({
        currentSession: state.currentSession,
        startSession: state.startSession,
    })));

    const { settings } = useSettingsStore(useShallow(state => ({ settings: state.settings })));
    const { user } = useAuthStore(useShallow(state => ({ user: state.user })));
    const { profile } = useUserStore(useShallow(state => ({ profile: state.profile })));

    const teachingStyle = normalizeTeachingStyle(profile?.learningPreferences?.teachingStyle);

    const [topicUnavailable, setTopicUnavailable] = useState(false);
    /** Heavy visual preload is fire-and-forget after startSession; keep flag for TeachingPage gate compatibility. */
    const isPreloading = false;
    const [lessonContentState, setLessonContentState] = useState<LessonContentState>(INITIAL_LESSON_CONTENT);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    const initGenRef = useRef(0);
    const greetingAudioRef = useRef<HTMLAudioElement | null>(null);
    const prevLanguageRef = useRef<string | null>(null);
    const [teachingHydrated, setTeachingHydrated] = useState(() =>
        typeof useTeachingStore.persist?.hasHydrated === 'function'
            ? useTeachingStore.persist.hasHydrated()
            : true,
    );

    useEffect(() => {
        if (useTeachingStore.persist.hasHydrated()) {
            setTeachingHydrated(true);
            return;
        }
        return useTeachingStore.persist.onFinishHydration(() => {
            setTeachingHydrated(true);
        });
    }, []);

    const retryLoad = useCallback(() => {
        if (!topicId) return;
        clearLessonMemoryCacheForTopic(topicId);
        setIsRetrying(true);
        setLessonContentState({ phase: 'loading' });
        setRetryCount((c) => c + 1);
    }, [topicId]);

    useEffect(() => {
        if (!teachingHydrated) return;

        const initGen = ++initGenRef.current;
        const isInitStale = () => initGen !== initGenRef.current;

        const init = async () => {
            if (!topicId) {
                toast.warning('No topic selected. Redirecting to dashboard...');
                navigate(studentRoutes.dashboard, { replace: true });
                return;
            }

            const targetLanguage = coerceTtsLanguage(settings.accessibility?.ttsLanguage || DEFAULT_TTS_LANGUAGE);
            const videoOnly = isVideoOnlyTopic(topicId);
            if (
                prevLanguageRef.current != null &&
                prevLanguageRef.current !== targetLanguage &&
                !videoOnly
            ) {
                clearGeneratedCourseCache();
                clearVoiceCache();
                toast.info(`Rebuilding lesson in ${ttsLanguageLabel(targetLanguage)}…`, 4000);
            }
            prevLanguageRef.current = targetLanguage;

            // Video-only: Language only swaps the MP4 soundtrack. Do not remount the
            // session, restart TTS, or flash the loading board.
            if (videoOnly && currentSession?.topicId === topicId && currentSession.teachingSteps?.length) {
                if (currentSession.teachingSteps.some((s) => s.spokenContent)) {
                    useTeachingStore.setState({
                        currentSession: {
                            ...currentSession,
                            teachingSteps: currentSession.teachingSteps.map((s) => ({ ...s, spokenContent: '' })),
                        },
                    });
                }
                setLessonContentState({ phase: 'ready' });
                setTopicUnavailable(false);
                setIsRetrying(false);
                return;
            }

            setLessonContentState({ phase: 'loading' });
            setTopicUnavailable(false);

            const stateData = location.state as
                | { competitiveQuestion?: Question; theme?: SerializableCompetitiveTheme }
                | undefined;

            // Competitive Intercept
            if (stateData?.competitiveQuestion && topicId?.startsWith('competitive-')) {
                const question = stateData.competitiveQuestion;
                setTopicUnavailable(false);
                setLessonContentState({ phase: 'ready' });

                const steps = (question.explanation || '').split('\n').filter((s: string) => s.trim().length > 0);
                const formattedExplanation = steps.length > 0
                    ? steps.map((s: string, i: number) => `**Step ${i + 1}:** ${s.trim()}`).join('\n\n')
                    : (question.explanation || '');

                const teachingSteps = [
                    {
                        id: `step-${question.id}-concept`,
                        stepNumber: 1,
                        title: 'Concept Overview',
                        content: `### Topic: ${question.topic}\n\nThis problem tests your understanding of **${question.topic}**.\n\nLet us understand the key concept before solving the problem step-by-step.`,
                        spokenContent: `Hello! Today we are going to solve a ${question.difficulty} level question on the topic of ${question.topic}. Let me first explain the key concept behind this problem.`,
                        visualType: 'text' as const,
                        visualDomain: 'competitive',
                        durationSeconds: 60,
                        completed: false,
                        complexity: 'intermediate' as const
                    },
                    {
                        id: `step-${question.id}-solution`,
                        stepNumber: 2,
                        title: 'Step-by-Step Solution',
                        content: `### Question:\n${question.text}\n\n---\n\n### Solution:\n${formattedExplanation}`,
                        spokenContent: `Now let us solve the problem step by step. The question asks: ${question.text}. ${steps.length > 0 ? steps.join('. ') : (question.explanation || '')}`,
                        visualType: 'text' as const,
                        visualDomain: 'competitive',
                        durationSeconds: 120,
                        completed: false,
                        complexity: question.difficulty === 'Hard' ? 'advanced' as const : (question.difficulty === 'Medium' ? 'intermediate' as const : 'basic' as const)
                    },
                    {
                        id: `step-${question.id}-answer`,
                        stepNumber: 3,
                        title: 'Final Answer & Verification',
                        content: `### All Options:\n${question.options.map((opt: string, idx: number) => `**${String.fromCharCode(65 + idx)}.** ${opt}`).join('\n')}\n\n---\n\n### ✅ Correct Answer: **${String.fromCharCode(65 + question.correctAnswer)}. ${question.options[question.correctAnswer]}**`,
                        spokenContent: `Now let us verify the answer. The correct answer is Option ${String.fromCharCode(65 + question.correctAnswer)}: ${question.options[question.correctAnswer]}.`,
                        visualType: 'text' as const,
                        visualDomain: 'competitive',
                        durationSeconds: 45,
                        completed: false,
                        complexity: 'basic' as const
                    }
                ];

                startSession({
                    id: 'session_' + Date.now(),
                    userId: user?.id || 'user_1',
                    topicId: topicId,
                    topicName: `${question.topic} – Competitive Q&A`,
                    startTime: new Date().toISOString(),
                    status: 'active',
                    currentStep: 0,
                    totalSteps: teachingSteps.length,
                    progress: 0,
                    teachingSteps: teachingSteps,
                    doubts: [],
                    language: targetLanguage,
                });
                setIsRetrying(false);
                return;
            }

            // Resume only when cached session matches language + style (re-fetch if was curated/default)
            if (
                currentSession?.topicId === topicId &&
                currentSession.contentSource === 'cached' &&
                currentSession.language === targetLanguage &&
                (currentSession.teachingStyle || 'friendly') === teachingStyle
            ) {
                setLessonContentState({ phase: 'ready' });
                setIsRetrying(false);
                return;
            }

            if (currentSession?.topicId === topicId) {
                clearLessonMemoryCacheForTopic(topicId);
            }

            const topicContext = findTopicInfo(topicId);
            const registryEntry = getVisualsForTopic(topicId);
            const topicVideo = getTopicVideoResource(topicId);

            if (!topicContext.topic || (!registryEntry && !topicVideo)) {
                setTopicUnavailable(true);
                setLessonContentState({ phase: 'idle' });
                setIsRetrying(false);
                return;
            }

            const topicName = topicContext.topic.name || formatTopicName(topicId || '');
            const topicDescription = (topicContext.topic as Topic)?.description;
            const subjectArea = topicContext.subjectName;
            const streamName = topicContext.streamName;
            const topicDomain = registryEntry?.domain;

            const { getLessonPosition, clearLessonPosition } = useTeachingStore.getState();
            const savedPos = getLessonPosition(topicId);

            // Warm visuals in parallel with content fetch (cuts serial wait).
            // Video-only lessons use the MP4 as the visual — skip SVG preload.
            const warmPromise = videoOnly
                ? Promise.resolve({ success: true, componentKey: null })
                : preloadService.warmUpVisuals(topicId).catch(() => ({ success: false, componentKey: null }));

            const courseResult = await getCourseContent(
                topicId,
                topicName,
                topicDescription,
                subjectArea || undefined,
                topicContext.chapterName,
                streamName || undefined,
                targetLanguage,
                teachingStyle,
                savedPos?.contentVersion,
            );

            await warmPromise;

            if (isInitStale()) return;

            let teachingSteps = courseResult.steps || [];
            const contentSource = courseResult.source;
            const cachedSegments = courseResult.cachedLesson?.segments;
            const contentVersion = courseResult.contentVersion;
            const cachedStatus = courseResult.cachedLesson?.status;

            // Gate only when there are no teachable steps (FAILED with no curated/default).
            // PENDING topics with curated/default fallback continue into the Teaching Page.
            if (teachingSteps.length === 0) {
                if (cachedStatus === 'FAILED') {
                    setLessonContentState({
                        phase: 'failed',
                        topicName,
                        status: cachedStatus,
                        message: courseResult.cachedLesson?.message
                            ?? 'Curriculum content generation failed. Please try again later.',
                    });
                } else {
                    setLessonContentState({
                        phase: 'preparing',
                        topicName,
                        status: cachedStatus ?? 'PENDING',
                        message: courseResult.cachedLesson?.message
                            ?? 'Content is being prepared. Please try again shortly.',
                    });
                    const toastKey = `${topicId}:${cachedStatus ?? 'empty'}`;
                    if (!preparingToastShown.has(toastKey)) {
                        preparingToastShown.add(toastKey);
                        toast.info('Lesson content is not available yet. Please try again shortly.', 6000);
                    }
                }
                analytics.topicOpenFailed(topicId, cachedStatus || 'empty');
                analytics.cacheMiss(topicId, (cachedStatus as CacheStatus) || 'UNKNOWN');
                setIsRetrying(false);
                return;
            }

            const source = (contentSource || 'default') as ContentSource;
            if (source === 'cached') {
                analytics.cacheHit(topicId, (cachedStatus as CacheStatus) || 'READY');
            } else {
                analytics.cacheMiss(topicId, (cachedStatus as CacheStatus) || 'UNKNOWN');
            }
            analytics.contentLoaded({
                topicId,
                contentSource: source,
                cacheStatus: (cachedStatus as CacheStatus) || undefined,
                language: targetLanguage,
                teachingStyle,
                contentVersion,
            });
            analytics.topicOpenSuccess(topicId);
            analytics.lessonStarted({
                topicId,
                contentSource: source,
                language: targetLanguage,
                teachingStyle,
                contentVersion,
            });

            setLessonContentState({ phase: 'ready', topicName });

            const positionValid =
                savedPos &&
                savedPos.style === teachingStyle &&
                savedPos.language === targetLanguage &&
                savedPos.contentVersion === contentVersion;
            if (savedPos && !positionValid) {
                clearLessonPosition(topicId);
            }
            const isMidLessonResume = Boolean(positionValid && (savedPos!.segmentIndex > 0 || savedPos!.audioPosition > 0));

            const cachedRegistryVersion = courseResult.cachedLesson?.visualRegistry?.visualRegistryVersion;
            const liveRegistryVersion = registryEntry?.visual_version ?? 1;
            if (
                contentSource === 'cached' &&
                cachedRegistryVersion != null &&
                cachedRegistryVersion !== liveRegistryVersion
            ) {
                clearLessonPosition(topicId);
            }

            teachingSteps = teachingSteps.map(step => ({ ...step, visualDomain: topicDomain }));

            // Profession enhancement
            const userProfession = profile?.profession?.name;
            if (!videoOnly && userProfession && teachingSteps.length > 0) {
                const welcomeStep = teachingSteps[0];
                if (welcomeStep && welcomeStep.id.includes('intro')) {
                    const professionText = `As someone in ${userProfession}, you'll find this particularly relevant.`;
                    teachingSteps[0] = {
                        ...welcomeStep,
                        content: `${welcomeStep.content}\n\n${professionText}`,
                        spokenContent: `${welcomeStep.spokenContent} ${professionText}`,
                    };
                }
            }

            // Teachable steps required — do not inject placeholder defaultSteps here
            if (teachingSteps.length === 0) {
                setLessonContentState({
                    phase: 'failed',
                    topicName,
                    message: 'Unable to prepare a teaching lesson for this topic. Please try again.',
                });
                setIsRetrying(false);
                return;
            }

            if (!videoOnly) {
                teachingSteps = teachingSteps.map((step, i) => ensureSegmentHasVisual(step, topicId || '', i));

                validateSessionVisuals({
                    id: 'preview',
                    userId: user?.id || 'user_1',
                    topicId: topicId || '',
                    topicName: topicName || '',
                    startTime: new Date().toISOString(),
                    status: 'active',
                    currentStep: 0,
                    totalSteps: teachingSteps.length,
                    progress: 0,
                    teachingSteps,
                    doubts: [],
                });

                const markerIds = extractMarkerIdsFromSteps(teachingSteps);
                if (registryEntry) {
                    validateTopicVisualsForPublish(registryEntry, markerIds);
                }
            }

            const finalSession: TeachingSession = {
                id: 'session_' + Date.now(),
                userId: user?.id || 'user_1',
                topicId: topicId,
                topicName: topicName,
                startTime: new Date().toISOString(),
                status: 'active',
                currentStep: 0,
                totalSteps: teachingSteps.length,
                progress: 0,
                teachingSteps: teachingSteps,
                doubts: [],
                language: targetLanguage,
                teachingStyle,
                contentVersion,
                cachedSegments,
                contentSource,
            };

            if (isInitStale()) return;

            if (isMidLessonResume && savedPos?.highlightTarget) {
                emitVisualMarker(savedPos.highlightTarget);
            }

            const sessionAlreadyActive = () => {
                const live = useTeachingStore.getState().currentSession;
                return (
                    live?.topicId === topicId &&
                    live?.language === targetLanguage &&
                    (live?.teachingStyle || 'friendly') === teachingStyle &&
                    live?.contentSource === contentSource &&
                    (live?.contentVersion ?? 1) === (contentVersion ?? 1)
                );
            };

            // Show Teaching Page ASAP — do not block on greeting or heavy preload
            if (!sessionAlreadyActive()) startSession(finalSession);
            if (!videoOnly && registryEntry) {
                void preloadService.preloadPriorityVisuals(registryEntry, 1).catch(() => undefined);
            }

            if (!isInitStale()) {
                setLessonContentState({ phase: 'ready' });
                setIsRetrying(false);
            }

            // Greeting only when there is no READY lesson audio (avoids racing / stealing autoplay gesture)
            const hasReadyLessonAudio = Boolean(
                courseResult.cachedLesson?.segments?.some(
                    (s) => s.status === 'READY' && s.audioUrl && s.narration?.trim(),
                ),
            );
            if (
                !videoOnly &&
                contentSource === 'cached' &&
                courseResult.cachedLesson?.greetingTemplate &&
                !isMidLessonResume &&
                !hasReadyLessonAudio
            ) {
                const firstName = profile?.name?.split(/\s+/)[0] || 'there';
                void (async () => {
                    try {
                        const greeting = await fetchGreetingAudio(firstName, targetLanguage, teachingStyle);
                        if (isInitStale() || !greeting) return;
                        if (greeting.audioUrl) {
                            const audio = new Audio(greeting.audioUrl);
                            greetingAudioRef.current = audio;
                            await audio.play().catch(() => undefined);
                        } else if (greeting.text && typeof window !== 'undefined' && window.speechSynthesis) {
                            const utter = new SpeechSynthesisUtterance(greeting.text);
                            window.speechSynthesis.speak(utter);
                        }
                    } catch {
                        /* ignore greeting errors */
                    }
                })();
            }
        };

        init();

        return () => {
            initGenRef.current++;
            if (greetingAudioRef.current) {
                greetingAudioRef.current.pause();
                greetingAudioRef.current.removeAttribute('src');
                greetingAudioRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- topic + TTS language + navigation state drive session bootstrap
    }, [topicId, settings.accessibility?.ttsLanguage, profile?.learningPreferences?.teachingStyle, location.state?.competitiveQuestion?.id, location.state?.theme?.color, retryCount, teachingHydrated]);

    return { topicUnavailable, isPreloading, lessonContentState, retryLoad, isRetrying };
}
