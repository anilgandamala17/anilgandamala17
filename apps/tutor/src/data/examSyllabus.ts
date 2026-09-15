/**
 * Syllabus and difficulty hints for competitive exam AI generation.
 * Used to align generated MCQs with official exam scope and level.
 */

export type DifficultyMix = { easy: number; medium: number; hard: number };
export type ExamDifficulty = 'Easy' | 'Medium' | 'Hard';

/** Exact Easy / Medium / Hard percentages for each exam (must sum to 100). */
export const EXAM_DIFFICULTY_MIX: Record<string, DifficultyMix> = {
  'jee-main': { easy: 30, medium: 50, hard: 20 },
  'jee-advanced': { easy: 15, medium: 35, hard: 50 },
  neet: { easy: 35, medium: 45, hard: 20 },
  eamcet: { easy: 30, medium: 50, hard: 20 },
  polycet: { easy: 40, medium: 45, hard: 15 },
  ntse: { easy: 40, medium: 45, hard: 15 },
  'rjc-cet': { easy: 35, medium: 45, hard: 20 },
  gate: { easy: 20, medium: 50, hard: 30 },
  sainik: { easy: 40, medium: 45, hard: 15 },
  navodaya: { easy: 45, medium: 40, hard: 15 },
  kv: { easy: 40, medium: 45, hard: 15 },
  emrs: { easy: 40, medium: 45, hard: 15 },
  nmms: { easy: 40, medium: 45, hard: 15 },
  olympiad: { easy: 20, medium: 50, hard: 30 },
  'rgukt-iiit': { easy: 30, medium: 50, hard: 20 },
};

export function getExamDifficultyMix(examId: string): DifficultyMix {
  return EXAM_DIFFICULTY_MIX[examId] ?? { easy: 30, medium: 50, hard: 20 };
}

/** Optional per exam+subject difficulty overrides (falls back to exam-level mix). */
export const SUBJECT_DIFFICULTY_MIX: Record<string, Record<string, DifficultyMix>> = {
  neet: {
    bot: { easy: 40, medium: 45, hard: 15 },
    zoo: { easy: 40, medium: 45, hard: 15 },
    chem: { easy: 35, medium: 45, hard: 20 },
    phy: { easy: 30, medium: 45, hard: 25 },
  },
  'jee-advanced': {
    math: { easy: 10, medium: 30, hard: 60 },
    phy: { easy: 15, medium: 35, hard: 50 },
    chem: { easy: 15, medium: 35, hard: 50 },
  },
  'jee-main': {
    math: { easy: 25, medium: 50, hard: 25 },
    phy: { easy: 30, medium: 50, hard: 20 },
    chem: { easy: 35, medium: 45, hard: 20 },
  },
  eamcet: {
    math: { easy: 25, medium: 50, hard: 25 },
    phy: { easy: 30, medium: 50, hard: 20 },
    chem: { easy: 35, medium: 45, hard: 20 },
  },
};

export function getDifficultyMix(examId: string, subjectId: string): DifficultyMix {
  return SUBJECT_DIFFICULTY_MIX[examId]?.[subjectId] ?? getExamDifficultyMix(examId);
}

/** Short generation instructions per difficulty band. */
export const DIFFICULTY_GENERATION_RULES: Record<
  string,
  Record<string, Record<ExamDifficulty, string>>
> = {
  neet: {
    default: {
      Easy: 'Direct NCERT recall or single-step application; short stem.',
      Medium: 'Two-step reasoning or standard numerical from NCERT scope.',
      Hard: 'Multi-concept application or interpretation; still NCERT-faithful.',
    },
  },
  'jee-main': {
    default: {
      Easy: 'Single-concept or direct formula application.',
      Medium: 'Two-step numerical or concept combination.',
      Hard: 'Multi-step problem with non-obvious setup; JEE Main standard.',
    },
  },
  'jee-advanced': {
    default: {
      Easy: 'Foundational concept with one non-trivial step.',
      Medium: 'Multi-concept linkage; analytical reasoning.',
      Hard: 'Non-routine multi-step; subtle distractors; Advanced standard.',
    },
  },
  eamcet: {
    default: {
      Easy: 'Direct intermediate-level concept or short numerical.',
      Medium: 'Application with moderate calculation; time-efficient style.',
      Hard: 'Multi-step numerical or concept blend; EAPCET pattern.',
    },
  },
};

export function getDifficultyGenerationRule(
  examId: string,
  subjectId: string,
  difficulty: ExamDifficulty,
): string {
  const byExam = DIFFICULTY_GENERATION_RULES[examId];
  const rule =
    byExam?.[subjectId] ?? byExam?.default ?? DIFFICULTY_GENERATION_RULES.neet.default;
  return rule[difficulty];
}

/**
 * Interleaved Easy/Medium/Hard sequence that matches the exam+subject mix.
 */
export function allocateDifficultySequence(
  examId: string,
  subjectIdOrCount: string | number,
  countMaybe?: number,
): ExamDifficulty[] {
  let subjectId: string;
  let count: number;
  if (typeof subjectIdOrCount === 'number') {
    subjectId = '';
    count = subjectIdOrCount;
    return allocateDifficultySequenceLegacy(examId, count);
  }
  subjectId = subjectIdOrCount;
  count = countMaybe ?? 0;
  if (count <= 0) return [];
  const mix = getDifficultyMix(examId, subjectId);
  return buildDifficultySequence(mix, count);
}

function allocateDifficultySequenceLegacy(examId: string, count: number): ExamDifficulty[] {
  const mix = getExamDifficultyMix(examId);
  return buildDifficultySequence(mix, count);
}

function buildDifficultySequence(mix: DifficultyMix, count: number): ExamDifficulty[] {
  let easy = Math.round((count * mix.easy) / 100);
  let hard = Math.round((count * mix.hard) / 100);
  let medium = count - easy - hard;
  if (medium < 0) {
    const overflow = -medium;
    if (hard >= overflow) hard -= overflow;
    else easy = Math.max(0, easy - (overflow - hard));
    medium = 0;
  }
  while (easy + medium + hard < count) medium += 1;
  while (easy + medium + hard > count) {
    if (medium > 0) medium -= 1;
    else if (easy > 0) easy -= 1;
    else hard -= 1;
  }

  const remaining: Record<ExamDifficulty, number> = {
    Easy: easy,
    Medium: medium,
    Hard: hard,
  };
  const order: ExamDifficulty[] = ['Easy', 'Medium', 'Hard'];
  const out: ExamDifficulty[] = [];
  while (out.length < count) {
    let placed = false;
    for (const d of order) {
      if (remaining[d] > 0) {
        out.push(d);
        remaining[d] -= 1;
        placed = true;
      }
    }
    if (!placed) break;
  }
  return out;
}

/** Per-exam overall difficulty / style guidance */
export const EXAM_DIFFICULTY_PROFILE: Record<string, string> = {
  'jee-main':
    'JEE Main standard: single-concept and two-step problems; EXACT mix 30% Easy, 50% Medium, 20% Hard. No Olympiad-only tricks.',
  'jee-advanced':
    'JEE Advanced standard: multi-step reasoning, subtle distractors; EXACT mix 15% Easy, 35% Medium, 50% Hard. Prefer linked concepts and assertion–reason where appropriate.',
  neet:
    'NEET (UG) standard: NCERT-aligned, factual plus applied; EXACT mix 35% Easy, 45% Medium, 20% Hard. Biology must match NCERT depth.',
  eamcet:
    'EAMCET (Engineering) style: brisk numericals and direct theory; EXACT mix 30% Easy, 50% Medium, 20% Hard. Strong emphasis on speed.',
  polycet:
    'Diploma-level POLYCET: straightforward to moderate; EXACT mix 40% Easy, 45% Medium, 15% Hard. Clear wording; fewer multi-page derivations.',
  ntse:
    'NTSE MAT/SAT: age-appropriate for Class 10; EXACT mix 40% Easy, 45% Medium, 15% Hard. MAT uses reasoning patterns; SAT aligns with NCERT.',
  'rjc-cet':
    'Intermediate-level CET: board + light competitive mix; EXACT mix 35% Easy, 45% Medium, 20% Hard.',
  gate:
    'GATE-style: engineering depth, numerical and conceptual; EXACT mix 20% Easy, 50% Medium, 30% Hard. GA follows GATE aptitude patterns.',
  sainik:
    'Sainik School Class 6/9 entrance: arithmetic, intelligence, language, GK; EXACT mix 40% Easy, 45% Medium, 15% Hard. Age-appropriate, not JEE-level.',
  navodaya:
    'JNVST (Navodaya): mental ability, arithmetic, language for Class 6; EXACT mix 45% Easy, 40% Medium, 15% Hard. Pattern-based MAT, no Class 12 calculus.',
  kv:
    'KV admission: Class 8–9 English, Hindi, Maths, Science, SST; EXACT mix 40% Easy, 45% Medium, 15% Hard. NCERT school standard.',
  emrs:
    'EMRS entrance: mental ability, arithmetic, language; EXACT mix 40% Easy, 45% Medium, 15% Hard. Scholarship/residential flavour.',
  nmms:
    'NMMS Class 8 Scholarship: MAT + SAT (Science, SST, Maths); EXACT mix 40% Easy, 45% Medium, 15% Hard.',
  olympiad:
    'School Olympiads (SOF-style Class 6–10): HOTS and reasoning; EXACT mix 20% Easy, 50% Medium, 30% Hard.',
  'rgukt-iiit':
    'RGUKT IIIT Class 10 entrance: EXACT mix 30% Easy, 50% Medium, 20% Hard. State board / CBSE Class 10 application.',
};

const DEFAULT_SUBJECT_SYLLABUS =
  'Use the standard national board + competitive syllabus for this subject. Stay within high-school / early UG scope unless the exam demands otherwise.';

/** Key units/chapters to anchor AI coverage (not exhaustive—prompts the model to stay on-scope). */
export const SUBJECT_SYLLABUS_CONTEXT: Record<string, Record<string, string>> = {
  'jee-main': {
    phy: 'Mechanics, waves, thermodynamics, electrostatics, current electricity, magnetism, EMI/AC, optics, modern physics (NCERT Class 11–12).',
    chem: 'Physical, organic, inorganic chemistry per JEE Main weightage; NCERT-based reactions and periodic trends.',
    math: 'Algebra, coordinate geometry, calculus, trigonometry, probability, vectors & 3D as per JEE Main.',
  },
  'jee-advanced': {
    phy: 'IIT-level mechanics, rotation, waves, thermal, electrodynamics, optics, modern physics with multi-step problems.',
    chem: 'Advanced organic mechanisms, thermo/kinetics, electrochemistry, qualitative inorganic reasoning.',
    math: 'Rigorous calculus, algebra, combinatorics, complex numbers, analytical geometry suitable for Advanced.',
  },
  neet: {
    phy: 'NCERT Class 11–12 Physics: mechanics, properties of matter, thermodynamics, waves, electricity, magnetism, optics, modern physics.',
    chem: 'NCERT Physical / Organic / Inorganic for NEET; biomolecules, polymers, everyday chemistry where relevant.',
    bot: 'NCERT Botany: cell biology, plant physiology, reproduction, genetics, ecology, biotechnology.',
    zoo: 'NCERT Zoology: animal physiology, reproduction, evolution, human health, ecology.',
  },
  eamcet: {
    math: 'Intermediate Mathematics: algebra, trigonometry, coordinate geometry, calculus, probability.',
    phy: 'Mechanics, properties of matter, heat, sound, electricity, magnetism, optics, modern physics at EAMCET level.',
    chem: 'Atomic structure, bonding, stoichiometry, organic nomenclature and reactions, acids/bases, electrochemistry.',
  },
  polycet: {
    math: 'Diploma-level mathematics: arithmetic, algebra, geometry, trigonometry.',
    phy: 'Basic mechanics, heat, sound, electricity, magnetism at diploma entrance level.',
    chem: 'Fundamentals: matter, atomic structure, periodic table, chemical bonding, basic organic and inorganic.',
  },
  ntse: {
    mat: 'Verbal/non-verbal reasoning, series, analogies, coding-decoding, pattern recognition suitable for NTSE MAT.',
    'sat-sci': 'NCERT Class 9–10 Science: physics, chemistry, life sciences integrated.',
    'sat-sst': 'NCERT Class 9–10 History, Civics, Geography; factual and interpretive.',
    'sat-math': 'NCERT Class 9–10 Mathematics: arithmetic, basic algebra, geometry.',
  },
  'rjc-cet': {
    math: 'Intermediate board mathematics with CET-style MCQs.',
    sci: 'Integrated science: physics, chemistry, biology basics at intermediate level.',
    eng: 'Reading comprehension, grammar, vocabulary, error spotting.',
  },
  gate: {
    ga: 'GATE General Aptitude: verbal ability, numerical ability, reasoning, data interpretation.',
    'eng-core': 'GATE engineering core: strength of materials, thermodynamics, fluid mechanics, electrical circuits, manufacturing, engineering mechanics — typical multi-discipline GATE flavour.',
    'eng-math': 'GATE Engineering Mathematics: linear algebra, calculus, differential equations, complex variables, probability & statistics, numerical methods, transforms.',
    eng: 'Engineering mathematics: linear algebra, calculus, probability, transforms as per GATE common syllabus.',
    cs: 'GATE CS: discrete math, DS/Algo, CN, OS, DBMS, TOC, digital logic, compilers (typical GATE CS scope).',
  },
  sainik: {
    math: 'Sainik maths: number system, fractions, percentages, ratio, LCM/HCF, simple interest, time-work, time-distance, mensuration, basic algebra and geometry (Class 5–8).',
    intel: 'Intelligence: analogies, odd-one-out, series, coding-decoding, pattern completion, spatial figures, blood relations.',
    lang: 'Language: synonyms, antonyms, one-word substitution, comprehension, grammar, error spotting (English).',
    gk: 'GK: Indian history, geography, polity, current affairs, general science, defence and national symbols.',
  },
  navodaya: {
    mat: 'JNVST Mental Ability: figure analogy, odd figures, pattern completion, embedded figures, series, mirror/water images.',
    arith: 'JNVST Arithmetic: number system, four operations, fractions, decimals, percentage, profit-loss, simple interest, time-distance, mensuration (Class 5).',
    lang: 'JNVST Language: reading comprehension, grammar, vocabulary at Class 5–6 English.',
  },
  kv: {
    eng: 'KV English: unseen passage, grammar (tenses, articles, voice, narration), vocabulary, writing skills Class 8–9.',
    hin: 'KV Hindi: व्याकरण (संधि, समास, काल, वचन), अपठित गद्यांश, शब्द ज्ञान, मुहावरे.',
    math: 'KV Mathematics: linear equations, polynomials, triangles, statistics, probability, mensuration Class 8–9 NCERT.',
    sci: 'KV Science: cell, tissues, force, motion, light, atoms, metals, crop production Class 8–9 NCERT.',
    sst: 'KV Social Science: history (modern India), geography (resources, climate), civics (constitution, democracy) Class 8–9.',
  },
  emrs: {
    mat: 'EMRS Mental Ability: series, analogies, classification, coding-decoding, direction sense, blood relations, puzzles.',
    arith: 'EMRS Arithmetic: percentages, ratio, averages, time-work, profit-loss, simple interest, mensuration.',
    lang: 'EMRS Language: English grammar, vocabulary, comprehension, error detection.',
  },
  'nmms': {
    mat: 'Verbal/non-verbal reasoning, series completion, analogies, classification, coding-decoding, and pattern recognition (Class 8 standard).',
    'sat-sci': 'Class 7-8 Science: physics (light, force, pressure, heat), chemistry (synthetic fibres, metals, chemical effects of current), and biology (crop production, microorganisms, cell structure).',
    'sat-sst': 'Class 7-8 History, Geography, and Civics: Indian national movement, resources, agriculture, constitution, and judiciary.',
    'sat-math': 'Class 7-8 Mathematics: rational numbers, linear equations, quadrilaterals, square/cube roots, mensuration, and algebra.',
  },
  'olympiad': {
    math: 'Olympiad Mathematics: number system, algebra, geometry, mensuration, data handling, and higher-order thinking problems.',
    sci: 'Olympiad Science: physical and chemical changes, heat, motion, force, cells, plants, human physiology, and pollution.',
    eng: 'Olympiad English: grammar, sentence structure, comprehension, vocabulary, and everyday communication.',
    mat: 'Olympiad Logical Reasoning: verbal and non-verbal reasoning, analogies, patterns, coding, and spatial relationships.',
  },
  'rgukt-iiit': {
    math: 'Class 10 Mathematics: real numbers, polynomials, linear equations, quadratic equations, progressions, coordinate geometry, trigonometry, and mensuration.',
    phy: 'Class 10 Physics: light reflection and refraction, human eye, electricity, and magnetic effects of current.',
    chem: 'Class 10 Chemistry: chemical reactions, acids and bases, metals and non-metals, carbon compounds, and classification.',
    bio: 'Class 10 Biology: life processes, control and coordination, reproduction, heredity, and environment.',
  },
};

/**
 * How real papers for this exam usually look — used to steer stems away from generic templates.
 */
export const EXAM_PATTERN_GUIDE: Record<string, string> = {
  'jee-main':
    'Typical JEE Main stems: single-correct, numeric answers expressed as one of four values; occasional Assertion–Reason; chemistry reaction sequences; math short computation. Avoid NEET-style pure fact recall unless in Chemistry/Biology crossover.',
  'jee-advanced':
    'Typical Advanced stems: multi-constraint mechanics, linked comprehension, integer/numeric feel in options, deep organic sequences, non-routine proofs-style multiple choice.',
  neet:
    'Typical NEET stems: NCERT-faithful facts, applied biology, reaction conditions, graph-less quantitative where needed; Assertion–Reason appears; options are often statement bundles.',
  eamcet:
    'Typical EAMCET: fast numeric plug-in, direct formulae, Telangana/Andhra intermediate flavour; fewer paragraph-long English stems.',
  polycet:
    'Typical POLYCET: straightforward computation, definitions, simple applications; minimal ornate wording.',
  ntse:
    'Typical NTSE MAT: patterns, analogies, series; SAT: short NCERT-based fact and interpretation.',
  'rjc-cet':
    'Typical RJC: board-level language, mixed science, reading passages with MCQs.',
  gate:
    'Typical GATE: technical MCQs with engineering data, GA with verbal + quantitative reasoning.',
  sainik:
    'Typical Sainik: short arithmetic, intelligence figures described in words, language MCQs, GK facts — never Class 12 JEE calculus.',
  navodaya:
    'Typical JNVST: figure/pattern MAT described in words, Class 5 arithmetic, simple English comprehension.',
  kv:
    'Typical KV: NCERT Class 8–9 school MCQs across five subjects; straightforward wording.',
  emrs:
    'Typical EMRS: reasoning + arithmetic + language similar to scholarship exams, not engineering.',
  'nmms':
    'Typical NMMS: Direct Scholastic and Mental Ability questions suited for Class 8 scholarship seekers.',
  'olympiad':
    'Typical Olympiad: Challenging, conceptual, and non-routine problem solving with logical reasoning.',
  'rgukt-iiit':
    'Typical RGUKT IIIT: CBSE/State Board Class 10 standard multiple choice questions focusing on fundamental application.',
};

export function getExamDifficultyGuidance(examId: string): string {
  return EXAM_DIFFICULTY_PROFILE[examId] ?? 'Match the official difficulty distribution for this examination.';
}

export function getExamPatternGuide(examId: string): string {
  return EXAM_PATTERN_GUIDE[examId] ?? 'Match the authentic style and pacing of the named examination — not a generic school test.';
}

export function getSubjectSyllabusContext(examId: string, subjectId: string): string {
  const byExam = SUBJECT_SYLLABUS_CONTEXT[examId];
  if (byExam?.[subjectId]) return byExam[subjectId];
  const fallback = SUBJECT_SYLLABUS_CONTEXT[examId]?.['default'];
  if (fallback) return fallback;
  return DEFAULT_SUBJECT_SYLLABUS;
}

/**
 * Per exam + subject: accuracy rules and “what not to do” so items stay on-discipline
 * and do not blur into other subjects (major cause of generic / repetitive output).
 */
export const SUBJECT_DISCIPLINE_RULES: Record<string, Record<string, string>> = {
  'jee-main': {
    phy: 'Physics only: use SI units; sign/direction matters for vectors; include varied chapters (mechanics, E&M, optics, modern) — do not ask biology or chemistry disguised as physics.',
    chem: 'Chemistry only: balance mentally where needed; name reactions and conditions per NCERT/JEE; avoid pure physics word problems.',
    math: 'Mathematics only: calculus/algebra/geometry appropriate to JEE Main; avoid biology/chemistry narratives.',
  },
  'jee-advanced': {
    phy: 'Advanced physics: multi-step, subtle distractors; rotation, constraints, fields — stay rigorous; no NEET-style one-line facts unless physics-based.',
    chem: 'Advanced chemistry: mechanism depth, stereochemistry, thermo/kinetics; avoid generic definitions repeated across questions.',
    math: 'Advanced math: non-routine but fair; avoid repeating the same trick (e.g. same substitution) across items in one batch.',
  },
  neet: {
    phy: 'NEET Physics: NCERT-aligned numericals and concepts; avoid JEE-only olympiad setups.',
    chem: 'NEET Chemistry: NCERT reactions, biomolecules, everyday chemistry; options as short statements typical of NEET.',
    bot: 'Botany ONLY: plants, tissues, physiology, genetics, ecology of plants — do NOT ask animal/human physiology here.',
    zoo: 'Zoology ONLY: animals, human physiology, evolution, health — do NOT ask pure plant taxonomy here.',
  },
  eamcet: {
    math: 'EAMCET Math: intermediate-level speed maths; varied subtopics across algebra, trig, calculus, probability.',
    phy: 'EAMCET Physics: formula application and short numericals; Andhra/Telangana intermediate flavour.',
    chem: 'EAMCET Chemistry: brisk theory + numeric; stoichiometry and organic recognition common.',
  },
  polycet: {
    math: 'Diploma math: arithmetic through basic trig; avoid JEE Advanced calculus depth.',
    phy: 'Diploma physics: simple labs and definitions; avoid long derivations.',
    chem: 'Diploma chemistry: basics and straightforward applications.',
  },
  ntse: {
    mat: 'Mental Ability: reasoning patterns, series, coding, non-verbal — not school science.',
    'sat-sci': 'Integrated Class 9–10 science; rotate physics/chemistry/life science contexts.',
    'sat-sst': 'History/Civics/Geography NCERT; avoid engineering math.',
    'sat-math': 'Class 9–10 math only; clear numbers and diagrams in words if needed.',
  },
  'rjc-cet': {
    math: 'Intermediate mathematics for CET; varied stem openings.',
    sci: 'Integrated science: rotate physics/chemistry/biology items; label topic clearly in topic field.',
    eng: 'English: grammar, vocabulary, reading comprehension — single-best answer MCQs.',
  },
  gate: {
    ga: 'GATE GA: verbal + quantitative + reasoning; no core engineering technicals unless GA-style.',
    'eng-core': 'Engineering core only: SOM, thermo, fluids, circuits — not CS theory and not school arithmetic.',
    'eng-math': 'Engineering mathematics only: linear algebra, ODE, probability, transforms — exam-appropriate GATE difficulty.',
    eng: 'Engineering mathematics: linear algebra, ODE, probability, transforms — exam-appropriate difficulty.',
    cs: 'CS technical: algorithms, DS, OS, networks, DB, TOC — plausible wrong options from common bugs/misconceptions.',
  },
  sainik: {
    math: 'School arithmetic/geometry only; avoid JEE calculus and coordinate geometry of Class 11–12.',
    intel: 'Reasoning and patterns only — not school science facts.',
    lang: 'English language MCQs only.',
    gk: 'General knowledge and current/static GK — not subject-specific JEE physics.',
  },
  navodaya: {
    mat: 'Figure and pattern reasoning described in words; not school science.',
    arith: 'Class 5 arithmetic only; no algebra of Class 10+.',
    lang: 'Simple English language for Class 6 entry.',
  },
  kv: {
    eng: 'School English grammar and comprehension.',
    hin: 'School Hindi व्याकरण and साहित्य basics.',
    math: 'Class 8–9 NCERT maths only.',
    sci: 'Class 8–9 NCERT science only.',
    sst: 'Class 8–9 history, geography, civics only.',
  },
  emrs: {
    mat: 'Mental ability / reasoning only.',
    arith: 'School arithmetic only.',
    lang: 'English language only.',
  },
  'nmms': {
    mat: 'Mental Ability: reasoning and logic puzzles. No school syllabus questions.',
    'sat-sci': 'Science SAT: direct Class 8 science concepts.',
    'sat-sst': 'Social Science SAT: direct history, civics, and geography.',
    'sat-math': 'Mathematics SAT: Class 8 level algebra, geometry, and arithmetic.',
  },
  'olympiad': {
    math: 'Olympiad Math: HOTS arithmetic, algebra, and geometry.',
    sci: 'Olympiad Science: deep conceptual science questions.',
    eng: 'Olympiad English: advanced grammar and usage.',
    mat: 'Olympiad Logical Reasoning: logical puzzles and series.',
  },
  'rgukt-iiit': {
    math: 'RGUKT Math: Class 10 board level questions.',
    phy: 'RGUKT Physics: basic mechanics, optics, and electricity.',
    chem: 'RGUKT Chemistry: basic reactions and periodic table.',
    bio: 'RGUKT Biology: basic plant and animal physiology.',
  },
};

export function getSubjectDisciplineRules(examId: string, subjectId: string): string {
  return SUBJECT_DISCIPLINE_RULES[examId]?.[subjectId] ??
    'Stay strictly within this subject; use terminology and difficulty typical of the named exam — not a generic trivia quiz.';
}

/** Full block for prompts: syllabus + discipline + subject lock. */
export function getSubjectGenerationBrief(examId: string, subjectId: string, subjectName: string): string {
  const syllabus = getSubjectSyllabusContext(examId, subjectId);
  const discipline = getSubjectDisciplineRules(examId, subjectId);
  return [
    `SUBJECT LOCK: Generate ONLY questions for "${subjectName}" (code: ${subjectId}) in "${examId}". Every stem and option must clearly belong to this subject. Do not mix in questions meant for other subjects or other examinations.`,
    `SYLLABUS ANCHORS (cover varied units across the paper, not one chapter repeated):\n${syllabus}`,
    `DISCIPLINE & REALISM:\n${discipline}`,
  ].join('\n\n');
}

/** Discrete syllabus units used to rotate topics inside one paper (anti-repeat). */
export function getSyllabusUnits(examId: string, subjectId: string): string[] {
  const text = getSubjectSyllabusContext(examId, subjectId);
  const parts = text
    .split(/[,;]| - |\band\b/i)
    .map((s) => s.replace(/\([^)]*\)/g, '').replace(/[:.]/g, ' ').trim())
    .map((s) => s.replace(/\s+/g, ' '))
    .filter((s) => s.length >= 4 && s.length <= 72);
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  return unique.length ? unique : [text.slice(0, 72)];
}
