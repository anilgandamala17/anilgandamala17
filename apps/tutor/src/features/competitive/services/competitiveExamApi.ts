/**
 * FUTURE BACKEND:
 * POST /api/competitive/generate-exam
 *   { examId, examName, subjectId, subjectName, count, examYear, mode?, topicIds? }
 *   → { questions, generationVersion, sourcePolicy, validationRejectedCount }
 * NOW: mockAdapter.generateExam(...) + client-side validation
 */

import type { Question } from '@/features/competitive/data/competitiveQuestions'
import {
  assignDefaultMetadata,
  type ValidatedQuestion,
} from './examSourceValidator'
import { buildExamSlotPlan } from './examSlotPlan'
import { finalizeExamPaper } from './finalizeExamPaper'
import { lockScienceDiscipline } from '@/features/competitive/data/competitive/subjectDiscipline'
import { mockAdapter } from '@/services/adapters/mockAdapter'

export class CompetitiveExamGenerationError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'CompetitiveExamGenerationError'
  }
}

export interface GenerateExamApiParams {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  count: number
  examYear: string
  mode?: 'mock' | 'pyq'
  topicIds?: string[]
}

export interface GenerateExamApiResult {
  questions: Question[]
  generationVersion: string
  sourcePolicy: string
  validationRejectedCount: number
}

function clientValidateQuestions(
  questions: ValidatedQuestion[],
  params: GenerateExamApiParams,
): Question[] {
  const scienceDiscipline =
    params.subjectId === 'sci' || params.subjectId === 'sat-sci'
      ? lockScienceDiscipline(`${params.examId}:${params.subjectId}:${params.examYear}`)
      : undefined
  const slots = buildExamSlotPlan(params.examId, params.subjectId, params.count, Date.now())

  const withMeta = questions.map((q) =>
    assignDefaultMetadata(q, {
      examId: params.examId,
      subjectId: params.subjectId,
    }),
  )

  const finalized = finalizeExamPaper(withMeta, slots, {
    examId: params.examId,
    subjectId: params.subjectId,
    subjectName: params.subjectName,
    scienceDiscipline,
    paperSeed: `${params.examId}:${params.subjectId}:${params.examYear}`,
  })

  if (import.meta.env.DEV) {
    console.debug(
      '[exam-generation] client validation rejected:',
      `subject=${finalized.rejected.subject}`,
      `source=${finalized.rejected.source}`,
      `difficulty=${finalized.rejected.difficulty}`,
      `options=${finalized.rejected.options}`,
      `duplicates=${finalized.rejected.duplicates}`,
    )
  }

  if (!finalized.questions.length) {
    throw new CompetitiveExamGenerationError(
      'INSUFFICIENT_CONTENT',
      'Not enough valid questions are available for the selected exam and subject.',
    )
  }

  return finalized.questions
}

export async function generateExamViaApi(
  params: GenerateExamApiParams,
): Promise<GenerateExamApiResult> {
  const raw = await mockAdapter.generateExam(params)
  const questions = clientValidateQuestions(raw.questions as ValidatedQuestion[], params)
  return {
    questions,
    generationVersion: raw.generationVersion,
    sourcePolicy: raw.sourcePolicy,
    validationRejectedCount: raw.validationRejectedCount,
  }
}
