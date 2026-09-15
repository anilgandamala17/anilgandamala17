import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Check, X, RotateCcw, ChevronLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../../services/aiService';
import { useCappedGeneratingProgress } from '../StudioPanel/GeneratingProgress';
interface QuizViewerProps {
    topic: string;
    subjectArea?: string;
    gradeLevel?: string;
    /** Curriculum / session: official topic description */
    topicDescription?: string;
    /** Curriculum: chapter name */
    chapterName?: string;
    /** Curriculum: subject description from catalog */
    subjectDescription?: string;
    lessonContent?: string[];
    onComplete?: (score: number) => void;
    /** Live progress for the Studio panel: how many of the generated questions are answered. */
    onProgress?: (progress: { answered: number; total: number }) => void;
    onBack?: () => void;
}

interface Question {
    id: number;
    text: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

type RawQuestion = { text: string; options: string[]; correctAnswer: number; explanation: string };

function stripAiJsonWrappers(s: string): string {
    const t = s.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    return t.trim();
}

/** Fixes common model mistakes like trailing commas before ] or } */
function stripTrailingCommasInJson(s: string): string {
    return s.replace(/,(\s*[\]}])/g, '$1');
}

/**
 * Extract the first top-level JSON array using bracket depth (avoids greedy-regex grabbing
 * the wrong `]` when explanations contain brackets).
 */
function extractBalancedJsonArray(raw: string): string | null {
    const start = raw.indexOf('[');
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < raw.length; i++) {
        const ch = raw[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (inString) {
            if (ch === '\\') escape = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') {
            inString = true;
            continue;
        }
        if (ch === '[') depth++;
        else if (ch === ']') {
            depth--;
            if (depth === 0) return raw.slice(start, i + 1);
        }
    }
    return null;
}

function unwrapQuestionsArray(parsed: unknown): RawQuestion[] | null {
    if (Array.isArray(parsed)) return parsed as RawQuestion[];
    if (parsed && typeof parsed === 'object') {
        const o = parsed as Record<string, unknown>;
        for (const key of ['questions', 'quiz', 'items', 'data']) {
            const v = o[key];
            if (Array.isArray(v)) return v as RawQuestion[];
        }
    }
    return null;
}

function parseQuestionsFromAIResponse(response: string): RawQuestion[] {
    const cleaned = stripAiJsonWrappers(response);
    const chunks: string[] = [];
    const balanced = extractBalancedJsonArray(cleaned);
    for (const base of [cleaned, balanced].filter(Boolean) as string[]) {
        chunks.push(base);
        chunks.push(stripTrailingCommasInJson(base));
    }
    for (const chunk of chunks) {
        try {
            const parsed = JSON.parse(chunk) as unknown;
            const arr = unwrapQuestionsArray(parsed);
            if (arr && arr.length > 0) return arr;
        } catch {
            /* try next */
        }
    }
    throw new Error('Could not parse quiz JSON');
}

/** Different slice of long lessons each generation so prompts are not identical. */
function buildLessonSnippet(lessonContent: string[], nonce: number, maxLen = 4000): string {
    const full = lessonContent.join('\n\n').trim();
    if (!full) return '';
    if (full.length <= maxLen) return full;
    const span = full.length - maxLen;
    const start = (Math.abs(nonce) * 2654435761) % (span + 1);
    return full.slice(start, start + maxLen);
}

const QUIZ_EMPHASIS_BY_NONCE = [
    'Emphasize precise definitions, terminology, and "what is" questions.',
    'Emphasize short scenarios, "what happens if", and applying ideas to new situations.',
    'Emphasize compare/contrast, "which is NOT correct", and reasoning about relationships.',
    'Emphasize procedures, steps, ordering, and "how would you" process questions where the topic allows.',
    'Emphasize misconceptions, common errors, and "find the mistake" style questions.',
] as const;

function extractGradeNumber(gradeLevel: string): number {
    const m = gradeLevel.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 8;
}

function getGradeTier(n: number): 'primary' | 'middle' | 'secondary' | 'senior' {
    if (n <= 5) return 'primary';
    if (n <= 8) return 'middle';
    if (n <= 10) return 'secondary';
    return 'senior';
}

function getDifficultyProfile(tier: ReturnType<typeof getGradeTier>): string {
    switch (tier) {
        case 'primary': return 'Use very simple language (age 6-11). Ask basic "what", "which" and "name" questions. Avoid complex calculations. Use everyday examples.';
        case 'middle': return 'Use moderate language (age 11-14). Mix conceptual and basic application questions. Include simple single-step calculations where relevant.';
        case 'secondary': return 'Use standard exam language (age 14-16). Include reasoning, multi-step problems, and board-exam style questions. Test both understanding and application.';
        case 'senior': return 'Use advanced academic language (age 16-18). Include analytical, problem-solving, and competitive-exam style questions. Expect numerical/formula-based answers for science and math.';
    }
}

function getSubjectQuestionPattern(subjectArea: string): string {
    const s = subjectArea.toLowerCase();
    if (s.includes('math')) return 'Focus on calculations, formula application, step-by-step problem solving, and numerical reasoning. Include at least 3 problems requiring computation.';
    if (s.includes('physics')) return 'Mix conceptual questions with numerical problems using formulas. Include questions on laws, units, and real-world applications.';
    if (s.includes('chemistry')) return 'Ask about reactions, properties, equations, and periodic trends. Include balanced equation interpretation and chemical formula questions.';
    if (s.includes('biology')) return 'Ask about structures, functions, processes, and classification. Reference diagrams where possible (describe part functions).';
    if (s.includes('science')) return 'Combine concept understanding, diagram-based questions, reasoning about phenomena, and real-world application.';
    if (s.includes('english')) return 'Focus on comprehension, grammar rules, vocabulary in context, literary devices, and writing conventions.';
    if (s.includes('hindi') || s.includes('language')) return 'Focus on grammar, vocabulary, comprehension, and literary meaning.';
    if (s.includes('social') || s.includes('history') || s.includes('geography')) return 'Ask about events, causes and effects, geographic features, dates/timelines, and civic concepts.';
    if (s.includes('computer') || s.includes('it') || s.includes('cs')) return 'Include code interpretation, concept definitions, algorithm steps, and practical application questions.';
    return 'Use a mix of conceptual, applied, and analytical question types.';
}

function coerceCorrectIndex(ca: unknown, numOptions: number): number {
    const len = Math.min(4, Math.max(2, numOptions));
    if (typeof ca === 'string') {
        const u = ca.trim().toUpperCase();
        if (/^[A-D]$/.test(u)) {
            const idx = u.charCodeAt(0) - 65;
            if (idx >= 0 && idx < len) return idx;
        }
        const n = parseInt(ca.trim(), 10);
        if (!Number.isNaN(n)) {
            if (n >= 1 && n <= len) return n - 1;
            if (n >= 0 && n < len) return n;
        }
    }
    if (typeof ca === 'number' && Number.isFinite(ca)) {
        const i = Math.trunc(ca);
        if (i >= 1 && i <= len) return i - 1;
        if (i >= 0 && i < len) return i;
    }
    return 0;
}

function normalizeQuestions(raw: RawQuestion[], topic: string): Question[] {
    const padPool = [
        'None of the other choices is the best answer.',
        'This is not the best fit for the question.',
        'Only partly correct; not the strongest choice.',
        'Not supported by the lesson or standard definitions.',
    ];
    const out: Question[] = [];
    for (const q of raw) {
        if (out.length >= 12) break;
        if (!q || typeof q.text !== 'string' || !q.text.trim()) continue;
        let opts = Array.isArray(q.options) ? q.options.map(o => String(o).trim()).filter(Boolean) : [];
        if (opts.length < 2) continue;
        if (opts.length > 4) opts = opts.slice(0, 4);
        let p = 0;
        while (opts.length < 4) {
            opts.push(padPool[p % padPool.length]);
            p++;
        }
        const correct = coerceCorrectIndex(q.correctAnswer, opts.length);
        const explanation =
            typeof q.explanation === 'string' && q.explanation.trim()
                ? q.explanation.trim()
                : `The best choice reflects key ideas about "${topic}".`;
        out.push({
            id: out.length + 1,
            text: q.text.trim(),
            options: opts.slice(0, 4),
            correctAnswer: Math.min(3, Math.max(0, correct)),
            explanation,
        });
    }
    if (out.length < 5) {
        throw new Error(`Too few valid questions after normalization (${out.length})`);
    }
    return out.slice(0, 10);
}

async function generateAIQuestions(params: {
    topic: string;
    subjectArea: string;
    gradeLevel: string;
    topicDescription?: string;
    chapterName?: string;
    subjectDescription?: string;
    lessonContent: string[];
    /** Increments each "new quiz"; changes prompt structure, not just an ID string. */
    generationNonce: number;
    /** Unique per request (random); breaks deterministic repeats at temperature 0. */
    requestSalt: string;
}): Promise<Question[]> {
    const {
        topic,
        subjectArea,
        gradeLevel,
        topicDescription,
        chapterName,
        subjectDescription,
        lessonContent,
        generationNonce,
        requestSalt,
    } = params;

    const contentSnippet = buildLessonSnippet(lessonContent, generationNonce);
    const emphasis = QUIZ_EMPHASIS_BY_NONCE[generationNonce % QUIZ_EMPHASIS_BY_NONCE.length];
    const questionStyleHint = [
        'Vary stems: some start with a context sentence, others are direct.',
        'Use distinct fictional names, quantities, or contexts in examples (do not reuse the same example story as other quiz runs).',
    ].join(' ');

    const curriculumBlock = [
        chapterName ? `Chapter / unit: ${chapterName}` : '',
        subjectDescription ? `Subject overview: ${subjectDescription}` : '',
        topicDescription ? `Topic description (from curriculum): ${topicDescription}` : '',
    ]
        .filter(Boolean)
        .join('\n');

    const gradeNum = extractGradeNumber(gradeLevel);
    const tier = getGradeTier(gradeNum);
    const difficultyProfile = getDifficultyProfile(tier);
    const subjectPattern = getSubjectQuestionPattern(subjectArea);

    const mainPrompt = `You are an expert Indian school assessment author specializing in ${subjectArea} for Class ${gradeNum} (${gradeLevel}).

=== STUDENT PROFILE ===
- Class / Grade: ${gradeNum} (${tier} level)
- Subject: ${subjectArea}
- Topic: "${topic}"
- Difficulty calibration: ${difficultyProfile}

=== SUBJECT QUESTION PATTERN ===
${subjectPattern}

${curriculumBlock ? `=== CURRICULUM CONTEXT ===\n${curriculumBlock}\n` : ''}
=== THIS QUIZ INSTANCE ===
- Generation index: ${generationNonce} — produce UNIQUE questions different from prior runs
- Request salt: ${requestSalt}
- Style emphasis: ${emphasis}
- ${questionStyleHint}

=== LESSON CONTENT ===
${contentSnippet || `Use standard Class ${gradeNum} ${subjectArea} NCERT/CBSE syllabus expectations for "${topic}".`}

STRICT RULES:
1. Generate EXACTLY 10 multiple-choice questions strictly about "${topic}" in ${subjectArea}.
2. Difficulty must match Class ${gradeNum}: ${difficultyProfile}
3. Follow the subject pattern: ${subjectPattern}
4. Each question must have EXACTLY 4 options. One correct answer.
5. "correctAnswer" = 0-based index (0, 1, 2, or 3). Never use letters.
6. "explanation" must explain WHY the correct answer is right AND why the top wrong option is wrong.
7. NO duplicate questions. NO generic questions unrelated to the topic.
8. For mathematics/physics: include actual numbers/formulas in at least 3 questions.

Return ONLY a JSON array — no markdown, no extra text:
[
  {
    "text": "Question stem?",
    "options": ["Option A","Option B","Option C","Option D"],
    "correctAnswer": 0,
    "explanation": "Correct because... The wrong options fail because..."
  }
]`;

    const compactPrompt = `You output ONLY valid JSON (no markdown).

Create exactly 10 multiple-choice quiz items for:
- Topic: "${topic}"
- Subject: ${subjectArea}
- Level: ${gradeLevel}

Context (may be partial):
${contentSnippet.slice(0, 2800) || `Standard ${gradeLevel} ${subjectArea} expectations for "${topic}".`}

Each item must be: {"text": string, "options": [exactly 4 strings], "correctAnswer": 0|1|2|3, "explanation": string}
correctAnswer is 0-based index into options.

Variety salt: ${requestSalt}

Output: one JSON array of 10 objects, nothing else.`;

    const runPrompt = async (p: string) => {
        const response = await aiService.callAI(p, 3, 1200, { temperature: 0.85 });
        const raw = parseQuestionsFromAIResponse(response);
        return normalizeQuestions(raw, topic);
    };

    try {
        return await runPrompt(mainPrompt);
    } catch (first) {
        console.warn('[QuizViewer] Primary quiz generation failed, trying compact prompt:', first);
        return await runPrompt(compactPrompt);
    }
}

// Fallback static questions that at least use the topic name
function getFallbackQuestions(topic: string, subjectArea: string): Question[] {
    return [
        {
            id: 1,
            text: `In ${subjectArea}, which statement best captures the main idea of "${topic}"?`,
            options: [
                `It is a core idea students should master in this topic.`,
                'It is unrelated to this subject.',
                'It only appears in advanced university courses.',
                'It refers to a historical figure only.',
            ],
            correctAnswer: 0,
            explanation: `"${topic}" is central to ${subjectArea} at this level.`,
        },
        {
            id: 2,
            text: `When applying "${topic}" in ${subjectArea}, what is the primary learning goal?`,
            options: [
                'To memorize unrelated facts.',
                'To use concepts correctly in explanations and simple problems.',
                'To skip definitions entirely.',
                'To ignore the syllabus.',
            ],
            correctAnswer: 1,
            explanation: `The goal is to understand and apply "${topic}" within ${subjectArea}.`,
        },
        {
            id: 3,
            text: `How does "${topic}" usually connect to other ideas in ${subjectArea}?`,
            options: [
                'It is always isolated.',
                'It links to other concepts and builds toward broader skills.',
                'It replaces every other topic.',
                'It is only vocabulary.',
            ],
            correctAnswer: 1,
            explanation: `"${topic}" connects to other parts of ${subjectArea}.`,
        },
        {
            id: 4,
            text: `Which is a common mistake students make about "${topic}"?`,
            options: [
                'Confusing it with a superficially similar but different idea.',
                'Reading the definition once.',
                'Using examples.',
                'Asking questions.',
            ],
            correctAnswer: 0,
            explanation: `Confusion with nearby concepts is typical for "${topic}".`,
        },
        {
            id: 5,
            text: `If a problem involves "${topic}" in ${subjectArea}, what should you check first?`,
            options: [
                'Random guessing.',
                'Definitions, given data, and which principle applies.',
                'Only the final answer format.',
                'Unrelated formulas.',
            ],
            correctAnswer: 1,
            explanation: `Start from definitions and what the question asks about "${topic}".`,
        },
    ];
}

function QuizCraftingLoader({
    tierColor,
    tierLabel,
    subjectArea,
    topic,
}: {
    tierColor: string;
    tierLabel: string;
    subjectArea: string;
    topic: string;
}) {
    const pct = useCappedGeneratingProgress(true);
    return (
        <div className="flex flex-col items-center justify-center h-full gap-5 p-6">
            <div className="relative">
                <motion.div className="w-16 h-16 rounded-full border-4 border-purple-100 dark:border-purple-900/40"
                    style={{ borderTopColor: tierColor }}
                    animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }} />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-purple-500" />
            </div>
            <div className="text-center w-full max-w-[260px]">
                <p className="font-semibold text-gray-800 dark:text-slate-100">Crafting your quiz…</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    <span className="font-medium" style={{ color: tierColor }}>{tierLabel}</span> level · {subjectArea}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium truncate">{topic}</p>
                <div className="mt-4 text-left">
                    <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">Generating questions…</span>
                        <span className="tabular-nums text-[10px] font-semibold text-gray-400">{Math.round(pct)}%</span>
                    </div>
                    <div
                        className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(pct)}
                        aria-label="Crafting your quiz"
                    >
                        <div
                            className="studio-progress-fill h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: tierColor }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function QuizViewer({
    topic,
    subjectArea = 'General',
    gradeLevel = 'School',
    topicDescription,
    chapterName,
    subjectDescription,
    lessonContent = [],
    onComplete,
    onProgress,
    onBack,
}: QuizViewerProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
    const [isReviewMode, setIsReviewMode] = useState(false);
    /** Bumps on each AI regeneration so questions are always fresh. */
    const [generationNonce, setGenerationNonce] = useState(0);

    const lessonFingerprint = useMemo(() => {
        const joined = lessonContent.join('\n');
        return `${lessonContent.length}:${joined.length}:${joined.slice(0, 200)}`;
    }, [lessonContent]);

    const runGeneration = useCallback(() => {
        let cancelled = false;
        setIsLoading(true);
        setLoadError(null);
        setShowResult(false);
        setIsReviewMode(false);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);

        const requestSalt = `${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2, 11)}`;

        generateAIQuestions({
            topic,
            subjectArea,
            gradeLevel,
            topicDescription,
            chapterName,
            subjectDescription,
            lessonContent,
            generationNonce,
            requestSalt,
        })
            .then(qs => {
                if (!cancelled) {
                    setQuestions(qs);
                    setUserAnswers(new Array(qs.length).fill(null));
                    setIsLoading(false);
                }
            })
            .catch(err => {
                console.warn('[QuizViewer] AI quiz generation failed:', err);
                if (!cancelled) {
                    const fallback = getFallbackQuestions(topic, subjectArea);
                    setQuestions(fallback);
                    setUserAnswers(new Array(fallback.length).fill(null));
                    setIsLoading(false);
                    const msg = err instanceof Error ? err.message : String(err);
                    let hint =
                        'Could not load AI-generated questions — showing offline practice questions for this topic.';
                    if (/no ai api keys|api key missing|not configured/i.test(msg)) {
                        hint +=
                            ' Set VITE_OPENROUTER_API_KEY, VITE_MISTRAL_API_KEY, VITE_DEEPSEEK_API_KEY, or VITE_SARVAM_API_KEY in Vercel → Settings → Environment Variables, then redeploy.';
                    } else {
                        hint += ' Tap "New quiz" to retry.';
                    }
                    setLoadError(hint);
                }
            });

        return () => {
            cancelled = true;
        };
    // lessonContent is summarized by lessonFingerprint to avoid spurious reruns when the parent passes a new array reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lessonFingerprint tracks lessonContent
    }, [
        topic,
        subjectArea,
        gradeLevel,
        topicDescription,
        chapterName,
        subjectDescription,
        lessonFingerprint,
        generationNonce,
    ]);

    useEffect(() => {
        return runGeneration();
    }, [runGeneration]);

    const requestNewQuiz = useCallback(() => {
        setGenerationNonce(n => n + 1);
    }, []);

    const currentQuestion = questions[currentQuestionIndex];

    const answeredCount = useMemo(
        () => userAnswers.reduce((acc: number, answer) => acc + (answer !== null ? 1 : 0), 0),
        [userAnswers],
    );

    // Ref keeps the effect stable when the parent passes a new callback each render.
    const onProgressRef = useRef(onProgress);
    onProgressRef.current = onProgress;

    useEffect(() => {
        onProgressRef.current?.({ answered: answeredCount, total: questions.length });
    }, [answeredCount, questions.length]);

    const scrollRef = useRef<HTMLDivElement>(null);

    const handleOptionClick = (index: number) => {
        if (isAnswered || !currentQuestion) return;
        setSelectedOption(index);
        setIsAnswered(true);
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = index;
        setUserAnswers(newAnswers);
        if (index === currentQuestion.correctAnswer) setScore(prev => prev + 1);
        // Bring the explanation into view so the answer and the Next button read as one step.
        requestAnimationFrame(() => {
            const el = scrollRef.current;
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        });
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setShowResult(true);
            if (onComplete && questions.length > 0) {
                const correct = questions.reduce((acc, q, i) => acc + (userAnswers[i] === q.correctAnswer ? 1 : 0), 0);
                onComplete(Math.floor((correct / questions.length) * 100));
            }
        }
    };

    const handleRetrySameSet = () => {
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setShowResult(false);
        setIsReviewMode(false);
        setUserAnswers(new Array(questions.length).fill(null));
    };

    const gradeNum = extractGradeNumber(gradeLevel);
    const tier = getGradeTier(gradeNum);
    const tierColor = tier === 'primary' ? '#10b981' : tier === 'middle' ? '#3b82f6' : tier === 'secondary' ? '#8b5cf6' : '#f59e0b';
    const tierLabel = tier === 'primary' ? 'Beginner' : tier === 'middle' ? 'Intermediate' : tier === 'secondary' ? 'Advanced' : 'Expert';
    // Static classes (not inline styles) so the fill can never be dropped by a `background`
    // shorthand collision and leave white text on a transparent button.
    const tierButtonClass =
        tier === 'primary' ? 'bg-emerald-500 hover:bg-emerald-600'
        : tier === 'middle' ? 'bg-blue-500 hover:bg-blue-600'
        : tier === 'secondary' ? 'bg-violet-500 hover:bg-violet-600'
        : 'bg-amber-500 hover:bg-amber-600';

    if (isLoading) {
        return (
            <QuizCraftingLoader
                tierColor={tierColor}
                tierLabel={tierLabel}
                subjectArea={subjectArea}
                topic={topic}
            />
        );
    }

    if (showResult && !isReviewMode) {
        const pct = Math.round((score / questions.length) * 100);
        const isPerfect = score === questions.length;
        const isGood = pct >= 70;
        const emoji = isPerfect ? '🏆' : isGood ? '🎉' : '📚';
        const msg = isPerfect ? 'Outstanding! Perfect mastery!' : isGood ? 'Great work! Strong understanding.' : 'Keep practising — you will get there!';
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-5">
                <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="text-6xl select-none">{emoji}</motion.div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{isPerfect ? 'Perfect Score!' : 'Quiz Complete!'}</h3>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: tierColor }}>{tierLabel}</span>
                        <span className="text-xs text-gray-400">{subjectArea}</span>
                    </div>
                    <div className="mt-4 relative w-32 h-32 mx-auto">
                        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                            <motion.circle cx="18" cy="18" r="16" fill="none" strokeWidth="3"
                                stroke={tierColor} strokeLinecap="round"
                                strokeDasharray="100.53" initial={{ strokeDashoffset: 100.53 }}
                                animate={{ strokeDashoffset: 100.53 - (100.53 * pct / 100) }}
                                transition={{ duration: 1.2, ease: 'easeOut' }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black" style={{ color: tierColor }}>{pct}%</span>
                            <span className="text-xs text-gray-400">{score}/{questions.length}</span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 max-w-[220px] mx-auto">{msg}</p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                    <button type="button" onClick={requestNewQuiz}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-bold shadow-md transition-all hover:opacity-90"
                        style={{ background: tierColor }}>
                        <Sparkles className="w-4 h-4" /> New Quiz
                    </button>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setIsReviewMode(true)}
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                            Review
                        </button>
                        <button type="button" onClick={handleRetrySameSet}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" /> Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showResult && isReviewMode) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                    <button type="button" onClick={() => setIsReviewMode(false)} className="flex items-center gap-2 text-sm font-bold text-purple-600">
                        <ChevronLeft className="w-4 h-4" /> Back to results
                    </button>
                    <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Review</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {questions.map((q, idx) => (
                        <div key={q.id} className="space-y-4 text-left">
                            <h4 className="font-bold text-gray-800 dark:text-slate-100 flex items-start gap-2">
                                <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-xs shrink-0 mt-0.5">{idx + 1}</span>
                                {q.text}
                            </h4>
                            <div className="space-y-2 pl-8">
                                {q.options.map((opt, optIdx) => {
                                    const isUserChoice = userAnswers[idx] === optIdx;
                                    const isCorrect = q.correctAnswer === optIdx;
                                    let cls = 'p-3 rounded-lg border text-sm flex items-center justify-between ';
                                    if (isCorrect) cls += 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-200';
                                    else if (isUserChoice) cls += 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-200';
                                    else cls += 'bg-gray-50 border-gray-100 text-gray-400 dark:bg-slate-800 dark:border-slate-700/50 dark:text-slate-500';
                                    return (
                                        <div key={optIdx} className={cls}>
                                            <span>{opt}</span>
                                            {isCorrect && <Check className="w-4 h-4 text-green-500" />}
                                            {isUserChoice && !isCorrect && <X className="w-4 h-4 text-red-500" />}
                                        </div>
                                    );
                                })}
                                {q.explanation && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 pl-1 italic">{q.explanation}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0 flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="shrink-0 p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800 gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                    {onBack && (
                        <button type="button" onClick={onBack} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors mr-1 shrink-0">
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                        </button>
                    )}
                    <span className="text-sm font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        Q {currentQuestionIndex + 1}/{questions.length}
                    </span>
                </div>
                <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    {loadError && (
                        <button
                            type="button"
                            onClick={requestNewQuiz}
                            disabled={isLoading}
                            title="Generate a new set of AI questions"
                            className="text-xs font-semibold px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors shrink-0 flex items-center gap-1"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            New quiz
                        </button>
                    )}
                    <span className="text-xs font-bold px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-full truncate max-w-[140px]" title={topic}>
                        {topic}
                    </span>
                </div>
            </div>

            {loadError && (
                <div className="shrink-0 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-200">
                    ⚠️ {loadError}
                </div>
            )}

            <div ref={scrollRef} className="flex-1 min-h-0 p-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: tierColor }}>{tierLabel}</span>
                    <span className="text-xs text-gray-400 truncate">{subjectArea}{chapterName ? ` · ${chapterName}` : ''}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: tierColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
                        transition={{ duration: 0.3 }} />
                </div>
                <AnimatePresence mode="wait">
                    <motion.div key={currentQuestionIndex} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.18 }}>
                        <h3 className="text-base font-semibold text-gray-800 dark:text-slate-100 mb-4 leading-relaxed">
                            {currentQuestion?.text}
                        </h3>
                        <div className="space-y-2.5">
                            {currentQuestion?.options.map((option, index) => {
                                const letter = ['A','B','C','D'][index];
                                const isSelected = selectedOption === index;
                                const isCorrect = index === currentQuestion.correctAnswer;
                                let bg = 'bg-white dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50/60 dark:hover:bg-slate-700/60 text-gray-700 dark:text-slate-200';
                                let letterBg = 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400';
                                if (isAnswered) {
                                    if (isCorrect) { bg = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'; letterBg = 'bg-emerald-500 text-white'; }
                                    else if (isSelected) { bg = 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200'; letterBg = 'bg-red-500 text-white'; }
                                    else { bg = 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-500 opacity-50'; }
                                }
                                return (
                                    <button key={index} type="button" onClick={() => handleOptionClick(index)} disabled={isAnswered}
                                        className={`w-full p-3 text-left rounded-xl border-2 transition-all duration-150 flex items-center gap-3 ${bg}`}>
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${letterBg}`}>{letter}</span>
                                        <span className="text-sm leading-snug flex-1">{option}</span>
                                        {isAnswered && isCorrect && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                                        {isAnswered && isSelected && !isCorrect && <X className="w-4 h-4 text-red-500 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                        {isAnswered && currentQuestion?.explanation && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-3.5 rounded-xl border-l-4 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-400">
                                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">💡 AI Explanation</p>
                                <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{currentQuestion.explanation}</p>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="shrink-0 z-10 p-3 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400 truncate">
                    {isAnswered ? `${score} correct so far` : 'Pick an answer to continue'}
                </span>
                <button type="button" onClick={handleNext} disabled={!isAnswered}
                    className={`shrink-0 px-5 py-2.5 text-white rounded-xl font-semibold text-sm transition-colors disabled:cursor-not-allowed shadow-sm ${isAnswered ? tierButtonClass : 'bg-slate-400 hover:bg-slate-400'}`}>
                    {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz ✓' : 'Next →'}
                </button>
            </div>
        </div>
    );
}
