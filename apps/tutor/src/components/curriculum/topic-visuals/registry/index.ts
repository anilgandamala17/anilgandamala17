/**
 * Exact + normalized presentation registry.
 * Keys: subjectId → chapterId | slug(chapterName) → topicId | slug(topicName) → VisualKind
 */
import type { VisualKind } from '../types';
import { slugify } from '../normalize';

export type TopicKindMap = Record<string, VisualKind>;
export type ChapterKindMap = Record<string, TopicKindMap>;
export type SubjectKindMap = Record<string, ChapterKindMap>;

/**
 * High-value explicit mappings for colliding topic names and famous concepts.
 * Uses chapter ids / slugs from schoolCurriculum (read-only consumption).
 */
export const EXACT_REGISTRY: SubjectKindMap = {
  mathematics: {
    'math-6-1': {
      'math-6-1-large-numbers': 'place-value',
      'math-6-1-indian-system': 'place-value',
      'math-6-1-international-system': 'place-value',
    },
    'math-10-4': {
      'math-10-4-quadratic-factorization': 'quadratic-roots',
      'math-10-4-quadratic-formula': 'quadratic-roots',
      'math-10-4-nature-of-roots': 'quadratic-roots',
    },
    'knowing-our-numbers': {
      'large-numbers': 'place-value',
      'indian-system': 'place-value',
      'international-system': 'place-value',
    },
    'quadratic-equations': {
      'nature-of-roots': 'quadratic-roots',
      'quadratic-formula': 'quadratic-roots',
      'quadratic-factorization': 'parabola',
    },
    'data-handling': {
      mean: 'statistics-bars',
      median: 'statistics-bars',
      mode: 'statistics-bars',
      graphs: 'statistics-bars',
    },
    'coordinate-geometry': {
      'cartesian-system': 'coordinate-plane',
      'plotting-points': 'coordinate-plane',
      quadrants: 'coordinate-plane',
    },
  },
  physics: {
    'phy-11-1': {
      'phy-11-1-nature-of-physics': 'waves',
      'phy-11-1-scope': 'energy',
      'phy-11-1-scientific-method': 'flowchart',
    },
    'phy-11-2': {
      'phy-11-2-si-units': 'place-value',
      'phy-11-2-errors': 'statistics-bars',
      'phy-11-2-significant-figures': 'place-value',
    },
    'phy-11-3': {
      'phy-11-3-kinematics': 'motion-inertia',
      'phy-11-3-equations': 'linear-graph',
      'phy-11-3-graphs': 'linear-graph',
    },
    'phy-11-4': {
      'phy-11-4-vectors': 'force-arrows',
      'phy-11-4-projectile-motion': 'projectile',
      'phy-11-4-circular-motion': 'gravitation',
    },
    'phy-11-5': {
      'phy-11-5-newtons-laws': 'force-arrows',
      'phy-11-5-friction': 'motion-inertia',
      'phy-11-5-dynamics': 'newton-second',
    },
    'physical-world': {
      'nature-of-physics': 'waves',
      scope: 'energy',
      'scientific-method': 'flowchart',
    },
    'units-and-measurement': {
      'si-units': 'place-value',
      errors: 'statistics-bars',
      'significant-figures': 'place-value',
    },
    'motion-in-a-straight-line': {
      kinematics: 'motion-inertia',
      equations: 'linear-graph',
      graphs: 'linear-graph',
    },
    'motion-in-a-plane': {
      vectors: 'force-arrows',
      'projectile-motion': 'projectile',
      'circular-motion': 'gravitation',
    },
    'laws-of-motion': {
      'newtons-laws': 'force-arrows',
      friction: 'motion-inertia',
      dynamics: 'newton-second',
      'newtons-first-law': 'motion-inertia',
      'newtons-second-law': 'newton-second',
      'newtons-third-law': 'action-reaction',
    },
  },
  chemistry: {
    'structure-of-the-atom': {
      'atomic-models': 'bohr-atom',
      'subatomic-particles': 'bohr-atom',
      'electronic-configuration': 'bohr-atom',
    },
  },
  biology: {
    'the-fundamental-unit-of-life': {
      'cell-structure': 'cell-cutaway',
      organelles: 'cell-cutaway',
      'cell-division': 'cell-cutaway',
    },
  },
  english: {
    'eng-11-1': {
      'eng-11-1-prose': 'prose-pages',
      'eng-11-1-character-sketch': 'character-portrait',
      'eng-11-1-relationships': 'character-portrait',
    },
    'the-portrait-of-a-lady': {
      prose: 'prose-pages',
      'character-sketch': 'character-portrait',
      relationships: 'character-portrait',
    },
  },
  science: {
    'nutrition-in-plants': {
      photosynthesis: 'photosynthesis',
      'modes-of-nutrition': 'photosynthesis',
      parasites: 'plant-structure',
    },
    'nutrition-in-animals': {
      digestion: 'digestive-path',
      'digestive-system': 'digestive-path',
      ruminants: 'digestive-path',
    },
  },
};

export function lookupExact(
  subjectId: string,
  chapterId: string,
  chapterName: string,
  topicId: string,
  topicName: string,
): VisualKind | null {
  const subject = EXACT_REGISTRY[subjectId];
  if (!subject) return null;

  const chapterKeys = [chapterId, slugify(chapterName)];
  const topicKeys = [topicId, slugify(topicName)];

  for (const ck of chapterKeys) {
    const chapterMap = subject[ck];
    if (!chapterMap) continue;
    for (const tk of topicKeys) {
      if (chapterMap[tk]) return chapterMap[tk];
    }
  }
  return null;
}
