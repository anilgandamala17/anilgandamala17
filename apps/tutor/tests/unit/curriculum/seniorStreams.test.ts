import { describe, expect, it } from 'vitest';
import {
  SENIOR_STREAMS,
  SENIOR_UNION_SUBJECT_IDS,
  filterSubjectsForStream,
  inferStreamFromSubject,
  isSeniorGrade,
  normalizeStream,
} from '@/features/curriculum/data/seniorStreams';
import { getSubjectsForGradeStream } from '@/features/curriculum/data/schoolCurriculum';
import type { SchoolSubject } from '@/types';

const sampleSubjects: SchoolSubject[] = [
  { id: 'english', name: 'English', icon: '', color: '', description: '', chapters: [] },
  { id: 'mathematics', name: 'Mathematics', icon: '', color: '', description: '', chapters: [] },
  { id: 'physics', name: 'Physics', icon: '', color: '', description: '', chapters: [] },
  { id: 'chemistry', name: 'Chemistry', icon: '', color: '', description: '', chapters: [] },
  { id: 'biology', name: 'Biology', icon: '', color: '', description: '', chapters: [] },
  { id: 'computer-science', name: 'Computer Science', icon: '', color: '', description: '', chapters: [] },
];

describe('senior streams', () => {
  it('normalizes only mpc/bipc', () => {
    expect(normalizeStream('mpc')).toBe('mpc');
    expect(normalizeStream('bipc')).toBe('bipc');
    expect(normalizeStream('invalid')).toBeNull();
    expect(normalizeStream(null)).toBeNull();
  });

  it('recognizes Class 11/12 senior grades', () => {
    expect(isSeniorGrade('grade-11-science')).toBe(true);
    expect(isSeniorGrade('grade-12-science')).toBe(true);
    expect(isSeniorGrade('grade-10')).toBe(false);
  });

  it('MPC subjects are English, Mathematics, Physics, Chemistry', () => {
    expect([...SENIOR_STREAMS.mpc.subjectIds]).toEqual([
      'english',
      'mathematics',
      'physics',
      'chemistry',
    ]);
    const filtered = filterSubjectsForStream(sampleSubjects, 'mpc').map((s) => s.id);
    expect(filtered).toEqual(['english', 'mathematics', 'physics', 'chemistry']);
    expect(filtered).not.toContain('biology');
    expect(filtered).not.toContain('computer-science');
  });

  it('BiPC subjects are English, Biology, Physics, Chemistry', () => {
    expect([...SENIOR_STREAMS.bipc.subjectIds]).toEqual([
      'english',
      'biology',
      'physics',
      'chemistry',
    ]);
    const filtered = filterSubjectsForStream(sampleSubjects, 'bipc').map((s) => s.id);
    expect(filtered).toEqual(['english', 'biology', 'physics', 'chemistry']);
    expect(filtered).not.toContain('mathematics');
    expect(filtered).not.toContain('computer-science');
  });

  it('union excludes Computer Science', () => {
    expect(SENIOR_UNION_SUBJECT_IDS).not.toContain('computer-science');
  });

  it('infers stream from subject', () => {
    expect(inferStreamFromSubject('mathematics')).toBe('mpc');
    expect(inferStreamFromSubject('biology')).toBe('bipc');
    expect(inferStreamFromSubject('physics')).toBeNull();
    expect(inferStreamFromSubject('computer-science')).toBeNull();
  });

  it.each([
    ['grade-11-science', 'mpc'] as const,
    ['grade-11-science', 'bipc'] as const,
    ['grade-12-science', 'mpc'] as const,
    ['grade-12-science', 'bipc'] as const,
  ])('%s %s subjects match stream source of truth', (gradeId, stream) => {
    const names = getSubjectsForGradeStream(gradeId, stream).map((s) => s.name);
    if (stream === 'mpc') {
      expect(names).toEqual(['English', 'Mathematics', 'Physics', 'Chemistry']);
    } else {
      expect(names).toEqual(['English', 'Biology', 'Physics', 'Chemistry']);
    }
    expect(names).not.toContain('Computer Science');
  });
});
