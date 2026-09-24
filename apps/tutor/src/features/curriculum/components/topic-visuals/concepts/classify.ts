/**
 * Deterministic concept classifier from subject + chapter + topic titles.
 * Chapter context is scored first so generic topic names (Operations, Introduction)
 * resolve differently per chapter.
 */
import type { ConceptId, VisualKind } from '../types';
import { KIND_VARIANTS } from '../types';
import { pickVariant } from '../normalize';

export interface ClassifiedConcept {
  conceptId: ConceptId;
  kind: VisualKind;
}

type Rule = {
  conceptId: ConceptId;
  kind: VisualKind;
  /** Match against chapter+topic haystack */
  test: RegExp;
  /** Prefer chapter title hits */
  chapterBoost?: RegExp;
  weight?: number;
};

const RULES: Rule[] = [
  // ── Math (specific first) ──
  { conceptId: 'quadratic-roots', kind: 'quadratic-roots', test: /nature\s*of\s*roots|discriminant|roots?/i, chapterBoost: /quadratic/i, weight: 12 },
  { conceptId: 'parabola', kind: 'parabola', test: /parabola|quadratic\s*graph/i, chapterBoost: /quadratic/i, weight: 11 },
  { conceptId: 'quadratic-formula', kind: 'quadratic-roots', test: /quadratic\s*formula|quadratic\s*factoriz/i, weight: 11 },
  { conceptId: 'linear-graph', kind: 'linear-graph', test: /graphical\s*method|linear\s*equation|pair\s*of\s*linear|two\s*variables/i, weight: 10 },
  { conceptId: 'algebra-balance', kind: 'algebra-balance', test: /solving\s*equations?|simple\s*equations?|linear\s*equations?\s*in\s*one|variables?/i, chapterBoost: /equation/i, weight: 9 },
  { conceptId: 'polynomial', kind: 'polynomial', test: /polynomial|zeroes|factorization|division\s*algorithm/i, weight: 10 },
  { conceptId: 'trigonometry', kind: 'trigonometry', test: /trigono|ratios?|identit|principal\s*values/i, weight: 10 },
  { conceptId: 'calculus', kind: 'calculus', test: /derivative|limit|continuit|differenti|chain\s*rule|integral/i, weight: 10 },
  { conceptId: 'matrices', kind: 'matrices', test: /matrix|matrices|determinant|minors|cofactors|transpose/i, weight: 10 },
  { conceptId: 'sets-venn', kind: 'sets-venn', test: /\bsets?\b|venn|cartesian\s*product|domain\s*and\s*range|types\s*of\s*functions|relations?\s*and\s*functions/i, weight: 9 },
  { conceptId: 'statistics-bars', kind: 'statistics-bars', test: /\bmean\b|\bmedian\b|\bmode\b|data\s*handling|statistics|graphs?/i, chapterBoost: /data|statistic/i, weight: 10 },
  { conceptId: 'probability', kind: 'probability', test: /probability|chance|random/i, weight: 10 },
  { conceptId: 'coordinate-plane', kind: 'coordinate-plane', test: /coordinate|cartesian|plotting|quadrants?/i, weight: 10 },
  { conceptId: 'triangle', kind: 'triangle', test: /triangle|congruence|criteria|angle\s*sum|quadrilateral/i, weight: 9 },
  { conceptId: 'circle-geo', kind: 'circle-geo', test: /\bcircles?\b|circumference|radius|chord|tangent/i, weight: 9 },
  { conceptId: 'fractions', kind: 'fractions', test: /fraction|decimal|rational\s*numbers?|conversion/i, weight: 9 },
  { conceptId: 'number-line', kind: 'number-line', test: /number\s*line|integers?|whole\s*numbers?|negative\s*numbers?/i, weight: 9 },
  { conceptId: 'place-value', kind: 'place-value', test: /large\s*numbers?|indian\s*system|international\s*system|place\s*value|knowing\s*our\s*numbers/i, weight: 10 },
  { conceptId: 'factors', kind: 'place-value', test: /factors?|multiples?|divisib|playing\s*with\s*numbers/i, weight: 8 },
  { conceptId: 'geometry-basic', kind: 'triangle', test: /points?|lines?|curves?|polygons?|geometrical/i, weight: 7 },
  { conceptId: 'ap-series', kind: 'linear-graph', test: /arithmetic\s*progress|nth\s*term|sum\s*of\s*terms|ap\b/i, weight: 9 },
  { conceptId: 'real-numbers', kind: 'number-line', test: /real\s*numbers?|irrational|euclid|rationalization|fundamental\s*theorem/i, weight: 8 },
  { conceptId: 'complex', kind: 'coordinate-plane', test: /complex|imaginary|argand/i, weight: 9 },
  { conceptId: 'inequalities', kind: 'linear-graph', test: /inequalit/i, weight: 8 },
  { conceptId: 'squares-roots', kind: 'parabola', test: /square\s*roots?|perfect\s*squares?/i, weight: 8 },

  // ── Physics ──
  { conceptId: 'scientific-method', kind: 'flowchart', test: /scientific\s*method|experiment|hypothesis/i, weight: 10 },
  { conceptId: 'si-units', kind: 'place-value', test: /si\s*units?|significant\s*figures|measurement|units\s*and\s*measurement/i, weight: 9 },
  { conceptId: 'errors-measure', kind: 'statistics-bars', test: /\berrors?\b|uncertainty|precision|accuracy/i, weight: 9 },
  { conceptId: 'kinematics', kind: 'motion-inertia', test: /kinematics|straight\s*line|scope|nature\s*of\s*physics/i, chapterBoost: /motion|physical\s*world/i, weight: 8 },
  { conceptId: 'vectors', kind: 'force-arrows', test: /vectors?|circular\s*motion/i, weight: 9 },
  { conceptId: 'friction', kind: 'motion-inertia', test: /friction|dynamics|newton.?s\s*laws/i, chapterBoost: /laws?\s*of\s*motion/i, weight: 9 },
  { conceptId: 'newton-first', kind: 'motion-inertia', test: /first\s*law|inertia|rest/i, chapterBoost: /motion|newton/i, weight: 12 },
  { conceptId: 'newton-second', kind: 'newton-second', test: /second\s*law|f\s*=\s*ma|acceleration/i, chapterBoost: /motion|newton/i, weight: 12 },
  { conceptId: 'newton-third', kind: 'action-reaction', test: /third\s*law|action|reaction/i, chapterBoost: /motion|newton/i, weight: 12 },
  { conceptId: 'force', kind: 'force-arrows', test: /\bforce\b|laws?\s*of\s*motion/i, weight: 8 },
  { conceptId: 'motion', kind: 'motion-inertia', test: /\bmotion\b|velocity|speed|distance/i, weight: 7 },
  { conceptId: 'energy', kind: 'energy', test: /energy|work|power|kinetic|potential|scope/i, weight: 8 },
  { conceptId: 'waves', kind: 'waves', test: /wave|sound|oscillat|frequency|nature\s*of\s*physics/i, weight: 8 },
  { conceptId: 'optics', kind: 'optics-lens', test: /optics?|lens|mirror|refraction|reflection|light/i, weight: 9 },
  { conceptId: 'circuit', kind: 'circuit', test: /circuit|current|electric|ohm|resistance/i, weight: 9 },
  { conceptId: 'heat', kind: 'heat-transfer', test: /heat|temperature|conduction|convection|radiation/i, weight: 9 },
  { conceptId: 'gravitation', kind: 'gravitation', test: /gravitat|orbit|planet|kepler|circular\s*motion/i, weight: 9 },
  { conceptId: 'projectile', kind: 'projectile', test: /projectile|trajectory/i, weight: 10 },
  { conceptId: 'magnetism', kind: 'magnetism', test: /magnet|electromagnet|magnetic/i, weight: 9 },
  { conceptId: 'linear-graph-phy', kind: 'linear-graph', test: /\bgraphs?\b|equations?/i, chapterBoost: /motion\s*in\s*a\s*straight/i, weight: 9 },

  // ── Chemistry ──
  { conceptId: 'bohr', kind: 'bohr-atom', test: /bohr|atomic\s*model|structure\s*of\s*(the\s*)?atom|electronic\s*config|subatomic/i, weight: 11 },
  { conceptId: 'molecule', kind: 'molecule-bond', test: /molecule|atoms?\s*and\s*molecules|covalent|ionic|bonding|chemical\s*bond/i, weight: 10 },
  { conceptId: 'reaction', kind: 'reaction-arrow', test: /chemical\s*reaction|balancing|equation|types\s*of\s*reaction/i, weight: 10 },
  { conceptId: 'periodic', kind: 'periodic-hint', test: /periodic|elements?/i, weight: 9 },
  { conceptId: 'solution', kind: 'solution-beaker', test: /solution|mixture|separation|evaporation|states\s*of\s*matter|matter/i, weight: 8 },
  { conceptId: 'acid-base', kind: 'solution-beaker', test: /acid|base|salt|ph\b|indicator|neutralization/i, weight: 9 },
  { conceptId: 'organic', kind: 'organic-chain', test: /carbon|hydrocarbon|organic|functional\s*group/i, weight: 9 },
  { conceptId: 'metals', kind: 'materials', test: /metal|non-metal|corrosion|extraction/i, weight: 8 },

  // ── Biology ──
  { conceptId: 'cell', kind: 'cell-cutaway', test: /cell\s*structure|organelles?|fundamental\s*unit|cell\s*division/i, weight: 11 },
  { conceptId: 'photosynthesis', kind: 'photosynthesis', test: /photosynth|nutrition\s*in\s*plants|modes\s*of\s*nutrition|parasites?/i, weight: 10 },
  { conceptId: 'digestive', kind: 'digestive-path', test: /digest|nutrition\s*in\s*animals|human\s*nutrition|food\s*pipe/i, weight: 10 },
  { conceptId: 'circulation', kind: 'circulation', test: /circulat|transportation|heart|blood/i, weight: 10 },
  { conceptId: 'respiration', kind: 'respiration', test: /respirat|breathing|lungs?/i, weight: 10 },
  { conceptId: 'dna', kind: 'dna-helix', test: /dna|genetics?|heredity|chromosome/i, weight: 10 },
  { conceptId: 'ecology', kind: 'ecology-web', test: /ecology|ecosystem|food\s*chain|environment/i, weight: 9 },
  { conceptId: 'plant', kind: 'plant-structure', test: /plant|botan|tissue|root|stem|leaf/i, weight: 7 },
  { conceptId: 'microbes', kind: 'microbes', test: /microbe|microorganism|disease|useful\s*microbes/i, weight: 9 },
  { conceptId: 'food-bio', kind: 'food-sources', test: /food\s*sources|food\s*habits|ingredients|nutrients|balanced\s*diet|deficiency/i, weight: 9 },
  { conceptId: 'life-process', kind: 'circulation', test: /life\s*processes?|excretion/i, weight: 8 },

  // ── Language ──
  { conceptId: 'character', kind: 'character-portrait', test: /character\s*sketch|character\s*study|character\s*analysis|relationships?/i, weight: 11 },
  { conceptId: 'letter', kind: 'letter-doc', test: /letter|diary|report\s*writing|formal\s*writing/i, weight: 10 },
  { conceptId: 'grammar', kind: 'grammar-timeline', test: /grammar|tense|व्याकरण|vocabular|शब्द/i, weight: 9 },
  { conceptId: 'poetry', kind: 'poetry-stanza', test: /poem|poetry|कविता|stanza|rhyme|तुकबंदी/i, weight: 10 },
  { conceptId: 'prose', kind: 'prose-pages', test: /prose|literature|fiction|comprehension|narrative|reading|पठन|कहानी/i, weight: 8 },
  { conceptId: 'comprehension', kind: 'comprehension-marks', test: /comprehension|critical\s*thinking|analysis|summary/i, weight: 8 },
  { conceptId: 'vocabulary', kind: 'vocabulary', test: /vocabulary|word|dictionary/i, weight: 8 },
  { conceptId: 'drama', kind: 'drama-masks', test: /drama|wit|humor|theatre|play/i, weight: 9 },
  { conceptId: 'writing', kind: 'letter-doc', test: /writing\s*skills?|लेखन|essay/i, weight: 8 },
  { conceptId: 'biography', kind: 'character-portrait', test: /biograph|autobiograph|inspiration/i, weight: 8 },
  { conceptId: 'adventure-lit', kind: 'prose-pages', test: /adventure|survival|determination|overcoming|fear/i, chapterBoost: /afraid|die|deep\s*water|flying/i, weight: 7 },

  // ── Social ──
  { conceptId: 'timeline', kind: 'timeline', test: /timeline|periodis|sources?|history\s*introduction|modern\s*history/i, weight: 9 },
  { conceptId: 'archaeology', kind: 'archaeology', test: /archaeolog|tut|monument|civilization|empire/i, weight: 10 },
  { conceptId: 'map', kind: 'map-contour', test: /map|india|neighbour|location|geography|size/i, weight: 9 },
  { conceptId: 'globe', kind: 'globe-layers', test: /globe|earth|planet|solar|moon|layers?/i, weight: 9 },
  { conceptId: 'climate', kind: 'climate', test: /climate|weather|rainfall|season/i, weight: 9 },
  { conceptId: 'democracy', kind: 'democracy-pillars', test: /democracy|constitut|preamble|rights|secular|civics|politic|election|parliament|federal|judiciary|power\s*sharing/i, weight: 9 },
  { conceptId: 'economy', kind: 'market-supply', test: /econom|income|poverty|market|trade|money|banking|employment|development|sustainab|hdi|national\s*income/i, weight: 9 },
  { conceptId: 'revolution', kind: 'timeline', test: /revolution|french|nationalism|independence|freedom|colonial|british/i, weight: 9 },
  { conceptId: 'resources', kind: 'map-contour', test: /resource|soil|agriculture|irrigation|crop|population/i, weight: 8 },

  // ── CS ──
  { conceptId: 'flowchart', kind: 'flowchart', test: /flowchart|algorithm|pseudocode/i, weight: 10 },
  { conceptId: 'array', kind: 'array-blocks', test: /array|list\b|indexing/i, weight: 9 },
  { conceptId: 'stack', kind: 'stack-ds', test: /\bstack\b|queue|linked\s*list/i, weight: 9 },
  { conceptId: 'tree', kind: 'tree-nodes', test: /\btree\b|binary|graph\s*data|nodes?/i, weight: 9 },
  { conceptId: 'network', kind: 'network', test: /network|internet|protocol|osi/i, weight: 9 },
  { conceptId: 'code', kind: 'code-brackets', test: /program|coding|software|hardware|operating\s*system|database|sql|computer/i, weight: 7 },

  // ── Materials / fibre science ──
  { conceptId: 'materials', kind: 'materials', test: /material|fibre|fabric|plastic|synthetic|sorting/i, weight: 8 },
];

const SUBJECT_FALLBACK: Record<string, VisualKind> = {
  mathematics: 'neutral-math',
  science: 'neutral-science',
  physics: 'neutral-physics',
  chemistry: 'neutral-chemistry',
  biology: 'neutral-biology',
  english: 'neutral-language',
  hindi: 'neutral-language',
  'social-science': 'neutral-social',
  computer: 'neutral-cs',
  it: 'neutral-cs',
  'computer-science': 'neutral-cs',
};

export function subjectFallbackKind(subjectId: string): VisualKind {
  return SUBJECT_FALLBACK[subjectId] ?? 'neutral-math';
}

export function classifyConcept(
  subjectId: string,
  chapterName: string,
  topicName: string,
): ClassifiedConcept | null {
  const chapter = chapterName.toLowerCase();
  const topic = topicName.toLowerCase();
  const haystack = `${subjectId} ${chapter} ${topic}`;

  let best: { rule: Rule; score: number } | null = null;

  for (const rule of RULES) {
    let score = 0;
    if (rule.test.test(haystack)) score += rule.weight ?? 5;
    if (rule.test.test(topic)) score += 3;
    if (rule.chapterBoost?.test(chapter)) score += 4;
    if (rule.test.test(chapter)) score += 2;
    if (score > 0 && (!best || score > best.score)) {
      best = { rule, score };
    }
  }

  if (!best || best.score < 5) return null;

  return {
    conceptId: best.rule.conceptId,
    kind: best.rule.kind,
  };
}

export function classifyChapterFallback(
  _subjectId: string,
  chapterName: string,
): ClassifiedConcept | null {
  const chapter = chapterName.toLowerCase();
  let best: { rule: Rule; score: number } | null = null;
  for (const rule of RULES) {
    let score = 0;
    if (rule.chapterBoost?.test(chapter)) score += 8;
    if (rule.test.test(chapter)) score += 6;
    if (score > 0 && (!best || score > best.score)) best = { rule, score };
  }
  if (!best) return null;
  return { conceptId: `chapter:${best.rule.conceptId}`, kind: best.rule.kind };
}

export function withVariant(
  classified: ClassifiedConcept,
  seedKey: string,
): { kind: VisualKind; variant: string; conceptId: ConceptId } {
  const variants = KIND_VARIANTS[classified.kind];
  return {
    kind: classified.kind,
    variant: pickVariant(variants, seedKey),
    conceptId: classified.conceptId,
  };
}
