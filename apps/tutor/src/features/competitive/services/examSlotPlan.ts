import type { ExamDifficulty } from '@/features/competitive/data/examSyllabus';
import { allocateDifficultySequence } from '@/features/competitive/data/examSyllabus';
import { getNcertChapters } from '@/features/competitive/data/competitive/ncertSyllabus';
import { getSyllabusUnits } from '@/features/competitive/data/examSyllabus';

export const FORMAT_IDS = [
  'NUMERICAL_WORD',
  'ASSERTION_REASON',
  'STATEMENT_PAIR',
  'CONCEPTUAL_DIRECT',
  'QUALITATIVE_COMPARE',
  'GRAPH_OR_LIMIT_SCENARIO',
  'NEGATIVE_OR_EXCEPTION',
  'SUBJECTIVE_STYLE_MCQ',
  'DATA_COMPREHENSION',
  'CASE_APPLICATION',
] as const;

export type QuestionFormat = (typeof FORMAT_IDS)[number];

export const FORMAT_RULES: Record<QuestionFormat, string> = {
  NUMERICAL_WORD:
    'Word problem leading to a definite numeric or symbolic result; four options are distinct values/expressions.',
  ASSERTION_REASON:
    'Assertion (A) and Reason (R) with standard four AR truth choices.',
  STATEMENT_PAIR:
    'Statement I and Statement II; choose the correct option about their truth.',
  CONCEPTUAL_DIRECT:
    'Pure concept MCQ with minimal calculation; tests definition, condition, or classification.',
  QUALITATIVE_COMPARE:
    'Compare, rank, or identify largest/smallest/strongest among four scenarios.',
  GRAPH_OR_LIMIT_SCENARIO:
    'Describe a graph, limit, or physical situation in words; options are interpretations.',
  NEGATIVE_OR_EXCEPTION:
    'Which is NOT correct / incorrect / exception — one option is wrong in the requested sense.',
  SUBJECTIVE_STYLE_MCQ:
    'Four options are short paragraphs; choose the BEST or MOST COMPLETE answer.',
  DATA_COMPREHENSION:
    'Short data paragraph or table in the stem, then one MCQ from that data.',
  CASE_APPLICATION:
    'Short real/lab/situational case; choose the best explanation or next step.',
};

export interface ExamQuestionSlot {
  index: number;
  difficulty: ExamDifficulty;
  format: QuestionFormat;
  syllabusUnit: string;
  topicId?: string;
  chapterTitle?: string;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function buildExamSlotPlan(
  examId: string,
  subjectId: string,
  count: number,
  seed = 0,
): ExamQuestionSlot[] {
  const difficulties = allocateDifficultySequence(examId, subjectId, count);
  const units = getSyllabusUnits(examId, subjectId);
  const chapters = getNcertChapters(examId, subjectId);
  const formatOffset = hashString(`${examId}:${subjectId}:${seed}`) % FORMAT_IDS.length;

  const slots: ExamQuestionSlot[] = [];
  let lastUnit = '';
  let lastTopicId = '';

  for (let i = 0; i < count; i++) {
    const chapter = chapters.length ? chapters[(i + formatOffset) % chapters.length] : undefined;
    let unit = units[(i + formatOffset) % Math.max(units.length, 1)] ?? 'General';
    if (unit === lastUnit && units.length > 1) {
      unit = units[(i + formatOffset + 1) % units.length];
    }
    lastUnit = unit;

    const topicId = chapter?.id;
    if (topicId === lastTopicId && chapters.length > 1) {
      const alt = chapters[(i + formatOffset + 2) % chapters.length];
      slots.push({
        index: i,
        difficulty: difficulties[i] ?? 'Medium',
        format: FORMAT_IDS[(i + formatOffset) % FORMAT_IDS.length],
        syllabusUnit: alt?.title ?? unit,
        topicId: alt?.id,
        chapterTitle: alt?.title,
      });
      lastTopicId = alt?.id ?? '';
      continue;
    }
    lastTopicId = topicId ?? '';

    slots.push({
      index: i,
      difficulty: difficulties[i] ?? 'Medium',
      format: FORMAT_IDS[(i + formatOffset) % FORMAT_IDS.length],
      syllabusUnit: chapter?.title ?? unit,
      topicId: chapter?.id,
      chapterTitle: chapter?.title,
    });
  }
  return slots;
}

export function formatSlotPlanTable(slots: ExamQuestionSlot[]): string {
  return slots
    .map(
      (s) =>
        `Q${s.index + 1}: difficulty=${s.difficulty}, format=${s.format}, topicId=${s.topicId ?? 'auto'}, unit="${s.syllabusUnit}"`,
    )
    .join('\n');
}
