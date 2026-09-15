/** Allowed teacher/TTS locales for curriculum immersive + Settings. */
export const TTS_LANGUAGE_OPTIONS = [
  { value: 'en-IN', label: 'English', group: 'English' as const },
  { value: 'te-IN', label: 'Telugu', group: 'Indic' as const },
  { value: 'hi-IN', label: 'Hindi', group: 'Indic' as const },
  { value: 'ta-IN', label: 'Tamil', group: 'Indic' as const },
  { value: 'kn-IN', label: 'Kannada', group: 'Indic' as const },
  { value: 'ml-IN', label: 'Malayalam', group: 'Indic' as const },
] as const;

export type TtsLanguageCode = (typeof TTS_LANGUAGE_OPTIONS)[number]['value'];

export const ALLOWED_TTS_LANGUAGE_CODES: readonly string[] = TTS_LANGUAGE_OPTIONS.map(
  (l) => l.value,
);

export const DEFAULT_TTS_LANGUAGE: TtsLanguageCode = 'en-IN';

export function isAllowedTtsLanguage(code: string | null | undefined): boolean {
  if (!code) return false;
  return ALLOWED_TTS_LANGUAGE_CODES.includes(code);
}

/** Coerce unknown/legacy locales to a supported code. */
export function coerceTtsLanguage(code: string | null | undefined): TtsLanguageCode {
  if (code && isAllowedTtsLanguage(code)) return code as TtsLanguageCode;
  return DEFAULT_TTS_LANGUAGE;
}

export function isEnglishTtsLanguage(code: string | null | undefined): boolean {
  return /^en(?:-|$|_)/i.test((code || '').trim()) || !(code || '').trim();
}

export function ttsLanguageLabel(code: string | null | undefined): string {
  const coerced = coerceTtsLanguage(code);
  return TTS_LANGUAGE_OPTIONS.find((l) => l.value === coerced)?.label || coerced;
}
