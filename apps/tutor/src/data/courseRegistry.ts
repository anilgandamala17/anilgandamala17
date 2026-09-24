import { TeachingStep } from '@/types';
import { defaultSteps } from './courses/defaultCourse';
import { mitochondriaGrade11Steps } from './courses/mitochondriaGrade11';
import {
    biology11CellMembraneSteps,
    biology11ChloroplastSteps,
    biology11ProkaryoticCellSteps,
} from './courses/biology11CellOrganellesSync';
import {
    biology12DnaStructureSteps,
    biology12MendelismSteps,
} from './courses/biology12GeneticsSync';
import {
    biology12EmbryogenesisSteps,
    biology12FertilizationSteps,
    biology12SexualReproductionSteps,
} from './courses/biology12ReproductionSync';
import { generateComprehensiveCourse } from '@/services/contentGenerator';
import {
    fetchCachedLessonDetailed,
    cachedSegmentsToSpokenContent,
    type CacheFetchFailureReason,
} from '@/services/cachedLessonService';
import type { CachedLessonPayload } from '@/types/contentPipeline';
import { USE_CACHED_CURRICULUM, normalizeTeachingStyle } from '@/types/contentPipeline';
import { getVisualsForTopic } from './visualRegistry';
import { isVideoOnlyTopic } from './curriculumVideoResources';
import { coerceTtsLanguage, isEnglishTtsLanguage } from '../constants/ttsLanguages';

export interface CourseContentResult {
    steps: TeachingStep[];
    cachedLesson?: CachedLessonPayload;
    source: 'cached' | 'curated' | 'ai' | 'default';
    contentVersion?: number;
    cacheFallbackReason?: CacheFetchFailureReason;
}

const CURATED_TOPICS: Record<string, TeachingStep[]> = {
    'bio-11-8-mitochondria': mitochondriaGrade11Steps,
    'bio-12-1-sexual-reproduction': biology12SexualReproductionSteps,
    'bio-12-1-fertilization': biology12FertilizationSteps,
    'bio-12-1-embryogenesis': biology12EmbryogenesisSteps,
    'bio-11-8-chloroplast': biology11ChloroplastSteps,
    'bio-11-8-prokaryotic-cell': biology11ProkaryoticCellSteps,
    'bio-11-8-cell-membrane': biology11CellMembraneSteps,
    'bio-12-2-mendelism': biology12MendelismSteps,
    'bio-12-2-dna-structure': biology12DnaStructureSteps,
};

/** Kill-switch: only skip runtime AI when explicitly set to 'false'. */
function isRuntimeAiAllowed(): boolean {
    return import.meta.env.VITE_ALLOW_RUNTIME_AI !== 'false';
}

function logSilentFallback(
    topicId: string,
    reason: CacheFetchFailureReason,
    source: 'curated' | 'ai' | 'default',
): void {
    if (!import.meta.env.DEV) return;
    console.info(`[courseRegistry] Cache not READY (${reason}) — using ${source} content for ${topicId}`);
}

async function tryGenerateAiCourse(
    topicId: string,
    topicName: string | undefined,
    description: string | undefined,
    subjectArea: string | undefined,
    chapterName: string | undefined,
    gradeName: string | undefined,
    language: string,
    style: string,
    reason: CacheFetchFailureReason,
): Promise<CourseContentResult | null> {
    if (!topicName || !isRuntimeAiAllowed()) return null;
    if (!getVisualsForTopic(topicId)) return null;

    const cacheKey = `${topicId}:${language}:${style}`;
    if (generatedCourseCache.has(cacheKey)) {
        logSilentFallback(topicId, reason, 'ai');
        return { steps: generatedCourseCache.get(cacheKey)!, source: 'ai', cacheFallbackReason: reason };
    }

    try {
        const generatedSteps = await generateComprehensiveCourse(
            topicId,
            topicName,
            description,
            subjectArea,
            chapterName,
            gradeName,
            language,
        );
        if (generatedSteps?.length) {
            generatedCourseCache.set(cacheKey, generatedSteps);
            logSilentFallback(topicId, reason, 'ai');
            return { steps: generatedSteps, source: 'ai', cacheFallbackReason: reason };
        }
    } catch (error) {
        console.error(`[courseRegistry] AI generation failed for ${topicId}:`, error);
    }
    return null;
}

function lastResortDefault(topicId: string, reason: CacheFetchFailureReason): CourseContentResult {
    if (import.meta.env.DEV && CURATED_TOPICS[topicId]) {
        console.error(
            `[courseRegistry] BUG: curated topic ${topicId} fell through to defaultSteps — check routing/topicId`,
        );
    }
    logSilentFallback(topicId, reason, 'default');
    return { steps: defaultSteps, source: 'default', cacheFallbackReason: reason };
}

/**
 * English curated scripts only — never serve them when the learner asked for Indic speech.
 */
function curatedIfEnglish(language: string, curated: TeachingStep[] | undefined): TeachingStep[] | null {
    if (!curated || !isEnglishTtsLanguage(language)) return null;
    return curated;
}

/**
 * Gets course content for a topic.
 * Cache-first: READY Firestore → curated (English only) → runtime AI → default last resort.
 * Indic languages skip curated English so TTS receives native-script spokenContent.
 */
export const getCourseContent = async (
    topicId: string,
    topicName?: string,
    description?: string,
    subjectArea?: string,
    chapterName?: string,
    gradeName?: string,
    targetLanguage?: string,
    teachingStyle?: string,
    contentVersion?: number,
): Promise<CourseContentResult> => {
    const style = normalizeTeachingStyle(teachingStyle);
    const language = coerceTtsLanguage(targetLanguage);
    const curated = CURATED_TOPICS[topicId];
    // Video-only lessons keep the original MP4 + empty narration in every language.
    // Do not swap in cached/AI scripts (those would re-enable TTS / [VISUAL:] SVG).
    if (isVideoOnlyTopic(topicId) && curated?.length) {
        return {
            steps: curated.map((step) => ({ ...step, spokenContent: '' })),
            source: 'curated',
        };
    }
    const englishCurated = curatedIfEnglish(language, curated);

    const tryAi = (reason: CacheFetchFailureReason) =>
        tryGenerateAiCourse(
            topicId, topicName, description, subjectArea, chapterName, gradeName, language, style, reason,
        );

    // 1. Cache-first persistent content
    if (USE_CACHED_CURRICULUM) {
        try {
            const fetchResult = await fetchCachedLessonDetailed(topicId, language, style, contentVersion);
            const cached = fetchResult.lesson;
            const reason = fetchResult.failureReason ?? 'cache-miss';

            if (cached?.status === 'READY' && cached.steps?.length) {
                const spokenFromSegments = cachedSegmentsToSpokenContent(cached.segments);
                const masterStep = cached.steps[0];
                const steps: TeachingStep[] = [{
                    ...masterStep,
                    id: masterStep.id || `${topicId}-cached-master`,
                    stepNumber: 1,
                    title: masterStep.title || topicName || topicId,
                    spokenContent: spokenFromSegments || masterStep.spokenContent,
                    visualType: (masterStep.visualType as TeachingStep['visualType']) || 'diagram',
                    completed: false,
                }] as TeachingStep[];
                return {
                    steps,
                    cachedLesson: cached,
                    source: 'cached',
                    contentVersion: cached.contentVersion,
                };
            }

            // Not READY / miss: English may use curated; Indic must use AI (or empty preparing).
            if (cached && cached.status !== 'READY') {
                console.info(`[courseRegistry] Cached content ${cached.status} for ${topicId}`);
                if (englishCurated) {
                    logSilentFallback(topicId, reason === 'not-ready' ? 'not-ready' : reason, 'curated');
                    return { steps: englishCurated, source: 'curated', cacheFallbackReason: reason };
                }
                if (cached.status === 'FAILED') {
                    const ai = await tryAi('not-ready');
                    if (ai) return ai;
                    return {
                        steps: [],
                        cachedLesson: cached,
                        source: 'cached',
                        cacheFallbackReason: 'not-ready',
                    };
                }
                const ai = await tryAi('not-ready');
                if (ai) return ai;
            } else if (englishCurated) {
                logSilentFallback(topicId, reason, 'curated');
                return { steps: englishCurated, source: 'curated', cacheFallbackReason: reason };
            } else {
                const ai = await tryAi(reason);
                if (ai) return ai;
            }
        } catch {
            if (englishCurated) {
                logSilentFallback(topicId, 'network-error', 'curated');
                return { steps: englishCurated, source: 'curated', cacheFallbackReason: 'network-error' };
            }
            const ai = await tryAi('network-error');
            if (ai) return ai;
        }
    }

    // 2. Curated English only (when cache mode off or already handled misses)
    if (englishCurated) {
        return { steps: englishCurated, source: 'curated' };
    }

    // 3. Runtime AI for registry topics (required path for Indic)
    const ai = await tryAi('cache-miss');
    if (ai) return ai;

    // 4. Last resort placeholder only
    return lastResortDefault(topicId, 'cache-miss');
};

const generatedCourseCache = new Map<string, TeachingStep[]>();

/** Clear in-memory AI course cache (e.g. after language change). */
export function clearGeneratedCourseCache(): void {
    generatedCourseCache.clear();
}
