import { useEffect, useState } from 'react';
import { stripMarkers } from '@/utils/markerParser';

const CAPTION_WINDOW_WORDS = 16;

function cleanSpoken(text: string): string {
  return stripMarkers(text).replace(/\s+/g, ' ').trim();
}

/** Sliding subtitle window from chunk text + 0–1 playback progress. */
export function captionWindowFromProgress(chunkText: string, progress: number): string {
  const clean = cleanSpoken(chunkText);
  if (!clean) return '';
  const words = clean.split(' ').filter(Boolean);
  if (words.length === 0) return '';
  if (words.length <= CAPTION_WINDOW_WORDS) return clean;

  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const idx = Math.min(words.length - 1, Math.floor(clamped * words.length));
  const start = Math.max(0, Math.min(idx, words.length - CAPTION_WINDOW_WORDS));
  return words.slice(start, start + CAPTION_WINDOW_WORDS).join(' ');
}

/**
 * Live captions driven by useSpeech events (`speech-active-chunk`,
 * `speech-caption-progress`, `speech-end`).
 */
export function useLiveCaptions(enabled: boolean, stepKey: string | null) {
  const [captionText, setCaptionText] = useState('');
  const [activeChunk, setActiveChunk] = useState('');

  useEffect(() => {
    setCaptionText('');
    setActiveChunk('');
  }, [stepKey]);

  useEffect(() => {
    if (!enabled) return;

    const onChunk = (event: Event) => {
      const chunkText = (event as CustomEvent<{ chunkText?: string }>).detail?.chunkText;
      if (typeof chunkText !== 'string' || !chunkText.trim()) return;
      setActiveChunk(chunkText);
      setCaptionText(captionWindowFromProgress(chunkText, 0));
    };

    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ chunkText?: string; progress?: number }>).detail;
      const chunkText = detail?.chunkText;
      if (typeof chunkText !== 'string' || !chunkText.trim()) return;
      const progress = typeof detail?.progress === 'number' ? detail.progress : 0;
      setActiveChunk(chunkText);
      setCaptionText(captionWindowFromProgress(chunkText, progress));
    };

    const onEnd = () => {
      /* Keep last line visible until next chunk/step for readability. */
    };

    window.addEventListener('speech-active-chunk', onChunk);
    window.addEventListener('speech-caption-progress', onProgress);
    window.addEventListener('speech-end', onEnd);
    return () => {
      window.removeEventListener('speech-active-chunk', onChunk);
      window.removeEventListener('speech-caption-progress', onProgress);
      window.removeEventListener('speech-end', onEnd);
    };
  }, [enabled]);

  return { captionText, activeChunk, hasCaption: Boolean(captionText) };
}
