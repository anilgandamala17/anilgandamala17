import { aiService } from '@/services/aiService';
import { Question } from '@/features/competitive/data/competitiveQuestions';
import { generateContentFallbackQuestions } from '@/features/competitive/data/examContentFallbacks';
import {
  allocateDifficultySequence,
  type ExamDifficulty,
} from '@/features/competitive/data/examSyllabus';
import {
  getRecentTopicHints,
  getRecentStemHints,
  makeSessionEntropy,
  recordQuestionTopics,
  recordQuestionStems,
  stemFingerprint,
} from './examSessionDiversity';
import {
  clampCorrectAnswer,
  dedupeQuestions,
  extractExamMcqArray,
  isValidExamQuestion,
  looksLikePlaceholderQuestion,
  normalizeOptions,
  questionsAreNearDuplicates,
  resolvePaperLength,
} from './examQuestionQuality';
import {
  CompetitiveExamGenerationError,
  generateExamViaApi,
} from './competitiveExamApi';
import { analytics } from '@/services/analyticsService';
import { EXAM_GENERATION_VERSION } from '@/features/competitive/data/competitive/generationVersion';
import { getExamSourcePolicy } from '@/features/competitive/data/competitive/examSourcePolicy';
import { lockScienceDiscipline } from '@/features/competitive/data/competitive/subjectDiscipline';
import { buildExamSlotPlan } from './examSlotPlan';
import { finalizeExamPaper } from './finalizeExamPaper';
import type { ValidatedQuestion } from './examSourceValidator';

export interface AIExamPaperParams {
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  count: number;
  examYear: string;
  mode?: 'mock' | 'pyq';
  /** When 'full', callers pass uncapped official counts (see resolvePaperLength). */
  paperScope?: 'subject' | 'full';
}

interface RawExamQuestion {
  text?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  topic?: string;
  difficulty?: string;
  questionFormat?: string;
}

interface SlotPlan {
  format: (typeof FORMAT_IDS)[number];
  difficulty: ExamDifficulty;
  unit: string;
}

import { FORMAT_IDS, FORMAT_RULES } from './examSlotPlan';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function mapRawToQuestion(
  q: RawExamQuestion,
  i: number,
  slot: SlotPlan,
  base: {
    examName: string;
    subjectName: string;
    subjectId: string;
    examYear: string;
    idPrefix: string;
  },
): Question | null {
  const opts = normalizeOptions(q.options);
  if (!opts) return null;
  const text = (q.text && String(q.text).trim()) || '';
  if (!text) return null;
  const candidate: Question = {
    id: `${base.idPrefix}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    options: opts,
    correctAnswer: clampCorrectAnswer(q.correctAnswer),
    explanation: (q.explanation && String(q.explanation).trim()) || `See the ${base.examName} syllabus for ${slot.unit}.`,
    topic: (q.topic && String(q.topic).trim()) || slot.unit,
    questionFormat: slot.format,
    difficulty: slot.difficulty,
    examYear: base.examYear,
    subjectId: base.subjectId,
    subjectName: base.subjectName,
  };
  if (looksLikePlaceholderQuestion(candidate)) return null;
  return candidate;
}

function generateValidatedFallbackPaper(params: AIExamPaperParams, totalCount: number): Question[] {
  const scienceDiscipline =
    params.subjectId === 'sci' || params.subjectId === 'sat-sci'
      ? lockScienceDiscipline(`${params.examId}:${params.subjectId}:${params.examYear}`)
      : undefined;
  const baseSeed = Date.now();
  const slots = buildExamSlotPlan(params.examId, params.subjectId, totalCount, baseSeed);
  const difficulties = slots.map((s) => s.difficulty);
  const raw = generateContentFallbackQuestions({
    examId: params.examId,
    examName: params.examName,
    subjectId: params.subjectId,
    subjectName: params.subjectName,
    count: totalCount,
    year: params.examYear,
    difficulties,
    seed: baseSeed,
    scienceDiscipline,
  });

  const finalized = finalizeExamPaper(raw as ValidatedQuestion[], slots, {
    examId: params.examId,
    subjectId: params.subjectId,
    subjectName: params.subjectName,
    scienceDiscipline,
    paperSeed: `${params.examId}:${params.subjectId}:${baseSeed}`,
  });

  if (finalized.questions.length < Math.ceil(totalCount * 0.75)) {
    throw new CompetitiveExamGenerationError(
      'INSUFFICIENT_CONTENT',
      'Not enough valid questions are available for the selected exam and subject.',
    );
  }
  return finalized.questions.slice(0, totalCount);
}

export const aiExamGenerator = {
  async generateAIExamPaper(params: AIExamPaperParams): Promise<Question[]> {
    const {
      examId,
      examName,
      subjectId,
      subjectName,
      count: requestedCount,
      examYear: year,
      mode = 'mock',
    } = params;

    const totalCount = Math.max(1, requestedCount);
    const policy = getExamSourcePolicy(examId);
    analytics.examGenerationStarted({
      exam_id: examId,
      subject_id: subjectId,
      question_count: totalCount,
      source_policy: policy?.difficulty ?? 'unknown',
      generation_version: EXAM_GENERATION_VERSION,
    });

    try {
      const result = await generateExamViaApi({
        examId,
        examName,
        subjectId,
        subjectName,
        count: totalCount,
        examYear: year,
        mode,
      });
      recordQuestionTopics(examId, subjectId, result.questions.map((q) => q.topic));
      recordQuestionStems(examId, subjectId, result.questions.map((q) => q.text));
      analytics.examGenerationCompleted({
        exam_id: examId,
        subject_id: subjectId,
        question_count: result.questions.length,
        source_policy: result.sourcePolicy,
        generation_version: result.generationVersion,
        validation_rejected_count: result.validationRejectedCount,
      });
      return result.questions;
    } catch (apiErr) {
      const skipFallback =
        apiErr instanceof CompetitiveExamGenerationError &&
        (apiErr.code === 'invalid_request' || apiErr.code === 'invalid_exam_subject');

      if (skipFallback) {
        analytics.examGenerationFailed({
          exam_id: examId,
          subject_id: subjectId,
          error_type: apiErr.code,
          generation_version: EXAM_GENERATION_VERSION,
        });
        throw apiErr;
      }

      try {
        const fallback = generateValidatedFallbackPaper(params, totalCount);
        recordQuestionTopics(examId, subjectId, fallback.map((q) => q.topic));
        recordQuestionStems(examId, subjectId, fallback.map((q) => q.text));
        analytics.examGenerationCompleted({
          exam_id: examId,
          subject_id: subjectId,
          question_count: fallback.length,
          source_policy: policy?.difficulty ?? 'fallback',
          generation_version: EXAM_GENERATION_VERSION,
          validation_rejected_count: 0,
        });
        return fallback;
      } catch (fallbackErr) {
        analytics.examGenerationFailed({
          exam_id: examId,
          subject_id: subjectId,
          error_type:
            fallbackErr instanceof CompetitiveExamGenerationError
              ? fallbackErr.code
              : 'generation_failed',
          generation_version: EXAM_GENERATION_VERSION,
        });
        throw fallbackErr;
      }
    }
  },

  async generateAITopicQuiz(subjectName: string, chapterName: string, count: number = 10): Promise<Question[]> {
    const sessionEntropy = makeSessionEntropy();
    const historyKey = `topic-quiz-${subjectName}-${chapterName}`;
    const historyHints = getRecentTopicHints(historyKey, 'chapter');
    const stemHints = getRecentStemHints(historyKey, 'chapter');
    const difficulties = allocateDifficultySequence('jee-main', count);
    const offset = hashString(`${historyKey}|${sessionEntropy}`) % FORMAT_IDS.length;
    const slots: SlotPlan[] = difficulties.map((difficulty, i) => ({
      format: FORMAT_IDS[(i + offset) % FORMAT_IDS.length],
      difficulty,
      unit: chapterName,
    }));

    const slotLines = slots
      .map((slot, i) => `  • Q${i + 1}: REQUIRED_FORMAT="${slot.format}" | REQUIRED_DIFFICULTY=${slot.difficulty} — ${FORMAT_RULES[slot.format]}`)
      .join('\n');

    const prompt = `You are an expert examiner writing a ${subjectName} chapter test on "${chapterName}" ONLY.
Generate EXACTLY ${count} original MCQs that a competitive/board paper would actually ask from this chapter. No generic "Practice Question N" stems.

SESSION_ENTROPY=${sessionEntropy}
${historyHints ? `Avoid these subtopics from earlier runs: ${historyHints}` : ''}
${stemHints ? `Avoid similar stem openings: ${stemHints}` : ''}

PER-QUESTION CONTRACT:
${slotLines}

Rules: stay inside "${chapterName}"; 4 distinct options; correctAnswer 0–3; unique topic labels; honour REQUIRED_DIFFICULTY (Easy/Medium/Hard mix).
OUTPUT: JSON array only with text, options[4], correctAnswer, explanation, topic, difficulty, questionFormat.`;

    const parsed: Question[] = [];
    const used = new Set<string>();
    try {
      const response = await aiService.callAI(prompt, 3, 1800, {
        temperature: 0.62 + (hashString(sessionEntropy) % 8) * 0.02,
      });
      const arr = extractExamMcqArray(response) ?? [];
      for (let i = 0; i < arr.length && parsed.length < count; i++) {
        const raw = arr[i] && typeof arr[i] === 'object' ? (arr[i] as RawExamQuestion) : null;
        if (!raw) continue;
        const mapped = mapRawToQuestion(raw, i, slots[parsed.length] ?? slots[0], {
          examName: 'Topic Quiz',
          subjectName,
          subjectId: subjectName.toLowerCase().slice(0, 8),
          examYear: new Date().getFullYear().toString(),
          idPrefix: `ai-quiz-${chapterName.replace(/\s+/g, '-')}`,
        });
        if (!mapped || !isValidExamQuestion(mapped)) continue;
        if (parsed.some((prev) => questionsAreNearDuplicates(prev, mapped))) continue;
        used.add(stemFingerprint(mapped.text));
        parsed.push(mapped);
      }
    } catch (error) {
      console.error('[aiExamGenerator] Topic quiz generation failed:', error);
    }

    if (parsed.length < count) {
      parsed.push(
        ...generateContentFallbackQuestions({
          examId: 'jee-main',
          examName: 'Topic Quiz',
          subjectId: subjectName.toLowerCase().includes('phys')
            ? 'phy'
            : subjectName.toLowerCase().includes('chem')
              ? 'chem'
              : subjectName.toLowerCase().includes('bio')
                ? 'bio'
                : 'math',
          subjectName,
          count: count - parsed.length,
          year: new Date().getFullYear().toString(),
          difficulties: difficulties.slice(parsed.length),
          seed: hashString(sessionEntropy),
          usedFingerprints: used,
        }).map((q) => ({ ...q, topic: chapterName })),
      );
    }

    const finalQs = dedupeQuestions(parsed)
      .slice(0, count)
      .map((q, i) => ({ ...q, difficulty: difficulties[i] ?? q.difficulty }));

    recordQuestionTopics(historyKey, 'chapter', finalQs.map((q) => q.topic));
    recordQuestionStems(historyKey, 'chapter', finalQs.map((q) => q.text));
    return finalQs;
  },

  generateFallbackQuestions(
    examName: string,
    subjectName: string,
    count: number,
    year: string,
    topicName?: string,
    subjectIdOverride?: string,
  ): Question[] {
    const examIdGuess = examName.toLowerCase().includes('neet')
      ? 'neet'
      : examName.toLowerCase().includes('advanced')
        ? 'jee-advanced'
        : examName.toLowerCase().includes('eamcet')
          ? 'eamcet'
          : 'jee-main';
    const subjectId = subjectIdOverride ?? subjectName.toLowerCase().substring(0, 3);
    return generateContentFallbackQuestions({
      examId: examIdGuess,
      examName,
      subjectId,
      subjectName,
      count,
      year,
      difficulties: allocateDifficultySequence(examIdGuess, count),
      seed: Date.now(),
    }).map((q) => (topicName ? { ...q, topic: topicName } : q));
  },
};

export { FORMAT_IDS, FORMAT_RULES, stemFingerprint, resolvePaperLength };
