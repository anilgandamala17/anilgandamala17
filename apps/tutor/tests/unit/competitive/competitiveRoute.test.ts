import { afterEach, describe, expect, it } from 'vitest';
import {
  clearExamDraft,
  flowTypeToSection,
  loadExamDraft,
  normalizeExamStep,
  normalizeSection,
  saveExamDraft,
  type ExamDraft,
} from '@/features/competitive/lib/competitiveRoute';

function sampleDraft(overrides: Partial<ExamDraft> = {}): ExamDraft {
  return {
    version: 3,
    flowType: 'mock',
    examId: 'jee-main',
    subjectId: 'physics',
    scope: 'subject',
    step: 'solving',
    questions: [
      {
        id: 'q1',
        text: 'Sample?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: 'Because A',
        topic: 'Mechanics',
        difficulty: 'Easy',
        examYear: '2025',
        subjectId: 'physics',
        subjectName: 'Physics',
      },
    ],
    currentQuestionIndex: 0,
    userAnswers: [0],
    visitedQuestions: [true],
    markedForReview: [false],
    bookmarked: [false],
    eliminated: {},
    notes: {},
    timer: 120,
    elapsedSeconds: 10,
    savedAt: Date.now(),
    ...overrides,
  };
}

describe('competitive route helpers', () => {
  it('normalizes sections and maps flow types', () => {
    expect(normalizeSection('weekly')).toBe('weekly');
    expect(normalizeSection('performance')).toBe('exams');
    expect(normalizeSection('quizzes')).toBe('exams');
    expect(normalizeSection('nope')).toBe('exams');
    expect(flowTypeToSection('pyq')).toBe('pyqs');
    expect(flowTypeToSection('mock')).toBe('mock');
    expect(normalizeExamStep('solving')).toBe('solving');
    expect(normalizeExamStep('weird')).toBe('exam');
  });
});

describe('exam draft recovery', () => {
  afterEach(() => {
    clearExamDraft('mock', 'jee-main', 'physics');
    sessionStorage.clear();
  });

  it('saves and restores a draft', () => {
    saveExamDraft(sampleDraft({ currentQuestionIndex: 0, userAnswers: [2] }));
    const loaded = loadExamDraft('mock', 'jee-main', 'physics');
    expect(loaded).not.toBeNull();
    expect(loaded?.examId).toBe('jee-main');
    expect(loaded?.userAnswers[0]).toBe(2);
    expect(loaded?.step).toBe('solving');
  });

  it('ignores malformed draft JSON safely', () => {
    sessionStorage.setItem('aira-exam-draft:mock', '{not-json');
    expect(loadExamDraft('mock', 'jee-main', 'physics')).toBeNull();
  });

  it('ignores unusable drafts with empty questions', () => {
    clearExamDraft('mock', 'jee-main', 'physics');
    sessionStorage.setItem(
      'aira-exam-draft:mock',
      JSON.stringify({ version: 3, questions: [], examId: 'jee-main', savedAt: Date.now() }),
    );
    expect(loadExamDraft('mock', 'jee-main', 'physics')).toBeNull();
  });
});
