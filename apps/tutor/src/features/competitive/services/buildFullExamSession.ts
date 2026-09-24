/**
 * Build a unified multi-subject CBT paper for Available Exams / PYQ / Mock.
 * Primary: sequential AI generation per catalog subject.
 * Fallback: existing generateFullExamPaper (bank + syllabus fallbacks).
 */
import type { Exam } from '@/data/mockData';
import {
  generateFullExamPaper,
  type Question,
} from '@/features/competitive/data/competitiveQuestions';
import { aiExamGenerator, resolvePaperLength } from './aiExamGenerator';

export type FullExamBuildProgress = {
  subjectIndex: number;
  subjectTotal: number;
  subjectName: string;
  phase: 'generating' | 'fallback' | 'done';
};

export type BuildFullExamSessionParams = {
  exam: Exam;
  examYear: string;
  mode: 'mock' | 'pyq' | 'standard';
  /** Return false to abort mid-build (stale generation id). */
  shouldContinue?: () => boolean;
  onProgress?: (p: FullExamBuildProgress) => void;
};

function stampNumbers(questions: Question[]): Question[] {
  return questions.map((q, i) => ({
    ...q,
    questionNumber: i + 1,
    examId: q.examId,
  }));
}

async function generateSubjectSlice(
  exam: Exam,
  subject: Exam['subjects'][number],
  examYear: string,
  mode: 'mock' | 'pyq' | 'standard',
): Promise<Question[]> {
  const apiMode = mode === 'standard' ? 'mock' : mode;
  const count = resolvePaperLength(subject.questionsCount, mode, 'full');
  return aiExamGenerator.generateAIExamPaper({
    examId: exam.id,
    examName: exam.name,
    subjectId: subject.id,
    subjectName: subject.name,
    count,
    examYear,
    mode: apiMode,
    paperScope: 'full',
  });
}

/**
 * Build a full combined examination for all subjects in catalog order.
 */
export async function buildFullExamSession(
  params: BuildFullExamSessionParams,
): Promise<Question[]> {
  const { exam, examYear, mode, shouldContinue, onProgress } = params;
  const subjects = exam.subjects;
  if (!subjects.length) return [];

  const combined: Question[] = [];
  let usedFallback = false;

  for (let i = 0; i < subjects.length; i++) {
    if (shouldContinue && !shouldContinue()) return [];
    const subject = subjects[i];
    onProgress?.({
      subjectIndex: i,
      subjectTotal: subjects.length,
      subjectName: subject.name,
      phase: 'generating',
    });

    try {
      const slice = await generateSubjectSlice(exam, subject, examYear, mode);
      if (shouldContinue && !shouldContinue()) return [];
      if (slice.length) {
        combined.push(...slice);
        continue;
      }
      usedFallback = true;
    } catch {
      usedFallback = true;
    }

    // Per-subject failure: fill from offline full-paper helper for that subject only
    onProgress?.({
      subjectIndex: i,
      subjectTotal: subjects.length,
      subjectName: subject.name,
      phase: 'fallback',
    });
    const offline = generateFullExamPaper(exam.id, examYear).filter(
      (q) => q.subjectId === subject.id,
    );
    if (offline.length) {
      combined.push(...offline);
    }
  }

  if (shouldContinue && !shouldContinue()) return [];

  // If nothing usable, last-resort full offline paper
  if (!combined.length) {
    onProgress?.({
      subjectIndex: 0,
      subjectTotal: subjects.length,
      subjectName: subjects[0]?.name ?? 'Exam',
      phase: 'fallback',
    });
    const offline = generateFullExamPaper(exam.id, examYear);
    if (!offline.length) {
      throw new Error('Could not build a full examination paper.');
    }
    usedFallback = true;
    onProgress?.({
      subjectIndex: subjects.length - 1,
      subjectTotal: subjects.length,
      subjectName: subjects[subjects.length - 1]?.name ?? 'Exam',
      phase: 'done',
    });
    return stampNumbers(offline);
  }

  void usedFallback;
  onProgress?.({
    subjectIndex: subjects.length - 1,
    subjectTotal: subjects.length,
    subjectName: subjects[subjects.length - 1]?.name ?? 'Exam',
    phase: 'done',
  });
  return stampNumbers(combined);
}
