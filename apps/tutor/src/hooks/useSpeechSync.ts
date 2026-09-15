import { useEffect, useState } from 'react';

/**
 * Hook for synchronizing visual components with speech synthesis
 * Listens to speech events and provides state for visual animations
 */
export function useSpeechSync(stepId: string) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechProgress, setSpeechProgress] = useState(0);
    const [currentSentence, setCurrentSentence] = useState(0);
    const [activeMarker, setActiveMarker] = useState<string | null>(null);

    useEffect(() => {
        const handleSpeechStart = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.stepId === stepId) {
                setIsSpeaking(true);
                setSpeechProgress(0);
                setCurrentSentence(0);
            }
        };

        const handleSpeechBoundary = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.stepId === stepId) {
                const progress = customEvent.detail?.progress;
                if (typeof progress === 'number' && !isNaN(progress)) {
                    setSpeechProgress(Math.min(100, Math.max(0, progress)));
                }
                if (customEvent.detail?.type === 'sentence') {
                    setCurrentSentence(prev => prev + 1);
                }
            }
        };

        const handleVisualMarker = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.stepId === stepId) {
                setActiveMarker(customEvent.detail?.markerId);
            }
        };

        const handleSpeechEnd = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.stepId === stepId) {
                setIsSpeaking(false);
                setSpeechProgress(100);
            }
        };

        window.addEventListener('speech-start', handleSpeechStart as EventListener);
        window.addEventListener('speech-boundary', handleSpeechBoundary as EventListener);
        window.addEventListener('visual-marker', handleVisualMarker as EventListener);
        window.addEventListener('speech-end', handleSpeechEnd as EventListener);

        return () => {
            window.removeEventListener('speech-start', handleSpeechStart as EventListener);
            window.removeEventListener('speech-boundary', handleSpeechBoundary as EventListener);
            window.removeEventListener('visual-marker', handleVisualMarker as EventListener);
            window.removeEventListener('speech-end', handleSpeechEnd as EventListener);
        };
    }, [stepId]);

    return { isSpeaking, speechProgress, currentSentence, activeMarker };
}
