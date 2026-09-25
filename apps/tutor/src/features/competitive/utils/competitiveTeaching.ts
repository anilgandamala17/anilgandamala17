/**
 * Competitive AI Explanation generators.
 * Kept off CompetitiveTeachingPage so ExamFlow / Questionary can
 * dynamically import this module without pulling the lecture UI.
 */
import { aiService } from '@/services/aiService';
import {
    formatExamMath,
    extractJsonArray,
    filterValidTeachingSteps,
    isTeachingStepLike,
    isOptionAnalysisStepTitle,
    lectureHasDetailedOptionAnalysis,
    speechFromOptionAnalysis,
} from '@/utils/examText';

export interface CompetitiveQuestion {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    topic: string;
    difficulty: string;
    examYear: string;
    subjectId: string;
    subjectName: string;
}

export function questionHasOptions(question: CompetitiveQuestion | null | undefined): boolean {
    return (question?.options?.length ?? 0) >= 2;
}

/** One lecturer voice for every AI Explanation step — energetic, clear, polished. */
const COMPETITIVE_EXPLAIN_SPEECH_STYLE = `--- SPEECH VOICE (SAME FOR EVERY STEP — CRITICAL) ---
Write every "speech" field as the SAME warm, natural human classroom teacher (for neural TTS):
- Conversational and clear — never flat, sleepy, robotic, or overly formal.
- Short sentences. Plain words. Natural pauses via commas and periods.
- Emphasize key terms once, then keep moving. No filler ("um", "basically", "you know").
- Sound like one continuous lecture across all 3 cards (same persona, same energy).
- Write speech the way a real tutor would speak aloud — not like a script reader.
- End each step with a crisp forward hook into the next idea when natural.
- Never invent multiple-choice options in speech unless real options were provided.`;

/** Keep each card's content unique — no repeated explanations across steps. */
const NO_REPEAT_ACROSS_CARDS = `--- NO REPEAT ACROSS CARDS (CRITICAL) ---
- Each idea appears in exactly ONE card. Do not restate the same reasoning, answer announcement, or tip in another card.
- Concept Introduction: frame the concept and stem only. Do NOT walk options letter-by-letter, do NOT give the full worked solution, do NOT list exam tips or memory hooks.
- Option Analysis & Common Analysis (when present): per-option why-correct/why-wrong + classic traps only. Do NOT re-derive the full solution or repeat concept framing.
- Solution, Exam Tips & Real-World Context: worked solution + shortcuts/exam tips + memory/real-world link in clear internal sections. Do NOT re-analyze every option letter; do NOT add a separate Summary or Next Practice section.
- NEVER include cards titled "Answer Announcement", "Summary", "Next Practice", or "Summary & Next Practice".`;

export interface AITeachingStep {
    id: number;
    title: string;
    subtitle: string;
    content: string;           // Rich markdown-style text
    speech: string;            // Voice narration script
    visualType: 'concept' | 'formula' | 'solution' | 'answer' | 'insight';
    icon: string;
    highlights?: string[];
}

const VALID_VISUAL_TYPES = new Set(['concept', 'formula', 'solution', 'answer', 'insight']);

const MIN_LECTURE_STEPS = 3;

/** Strip markdown so TTS reads like a teacher, not a document. */
export function stripSpeechForTts(raw: string): string {
    let s = String(raw || '');
    s = s.replace(/^#{1,6}\s+/gm, '');
    s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
    s = s.replace(/\*([^*]+)\*/g, '$1');
    s = s.replace(/`([^`]+)`/g, '$1');
    s = s.replace(/^\s*[-*•]\s+/gm, '');
    s = s.replace(/^\s*\d+[.)]\s+/gm, '');
    s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    s = s.replace(/\n{2,}/g, '. ');
    s = s.replace(/\n/g, ' ');
    s = s.replace(/\s{2,}/g, ' ');
    return s.trim();
}

function speechFromContent(content: string): string {
    const cleaned = stripSpeechForTts(content);
    if (cleaned.length <= 420) return cleaned;
    return `${cleaned.slice(0, 400).replace(/\s+\S*$/, '')}.`;
}

function speechForTeachingStep(title: string, content: string, rawSpeech: string): string {
    const cleaned = stripSpeechForTts(rawSpeech);
    if (isOptionAnalysisStepTitle(title)) {
        if (cleaned.length >= 180) return cleaned;
        return stripSpeechForTts(speechFromOptionAnalysis(content) || content);
    }
    return cleaned || speechFromContent(content);
}

/** True when steps are real lecture cards with enough depth (not highlights / one-liners). */
export function areValidTeachingSteps(steps: unknown): steps is AITeachingStep[] {
    if (!Array.isArray(steps) || steps.length !== MIN_LECTURE_STEPS) return false;
    const good = steps.filter(isTeachingStepLike).length;
    return good >= Math.ceil(MIN_LECTURE_STEPS * 0.6) && good >= MIN_LECTURE_STEPS;
}

function normalizeTeachingSteps(rawSteps: unknown[]): AITeachingStep[] {
    const iconMap: Record<string, string> = {
        concept: '🧠',
        formula: '📐',
        solution: '⚙️',
        answer: '✅',
        insight: '💡',
    };
    const bannedTitle =
        /answer\s*announcement|summary\s*&\s*next\s*practice|^\s*summary\s*$|^\s*next\s*practice\s*$/i;
    const valid = filterValidTeachingSteps<Record<string, unknown>>(rawSteps)
        .filter((s) => !bannedTitle.test(String(s.title || '')))
        .slice(0, MIN_LECTURE_STEPS);
    return valid.map((s, idx) => {
        const title = String(s.title || `Step ${idx + 1}`).trim();
        const visualRaw = typeof s.visualType === 'string' ? s.visualType : 'concept';
        let visualType = (VALID_VISUAL_TYPES.has(visualRaw) ? visualRaw : 'concept') as AITeachingStep['visualType'];
        const titleLower = title.toLowerCase();
        if (/option analysis|common analysis|key insights/.test(titleLower)) visualType = 'insight';
        else if (/solution|exam tips|real-world|real world/.test(titleLower)) visualType = 'solution';
        else if (/concept introduction|concept framing/.test(titleLower)) visualType = 'concept';
        const highlights = Array.isArray(s.highlights)
            ? s.highlights.map((h) => String(h)).filter(Boolean)
            : [];
        const content = String(s.content || '').trim();
        const rawSpeech = String(s.speech || '').trim();
        const speech = speechForTeachingStep(title, content, rawSpeech);
        return {
            id: typeof s.id === 'number' && Number.isFinite(s.id) ? s.id : idx + 1,
            title,
            subtitle: String(s.subtitle || '').trim(),
            content,
            speech,
            visualType,
            icon: iconMap[visualType] || '📖',
            highlights,
        };
    });
}


function optionLetter(index: number): string {
    return String.fromCharCode(65 + index);
}

function optionAnalysisQualityRules(optionCount: number): string {
    const letters = Array.from({ length: optionCount }, (_, i) => optionLetter(i)).join(', ');
    return `--- OPTION ANALYSIS & COMMON ANALYSIS (CRITICAL — EXAMINER GRADE) ---
- Step titled "Option Analysis & Common Analysis" MUST include:
  (1) one markdown bullet for EVERY real option letter: ${letters};
  (2) a short "### Common Analysis" section with 2–4 classic traps for this question type.
- Do not invent extra letters. Do not skip a listed letter. Do not write "A is correct, others are wrong".
- CORRECT option: 3–5 complete sentences. Quote the exact option text. Name the principle that makes it true. Show how it matches THIS stem. End with one quick check.
- EACH WRONG option: 3–5 complete sentences. Quote that option's exact text. Explain why it fails THIS stem. Name the misconception the examiner designed it to catch. End with how to eliminate it in under 10 seconds.
- Never use "incorrect", "wrong", or "distractor" as the entire reason.
- If the student picked a wrong option, that bullet must explain why it felt tempting.
- Common Analysis must NOT repeat the same sentences already used in the option bullets.
- This card's "speech" must narrate EVERY letter plus the traps (typically 140–220 words). No markdown. Do not skip letters.`;
}

function buildOptionAnalysisContentTemplate(
    options: string[],
    correctIndex: number,
    userAnswer?: number,
): string {
    const known = correctIndex >= 0 && correctIndex < options.length;
    const hasUserAnswer = userAnswer !== undefined && userAnswer !== null && userAnswer !== -1;
    const bullets = options.map((opt, i) => {
        const letter = optionLetter(i);
        const text = formatExamMath(opt).replace(/"/g, "'");
        if (known && i === correctIndex) {
            return `- **Option ${letter}** (${text}): CORRECT. Write 3-5 complete sentences. Quote this option. Name the principle that makes it true. Show how it matches THIS stem. End with one quick check.`;
        }
        const tempting =
            hasUserAnswer && userAnswer === i
                ? ' The student chose this option — explain why it felt tempting.'
                : '';
        return `- **Option ${letter}** (${text}): INCORRECT. Write 3-5 complete sentences. Quote this option. Explain why it fails THIS stem. Name the misconception it was designed to catch.${tempting} End with how to eliminate it in under 10 seconds.`;
    });
    return `## Deconstructing the options\\n\\n${bullets.join('\\n\\n')}\\n\\n### Common Analysis\\n\\n- [Trap 1 — name the misconception and how to spot it in under 10 seconds]\\n- [Trap 2]\\n- [Trap 3]`;
}

function buildStaticOptionAnalysis(
    question: CompetitiveQuestion,
    userAnswer?: number,
): { content: string; speech: string } {
    const hasOptions = questionHasOptions(question);
    if (!hasOptions) {
        return { content: '', speech: '' };
    }
    const knownKey =
        typeof question.correctAnswer === 'number' &&
        question.correctAnswer >= 0 &&
        question.correctAnswer < question.options.length;
    const hasUserAnswer = userAnswer !== undefined && userAnswer !== null && userAnswer !== -1;
    const traps = [
        `a missed condition or extra assumption that is not in the stem`,
        `a nearby formula or definition that looks like ${question.topic} but answers a different question`,
        `a sign, unit, limiting-case, or last-step arithmetic slip`,
        `jumping at a keyword in the option without checking the full governing rule`,
    ];
    const lines = question.options.map((opt, i) => {
        const letter = optionLetter(i);
        const text = formatExamMath(opt);
        const picked = hasUserAnswer && userAnswer === i;
        if (knownKey && i === question.correctAnswer) {
            return `- **Option ${letter}** (${text}): This is the correct choice. It is the only option that survives when you apply ${question.topic} to this exact stem in ${question.subjectName}. Restate the governing rule, match it to what the question actually asks, and confirm this wording is the result — not a nearby look-alike. A quick check is: if the stem's key constraint changed, this option would stop being true, which means it is locked to the question.${picked ? ' You selected this option — keep using that first-principle check on similar items.' : ''}`;
        }
        const trap = traps[i % traps.length];
        const student = picked
            ? ` You chose this option, which is a common trap: it feels close because of ${trap}.`
            : '';
        return `- **Option ${letter}** (${text}): This is incorrect for this stem. The wording "${text}" does not satisfy the governing ${question.topic} condition the question is testing.${student} Examiners plant this kind of distractor to catch ${trap}. Eliminate it in under ten seconds by asking whether this option would still hold if the stem's key constraint changed — if yes, it is not locked to the question.`;
    });
    const content = `## Deconstructing the options\n\n${lines.join('\n\n')}\n\n### Common Analysis\n\n- Jumping to an option before naming the governing principle for **${question.topic}**.\n- Mixing similar-looking formulas or definitions that look like ${question.topic} but answer a different question.\n- Sign, unit, or limiting-case slips in the last step — eliminate by asking whether the option survives if the stem's key constraint changes.`;
    const speech = stripSpeechForTts(speechFromOptionAnalysis(content));
    return { content, speech };
}

function getGradeAndStyle(examId: string): { grade: string; styleDescription: string } {
    const id = (examId || '').toLowerCase();
    if (id === 'free-form' || id.includes('free-form') || id === 'general') {
        return {
            grade: 'Competitive exam aspirant (open question)',
            styleDescription: 'Flexible coaching: detect whether the ask is a concept, derivation, or problem to solve; teach clearly without forcing a multiple-choice answer key.',
        };
    }
    if (id.includes('jee-advanced')) {
        return { grade: 'Class 11-12 (JEE Advanced)', styleDescription: 'Deep conceptual reasoning, rigorous proof/derivation, and advanced problem-solving techniques.' };
    }
    if (id.includes('jee')) {
        return { grade: 'Class 11-12 (JEE Main)', styleDescription: 'Highly conceptual and exam-oriented explanation, focusing on application of formulas and quick calculation tricks.' };
    }
    if (id.includes('neet')) {
        return { grade: 'Class 11-12 (NEET)', styleDescription: 'Medical concept explanation, emphasizing biological mechanisms, chemical reactions, physical concepts, and clear terminology.' };
    }
    if (id.includes('olympiad')) {
        return { grade: 'Class 8-10 (Olympiad)', styleDescription: 'Higher-order thinking, logical puzzles, analytical explanation, and rigorous concept application.' };
    }
    if (id.includes('rgukt') || id.includes('polycet') || id.includes('eamcet')) {
        return { grade: 'Class 10-12 (State Board / Entrance)', styleDescription: 'Exam-oriented, clear conceptual focus, step-by-step mathematics, and clear formula explanation.' };
    }
    if (id.includes('nmms')) {
        return { grade: 'Class 8', styleDescription: 'Slightly more detailed, encouraging tone, simple analogies, step-by-step logic.' };
    }
    if (id.includes('sainik') || id.includes('navodaya') || id.includes('kv') || id.includes('emrs')) {
        return { grade: 'Class 6-8', styleDescription: 'Very simple language, encouraging tone, colorful explanations, and basic math/logical connections.' };
    }
    return { grade: 'Secondary School', styleDescription: 'Encouraging, clear, concept-focused teaching style with simple explanations.' };
}

// ─── AI Generation ────────────────────────────────────────────────────────────
export async function generateAITeachingSteps(
    question: CompetitiveQuestion,
    examName?: string,
    userAnswer?: number
): Promise<AITeachingStep[]> {
    const { grade, styleDescription } = getGradeAndStyle(examName || question.subjectId);
    const hasUserAnswer = userAnswer !== undefined && userAnswer !== null && userAnswer !== -1;
    const isUserCorrect = hasUserAnswer && userAnswer === question.correctAnswer;
    const userSelectedLabel = hasUserAnswer ? String.fromCharCode(65 + userAnswer!) : 'None';
    const isFreeform =
        (examName || '').toLowerCase() === 'free-form' || question.subjectId === 'general';
    const hasOptions = questionHasOptions(question);
    const cleanStem = formatExamMath(question.text);
    const optionsBlock = hasOptions
        ? question.options
              .map((opt, i) => `${String.fromCharCode(65 + i)}. ${formatExamMath(opt)}`)
              .join('\n')
        : '';
    const knownKey =
        hasOptions &&
        typeof question.correctAnswer === 'number' &&
        question.correctAnswer >= 0 &&
        question.correctAnswer < question.options.length;
    
    // Classroom lecture pacing — richer than a one-line answer key
    let wordCountGuidance = '45-60 words per step';
    let durationLabel = 'Focused classroom lecture (~2–3 minutes total)';
    if (question.difficulty === 'Medium') {
        wordCountGuidance = '60-80 words per step';
        durationLabel = 'Detailed classroom lecture (~3–4 minutes total)';
    } else if (question.difficulty === 'Hard') {
        wordCountGuidance = '80-100 words per step';
        durationLabel = 'Deep classroom lecture (~4–5 minutes total)';
    }

    const lectureQualityRules = `--- LECTURE QUALITY (CRITICAL — NO THIN ANSWERS) ---
- Each "content" field must be a real mini-lesson: at least 2 short paragraphs OR a numbered walkthrough (never a single sentence).
- Solution steps must show full worked reasoning tied to THIS stem (and real options if present).
${hasOptions ? optionAnalysisQualityRules(question.options.length) : '- This is an OPEN question: do not invent Option A/B/C/D or an Option Analysis step.'}
- Every "speech" field must be spoken prose only: no markdown, no ## headings, no **bold**, no bullet symbols.
- Speech must teach the same ideas as content, in a warm clear teacher voice (${wordCountGuidance}).
- Never invent options or change the stem. Plain readable math only (no LaTeX).
${NO_REPEAT_ACROSS_CARDS}`;

    const freeformSharedHeader = `You are an expert competitive exam professor teaching a Class 10–12 student in a classroom. The student asked a FREE-FORM question (typed and/or extracted from an image).
Your tone: energetic, warm, crystal-clear, and perfectly paced. Prefer short sentences and plain words. Define jargon the first time you use it.

--- COMPLETE CONTEXT ---
Mode: Free-form AI Explanation
Target Student Grade/Level: ${grade} (${styleDescription})
Difficulty Level: ${question.difficulty} (Target Speech Duration: ${durationLabel})
Subject (inferred): ${question.subjectName}

STUDENT'S EXACT QUESTION STEM (authoritative — teach THIS only):
"""
${cleanStem}
"""

MATH / CONTENT STYLE:
- Write formulas in PLAIN READABLE text (e.g. √5 A / 2, A²). Never output LaTeX ($...$, \\frac, \\sqrt).
- Never invent options or change the stem text.
`;

    const freeformSpeechBlock = `${COMPETITIVE_EXPLAIN_SPEECH_STYLE}

${lectureQualityRules}

--- SPEECH Transcripts Directive ---
Generate spoken speech text ("speech" fields) that match the SPEECH VOICE above.
For each step, write ${wordCountGuidance} of spoken narration.
Do NOT use robotic templates.`;

    const freeformMcqPrompt = `${freeformSharedHeader}
REAL MULTIPLE-CHOICE OPTIONS (use ONLY these — do not invent or renumber):
${optionsBlock}
${knownKey ? `Known correct index (0-based) from source: ${question.correctAnswer} → Option ${String.fromCharCode(65 + question.correctAnswer)}` : 'Correct key: unknown from source — YOU must determine the correct option from reasoning.'}

--- FREE-FORM MCQ DIRECTIVE (CRITICAL) ---
- Stay locked to the stem and the REAL options above — they were OCR'd from the student's photo/text.
- Option Analysis & Common Analysis must be examiner-grade: a full why-correct writeup AND a full why-wrong writeup for every listed letter, plus a Common Analysis section (not a brief "distractor" label).
- Do NOT create an "Answer Announcement", "Summary", or "Next Practice" card — the UI highlights the correct option on Concept Introduction.
- Student-understandable language; never invent extra choices beyond the list.
- In content and speech, use plain readable math only (no LaTeX).

${freeformSpeechBlock}

--- DYNAMIC VISUAL HIGHLIGHTS ---
Identify 2-5 key equations, terms, or option letters for the "highlights" array.

Generate exactly 3 steps in JSON format:

[
  {
    "id": 1,
    "title": "Concept Introduction",
    "subtitle": "What this question is really about",
    "visualType": "concept",
    "content": "## Framing the idea\\n\\n[Name the core concept in 2-3 sentences. Explain why it matters for this exact question. Do NOT walk options or give the full solution.]",
    "speech": "[Open like a lecturer for ${wordCountGuidance}: name the concept and what you will teach. Spoken prose only.]",
    "highlights": []
  },
  {
    "id": 2,
    "title": "Option Analysis & Common Analysis",
    "subtitle": "Why each choice is right or wrong + traps",
    "visualType": "insight",
    "content": "${buildOptionAnalysisContentTemplate(question.options, knownKey ? question.correctAnswer : -1, userAnswer)}",
    "speech": "[Walk every real option letter in order, then name the classic traps. Spoken prose only. Cover ALL letters — do not skip. Typically 140-220 words.]",
    "highlights": []
  },
  {
    "id": 3,
    "title": "Solution, Exam Tips & Real-World Context",
    "subtitle": "Worked path + speed + retention",
    "visualType": "solution",
    "content": "## Step-by-step Solution\\n\\n1. [...]\\n2. [...]\\n3. [...]\\n4. [Arrive at the correct option with reasoning.]\\n\\n## Shortcuts & Exam Tips\\n\\n- **Shortcut**: [...]\\n- **Elimination**: [...]\\n- **Time box**: [...]\\n\\n## Memory & Real-world Link\\n\\n- **Memory hook**: [...]\\n- **Analogy**: [...]",
    "speech": "[Walk the solution, then one exam tip and one memory hook — do not re-analyze every option. Spoken prose only.]",
    "highlights": []
  }
]

Return ONLY the raw JSON array (no markdown backticks, no extra text):`;

    const freeformOpenPrompt = `${freeformSharedHeader}
Question type: OPEN (no multiple-choice options were provided).

--- FREE-FORM OPEN DIRECTIVE (CRITICAL) ---
- Stay locked to the student's exact question above.
- Teach process → then state the FINAL ANSWER clearly inside the Solution card.
- DO NOT invent Option A/B/C/D or any fake MCQ choices.
- DO NOT say "the correct option is…".
- DO NOT create "Answer Announcement", "Summary", or "Next Practice" cards.
- If numerical, show units and a quick check. If conceptual, give a crisp definition + worked example when helpful.
- Student-understandable: analogies when helpful; no dense jargon walls.
- Write formulas in PLAIN READABLE text only (no LaTeX).

${freeformSpeechBlock}

--- DYNAMIC VISUAL HIGHLIGHTS ---
Identify 2-5 key equations, terms, or phrases for the "highlights" array.

Generate exactly 3 steps in JSON format (no option analysis):

[
  {
    "id": 1,
    "title": "Concept Introduction",
    "subtitle": "What this question is really about",
    "visualType": "concept",
    "content": "## Framing the idea\\n\\n[Name the core concept in 2-3 sentences. Explain why it matters for this exact question. Do NOT give the full solution yet.]",
    "speech": "[Open like a lecturer for ${wordCountGuidance}: name the concept and what you will teach.]",
    "highlights": []
  },
  {
    "id": 2,
    "title": "Key Insights & Common Analysis",
    "subtitle": "Why this works + traps to avoid",
    "visualType": "insight",
    "content": "## Deeper understanding\\n\\n[Explain the why behind the method; call out subtle points.]\\n\\n### Common Analysis\\n\\n- [Mistake 1]\\n- [Mistake 2]\\n- [Mistake 3]",
    "speech": "[Highlight the insight that makes the solution click, then classic traps.]",
    "highlights": []
  },
  {
    "id": 3,
    "title": "Solution, Exam Tips & Real-World Context",
    "subtitle": "Worked path + speed + retention",
    "visualType": "solution",
    "content": "## Step-by-step Solution\\n\\n[Numbered steps with equations or logic.]\\n\\n**Final answer:** [state clearly].\\n\\n## Shortcuts & Exam Tips\\n\\n- **Shortcut**: [...]\\n- **Check**: [...]\\n- **Time box**: [...]\\n\\n## Memory & Real-world Link\\n\\n- **Memory hook**: [...]\\n- **Analogy**: [...]",
    "speech": "[Walk through each step, announce the final answer, then one tip and one memory hook.]",
    "highlights": []
  }
]

Return ONLY the raw JSON array (no markdown backticks, no extra text):`;

    const freeformPrompt = hasOptions ? freeformMcqPrompt : freeformOpenPrompt;

    const bankHasOptions = questionHasOptions(question);
    const bankKnownKey =
        bankHasOptions &&
        typeof question.correctAnswer === 'number' &&
        question.correctAnswer >= 0 &&
        question.correctAnswer < question.options.length;
    const bankCorrectLabel = bankKnownKey
        ? `Option ${String.fromCharCode(65 + question.correctAnswer)} (${question.options[question.correctAnswer]})`
        : 'Unknown — determine the correct option from reasoning';

    const prompt = isFreeform ? freeformPrompt : `You are an expert competitive exam professor teaching in a classroom. Explain this question step-by-step.
Your tone should be: energetic, crystal-clear, encouraging, concept-focused, and easy to understand. Teach the concept, not just the answer.

--- COMPLETE CONTEXT ---
Exam Name: ${examName || 'Competitive Exam'}
Subject: ${question.subjectName}
Topic/Chapter: ${question.topic}
Difficulty Level: ${question.difficulty} (Target Speech Duration: ${durationLabel})
Target Student Grade/Level: ${grade} (${styleDescription})

Question: "${cleanStem}"
${
  bankHasOptions
    ? `Options:\n${question.options
          .map((opt, i) => `${String.fromCharCode(65 + i)}. ${formatExamMath(opt)}`)
          .join('\n')}\nCorrect Answer: ${bankCorrectLabel}`
    : 'Question type: OPEN (no multiple-choice options). Do NOT invent Option A/B/C/D.'
}
Student's Selected Option: ${
  bankHasOptions && hasUserAnswer
    ? `Option ${userSelectedLabel} (${question.options[userAnswer!]})`
    : 'Unattempted'
}
Student's Result: ${
  bankHasOptions && hasUserAnswer
    ? isUserCorrect
      ? 'Correct!'
      : 'Incorrect'
    : 'N/A'
}

--- SUBJECT-SPECIFIC DIRECTIVE ---
${
  question.subjectId === 'math' ? 'MATHEMATICS: Show step-by-step calculations and derivations. Explain any arithmetic shortcuts or logical simplification.' :
  question.subjectId === 'phy' ? 'PHYSICS: Derive/state relevant equations, explain physical concepts behind variables, and relate to physical laws.' :
  question.subjectId === 'chem' ? 'CHEMISTRY: Detail chemical reactions, balanced structures, reaction mechanisms, periodic trends, or electron configurations.' :
  question.subjectId === 'bio' || question.subjectId === 'zoo' || question.subjectId === 'bot' ? 'BIOLOGY: Explain biological processes, morphological terminology, anatomical connections, and structural relations.' :
  question.subjectId === 'eng' || question.subjectId === 'lang' ? 'ENGLISH: Explain grammatical rules, contextual vocabulary cues, and comprehension logic.' :
  'GENERAL / MULTI-SUBJECT: Infer the subject from the question and teach with clear definitions, steps, and exam-oriented tips.'
}

${COMPETITIVE_EXPLAIN_SPEECH_STYLE}

${lectureQualityRules}

--- SPEECH Transcripts Directive ---
Generate spoken speech text ("speech" fields) that match the SPEECH VOICE above. Speak clearly, pause naturally, emphasize important concepts, and encourage the student.
For each step, write ${wordCountGuidance} of spoken narration. Make sure it flows naturally as a single contiguous lecture.
Do NOT use robotic templates. Every explanation must be generated completely dynamically.
Bank explanation hint (expand — do not paste alone as a step): ${JSON.stringify((question.explanation || '').slice(0, 400))}

--- DYNAMIC VISUAL HIGHLIGHTS ---
Identify 2-5 key mathematical equations, chemical names, vocabulary terms, or option labels that appear in the explanation, and return them in the "highlights" array. These will be highlighted on the virtual blackboard as you explain.

Generate exactly 3 steps in JSON format — teach like a premium classroom lecture, not an answer key:

[
  {
    "id": 1,
    "title": "Concept Introduction",
    "subtitle": "What this question is really testing",
    "visualType": "concept",
    "content": "## Framing the idea\\n\\n[Introduce the core concept/topic before touching options. Define the key idea in 3-5 sentences with exam context. Do NOT walk options letter-by-letter or give the full worked solution.]",
    "speech": "[Open like a lecturer for ${wordCountGuidance}: name the concept, why it matters in ${examName || 'this exam'}, and what skill is being tested. Spoken prose only.]",
    "highlights": ["${question.topic}"]
  },
  {
    "id": 2,
    "title": "${bankHasOptions ? 'Option Analysis & Common Analysis' : 'Key Insights & Common Analysis'}",
    "subtitle": "${bankHasOptions ? 'Why each choice is right or wrong + traps' : 'Why this works + traps to avoid'}",
    "visualType": "insight",
    "content": "${
      bankHasOptions
        ? buildOptionAnalysisContentTemplate(question.options, bankKnownKey ? question.correctAnswer : -1, userAnswer)
        : '## Deeper understanding\\n\\n[Explain the why behind the method; call out subtle points.]\\n\\n### Common Analysis\\n\\n- [Mistake 1]\\n- [Mistake 2]\\n- [Mistake 3]'
    }",
    "speech": "[${bankHasOptions ? 'Walk every real option letter in order. For the correct option, explain why it is right in full. For each wrong option, say why it fails this stem, what misconception it targets, and how to cut it in under ten seconds. Then name classic traps. Spoken prose only. Cover ALL letters — do not skip. Typically 140-220 words.' : 'Highlight the insight that makes the solution click, then classic traps.'}]",
    "highlights": []
  },
  {
    "id": 3,
    "title": "Solution, Exam Tips & Real-World Context",
    "subtitle": "Worked path + speed + retention",
    "visualType": "solution",
    "content": "## Step-by-step Solution\\n\\n1. [First reasoning step with equation or logic]\\n2. [Next step]\\n3. [Next step]\\n4. [Show how the correct ${bankHasOptions ? 'option' : 'answer'} follows]\\n\\n[Closing check in 1-2 sentences.]\\n\\n## Shortcuts & Exam Tips\\n\\n- **Shortcut**: [when applicable]\\n- **Elimination tip**: [...]\\n- **Time box**: target seconds for this difficulty\\n\\n## Memory & Real-world Link\\n\\n- **Mnemonic / memory hook**: [...]\\n- **Analogy**: [relatable real-world picture when it helps]\\n- **Alternative method**: [second valid approach if one exists]",
    "speech": "[Walk through the numbered solution (${wordCountGuidance}), then one exam tip and one memory hook. Do not re-analyze every option letter. Spoken prose only.]",
    "highlights": []
  }
]

Return ONLY the raw JSON array (no markdown backticks, no extra text):`;

    const parseLectureResponse = (raw: string): AITeachingStep[] => {
        const parsedArr = extractJsonArray(raw);
        if (!parsedArr) throw new Error('No JSON array in response');
        const normalized = normalizeTeachingSteps(parsedArr);
        if (!areValidTeachingSteps(normalized)) {
            throw new Error('Parsed teaching steps were too thin or invalid');
        }
        if (hasOptions && !lectureHasDetailedOptionAnalysis(normalized, question.options.length)) {
            throw new Error('Option analysis missing per-option why-correct / why-wrong depth');
        }
        return normalized;
    };

    const buildRepairPrompt = (priorRaw: string) => `You previously produced a thin or invalid lecture for this exam question.
Rewrite a COMPLETE detailed 3-step JSON teaching lecture. Expand every step — no one-liners.
Do NOT include "Answer Announcement", "Summary", "Next Practice", or "Summary & Next Practice" cards.
${hasOptions ? `
OPTION ANALYSIS & COMMON ANALYSIS MUST BE REWRITTEN IN FULL:
- Title must be "Option Analysis & Common Analysis".
- Include a markdown bullet for every real letter with 3-5 sentences each.
- Correct option: why it is right (principle + match to this stem + check).
- Each wrong option: why it fails this stem, the misconception it was designed to catch, and a 10-second elimination.
- Add a "### Common Analysis" section with 2–4 classic traps (do not copy-paste the option bullets).
- Do not write only "incorrect" or "distractor".
Real options:
${optionsBlock}
${knownKey ? `Correct letter: ${optionLetter(question.correctAnswer)}` : 'Determine the correct letter from reasoning.'}
${hasUserAnswer && !isUserCorrect ? `Student picked Option ${userSelectedLabel} — explain why that trap felt tempting.` : ''}
` : 'OPEN question — no MCQ options and no Option Analysis step. Use "Key Insights & Common Analysis" as step 2.'}

Required titles (in order):
1. "Concept Introduction"
2. "${hasOptions ? 'Option Analysis & Common Analysis' : 'Key Insights & Common Analysis'}"
3. "Solution, Exam Tips & Real-World Context"

Question stem:
"""
${cleanStem}
"""
${bankHasOptions ? `Options:\n${optionsBlock}\nCorrect: ${bankCorrectLabel}` : 'OPEN question — no MCQ options.'}
${hasUserAnswer ? `Student picked: Option ${userSelectedLabel}` : ''}

${lectureQualityRules}
${COMPETITIVE_EXPLAIN_SPEECH_STYLE}
Speech length: ${wordCountGuidance} per step. Option analysis speech must cover every letter (140-220 words).

Prior draft (improve; do not copy thin stubs):
${priorRaw.slice(0, 3500)}

Return ONLY the raw JSON array of 3 teaching step objects with title, subtitle, visualType, content, speech, highlights.`;

    try {
        let raw = await aiService.callAI(prompt, 3, 1000, { temperature: 0.35 });
        try {
            return parseLectureResponse(raw);
        } catch (firstErr) {
            console.warn('[CompetitiveTeachingPage] First lecture parse thin/invalid, repairing once:', firstErr);
            raw = await aiService.callAI(buildRepairPrompt(raw), 2, 1000, { temperature: 0.4 });
            return parseLectureResponse(raw);
        }
    } catch (err) {
        console.warn('[CompetitiveTeachingPage] AI failed, falling back to enriched static steps:', err);
        if (isFreeform) {
            const hasOpts = questionHasOptions(question);
            const optionBreakdown = hasOpts ? buildStaticOptionAnalysis(question, userAnswer) : null;
            return [
                {
                    id: 1, icon: '🧠', visualType: 'concept',
                    title: 'Concept Introduction',
                    subtitle: 'What you asked',
                    content: `## Your question\n\n${question.text}\n\nWe'll break this into a clear teaching walkthrough. Review the stem carefully, name the core concept, and rebuild the method step by step so the idea sticks under exam pressure.`,
                    speech: stripSpeechForTts(
                        `Great question. ${question.text.slice(0, 160)}. Stay with me — we'll break it down clearly, step by step, with the same care a classroom teacher would use.`,
                    ),
                    highlights: [],
                },
                ...(optionBreakdown
                    ? [{
                        id: 2, icon: '💡', visualType: 'insight' as const,
                        title: 'Option Analysis & Common Analysis',
                        subtitle: 'Why each choice is right or wrong + traps',
                        content: optionBreakdown.content,
                        speech: optionBreakdown.speech,
                        highlights: ['Option Analysis'],
                    }]
                    : [{
                        id: 2, icon: '💡', visualType: 'insight' as const,
                        title: 'Key Insights & Common Analysis',
                        subtitle: 'Why this works + traps to avoid',
                        content: `## Approach\n\n1. Identify the topic and list knowns and unknowns.\n2. Recall the governing definition, law, or formula.\n3. Watch for classic traps: skipped conditions, mixed formulas, and last-step slips.\n\n### Common Analysis\n\n- Naming the principle too late.\n- Mixing look-alike definitions.\n- Skipping a consistency check.`,
                        speech: stripSpeechForTts(
                            `Name the topic, apply the core rule, and watch for classic traps so distractors lose their power.`,
                        ),
                        highlights: [],
                    }]),
                {
                    id: 3, icon: '⚙️', visualType: 'solution',
                    title: 'Solution, Exam Tips & Real-World Context',
                    subtitle: 'Worked path + speed + retention',
                    content: hasOpts
                        ? `## Step-by-step Solution\n\n1. Read the stem carefully and underline knowns and unknowns.\n2. Recall the governing definition, law, or formula for this topic.\n3. Apply it cleanly and confirm the matching choice.\n4. Do a quick consistency check.\n\n## Shortcuts & Exam Tips\n\n- Spot the topic from stem keywords before calculating.\n- Eliminate options that break an obvious condition.\n- Keep a tight time box on sticky algebra.\n\n## Memory & Real-world Link\n\n- Memory hook: name the rule first, then compute.\n- The live AI lecture could not be fully generated — tap back and resubmit for a richer walkthrough.`
                        : `## Step-by-step Solution\n\n1. Identify the topic and list knowns and unknowns.\n2. Recall the governing definition, law, or formula.\n3. Work step-by-step toward the asked result.\n4. State the final answer clearly with units if needed.\n\n## Shortcuts & Exam Tips\n\n- Write one governing equation before calculating.\n- Check units and edge cases.\n\n## Memory & Real-world Link\n\n- Memory hook: principle first, then algebra.\n- The live AI lecture could not be fully generated — tap back and resubmit for a richer walkthrough.`,
                    speech: stripSpeechForTts(
                        hasOpts
                            ? `Here's the plan. Name the topic, apply the core rule, confirm the matching choice, and keep one exam tip in mind for speed.`
                            : `Here's the plan. Name the topic, apply the core rule step by step, lock in a clear final answer, and keep one tip for next time.`,
                    ),
                    highlights: [],
                },
            ];
        }
        return buildStaticSteps(question, examName, userAnswer);
    }
}

function buildStaticSteps(
    question: CompetitiveQuestion,
    examName?: string,
    userAnswer?: number
): AITeachingStep[] {
    const hasOptions = questionHasOptions(question);
    const knownKey =
        hasOptions &&
        typeof question.correctAnswer === 'number' &&
        question.correctAnswer >= 0 &&
        question.correctAnswer < question.options.length;
    const correct = knownKey ? question.options[question.correctAnswer] : '';
    const correctLabel = knownKey ? String.fromCharCode(65 + question.correctAnswer) : '';
    const stem = formatExamMath(question.text);
    const bankExplain = (question.explanation || '').trim();
    const explainBody =
        bankExplain.length >= 40
            ? bankExplain
            : `Apply the core idea behind **${question.topic}** in ${question.subjectName}. Read the stem carefully, identify what is asked, recall the governing rule or formula, then reason to the result without skipping intermediate checks.`;

    const step = (
        partial: Omit<AITeachingStep, 'speech' | 'icon'> & { speech?: string; icon?: string },
    ): AITeachingStep => ({
        ...partial,
        icon: partial.icon || '📖',
        speech: stripSpeechForTts(partial.speech || (
            isOptionAnalysisStepTitle(partial.title)
                ? speechFromOptionAnalysis(partial.content)
                : speechFromContent(partial.content)
        )),
    });

    if (!hasOptions) {
        return [
            step({
                id: 1, icon: '🧠', visualType: 'concept',
                title: 'Concept Introduction',
                subtitle: 'What this question tests',
                content: `## Understanding the ask\n\n**Topic:** ${question.topic} (${question.subjectName})\n\n### Question\n${stem}\n\n### What to notice\nName the concept first, then decide what a complete answer must include (value, units, definition, or short proof). This keeps the walkthrough exam-ready.`,
                speech: `Let's frame this clearly. The topic is ${question.topic}. I'll read the question with you, name the idea being tested, then solve it step by step so the method sticks.`,
            }),
            step({
                id: 2, icon: '💡', visualType: 'insight',
                title: 'Key Insights & Common Analysis',
                subtitle: 'Why this works + traps to avoid',
                content: `## Deeper understanding\n\n${explainBody}\n\n### Common Analysis\n\n- Jumping into algebra before naming the governing principle.\n- Mixing similar-looking formulas or definitions.\n- Losing marks on units, signs, or extreme cases.\n\n### 10-second fix\nAsk: what law or definition must be true here? Then rebuild from that rule.`,
                speech: `Key insight for ${question.topic}: name the principle first. Classic traps are mixed formulas and last-step slips — catch them by checking units and edge cases.`,
            }),
            step({
                id: 3, icon: '⚙️', visualType: 'solution',
                title: 'Solution, Exam Tips & Real-World Context',
                subtitle: 'Worked path + speed + retention',
                content: `## Step-by-step Solution\n\n${explainBody}\n\n### Method checklist\n1. List knowns and unknowns from the stem.\n2. Recall the governing definition, law, or formula.\n3. Carry the reasoning in small steps — no skipped algebra or logic.\n4. State the final result and do a quick sanity check.\n\n## Shortcuts & Exam Tips\n\n- Identify the principle before calculating.\n- Watch units, signs, and extreme cases.\n- If stuck, write one governing equation and rebuild from there.\n\n## Memory & Real-world Link\n\n- Memory hook: "${question.topic} → first name the rule, then compute."\n- Why it matters: the same first step shows up across many ${question.subjectName} items in ${examName || 'competitive exams'}.`,
                speech: `Stay with the method. Start from the knowns, apply the core principle for ${question.topic}, lock the answer with a quick check, and remember: name the rule before you compute.`,
            }),
        ];
    }

    const optionBreakdown = buildStaticOptionAnalysis(question, userAnswer);

    return [
        step({
            id: 1, icon: '🧠', visualType: 'concept',
            title: 'Concept Introduction',
            subtitle: 'What this question is really testing',
            content: `## Framing ${question.topic}\n\nThis **${question.difficulty}** ${question.subjectName} question targets **${question.topic}** for ${examName || 'your exam'}.\n\n### Stem\n${stem}\n\n### Teaching goal\nBefore walking options or the full derivation, name the principle. The correct choice is highlighted on the board so we can focus on the idea being tested.`,
            speech: `Core idea time: ${question.topic}. This ${question.difficulty} ${question.subjectName} question is testing whether you can apply that idea under timed pressure. Stay with me — next we dismantle every option, then prove the solution.`,
            highlights: [question.topic],
        }),
        step({
            id: 2, icon: '💡', visualType: 'insight',
            title: 'Option Analysis & Common Analysis',
            subtitle: 'Why each choice is right or wrong + traps',
            content: optionBreakdown.content,
            speech: optionBreakdown.speech,
            highlights: knownKey ? [`Option ${correctLabel}`] : ['Option Analysis'],
        }),
        step({
            id: 3, icon: '⚙️', visualType: 'solution',
            title: 'Solution, Exam Tips & Real-World Context',
            subtitle: 'Worked path + speed + retention',
            content: `## Step-by-step Solution\n\n${explainBody}\n\n### Structured path\n1. Re-read the stem and mark knowns / unknowns.\n2. Recall the governing rule for **${question.topic}**.\n3. Apply it to this exact wording — keep intermediate steps visible.\n4. ${knownKey ? `Show why Option ${correctLabel} follows.` : 'Arrive at the matching choice.'}\n5. Quick check: units, signs, and whether the result answers what was asked.\n\n## Shortcuts & Exam Tips\n\n- **Shortcut**: Identify ${question.topic} from keywords in the stem before calculating.\n- **Elimination**: Discard options that violate an obvious condition (units, sign, limiting case).\n- **Time box**: Aim for a clean first pass; mark and return only if the algebra stalls.\n\n## Memory & Real-world Link\n\n- **Memory hook**: "${question.topic} → first name the rule, then compute."\n- **Why it matters**: The same first step shows up across many ${question.subjectName} items in ${examName || 'competitive exams'}.\n- **Analogy**: Treat options like suspects — the governing law is your evidence filter; only one story survives.`,
            speech: `Here's why this works. ${stripSpeechForTts(explainBody).slice(0, 280)} ${
                knownKey ? `That locks in option ${correctLabel}.` : 'That locks the correct choice.'
            } Exam tip: spot ${question.topic} from the stem, eliminate broken options, and always name the rule before you compute.`,
            highlights: correct ? [formatExamMath(correct)] : [question.topic],
        }),
    ];
}
