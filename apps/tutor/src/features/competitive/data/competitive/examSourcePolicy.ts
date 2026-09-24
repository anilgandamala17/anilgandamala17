export type SourceFoundation =
  | 'NCERT'
  | 'NCERT_FOUNDATION'
  | 'INTERMEDIATE_FIRST'
  | 'OFFICIAL_SYLLABUS_ONLY';

export type NcertStrictness = 'strict' | 'foundation' | 'supporting' | 'none';

export interface ExamSourcePolicy {
  examId: string;
  foundation: SourceFoundation;
  syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS';
  difficulty: string;
  questionStyle: string;
  ncertStrictness: NcertStrictness;
  intermediateBoard?: 'AP' | 'TG' | 'AP_TG';
}

export const EXAM_SOURCE_POLICIES: Record<string, ExamSourcePolicy> = {
  'jee-main': {
    examId: 'jee-main',
    foundation: 'NCERT',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'JEE_MAIN',
    questionStyle: 'JEE_MAIN',
    ncertStrictness: 'foundation',
  },
  'jee-advanced': {
    examId: 'jee-advanced',
    foundation: 'NCERT_FOUNDATION',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'JEE_ADVANCED',
    questionStyle: 'JEE_ADVANCED',
    ncertStrictness: 'foundation',
  },
  neet: {
    examId: 'neet',
    foundation: 'NCERT',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'NEET',
    questionStyle: 'NEET',
    ncertStrictness: 'strict',
  },
  eamcet: {
    examId: 'eamcet',
    foundation: 'INTERMEDIATE_FIRST',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'EAPCET',
    questionStyle: 'EAPCET',
    ncertStrictness: 'supporting',
    intermediateBoard: 'AP_TG',
  },
  polycet: {
    examId: 'polycet',
    foundation: 'OFFICIAL_SYLLABUS_ONLY',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'POLYCET',
    questionStyle: 'POLYCET',
    ncertStrictness: 'supporting',
  },
  ntse: {
    examId: 'ntse',
    foundation: 'NCERT',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'NTSE',
    questionStyle: 'NTSE',
    ncertStrictness: 'strict',
  },
  'rjc-cet': {
    examId: 'rjc-cet',
    foundation: 'OFFICIAL_SYLLABUS_ONLY',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'RJC_CET',
    questionStyle: 'RJC_CET',
    ncertStrictness: 'supporting',
  },
  gate: {
    examId: 'gate',
    foundation: 'OFFICIAL_SYLLABUS_ONLY',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'GATE',
    questionStyle: 'GATE',
    ncertStrictness: 'none',
  },
  sainik: {
    examId: 'sainik',
    foundation: 'OFFICIAL_SYLLABUS_ONLY',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'SAINIK',
    questionStyle: 'SAINIK',
    ncertStrictness: 'none',
  },
  navodaya: {
    examId: 'navodaya',
    foundation: 'OFFICIAL_SYLLABUS_ONLY',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'NAVODAYA',
    questionStyle: 'NAVODAYA',
    ncertStrictness: 'none',
  },
  kv: {
    examId: 'kv',
    foundation: 'NCERT',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'KV',
    questionStyle: 'KV',
    ncertStrictness: 'strict',
  },
  emrs: {
    examId: 'emrs',
    foundation: 'OFFICIAL_SYLLABUS_ONLY',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'EMRS',
    questionStyle: 'EMRS',
    ncertStrictness: 'none',
  },
  nmms: {
    examId: 'nmms',
    foundation: 'NCERT',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'NMMS',
    questionStyle: 'NMMS',
    ncertStrictness: 'strict',
  },
  olympiad: {
    examId: 'olympiad',
    foundation: 'NCERT',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'OLYMPIAD',
    questionStyle: 'OLYMPIAD',
    ncertStrictness: 'foundation',
  },
  'rgukt-iiit': {
    examId: 'rgukt-iiit',
    foundation: 'NCERT',
    syllabusAuthority: 'OFFICIAL_EXAM_SYLLABUS',
    difficulty: 'RGUKT',
    questionStyle: 'RGUKT',
    ncertStrictness: 'foundation',
  },
};

export function getExamSourcePolicy(examId: string): ExamSourcePolicy | null {
  return EXAM_SOURCE_POLICIES[examId] ?? null;
}

export function summarizeSourcePolicy(policy: ExamSourcePolicy): string {
  const parts = [
    `Foundation: ${policy.foundation}`,
    `Syllabus: ${policy.syllabusAuthority}`,
    `Difficulty: ${policy.difficulty}`,
    `Style: ${policy.questionStyle}`,
    `NCERT strictness: ${policy.ncertStrictness}`,
  ];
  if (policy.intermediateBoard) {
    parts.push(`Intermediate board priority: ${policy.intermediateBoard}`);
  }
  return parts.join('; ');
}

export type SourceBasis = 'NCERT' | 'INTERMEDIATE' | 'OFFICIAL_SYLLABUS';

export function allowedSourceBases(policy: ExamSourcePolicy): SourceBasis[] {
  switch (policy.foundation) {
    case 'NCERT':
      return ['NCERT', 'OFFICIAL_SYLLABUS'];
    case 'NCERT_FOUNDATION':
      return ['NCERT', 'OFFICIAL_SYLLABUS'];
    case 'INTERMEDIATE_FIRST':
      return ['INTERMEDIATE', 'NCERT', 'OFFICIAL_SYLLABUS'];
    case 'OFFICIAL_SYLLABUS_ONLY':
      return ['OFFICIAL_SYLLABUS'];
    default:
      return ['OFFICIAL_SYLLABUS'];
  }
}
