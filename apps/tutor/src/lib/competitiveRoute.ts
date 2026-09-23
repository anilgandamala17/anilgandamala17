/**
 * URL contract for Competitive Mode.
 *
 * Every screen inside `/student/competitive` is addressable so a refresh, a
 * shared link, or the browser back button lands exactly where the student was
 * instead of resetting to the exam catalog.
 */
import type { Exam, ExamSubject, Paper } from '../data/mockData';
import { COMPETITIVE_EXAMS } from '../data/mockData';
import type { Question } from '../data/competitiveQuestions';
import { EXAM_GENERATION_VERSION } from '../data/competitive/generationVersion';

/** Active hub sections (Analytics removed — lives on /student/dashboard?mode=competitive). */
export const COMPETITIVE_SECTIONS = [
    'exams',
    'weekly',
    'quizzes',
    'questionary',
    'pyqs',
    'mock',
] as const;

export type CompetitiveSection = (typeof COMPETITIVE_SECTIONS)[number];

/** Legacy analytics section — redirect callers to the unified dashboard. */
export const LEGACY_PERFORMANCE_SECTION = 'performance';

export const SECTION_PARAM = 'section';

/** Params owned by the flows; cleared whenever the student switches sections. */
export const FLOW_PARAMS = [
    'step',
    'exam',
    'subject',
    'paper',
    'topic',
    'chapter',
    'challenge',
    'weeklySession',
    'q',
] as const;

export function isLegacyPerformanceSection(value: string | null): boolean {
    return value === LEGACY_PERFORMANCE_SECTION;
}

export function normalizeSection(value: string | null): CompetitiveSection {
    if (isLegacyPerformanceSection(value)) return 'exams';
    return COMPETITIVE_SECTIONS.includes(value as CompetitiveSection)
        ? (value as CompetitiveSection)
        : 'exams';
}

/** Map an exam draft flowType to the competitive hub `section` query value. */
export function flowTypeToSection(flowType: string): CompetitiveSection {
    switch (flowType) {
        case 'pyq':
            return 'pyqs';
        case 'mock':
            return 'mock';
        case 'weekly':
            return 'weekly';
        default:
            return 'exams';
    }
}

export function findExam(examId: string | null): Exam | null {
    if (!examId) return null;
    return COMPETITIVE_EXAMS.find((exam) => exam.id === examId) ?? null;
}

export function findSubject(exam: Exam | null, subjectId: string | null): ExamSubject | null {
    if (!exam || !subjectId) return null;
    return exam.subjects.find((subject) => subject.id === subjectId) ?? null;
}

export function findPaper(exam: Exam | null, year: string | null): Paper | null {
    if (!exam || !year) return null;
    return exam.papers.find((paper) => String(paper.year) === year) ?? null;
}

export type ExamFlowStep = 'exam' | 'subject' | 'paper' | 'solving' | 'result';

export function normalizeExamStep(value: string | null): ExamFlowStep {
    switch (value) {
        case 'subject':
        case 'paper':
        case 'solving':
        case 'result':
            return value;
        default:
            return 'exam';
    }
}

/* ── Live exam session persistence ───────────────────────────────────────── */

export type ExamDraftScope = 'full' | 'subject';

/** v3 full-paper drafts + legacy v2 subject drafts (read for migration). */
export interface ExamDraft {
    version: 2 | 3;
    flowType: string;
    examId: string;
    /** Required for subject-scoped sessions; 'full' for combined papers. */
    subjectId: string;
    scope?: ExamDraftScope;
    paperYear?: string;
    step: 'solving' | 'result';
    questions: Question[];
    currentQuestionIndex: number;
    userAnswers: number[];
    visitedQuestions: boolean[];
    markedForReview: boolean[];
    bookmarked: boolean[];
    eliminated: Record<number, number[]>;
    notes: Record<number, string>;
    timer: number;
    elapsedSeconds: number;
    /** Palette filter only — never resets answers/timer. */
    subjectFilter?: string | null;
    savedAt: number;
}

export const FULL_PAPER_SUBJECT_ID = 'full';

/** Sessions older than this are treated as abandoned. */
const DRAFT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

function draftKey(
    flowType: string,
    examId?: string,
    subjectId?: string,
    topicRange?: string,
    paperYear?: string,
): string {
    const base = `aira-exam-draft:${flowType}`;
    if (!examId || !subjectId) return base;
    const range = topicRange ?? (paperYear ? `pyq-${paperYear}` : 'all');
    return `${base}:${examId}:${subjectId}:${range}:${EXAM_GENERATION_VERSION}`;
}

function fullDraftKey(flowType: string, examId: string, paperYear?: string): string {
    const yearPart = paperYear || 'all';
    return `aira-exam-draft:${flowType}:${examId}:full:${yearPart}:${EXAM_GENERATION_VERSION}`;
}

/** Exported for offline cache-isolation tests. */
export function examDraftCacheKey(
    flowType: string,
    examId: string,
    subjectId: string,
    paperYear?: string,
): string {
    if (subjectId === FULL_PAPER_SUBJECT_ID) {
        return fullDraftKey(flowType, examId, paperYear);
    }
    return draftKey(flowType, examId, subjectId, undefined, paperYear);
}

function legacyDraftKey(flowType: string): string {
    return `aira-exam-draft:${flowType}`;
}

function isUsableDraft(parsed: ExamDraft): boolean {
    return (
        (parsed.version === 2 || parsed.version === 3) &&
        Array.isArray(parsed.questions) &&
        parsed.questions.length > 0
    );
}

export function saveExamDraft(draft: ExamDraft): void {
    try {
        const scope = draft.scope ?? (draft.subjectId === FULL_PAPER_SUBJECT_ID ? 'full' : 'subject');
        const normalized: ExamDraft = {
            ...draft,
            version: 3,
            scope,
            subjectId: scope === 'full' ? FULL_PAPER_SUBJECT_ID : draft.subjectId,
        };
        const key =
            scope === 'full'
                ? fullDraftKey(normalized.flowType, normalized.examId, normalized.paperYear)
                : draftKey(
                      normalized.flowType,
                      normalized.examId,
                      normalized.subjectId,
                      undefined,
                      normalized.paperYear,
                  );
        sessionStorage.setItem(key, JSON.stringify(normalized));
        sessionStorage.removeItem(legacyDraftKey(draft.flowType));
    } catch {
        /* storage full or unavailable — drafts are best effort */
    }
}

export function loadExamDraft(
    flowType: string,
    examId?: string,
    subjectId?: string,
    paperYear?: string,
): ExamDraft | null {
    try {
        const isFull =
            !subjectId || subjectId === FULL_PAPER_SUBJECT_ID || subjectId === 'all';
        const keys = [
            examId && isFull ? fullDraftKey(flowType, examId, paperYear) : null,
            examId && subjectId && !isFull
                ? draftKey(flowType, examId, subjectId, undefined, paperYear)
                : null,
            legacyDraftKey(flowType),
        ].filter(Boolean) as string[];

        for (const key of keys) {
            const raw = sessionStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw) as ExamDraft;
            if (!isUsableDraft(parsed)) continue;
            if (examId && parsed.examId !== examId) continue;
            if (
                subjectId &&
                !isFull &&
                parsed.subjectId &&
                parsed.subjectId !== subjectId &&
                parsed.subjectId !== FULL_PAPER_SUBJECT_ID
            ) {
                continue;
            }
            if (paperYear && parsed.paperYear && parsed.paperYear !== paperYear) continue;
            if (Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) {
                clearExamDraft(flowType, examId, subjectId, paperYear);
                return null;
            }
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
}

export function clearExamDraft(
    flowType: string,
    examId?: string,
    subjectId?: string,
    paperYear?: string,
): void {
    try {
        if (examId) {
            sessionStorage.removeItem(fullDraftKey(flowType, examId, paperYear));
            if (subjectId && subjectId !== FULL_PAPER_SUBJECT_ID) {
                sessionStorage.removeItem(
                    draftKey(flowType, examId, subjectId, undefined, paperYear),
                );
            }
        }
        sessionStorage.removeItem(legacyDraftKey(flowType));
    } catch {
        /* ignore */
    }
}

/**
 * Scan sessionStorage for the most recently saved usable exam draft.
 * Used by the Competitive dashboard "Continue preparation" card.
 */
export function findLatestExamDraft(): ExamDraft | null {
    try {
        let best: ExamDraft | null = null;
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (!key || !key.startsWith('aira-exam-draft:')) continue;
            const raw = sessionStorage.getItem(key);
            if (!raw) continue;
            let parsed: ExamDraft;
            try {
                parsed = JSON.parse(raw) as ExamDraft;
            } catch {
                continue;
            }
            if (!isUsableDraft(parsed)) continue;
            if (Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) continue;
            if (!best || parsed.savedAt > best.savedAt) best = parsed;
        }
        return best;
    } catch {
        return null;
    }
}

/* ── Topic quiz session persistence ──────────────────────────────────────── */

export interface QuizDraft {
    version: 1;
    subjectId: string;
    chapterId: string;
    step: 'solving' | 'result';
    questions: Question[];
    currentQuestionIndex: number;
    userAnswers: number[];
    timer: number;
    savedAt: number;
}

const QUIZ_DRAFT_KEY_PREFIX = 'aira-topic-quiz-draft';

function quizDraftKey(subjectId: string, chapterId: string): string {
    return `${QUIZ_DRAFT_KEY_PREFIX}:${subjectId}:${chapterId}`;
}

export function saveQuizDraft(draft: QuizDraft): void {
    try {
        const key = quizDraftKey(draft.subjectId, draft.chapterId);
        sessionStorage.setItem(key, JSON.stringify(draft));
        sessionStorage.removeItem(QUIZ_DRAFT_KEY_PREFIX);
    } catch {
        /* ignore */
    }
}

export function loadQuizDraft(subjectId?: string, chapterId?: string): QuizDraft | null {
    try {
        const keys = [
            subjectId && chapterId ? quizDraftKey(subjectId, chapterId) : null,
            QUIZ_DRAFT_KEY_PREFIX,
        ].filter(Boolean) as string[];

        for (const key of keys) {
            const raw = sessionStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw) as QuizDraft;
            if (parsed?.version !== 1 || !Array.isArray(parsed.questions) || !parsed.questions.length) {
                continue;
            }
            if (subjectId && parsed.subjectId !== subjectId) continue;
            if (chapterId && parsed.chapterId !== chapterId) continue;
            if (Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) {
                clearQuizDraft(subjectId, chapterId);
                return null;
            }
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
}

export function clearQuizDraft(subjectId?: string, chapterId?: string): void {
    try {
        if (subjectId && chapterId) {
            sessionStorage.removeItem(quizDraftKey(subjectId, chapterId));
        }
        sessionStorage.removeItem(QUIZ_DRAFT_KEY_PREFIX);
    } catch {
        /* ignore */
    }
}

/* ── AI explanation payload persistence ──────────────────────────────────── */

export interface ExplainPayload {
    competitiveQuestion: unknown;
    theme?: { color: string; bgColor: string; gradient: string };
    userAnswer?: number;
    examName?: string;
    returnTo?: string;
    /** When present, the explain page opens immediately (no second generation wait). */
    teachingSteps?: unknown[];
}

const EXPLAIN_KEY = 'aira-competitive-explain';

export function saveExplainPayload(payload: ExplainPayload): void {
    try {
        sessionStorage.setItem(EXPLAIN_KEY, JSON.stringify(payload));
    } catch {
        /* ignore */
    }
}

export function loadExplainPayload(): ExplainPayload | null {
    try {
        const raw = sessionStorage.getItem(EXPLAIN_KEY);
        return raw ? (JSON.parse(raw) as ExplainPayload) : null;
    } catch {
        return null;
    }
}
