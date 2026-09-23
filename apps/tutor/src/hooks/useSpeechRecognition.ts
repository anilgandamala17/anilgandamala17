/**
 * Browser SpeechRecognition for English STT (composer input — not TTS).
 * Does not auto-send; caller inserts transcript into a text field.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean; length: number }>;
};

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type SpeechRecognitionStatus =
  | 'idle'
  | 'listening'
  | 'unsupported'
  | 'denied'
  | 'error';

export function useSpeechRecognition(options?: {
  lang?: string;
  onFinalTranscript?: (text: string) => void;
}) {
  const lang = options?.lang ?? 'en-IN';
  const onFinalRef = useRef(options?.onFinalTranscript);
  onFinalRef.current = options?.onFinalTranscript;

  const [status, setStatus] = useState<SpeechRecognitionStatus>(() =>
    getSpeechRecognitionCtor() ? 'idle' : 'unsupported',
  );
  const [interim, setInterim] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    setInterim('');
    setStatus((s) => (s === 'unsupported' || s === 'denied' ? s : 'idle'));
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setStatus('unsupported');
      setErrorMessage('Speech recognition is not supported in this browser.');
      return;
    }
    stop();
    setErrorMessage(null);
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const piece = result[0]?.transcript || '';
        if (result.isFinal) finalText += piece;
        else interimText += piece;
      }
      if (interimText) setInterim(interimText);
      if (finalText.trim()) {
        setInterim('');
        onFinalRef.current?.(finalText.trim());
      }
    };

    rec.onerror = (event) => {
      const code = event.error || 'error';
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setStatus('denied');
        setErrorMessage('Microphone permission was denied.');
      } else if (code === 'aborted' || code === 'no-speech') {
        setStatus('idle');
        setErrorMessage(null);
      } else {
        setStatus('error');
        setErrorMessage('Could not recognize speech. Try again.');
      }
      recRef.current = null;
      setInterim('');
    };

    rec.onend = () => {
      recRef.current = null;
      setStatus((s) => (s === 'listening' ? 'idle' : s));
      setInterim('');
    };

    try {
      recRef.current = rec;
      setStatus('listening');
      rec.start();
    } catch {
      setStatus('error');
      setErrorMessage('Could not start the microphone.');
      recRef.current = null;
    }
  }, [lang, stop]);

  const toggle = useCallback(() => {
    if (status === 'listening') stop();
    else start();
  }, [start, status, stop]);

  return {
    status,
    interim,
    errorMessage,
    supported: status !== 'unsupported',
    isListening: status === 'listening',
    start,
    stop,
    toggle,
  };
}
