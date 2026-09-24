import type { Question } from '@/features/competitive/data/competitiveQuestions';
import { stemFingerprint } from './examSessionDiversity';

const PLACEHOLDER_STEM = [
  /\[fallback\]/i,
  /practice question\s+\d+/i,
  /evaluate the given parameters/i,
  /given standard parameters/i,
  /evaluate the condition and calculate the optimal result/i,
  /foundational principles of/i,
  /^question\s+\d+$/i,
];

const PLACEHOLDER_OPTION = /^(option\s*[a-d](?:\s*\(.*\))?|value is\s+\d+)$/i;

export function looksLikePlaceholderQuestion(q: Pick<Question, 'text' | 'options'>): boolean {
  const text = (q.text || '').trim();
  if (!text || text.length < 12) return true;
  if (PLACEHOLDER_STEM.some((re) => re.test(text))) return true;
  const opts = Array.isArray(q.options) ? q.options : [];
  if (opts.length !== 4) return true;
  if (opts.some((o) => PLACEHOLDER_OPTION.test(String(o).trim()))) return true;
  const normalized = opts.map((o) => String(o).trim().toLowerCase());
  if (new Set(normalized).size < 4) return true;
  return false;
}

export function isValidExamQuestion(q: Question | null | undefined): q is Question {
  if (!q) return false;
  if (looksLikePlaceholderQuestion(q)) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) return false;
  if (!q.topic || !String(q.topic).trim()) return false;
  return true;
}

function significantTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[0-9]+/g, ' ')
      .replace(/[^\p{L}\s]/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 4),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

function numericSignature(text: string): string {
  return (text.match(/-?\d+(?:\.\d+)?/g) || []).join(',');
}

export function questionsAreNearDuplicates(a: Question, b: Question): boolean {
  const fa = stemFingerprint(a.text);
  const fb = stemFingerprint(b.text);
  if (fa && fa === fb) return true;
  const na = numericSignature(a.text);
  const nb = numericSignature(b.text);
  if (na && nb && na !== nb) return false;
  const tokensA = significantTokens(a.text);
  const tokensB = significantTokens(b.text);
  if (tokensA.size < 5 || tokensB.size < 5) return false;
  return jaccard(tokensA, tokensB) >= 0.92;
}

/** Strip numbers to detect same question skeleton with different constants. */
export function questionStructureFingerprint(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0-9]+(?:\.[0-9]+)?/g, '#')
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}#\s]/gu, '')
    .trim()
    .slice(0, 120);
}

export function questionsShareTemplate(aText: string, bText: string): boolean {
  const fa = questionStructureFingerprint(aText);
  const fb = questionStructureFingerprint(bText);
  if (!fa || !fb || fa.length < 20) return false;
  return fa === fb;
}

/** Keep first unique item; drop later near-duplicates. */
export function dedupeQuestions(questions: Question[]): Question[] {
  const kept: Question[] = [];
  for (const q of questions) {
    if (!isValidExamQuestion(q)) continue;
    if (kept.some((prev) => questionsAreNearDuplicates(prev, q))) continue;
    kept.push(q);
  }
  return kept;
}

/** Drop excess questions sharing the same stem skeleton; keeps up to maxPerTemplate each. */
export function dedupeQuestionTemplates(
  questions: Question[],
  maxPerTemplate = 2,
  minKeep = 0,
): Question[] {
  const kept: Question[] = [];
  const counts = new Map<string, number>();
  for (const q of questions) {
    if (!isValidExamQuestion(q)) continue;
    const fp = questionStructureFingerprint(q.text);
    if (fp.length >= 20) {
      const c = counts.get(fp) ?? 0;
      if (c >= maxPerTemplate) continue;
      counts.set(fp, c + 1);
    }
    kept.push(q);
  }
  if (minKeep > 0 && kept.length < minKeep) return kept;
  return kept;
}

export function extractExamMcqArray(raw: string): unknown[] | null {
  const cleaned = String(raw || '')
    .replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, '')
    .replace(/```(?:json)?/gi, '')
    .trim();

  const arrays: string[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] !== '[') continue;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let j = i; j < cleaned.length; j++) {
      const ch = cleaned[j];
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
      if (ch === '[') depth += 1;
      else if (ch === ']') {
        depth -= 1;
        if (depth === 0) {
          arrays.push(cleaned.slice(i, j + 1));
          break;
        }
      }
    }
  }

  let best: unknown[] | null = null;
  let bestScore = 0;
  for (const candidate of arrays) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (!Array.isArray(parsed) || parsed.length === 0) continue;
      const objects = parsed.filter(
        (item) => item && typeof item === 'object' && typeof (item as { text?: unknown }).text === 'string',
      );
      const score = objects.length * 10 + parsed.length;
      if (score > bestScore && objects.length > 0) {
        bestScore = score;
        best = parsed;
      }
    } catch {
      /* skip truncated JSON */
    }
  }
  return best;
}

export function normalizeOptions(options: unknown): string[] | null {
  if (!Array.isArray(options) || options.length < 4) return null;
  const cleaned = options.slice(0, 4).map((o) => String(o ?? '').trim()).filter(Boolean);
  if (cleaned.length !== 4) return null;
  if (new Set(cleaned.map((o) => o.toLowerCase())).size < 4) return null;
  if (cleaned.some((o) => PLACEHOLDER_OPTION.test(o))) return null;
  return cleaned;
}

export function clampCorrectAnswer(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(3, Math.max(0, Math.round(n)));
}

/** Practice length: official papers can be 80–100 Q; AI quality collapses past ~30.
 *  Full CBT papers (`paperScope: 'full'`) use the official subject count uncapped. */
export function resolvePaperLength(
  officialCount: number,
  mode: 'mock' | 'pyq' | 'standard',
  paperScope: 'subject' | 'full' = 'subject',
): number {
  if (paperScope === 'full') {
    return Math.max(1, officialCount);
  }
  const cap = mode === 'mock' ? 18 : 30;
  return Math.max(1, Math.min(officialCount, cap));
}
