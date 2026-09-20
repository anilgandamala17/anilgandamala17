/** Presentation-only topic card visual types (no curriculum mutations). */

export type VisualKind =
  | 'number-line'
  | 'place-value'
  | 'fractions'
  | 'algebra-balance'
  | 'linear-graph'
  | 'quadratic-roots'
  | 'parabola'
  | 'triangle'
  | 'circle-geo'
  | 'coordinate-plane'
  | 'statistics-bars'
  | 'probability'
  | 'matrices'
  | 'trigonometry'
  | 'calculus'
  | 'sets-venn'
  | 'polynomial'
  | 'motion-inertia'
  | 'force-arrows'
  | 'newton-second'
  | 'action-reaction'
  | 'energy'
  | 'waves'
  | 'optics-lens'
  | 'circuit'
  | 'heat-transfer'
  | 'gravitation'
  | 'projectile'
  | 'magnetism'
  | 'bohr-atom'
  | 'molecule-bond'
  | 'reaction-arrow'
  | 'periodic-hint'
  | 'solution-beaker'
  | 'organic-chain'
  | 'cell-cutaway'
  | 'photosynthesis'
  | 'digestive-path'
  | 'circulation'
  | 'dna-helix'
  | 'ecology-web'
  | 'plant-structure'
  | 'respiration'
  | 'prose-pages'
  | 'character-portrait'
  | 'letter-doc'
  | 'grammar-timeline'
  | 'poetry-stanza'
  | 'comprehension-marks'
  | 'vocabulary'
  | 'drama-masks'
  | 'timeline'
  | 'map-contour'
  | 'democracy-pillars'
  | 'market-supply'
  | 'archaeology'
  | 'globe-layers'
  | 'climate'
  | 'flowchart'
  | 'array-blocks'
  | 'stack-ds'
  | 'tree-nodes'
  | 'network'
  | 'code-brackets'
  | 'food-sources'
  | 'materials'
  | 'microbes'
  | 'neutral-math'
  | 'neutral-science'
  | 'neutral-physics'
  | 'neutral-chemistry'
  | 'neutral-biology'
  | 'neutral-language'
  | 'neutral-social'
  | 'neutral-cs';

export type ConceptId = string;

export interface TopicVisualSpec {
  kind: VisualKind;
  variant: string;
  conceptId: ConceptId;
  /** How the spec was resolved — for DEV diagnostics */
  source:
    | 'exact'
    | 'normalized'
    | 'concept'
    | 'chapter'
    | 'subject';
}

export interface ResolveTopicVisualContext {
  gradeId?: string;
  subjectId: string;
  chapterId: string;
  chapterName: string;
  chapterNumber?: number;
  topicId: string;
  topicName: string;
}

export interface VisualKindProps {
  accent: string;
  variant: string;
  titleHint?: string;
}

/** Known variants per kind — used for deterministic variant pick + DEV checks */
export const KIND_VARIANTS: Record<VisualKind, readonly string[]> = {
  'number-line': ['a', 'b', 'c'],
  'place-value': ['a', 'b', 'c'],
  fractions: ['a', 'b', 'c'],
  'algebra-balance': ['a', 'b', 'c'],
  'linear-graph': ['a', 'b', 'c'],
  'quadratic-roots': ['a', 'b', 'c'],
  parabola: ['a', 'b', 'c'],
  triangle: ['a', 'b', 'c'],
  'circle-geo': ['a', 'b', 'c'],
  'coordinate-plane': ['a', 'b', 'c'],
  'statistics-bars': ['a', 'b', 'c'],
  probability: ['a', 'b', 'c'],
  matrices: ['a', 'b', 'c'],
  trigonometry: ['a', 'b', 'c'],
  calculus: ['a', 'b', 'c'],
  'sets-venn': ['a', 'b', 'c'],
  polynomial: ['a', 'b', 'c'],
  'motion-inertia': ['a', 'b', 'c'],
  'force-arrows': ['a', 'b', 'c'],
  'newton-second': ['a', 'b', 'c'],
  'action-reaction': ['a', 'b', 'c'],
  energy: ['a', 'b', 'c'],
  waves: ['a', 'b', 'c'],
  'optics-lens': ['a', 'b', 'c'],
  circuit: ['a', 'b', 'c'],
  'heat-transfer': ['a', 'b', 'c'],
  gravitation: ['a', 'b', 'c'],
  projectile: ['a', 'b', 'c'],
  magnetism: ['a', 'b', 'c'],
  'bohr-atom': ['a', 'b', 'c'],
  'molecule-bond': ['a', 'b', 'c'],
  'reaction-arrow': ['a', 'b', 'c'],
  'periodic-hint': ['a', 'b', 'c'],
  'solution-beaker': ['a', 'b', 'c'],
  'organic-chain': ['a', 'b', 'c'],
  'cell-cutaway': ['a', 'b', 'c'],
  photosynthesis: ['a', 'b', 'c'],
  'digestive-path': ['a', 'b', 'c'],
  circulation: ['a', 'b', 'c'],
  'dna-helix': ['a', 'b', 'c'],
  'ecology-web': ['a', 'b', 'c'],
  'plant-structure': ['a', 'b', 'c'],
  respiration: ['a', 'b', 'c'],
  'prose-pages': ['a', 'b', 'c'],
  'character-portrait': ['a', 'b', 'c'],
  'letter-doc': ['a', 'b', 'c'],
  'grammar-timeline': ['a', 'b', 'c'],
  'poetry-stanza': ['a', 'b', 'c'],
  'comprehension-marks': ['a', 'b', 'c'],
  vocabulary: ['a', 'b', 'c'],
  'drama-masks': ['a', 'b', 'c'],
  timeline: ['a', 'b', 'c'],
  'map-contour': ['a', 'b', 'c'],
  'democracy-pillars': ['a', 'b', 'c'],
  'market-supply': ['a', 'b', 'c'],
  archaeology: ['a', 'b', 'c'],
  'globe-layers': ['a', 'b', 'c'],
  climate: ['a', 'b', 'c'],
  flowchart: ['a', 'b', 'c'],
  'array-blocks': ['a', 'b', 'c'],
  'stack-ds': ['a', 'b', 'c'],
  'tree-nodes': ['a', 'b', 'c'],
  network: ['a', 'b', 'c'],
  'code-brackets': ['a', 'b', 'c'],
  'food-sources': ['a', 'b', 'c'],
  materials: ['a', 'b', 'c'],
  microbes: ['a', 'b', 'c'],
  'neutral-math': ['a', 'b', 'c'],
  'neutral-science': ['a', 'b', 'c'],
  'neutral-physics': ['a', 'b', 'c'],
  'neutral-chemistry': ['a', 'b', 'c'],
  'neutral-biology': ['a', 'b', 'c'],
  'neutral-language': ['a', 'b', 'c'],
  'neutral-social': ['a', 'b', 'c'],
  'neutral-cs': ['a', 'b', 'c'],
};
