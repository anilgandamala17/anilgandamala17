/**
 * Subject discipline definitions for cross-subject validation.
 * Keyword checks are secondary — primary validation uses topicId/syllabusUnit metadata.
 */

export type SubjectDiscipline =
  | 'physics'
  | 'chemistry'
  | 'mathematics'
  | 'biology'
  | 'botany'
  | 'zoology'
  | 'english'
  | 'hindi'
  | 'reasoning'
  | 'general-knowledge'
  | 'social-science'
  | 'engineering'
  | 'computer-science';

const SUBJECT_TO_DISCIPLINE: Record<string, SubjectDiscipline> = {
  phy: 'physics',
  chem: 'chemistry',
  math: 'mathematics',
  mat: 'reasoning',
  intel: 'reasoning',
  arith: 'mathematics',
  bot: 'botany',
  zoo: 'zoology',
  bio: 'biology',
  eng: 'english',
  'eng-core': 'engineering',
  'eng-math': 'mathematics',
  ga: 'reasoning',
  cs: 'computer-science',
  lang: 'english',
  hin: 'hindi',
  gk: 'general-knowledge',
  sst: 'social-science',
  'sat-sst': 'social-science',
  'sat-math': 'mathematics',
  'sat-sci': 'physics',
  sci: 'physics',
};

/** Secondary markers — used only when metadata validation is inconclusive. */
const DISCIPLINE_MARKERS: Record<SubjectDiscipline, RegExp[]> = {
  physics: [
    /\bnewton\b/i, /\bforce\b/i, /\bvelocity\b/i, /\bacceleration\b/i, /\bmomentum\b/i,
    /\belectric\s*field\b/i, /\bmagnetic\b/i, /\boptics\b/i, /\bthermodynamic/i,
    /\bprojectile\b/i, /\bohm\b/i, /\bresistivity\b/i, /\bgravit/i,
  ],
  chemistry: [
    /\bmole\b/i, /\bstoichiometr/i, /\bperiodic\s*table\b/i, /\bbonding\b/i,
    /\boxidation\b/i, /\breduction\b/i, /\borganic\b/i, /\binorganic\b/i,
    /\bequilibrium\b/i, /\bph\b/i, /\benthalpy\b/i, /\breaction\s*mechanism/i,
  ],
  mathematics: [
    /\bintegral\b/i, /\bderivative\b/i, /\bdifferentiat/i, /\bmatrix\b/i,
    /\bdeterminant\b/i, /\bprobability\b/i, /\bquadratic\b/i, /\bgeometry\b/i,
    /\btrigonometr/i, /\bvector\b/i, /\blimit\b/i, /\bpolynomial/i,
  ],
  biology: [
    /\bcell\b/i, /\bphotosynthesis\b/i, /\bmitosis\b/i, /\bmeiosis\b/i,
    /\bgenetics\b/i, /\becology\b/i, /\bphysiology\b/i,
  ],
  botany: [
    /\bplant\b/i, /\bphotosynthesis\b/i, /\bxylem\b/i, /\bphloem\b/i,
    /\bpollination\b/i, /\bfloral\b/i, /\bchloroplast\b/i,
  ],
  zoology: [
    /\banimal\b/i, /\bheart\b/i, /\bblood\b/i, /\bnephron\b/i,
    /\bhuman\s*reproduction\b/i, /\bimmunity\b/i, /\bvertebrate/i,
  ],
  english: [/\bgrammar\b/i, /\bsynonym\b/i, /\bantonym\b/i, /\bcomprehension\b/i],
  hindi: [/\bव्याकरण\b/, /\bसंधि\b/, /\bसमास\b/],
  reasoning: [/\banalogy\b/i, /\bseries\b/i, /\bcoding\b/i, /\bodd\s*one\s*out\b/i],
  'general-knowledge': [/\bhistory\b/i, /\bgeography\b/i, /\bpolity\b/i, /\bcurrent\s*affairs\b/i],
  'social-science': [/\bhistory\b/i, /\bcivics\b/i, /\bgeography\b/i, /\bconstitution\b/i],
  engineering: [/\bstrength\s*of\s*materials\b/i, /\bthermodynamics\b/i, /\bfluid\s*mechanics\b/i],
  'computer-science': [/\balgorithm\b/i, /\bdata\s*structure\b/i, /\bcomplexity\b/i, /\bturing\b/i],
};

export function getSubjectDiscipline(subjectId: string): SubjectDiscipline | null {
  return SUBJECT_TO_DISCIPLINE[subjectId.toLowerCase()] ?? null;
}

export function countDisciplineMarkers(text: string, discipline: SubjectDiscipline): number {
  const patterns = DISCIPLINE_MARKERS[discipline] ?? [];
  let count = 0;
  for (const re of patterns) {
    if (re.test(text)) count += 1;
  }
  return count;
}

export function detectDominantForeignDiscipline(
  text: string,
  expected: SubjectDiscipline,
): SubjectDiscipline | null {
  let best: SubjectDiscipline | null = null;
  let bestCount = 0;
  for (const [disc, patterns] of Object.entries(DISCIPLINE_MARKERS) as [SubjectDiscipline, RegExp[]][]) {
    if (disc === expected) continue;
    let count = 0;
    for (const re of patterns) {
      if (re.test(text)) count += 1;
    }
    if (count > bestCount) {
      bestCount = count;
      best = disc;
    }
  }
  const expectedCount = countDisciplineMarkers(text, expected);
  if (best && bestCount >= 2 && bestCount > expectedCount + 1) return best;
  return null;
}

/** Integrated science subjects lock to one discipline per session. */
export type ScienceDiscipline = 'physics' | 'chemistry' | 'biology';

export function lockScienceDiscipline(seed: string): ScienceDiscipline {
  const disciplines: ScienceDiscipline[] = ['physics', 'chemistry', 'biology'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return disciplines[Math.abs(h) % disciplines.length];
}
