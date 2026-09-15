/**
 * Shared cleaners for competitive exam OCR + explain UI.
 * Converts common LaTeX to readable Unicode and rejects model-thinking junk.
 */

const SUPERSCRIPT: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', n: 'ⁿ',
};

const JUNK_MARKERS = [
    /<think\b/i,
    /<\/think>/i,
    /<thinking\b/i,
    /<\/thinking>/i,
    /\bconstruct the final JSON\b/i,
    /\bReturn ONLY valid JSON\b/i,
    /\bcorrectAnswerIndex\b/,
    /\bquestionText\b/,
    /\bsubjectGuess\b/,
    /\bChain of Thought\b/i,
    /\bThe user wants me to extract\b/i,
    /\bStep \d+:\s*Analyze the image\b/i,
    /\bLet's construct the final JSON\b/i,
    /\bDo NOT invent options\b/i,
];

/** True when text looks like model reasoning / prompt leakage rather than a real stem. */
export function looksLikeModelJunk(text: string): boolean {
    const t = (text || '').trim();
    if (!t) return true;
    // Only hard-reject extreme dumps; real multi-part stems can be long.
    if (t.length > 4000) return true;
    return JUNK_MARKERS.some((re) => re.test(t));
}

function stripClosedThinking(raw: string): string {
    let s = String(raw || '');
    s = s.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '');
    s = s.replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, '');
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    return s.trim();
}

function collectBalancedJsonObjects(source: string): string[] {
    const candidates: string[] = [];
    for (let i = 0; i < source.length; i++) {
        if (source[i] !== '{') continue;
        let depth = 0;
        let inString = false;
        let escape = false;
        for (let j = i; j < source.length; j++) {
            const ch = source[j];
            if (inString) {
                if (escape) escape = false;
                else if (ch === '\\') escape = true;
                else if (ch === '"') inString = false;
                continue;
            }
            if (ch === '"') {
                inString = true;
                continue;
            }
            if (ch === '{') depth++;
            else if (ch === '}') {
                depth--;
                if (depth === 0) {
                    candidates.push(source.slice(i, j + 1));
                    break;
                }
            }
        }
    }
    return candidates;
}

/**
 * Find brace-balanced JSON objects and return the best parse that has questionText.
 * Prefers the last valid candidate (models often put JSON after reasoning).
 */
export function extractExamJsonObject(
    raw: string,
    opts?: { skipThinkingStrip?: boolean },
): Record<string, unknown> | null {
    // Try raw first so unclosed <think>…{json} still recovers.
    const sources = opts?.skipThinkingStrip
        ? [String(raw || '')]
        : [String(raw || ''), stripClosedThinking(raw)];

    let best: Record<string, unknown> | null = null;
    for (const source of sources) {
        for (const c of collectBalancedJsonObjects(source)) {
            try {
                const parsed = JSON.parse(c) as Record<string, unknown>;
                if (typeof parsed.questionText === 'string' && parsed.questionText.trim()) {
                    best = parsed;
                }
            } catch {
                /* skip */
            }
        }
        if (best) break;
    }
    return best;
}

/**
 * Strip model thinking without deleting trailing JSON after an unclosed <think>.
 */
export function stripModelThinking(raw: string): string {
    let s = stripClosedThinking(raw);
    const unclosed = s.search(/<think\b[^>]*>/i);
    if (unclosed >= 0) {
        const after = s.slice(unclosed);
        const json = extractExamJsonObject(after, { skipThinkingStrip: true });
        if (json) return JSON.stringify(json);
        s = s.slice(0, unclosed).trim();
    }
    const unclosedThinking = s.search(/<thinking\b[^>]*>/i);
    if (unclosedThinking >= 0) {
        const after = s.slice(unclosedThinking);
        const json = extractExamJsonObject(after, { skipThinkingStrip: true });
        if (json) return JSON.stringify(json);
        s = s.slice(0, unclosedThinking).trim();
    }
    return s;
}

function collectBalancedJsonArrays(source: string): string[] {
    const arrays: string[] = [];
    for (let i = 0; i < source.length; i++) {
        if (source[i] !== '[') continue;
        let depth = 0;
        let inString = false;
        let escape = false;
        for (let j = i; j < source.length; j++) {
            const ch = source[j];
            if (inString) {
                if (escape) escape = false;
                else if (ch === '\\') escape = true;
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
                if (depth === 0) {
                    arrays.push(source.slice(i, j + 1));
                    break;
                }
            }
        }
    }
    return arrays;
}

/** True when an item looks like a lecture teaching step (not a highlights string / one-liner). */
export function isTeachingStepLike(item: unknown): boolean {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const o = item as Record<string, unknown>;
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    const content = typeof o.content === 'string' ? o.content.trim() : '';
    // Reject empty or single-line stubs like "Waves." — real mini-lessons are longer.
    return title.length > 0 && content.length >= 80;
}


/** Validate / score an array as teaching steps (rejects nested highlights like ["Waves"]). */
export function scoreTeachingStepsArray(arr: unknown): number {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const good = arr.filter(isTeachingStepLike).length;
    if (good === 0) return 0;
    // Prefer fuller lectures; require majority of items to be real steps.
    if (good < Math.ceil(arr.length * 0.6)) return 0;
    return good * 10 + arr.length;
}

/**
 * Balanced JSON array extract for teaching-step responses.
 * Prefers the largest array of objects with title+content — never nested highlights.
 */
export function extractJsonArray(raw: string): unknown[] | null {
    const cleaned = stripClosedThinking(raw).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const arrays = collectBalancedJsonArrays(cleaned);

    let best: unknown[] | null = null;
    let bestScore = 0;
    for (const candidate of arrays) {
        try {
            const parsed = JSON.parse(candidate);
            const score = scoreTeachingStepsArray(parsed);
            if (score > bestScore) {
                bestScore = score;
                best = parsed as unknown[];
            }
        } catch {
            /* skip */
        }
    }
    if (best) return best;

    // Fallback: last non-empty array that is not a pure string list (legacy callers).
    for (let k = arrays.length - 1; k >= 0; k--) {
        try {
            const parsed = JSON.parse(arrays[k]);
            if (
                Array.isArray(parsed) &&
                parsed.length > 0 &&
                parsed.some((item) => item && typeof item === 'object' && !Array.isArray(item))
            ) {
                return parsed;
            }
        } catch {
            /* skip */
        }
    }
    return null;
}

/** Filter + require at least one real teaching step with title and content. */
export function filterValidTeachingSteps<T extends Record<string, unknown>>(arr: unknown[]): T[] {
    return arr.filter(isTeachingStepLike) as T[];
}

export const MIN_OPTION_REASON_CHARS = 120;

export interface ParsedOptionReason {
    letter: string;
    reason: string;
}

const OPTION_HEADING_RE =
    /(?:^|\n)\s*(?:(?:[-*•]\s*)?(?:\*\*)?Option\s+([A-Za-z])(?:\*\*)?(?:\s*\([^)]*\))?\s*[:.\-—–]\s*|#{2,4}\s*Option\s+([A-Za-z])\b[^\n]*\n+)/gi;

function isVagueOptionReason(reason: string): boolean {
    const compact = reason.replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
    if (compact.length < MIN_OPTION_REASON_CHARS) return true;
    if (
        /^(this (option|choice) )?(is )?(incorrect|wrong|not correct|a distractor|the distractor)([.,].*)?$/i.test(
            compact,
        ) &&
        compact.length < 160
    ) {
        return true;
    }
    const withoutLabels = compact
        .replace(/\b(incorrect|wrong|distractor|not correct|option [a-z]|correct)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    return withoutLabels.length < 80;
}

/** Split Option Analysis markdown into per-letter reasons (A, B, C, …). */
export function parseOptionAnalysisReasons(content: string): ParsedOptionReason[] {
    const text = String(content || '').replace(/\r\n/g, '\n');
    if (!text.trim()) return [];

    const starts: { letter: string; headingStart: number; bodyStart: number }[] = [];
    const re = new RegExp(OPTION_HEADING_RE.source, 'gi');
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
        const letter = (match[1] || match[2] || '').toUpperCase();
        if (!letter) continue;
        starts.push({
            letter,
            headingStart: match.index,
            bodyStart: match.index + match[0].length,
        });
    }
    if (starts.length === 0) return [];

    const out: ParsedOptionReason[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < starts.length; i++) {
        const end = i + 1 < starts.length ? starts[i + 1].headingStart : text.length;
        const reason = text.slice(starts[i].bodyStart, end).replace(/\s+/g, ' ').trim();
        if (seen.has(starts[i].letter)) continue;
        seen.add(starts[i].letter);
        out.push({ letter: starts[i].letter, reason });
    }
    return out;
}

export function isOptionAnalysisStepTitle(title: string): boolean {
    return /option analysis/i.test(String(title || ''));
}

export function findOptionAnalysisStep<T extends { title?: unknown; content?: unknown }>(
    steps: T[],
): T | undefined {
    return steps.find((s) => isOptionAnalysisStepTitle(String(s.title || '')))
        || steps.find((s) => /deconstructing the options/i.test(String(s.content || '')));
}

/** True when every real MCQ letter has a concrete, distinct why-correct / why-wrong reason. */
export function optionAnalysisMeetsQuality(content: string, optionCount: number): boolean {
    if (optionCount < 2) return true;
    const parsed = parseOptionAnalysisReasons(content);
    const byLetter = new Map(parsed.map((p) => [p.letter, p.reason]));
    const reasons: string[] = [];
    for (let i = 0; i < optionCount; i++) {
        const letter = String.fromCharCode(65 + i);
        const reason = byLetter.get(letter) || '';
        if (isVagueOptionReason(reason)) return false;
        reasons.push(reason.replace(/\s+/g, ' ').trim().toLowerCase());
    }
    if (new Set(reasons).size < optionCount) return false;
    return true;
}

export function lectureHasDetailedOptionAnalysis(
    steps: unknown,
    optionCount: number,
): boolean {
    if (optionCount < 2) return true;
    if (!Array.isArray(steps)) return false;
    const step = findOptionAnalysisStep(steps as { title?: unknown; content?: unknown }[]);
    if (!step) return false;
    const content = typeof (step as { content?: unknown }).content === 'string'
        ? (step as { content: string }).content
        : '';
    return optionAnalysisMeetsQuality(content, optionCount);
}

/** Full spoken walkthrough of every option — never truncated. */
export function speechFromOptionAnalysis(content: string): string {
    const parsed = parseOptionAnalysisReasons(content);
    if (parsed.length === 0) {
        return String(content || '').replace(/\s+/g, ' ').trim();
    }
    return parsed
        .map((p) => `Option ${p.letter}. ${p.reason}`)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function looksLikeInlineMath(inner: string): boolean {
    const t = inner.trim();
    if (!t) return false;
    // Pure money like 400 / 1,200 — keep the $.
    if (/^[\d,]+(\.\d+)?$/.test(t)) return false;
    if (/^[\d,]+(\.\d+)?\s*(million|billion|k|m|cr|lakh)?$/i.test(t)) return false;
    return /[\\^_{}=]|\\frac|\\sqrt|[A-Za-z]\d|\d\s*\/\s*\d|[√πθαβ×·±÷≤≥≠≈∞]/.test(t);
}

/**
 * Convert common LaTeX / $math$ into readable exam text.
 * Preserves newlines (safe for markdown lecture content).
 */
export function formatExamMath(input: string): string {
    let s = String(input || '');

    // Convert LaTeX commands first so $...$ stripping sees readable math (e.g. $1/2$).
    for (let n = 0; n < 4; n++) {
        s = s.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)');
        s = s.replace(/\\dfrac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)');
        s = s.replace(/\\sqrt\s*\{([^{}]+)\}/g, '√($1)');
        s = s.replace(/\\sqrt\s*([A-Za-z0-9]+)/g, '√$1');
    }

    s = s.replace(/\\times/g, '×');
    s = s.replace(/\\cdot/g, '·');
    s = s.replace(/\\pm/g, '±');
    s = s.replace(/\\div/g, '÷');
    s = s.replace(/\\leq/g, '≤');
    s = s.replace(/\\geq/g, '≥');
    s = s.replace(/\\neq/g, '≠');
    s = s.replace(/\\approx/g, '≈');
    s = s.replace(/\\infty/g, '∞');
    s = s.replace(/\\pi\b/g, 'π');
    s = s.replace(/\\theta\b/g, 'θ');
    s = s.replace(/\\alpha\b/g, 'α');
    s = s.replace(/\\beta\b/g, 'β');
    s = s.replace(/\\left\s*/g, '');
    s = s.replace(/\\right\s*/g, '');
    s = s.replace(/\\,/g, ' ');
    s = s.replace(/\\;/g, ' ');
    s = s.replace(/\\!/g, '');
    s = s.replace(/\\{/g, '{').replace(/\\}/g, '}');

    s = s.replace(/\^\{([0-9+\-n]+)\}/g, (_, exp: string) =>
        [...exp].map((c) => SUPERSCRIPT[c] || c).join(''),
    );
    s = s.replace(/\^([0-9])/g, (_, d: string) => SUPERSCRIPT[d] || `^${d}`);

    s = s.replace(/\\([A-Za-z]+)/g, '$1');
    s = s.replace(/\(([^()\n]+)\)\/\(([^()\n]+)\)/g, '$1/$2');

    // Protect currency `$400` so it cannot pair with a later math `$`.
    // Do not touch `$1/2` style math (digit immediately followed by `/`).
    const currencySlots: string[] = [];
    s = s.replace(/\$(\d[\d,]*(?:\.\d+)?)(?![\d/.])/g, (_, amount: string) => {
        const idx = currencySlots.length;
        currencySlots.push(`$${amount}`);
        return `\u0000CUR${idx}\u0000`;
    });

    s = s.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
    s = s.replace(/\$([^$\n]+)\$/g, (full, inner: string) =>
        looksLikeInlineMath(inner) ? inner : full,
    );
    s = s.replace(/\\\(([\s\S]*?)\\\)/g, '$1');
    s = s.replace(/\\\[([\s\S]*?)\\\]/g, '$1');

    const nul = String.fromCharCode(0);
    s = s.replace(new RegExp(`${nul}CUR(\\d+)${nul}`, 'g'), (_, idx: string) => currencySlots[Number(idx)] || '');

    // Collapse horizontal runs of spaces/tabs only — keep newlines for markdown.
    s = s.replace(/[^\S\n]{2,}/g, ' ');

    return s.trim();
}

/** Split stem that still has A)/B)/C)/D) lines into stem + options. */
export function splitStemAndOptions(text: string): { stem: string; options: string[] } {
    const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const optionIdx: number[] = [];
    const optionVals: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^(?:[A-Da-d]|[1-9])\s*[).:-]\s*(.+)$/);
        if (m) {
            optionIdx.push(i);
            optionVals.push(
                formatExamMath(m[1].replace(/^\s*(?:[A-Da-d]|[1-9])\s*[).:-]\s*/, '').trim()),
            );
        }
    }
    if (optionVals.length < 2) {
        return { stem: formatExamMath(text), options: [] };
    }
    const firstOptLine = optionIdx[0];
    const consecutive = optionIdx.every((idx, n) => n === 0 || idx === optionIdx[n - 1] + 1);
    if (!consecutive) {
        return { stem: formatExamMath(text), options: [] };
    }
    const stemLines = lines.slice(0, firstOptLine);
    return {
        stem: formatExamMath(stemLines.join('\n').trim() || text),
        options: optionVals.filter(Boolean),
    };
}

export function sanitizeExamStem(text: string): string {
    const split = splitStemAndOptions(stripClosedThinking(text));
    const formatted = formatExamMath(split.stem);
    if (looksLikeModelJunk(formatted)) {
        throw new Error('Could not read a clean question from this image. Try a clearer photo.');
    }
    return formatted.trim();
}

export function sanitizeOptionText(text: string): string {
    return formatExamMath(
        String(text || '')
            .replace(/^\s*(?:[A-Da-d]|[1-9])\s*[).:-]\s*/, '')
            .trim(),
    );
}

/** Hints like "explain" / "solve" should not be prepended onto the stem. */
export function isMeaningfulStudentHint(hint: string | undefined | null): boolean {
    const h = (hint || '').trim();
    if (h.length < 3) return false;
    if (h.length <= 12 && /^(explain|solve|help|please|answer|what|how)\.?$/i.test(h)) return false;
    return true;
}

export function assertCleanExtractedQuestion(input: {
    questionText: string;
    options?: string[] | null;
}): void {
    const stem = (input.questionText || '').trim();
    if (stem.length < 8) {
        throw new Error('Could not read a clean question from this image. Try a clearer photo.');
    }
    if (looksLikeModelJunk(stem)) {
        throw new Error('Could not read a clean question from this image. Try a clearer photo.');
    }
    const opts = Array.isArray(input.options) ? input.options.filter(Boolean) : [];
    if (opts.length === 1) {
        throw new Error('Could not read the answer choices clearly. Try a clearer photo.');
    }
    for (const o of opts) {
        if (looksLikeModelJunk(o) || o.length > 400) {
            throw new Error('Could not read a clean question from this image. Try a clearer photo.');
        }
    }
}
