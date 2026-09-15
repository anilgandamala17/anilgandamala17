import type { ComponentType } from 'react';
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Globe2,
  Monitor,
  Atom,
  Dna,
  Languages,
  Compass,
  type LucideProps,
} from 'lucide-react';

export type SubjectId =
  | 'mathematics'
  | 'science'
  | 'english'
  | 'hindi'
  | 'social-science'
  | 'computer'
  | 'computer-science'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | string;

/** Canonical subject → brand color (CSS var or hex fallback). */
export const SUBJECT_COLORS: Record<string, string> = {
  mathematics: 'var(--dash-subj-math)',
  science: 'var(--dash-subj-science)',
  english: 'var(--dash-subj-english)',
  hindi: 'var(--dash-subj-hindi)',
  'social-science': 'var(--dash-subj-social)',
  computer: 'var(--dash-subj-cs)',
  'computer-science': 'var(--dash-subj-cs)',
  physics: 'var(--dash-subj-physics)',
  chemistry: 'var(--dash-subj-chem)',
  biology: 'var(--dash-subj-bio)',
};

/** Hex values for canvas / Three.js (CSS vars don't resolve in WebGL). */
export const SUBJECT_HEX: Record<string, string> = {
  mathematics: '#2C8CFF',
  science: '#1DD186',
  english: '#FF5E7E',
  hindi: '#FF9E2C',
  'social-science': '#8A4FFF',
  computer: '#00C2D1',
  'computer-science': '#00C2D1',
  physics: '#6366F1',
  chemistry: '#F59E0B',
  biology: '#10B981',
};

export const SUBJECT_ICONS: Record<string, ComponentType<LucideProps>> = {
  mathematics: Calculator,
  science: FlaskConical,
  english: BookOpen,
  hindi: Languages,
  'social-science': Globe2,
  computer: Monitor,
  'computer-science': Monitor,
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
  'for you': Compass,
  'for-you': Compass,
};

export function normalizeSubjectKey(idOrName: string): string {
  return idOrName.trim().toLowerCase().replace(/\s+/g, '-');
}

export function subjectColor(idOrName: string): string {
  const key = normalizeSubjectKey(idOrName);
  return SUBJECT_COLORS[key] || 'var(--dash-brand)';
}

export function subjectHex(idOrName: string): string {
  const key = normalizeSubjectKey(idOrName);
  return SUBJECT_HEX[key] || '#6366F1';
}

export function subjectIcon(idOrName: string): ComponentType<LucideProps> {
  const key = normalizeSubjectKey(idOrName);
  return SUBJECT_ICONS[key] || BookOpen;
}
