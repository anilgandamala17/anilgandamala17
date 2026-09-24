/**
 * Tracks recently generated subtopic labels per exam+subject to reduce repetition across sessions.
 * Uses sessionStorage so variety resets naturally when the browser session ends.
 */

import { EXAM_GENERATION_VERSION } from '@/features/competitive/data/competitive/generationVersion';

const STORAGE_PREFIX = 'aira-competitive-topic-history';
const STEM_PREFIX = 'aira-competitive-stem-prefixes';

function key(examId: string, subjectId: string): string {
  return `${STORAGE_PREFIX}:${examId}:${subjectId}:${EXAM_GENERATION_VERSION}`;
}

function stemKey(examId: string, subjectId: string): string {
  return `${STEM_PREFIX}:${examId}:${subjectId}:${EXAM_GENERATION_VERSION}`;
}

/** Normalize opening of a question for anti-repetition hints (not cryptographic). */
export function stemFingerprint(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .slice(0, 72);
}

const MAX_STORED = 48;

export function getRecentTopicHints(examId: string, subjectId: string): string {
  try {
    const raw = sessionStorage.getItem(key(examId, subjectId));
    if (!raw) return '';
    const topics: string[] = JSON.parse(raw);
    if (!Array.isArray(topics) || topics.length === 0) return '';
    return topics
      .slice(-28)
      .map((t) => String(t).trim())
      .filter(Boolean)
      .join(' | ');
  } catch {
    return '';
  }
}

const MAX_STEMS = 36;

/** Recent question openings to steer the model away from copy-paste stems. */
export function getRecentStemHints(examId: string, subjectId: string): string {
  try {
    const raw = sessionStorage.getItem(stemKey(examId, subjectId));
    if (!raw) return '';
    const stems: string[] = JSON.parse(raw);
    if (!Array.isArray(stems) || stems.length === 0) return '';
    return stems
      .slice(-20)
      .map((s) => String(s).trim())
      .filter(Boolean)
      .join(' || ');
  } catch {
    return '';
  }
}

export function recordQuestionStems(examId: string, subjectId: string, questionTexts: string[]): void {
  if (!questionTexts.length) return;
  try {
    const k = stemKey(examId, subjectId);
    const prev = JSON.parse(sessionStorage.getItem(k) || '[]') as unknown;
    const base = Array.isArray(prev) ? prev.map(String) : [];
    const next = questionTexts.map(stemFingerprint).filter(Boolean);
    const merged = [...base, ...next];
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const s of merged) {
      if (seen.has(s)) continue;
      seen.add(s);
      deduped.push(s);
    }
    sessionStorage.setItem(k, JSON.stringify(deduped.slice(-MAX_STEMS)));
  } catch {
    /* ignore */
  }
}

export function recordQuestionTopics(examId: string, subjectId: string, topicLabels: string[]): void {
  if (!topicLabels.length) return;
  try {
    const k = key(examId, subjectId);
    const prev = JSON.parse(sessionStorage.getItem(k) || '[]') as unknown;
    const base = Array.isArray(prev) ? prev.map(String) : [];
    const merged = [...base, ...topicLabels.map((t) => String(t).trim()).filter(Boolean)];
    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const t of merged) {
      const low = t.toLowerCase();
      if (seen.has(low)) continue;
      seen.add(low);
      deduped.push(t);
    }
    sessionStorage.setItem(k, JSON.stringify(deduped.slice(-MAX_STORED)));
  } catch {
    /* ignore quota / private mode */
  }
}

export function makeSessionEntropy(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
