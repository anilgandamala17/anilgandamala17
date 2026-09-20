import type { ResolveTopicVisualContext, TopicVisualSpec } from './types';
import { KIND_VARIANTS } from './types';
import { pickVariant } from './normalize';
import { lookupExact } from './registry';
import {
  classifyChapterFallback,
  classifyConcept,
  subjectFallbackKind,
  withVariant,
} from './concepts/classify';

const loggedUnmapped = new Set<string>();

function seedKey(ctx: ResolveTopicVisualContext): string {
  return `${ctx.chapterId}|${ctx.topicId}|${ctx.topicName}`;
}

/**
 * Resolve a topic card visual using:
 * 1 exact registry → 2 normalized (via lookupExact slugs) → 3 concept classifier
 * → 4 chapter fallback → 5 subject fallback
 */
export function resolveTopicVisual(
  ctx: ResolveTopicVisualContext,
): TopicVisualSpec {
  const seed = seedKey(ctx);

  const exact = lookupExact(
    ctx.subjectId,
    ctx.chapterId,
    ctx.chapterName,
    ctx.topicId,
    ctx.topicName,
  );
  if (exact) {
    return {
      kind: exact,
      variant: pickVariant(KIND_VARIANTS[exact], seed),
      conceptId: `exact:${exact}`,
      source: 'exact',
    };
  }

  const classified = classifyConcept(
    ctx.subjectId,
    ctx.chapterName,
    ctx.topicName,
  );
  if (classified) {
    const picked = withVariant(classified, seed);
    return {
      kind: picked.kind,
      variant: picked.variant,
      conceptId: picked.conceptId,
      source: 'concept',
    };
  }

  const chapterHit = classifyChapterFallback(ctx.subjectId, ctx.chapterName);
  if (chapterHit) {
    const picked = withVariant(chapterHit, seed);
    return {
      kind: picked.kind,
      variant: picked.variant,
      conceptId: picked.conceptId,
      source: 'chapter',
    };
  }

  const kind = subjectFallbackKind(ctx.subjectId);
  const key = `${ctx.subjectId}/${ctx.chapterId}/${ctx.topicId}`;
  if (import.meta.env.DEV && !loggedUnmapped.has(key)) {
    loggedUnmapped.add(key);
    console.info(
      '[topic-visual] unmapped topic → subject fallback',
      {
        subjectId: ctx.subjectId,
        chapterId: ctx.chapterId,
        chapterName: ctx.chapterName,
        topicId: ctx.topicId,
        topicName: ctx.topicName,
        kind,
      },
    );
  }

  return {
    kind,
    variant: pickVariant(KIND_VARIANTS[kind], seed),
    conceptId: `subject:${ctx.subjectId}`,
    source: 'subject',
  };
}
