import { TeachingStep } from '@/types';
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

/** Opt-in: runtime AI only when VITE_ALLOW_RUNTIME_AI is explicitly 'true'. */
export function isRuntimeAiAllowed(): boolean {
    return import.meta.env.VITE_ALLOW_RUNTIME_AI === 'true';
}

function logSilentFallback(
    topicId: string,
    reason: CacheFetchFailureReason,
    source: 'curated' | 'ai' | 'default',
): void {
    if (!import.meta.env.DEV) return;
    console.info(`[courseRegistry] Cache not READY (${reason}) — using ${source} content for ${topicId}`);
}

/**
 * Build teachable steps for any curriculum topic.
 * Uses local topic-analysis templates always; network AI only when opted in.
 * Does not require a visual-registry hit — teaching still opens with diagram canvas fallback.
 */
async function tryGenerateTeachableCourse(
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
    if (!topicName?.trim()) return null;

    const allowRuntimeAi = isRuntimeAiAllowed();
    const source: CourseContentResult['source'] = allowRuntimeAi ? 'ai' : 'default';
    const cacheKey = `${topicId}:${language}:${style}:${source}`;
    if (generatedCourseCache.has(cacheKey)) {
        logSilentFallback(topicId, reason, source);
        return { steps: generatedCourseCache.get(cacheKey)!, source, cacheFallbackReason: reason };
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
            { allowRuntimeAi },
        );
        if (generatedSteps?.length) {
            generatedCourseCache.set(cacheKey, generatedSteps);
            logSilentFallback(topicId, reason, source);
            return { steps: generatedSteps, source, cacheFallbackReason: reason };
        }
    } catch (error) {
        console.error(`[courseRegistry] Course generation failed for ${topicId}:`, error);
    }
    return null;
}

function lastResortDefault(topicId: string, reason: CacheFetchFailureReason): CourseContentResult {
    if (import.meta.env.DEV && CURATED_TOPICS[topicId]) {
        console.error(
            `[courseRegistry] BUG: curated topic ${topicId} fell through to empty last resort — check routing/topicId`,
        );
    }
    logSilentFallback(topicId, reason, 'default');
    // Only when topicName was missing so we could not build templates.
    return { steps: [], source: 'default', cacheFallbackReason: reason };
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

    const tryGenerated = (reason: CacheFetchFailureReason) =>
        tryGenerateTeachableCourse(
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
                    const generated = await tryGenerated('not-ready');
                    if (generated) return generated;
                    return {
                        steps: [],
                        cachedLesson: cached,
                        source: 'cached',
                        cacheFallbackReason: 'not-ready',
                    };
                }
                const generated = await tryGenerated('not-ready');
                if (generated) return generated;
            } else if (englishCurated) {
                logSilentFallback(topicId, reason, 'curated');
                return { steps: englishCurated, source: 'curated', cacheFallbackReason: reason };
            } else {
                const generated = await tryGenerated(reason);
                if (generated) return generated;
            }
        } catch {
            if (englishCurated) {
                logSilentFallback(topicId, 'network-error', 'curated');
                return { steps: englishCurated, source: 'curated', cacheFallbackReason: 'network-error' };
            }
            const generated = await tryGenerated('network-error');
            if (generated) return generated;
        }
    }

    // 2. Curated English only (when cache mode off or already handled misses)
    if (englishCurated) {
        return { steps: englishCurated, source: 'curated' };
    }

    // 3. Local topic templates (optional runtime AI enhancement when opted in)
    const generated = await tryGenerated('cache-miss');
    if (generated) return generated;

    // 4. Empty only when topicName was unavailable
    return lastResortDefault(topicId, 'cache-miss');
};

const generatedCourseCache = new Map<string, TeachingStep[]>();

/** Clear in-memory AI course cache (e.g. after language change). */
export function clearGeneratedCourseCache(): void {
    generatedCourseCache.clear();
}
