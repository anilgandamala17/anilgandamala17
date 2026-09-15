export type VoicePickOptions = {
  language?: string;
  preferredName?: string;
};

function normalizeLang(lang?: string): string {
  if (!lang) return '';
  return lang.toLowerCase();
}

export function normalizeLanguageCode(language?: string): string {
  const raw = normalizeLang(language).replace('_', '-');
  if (!raw) return 'en-in';
  const map: Record<string, string> = {
    en: 'en-in', hi: 'hi-in', te: 'te-in', ta: 'ta-in',
    ml: 'ml-in', kn: 'kn-in', mr: 'mr-in', bn: 'bn-in',
    gu: 'gu-in', pa: 'pa-in', or: 'or-in', od: 'or-in',
  };
  return map[raw] || raw;
}

function languageBase(lang: string): string {
  return normalizeLanguageCode(lang).split('-')[0];
}

export function isVoiceCompatibleWithLanguage(
  voice: SpeechSynthesisVoice,
  targetLanguage?: string
): boolean {
  const target = normalizeLanguageCode(targetLanguage);
  const voiceLang = normalizeLanguageCode(voice.lang);
  if (!target) return true;
  if (!voiceLang) return false;
  if (voiceLang === target) return true;
  const vBase = languageBase(voiceLang);
  const tBase = languageBase(target);
  return vBase === tBase;
}

function isMobilePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || ('ontouchstart' in window && navigator.maxTouchPoints > 1);
}

function voiceQualityScore(v: SpeechSynthesisVoice, preferredLang: string): number {
  const name = (v.name || '').toLowerCase();
  const uri = (v.voiceURI || '').toLowerCase();
  const lang = normalizeLang(v.lang);
  const onMobile = isMobilePlatform();

  let score = 0;

  if (preferredLang) {
    const pl = normalizeLang(preferredLang);
    if (lang === pl) score += 120;
    else if (lang.startsWith(pl)) score += 90;
    else if (pl.startsWith(lang)) score += 30;
  }

  // Quality tier bonuses
  if (name.includes('neural')) score += 350;
  if (name.includes('natural')) score += 340;
  if (name.includes('online')) score += 280;
  if (name.includes('wavenet')) score += 300;
  if (name.includes('premium')) score += 200;
  if (name.includes('enhanced')) score += 150;
  if (name.includes('high quality')) score += 150;

  // Platform-specific bonuses
  if (name.includes('microsoft') && name.includes('natural')) score += 200;
  if (name.includes('microsoft') && name.includes('online')) score += 180;
  if (name.includes('microsoft') || uri.includes('microsoft')) score += 100;
  if (name.includes('google') || uri.includes('google')) score += 90;
  if (name.includes('apple')) score += 80;

  // iOS voices: Siri voices and "Enhanced"/"Premium" are highest quality
  if (name.includes('siri')) score += 300;
  if (name.includes('(enhanced)') || name.includes('enhanced')) score += 200;
  if (name.includes('(premium)') || name.includes('premium')) score += 250;

  // Android: boost Google TTS voices, penalize low-quality ones
  if (onMobile && name.includes('google')) score += 150;

  const naturalVoiceNames = [
    'aria', 'jenny', 'guy', 'sara', 'ryan', 'sonia',
    'davis', 'jane', 'jason', 'nancy', 'tony', 'andrew',
    'emma', 'brian', 'amy', 'steffan', 'libby', 'maisie',
    'samantha', 'daniel', 'karen', 'moira', 'tessa',
    'rishi', 'veena', 'lekha',
  ];
  for (const n of naturalVoiceNames) {
    if (name.includes(n)) { score += 50; break; }
  }

  if (lang.includes('in')) score += 150;
  if (name.includes('india') || uri.includes('india')) score += 150;

  const indianVoices = ['neerja', 'prabhat', 'ravi', 'heera', 'swara', 'vaani', 'gagan', 'aarti', 'dhruv', 'lekha', 'rishi', 'veena', 'majhi'];
  for (const n of indianVoices) {
    if (name.includes(n)) { score += 200; break; }
  }

  // Severe penalties for low-quality engines
  if (name.includes('compact')) score -= 250;
  if (name.includes('espeak')) score -= 300;
  if (name.includes('mbrola')) score -= 280;
  if (name.includes('festival')) score -= 280;
  if (name.includes('cmu')) score -= 200;
  if (name.includes('flite')) score -= 250;
  if (name.includes('pico')) score -= 200;
  if (name.includes('speech services by google') && !name.includes('high quality')) score -= 50;

  // On mobile, non-Google Android voices are generally poor
  if (onMobile && name.includes('android') && !name.includes('google') && !name.includes('high quality')) score -= 100;

  if (v.localService === false) score += 60;
  // On mobile, local voices are preferred (work offline, lower latency)
  if (onMobile && v.localService === true) score += 40;
  if (v.default) score += 10;

  return score;
}

export function getHumanVoiceScore(
  v: SpeechSynthesisVoice,
  language: string = 'en'
): number {
  return voiceQualityScore(v, language);
}

export function pickBestHumanVoice(
  voices: SpeechSynthesisVoice[],
  opts: VoicePickOptions = {}
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const preferredLang = opts.language || 'en';

  const preferredName = opts.preferredName?.trim();
  if (preferredName) {
    const direct = voices.find((v) => v.name === preferredName);
    if (direct && isVoiceCompatibleWithLanguage(direct, preferredLang)) return direct;
  }

  const langMatched = voices.filter(v => isVoiceCompatibleWithLanguage(v, preferredLang));

  if (langMatched.length > 0) {
    const scored = langMatched.map(v => ({ voice: v, score: voiceQualityScore(v, preferredLang) }));
    scored.sort((a, b) => b.score - a.score);
    const good = scored.filter(s => s.score > 0);
    return (good.length > 0 ? good[0] : scored[0]).voice;
  }

  // When English TTS is requested, never fall back to Hindi/Indic voices (common on Indian devices).
  const wantEnglish = languageBase(normalizeLanguageCode(preferredLang)) === 'en';
  if (wantEnglish) {
    const englishVoices = voices.filter(v => languageBase(normalizeLanguageCode(v.lang)) === 'en');
    if (englishVoices.length > 0) {
      const scored = englishVoices.map(v => ({ voice: v, score: voiceQualityScore(v, preferredLang) }));
      scored.sort((a, b) => b.score - a.score);
      const good = scored.filter(s => s.score > 0);
      return (good.length > 0 ? good[0] : scored[0]).voice;
    }
  }

  const scored = voices.map(v => ({ voice: v, score: voiceQualityScore(v, preferredLang) }));
  scored.sort((a, b) => b.score - a.score);
  const goodVoices = scored.filter(s => s.score > 0);
  return (goodVoices.length > 0 ? goodVoices[0] : scored[0])?.voice ?? null;
}

export function filterNaturalVoices(
  voices: SpeechSynthesisVoice[],
  language: string = 'en'
): SpeechSynthesisVoice[] {
  const compatible = voices.filter(v => isVoiceCompatibleWithLanguage(v, language));
  const pool = compatible.length > 0 ? compatible : voices;

  const scored = pool.map(v => ({ voice: v, score: voiceQualityScore(v, language) }));

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.voice);
}
