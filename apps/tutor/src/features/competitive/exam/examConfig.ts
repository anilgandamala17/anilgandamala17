/**
 * Centralized competitive exam configuration.
 * UI must read rules from here — never hard-code exam-specific behavior in panels.
 */
import { COMPETITIVE_EXAMS, type Exam } from '@/data/mockData';
import { EXAM_META } from '@/features/competitive/data/examMeta';

export type ExamMarkingScheme = {
  correctMarks: number;
  incorrectMarks: number;
  unansweredMarks: number;
  negativeMarking: boolean;
};

export type ExamSecurityPolicy = {
  /** Applied only when Available Exams mounts the proctored path (`flowType === 'standard'`). */
  cameraRequired: boolean;
  microphoneRequired: boolean;
  fullscreenRequired: boolean;
  tabMonitoringEnabled: boolean;
  maxSecurityViolations: number;
};

export type ExamConfig = {
  examId: string;
  name: string;
  durationMinutes: number;
  totalQuestions: number;
  maximumMarks: number;
  sections: { id: string; name: string; questionsCount: number }[];
  questionTypes: string[];
  markingScheme: ExamMarkingScheme;
  language: string;
  security: ExamSecurityPolicy;
  tagline?: string;
  focus?: string;
};

const DEFAULT_MARKING: ExamMarkingScheme = {
  correctMarks: 4,
  incorrectMarks: -1,
  unansweredMarks: 0,
  negativeMarking: true,
};

const DEFAULT_SECURITY: ExamSecurityPolicy = {
  /** Enable per-exam when live proctoring is required; practice catalogs stay optional. */
  cameraRequired: false,
  microphoneRequired: false,
  fullscreenRequired: true,
  tabMonitoringEnabled: true,
  maxSecurityViolations: 2,
};

function totalQuestionsFor(exam: Exam): number {
  return exam.subjects.reduce((sum, s) => sum + (s.questionsCount || 0), 0);
}

/** Build ExamConfig from catalog exam (+ optional meta). */
export function getExamConfig(exam: Exam): ExamConfig {
  const totalQuestions = totalQuestionsFor(exam);
  const marking = DEFAULT_MARKING;
  const meta = EXAM_META[exam.id];
  return {
    examId: exam.id,
    name: exam.name,
    durationMinutes: exam.timeMinutes,
    totalQuestions,
    maximumMarks: totalQuestions * marking.correctMarks,
    sections: exam.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      questionsCount: s.questionsCount,
    })),
    questionTypes: ['MCQ'],
    markingScheme: marking,
    language: 'English',
    security: { ...DEFAULT_SECURITY },
    tagline: meta?.tagline,
    focus: meta?.focus,
  };
}

export function getExamConfigById(examId: string): ExamConfig | null {
  const exam = COMPETITIVE_EXAMS.find((e) => e.id === examId);
  return exam ? getExamConfig(exam) : null;
}

export type SubmissionPhase =
  | 'idle'
  | 'validating'
  | 'awaiting_confirmation'
  | 'submitting'
  | 'success'
  | 'failed';

export type ExamLifecycleStatus =
  | 'NOT_STARTED'
  | 'INSTRUCTIONS'
  | 'SYSTEM_CHECK'
  | 'READY'
  | 'ACTIVE'
  | 'REVIEW'
  | 'SUBMITTING'
  | 'SUBMITTED'
  | 'AUTO_SUBMITTED';
