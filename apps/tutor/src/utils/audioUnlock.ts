let audioUnlocked = false;
let audioContext: AudioContext | null = null;

/** Unlock Web Audio + a silent utterance so later TTS can autoplay. Safe to call often. */
export function unlockAudioContext() {
    if (audioUnlocked) return;
    try {
        if (!audioContext) {
            const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AC) audioContext = new AC();
        }
        if (audioContext?.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }

        const a = new Audio();
        a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        a.volume = 0.01;
        a.setAttribute('playsinline', 'true');
        const playPromise = a.play();
        if (playPromise) playPromise.catch(() => {});

        if (window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance('');
            u.volume = 0;
            window.speechSynthesis.speak(u);
            setTimeout(() => window.speechSynthesis.cancel(), 10);
        }
        audioUnlocked = true;
    } catch {
        /* audio unlock may fail in restricted browser contexts */
    }
}

/** Resume the shared AudioContext created by unlockAudioContext (needed before HTMLAudio play). */
export async function resumeAudioContext() {
    if (audioContext?.state === 'suspended') {
        await audioContext.resume().catch(() => {});
    }
}
