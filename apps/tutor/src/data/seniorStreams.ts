import type { SchoolSubject } from '../types';

export type SeniorStreamId = 'mpc' | 'bipc';

export const STREAM_PARAM = 'stream';

export const SENIOR_GRADE_IDS = ['grade-11-science', 'grade-12-science'] as const;

export type SeniorStreamDefinition = {
  id: SeniorStreamId;
  label: string;
  shortLabel: string;
  tagline: string;
  /** Subject ids in display order for chips / Explore CTA. */
  subjectIds: readonly string[];
  /** Local hero image under /tutor-media/images/ */
  heroImage: string;
  accent: string;
};

/** Central MPC / BiPC subject mapping for Class 11 and Class 12. */
export const SENIOR_STREAMS: Record<SeniorStreamId, SeniorStreamDefinition> = {
  mpc: {
    id: 'mpc',
    label: 'MPC',
    shortLabel: 'MPC',
    tagline: 'Mathematics · Physics · Chemistry · English',
    subjectIds: ['english', 'mathematics', 'physics', 'chemistry'],
    heroImage: '/tutor-media/images/streams/mpc-hero.png',
    accent: '#2563eb',
  },
  bipc: {
    id: 'bipc',
    label: 'BiPC',
    shortLabel: 'BiPC',
    tagline: 'Biology · Physics · Chemistry · English',
    subjectIds: ['english', 'biology', 'physics', 'chemistry'],
    heroImage: '/tutor-media/images/streams/bipc-hero.png',
    accent: '#059669',
  },
};

export const SENIOR_STREAM_LIST: SeniorStreamDefinition[] = [
  SENIOR_STREAMS.mpc,
  SENIOR_STREAMS.bipc,
];

/** Union of all senior stream subjects (no Computer Science). */
export const SENIOR_UNION_SUBJECT_IDS: readonly string[] = [
  'english',
  'mathematics',
  'physics',
  'chemistry',
  'biology',
];

export function isSeniorGrade(gradeId: string | null | undefined): boolean {
  if (!gradeId) return false;
  return (SENIOR_GRADE_IDS as readonly string[]).includes(gradeId);
}

export function normalizeStream(value: string | null | undefined): SeniorStreamId | null {
  if (value === 'mpc' || value === 'bipc') return value;
  return null;
}

export function getStreamSubjectIds(stream: SeniorStreamId): readonly string[] {
  return SENIOR_STREAMS[stream].subjectIds;
}

export function filterSubjectsForStream(
  subjects: SchoolSubject[],
  stream: SeniorStreamId,
): SchoolSubject[] {
  const order = getStreamSubjectIds(stream);
  const byId = new Map(subjects.map((s) => [s.id, s]));
  return order.map((id) => byId.get(id)).filter((s): s is SchoolSubject => Boolean(s));
}

/**
 * Infer stream from a subject when deep-linking without ?stream=.
 * Math → mpc, Biology → bipc, shared subjects → null (require stream pick).
 * computer-science → null (removed from senior).
 */
export function inferStreamFromSubject(subjectId: string | null | undefined): SeniorStreamId | null {
  if (!subjectId || subjectId === 'computer-science') return null;
  if (subjectId === 'mathematics') return 'mpc';
  if (subjectId === 'biology') return 'bipc';
  return null;
}

export function streamDisplayName(stream: SeniorStreamId): string {
  return SENIOR_STREAMS[stream].label;
}
