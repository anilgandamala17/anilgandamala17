import { useEffect, useMemo, useRef } from 'react';

interface TextBoardVisualProps {
    content: string;
}

export function TextBoardVisual({ content }: TextBoardVisualProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Basic markdown parsing to split sentences/paragraphs
    const sentences = useMemo(() => {
        // Strip markdown bold/italic
        const cleanContent = content.replace(/\*\*/g, '').replace(/\*/g, '');
        // Split by sentences roughly
        return cleanContent.split(/([.!?]+[\s\n]+)/).reduce((acc: string[], val) => {
            if (/^[.!?]+[\s\n]+$/.test(val) && acc.length > 0) {
                acc[acc.length - 1] += val;
            } else if (val.trim()) {
                acc.push(val);
            }
            return acc;
        }, []);
    }, [content]);

    useEffect(() => {
        const handleSpeechChunk = (e: Event) => {
            const ce = e as CustomEvent;
            const chunk = ce.detail?.chunkText;
            if (!chunk || !containerRef.current) return;

            const normChunk = chunk.replace(/[^\w\s]/g, '').toLowerCase().trim();
            if (!normChunk) return;

            const paragraphs = containerRef.current.querySelectorAll('p');
            
            // Check if there is at least one active match in the paragraphs
            let hasAnyActive = false;
            paragraphs.forEach((p) => {
                const sentence = p.getAttribute('data-sentence') || '';
                const normSentence = sentence.replace(/[^\w\s]/g, '').toLowerCase().trim();
                if (normSentence && (normSentence.includes(normChunk) || normChunk.includes(normSentence))) {
                    hasAnyActive = true;
                }
            });

            paragraphs.forEach((p) => {
                const sentence = p.getAttribute('data-sentence') || '';
                const normSentence = sentence.replace(/[^\w\s]/g, '').toLowerCase().trim();
                
                let isActive = false;
                if (normSentence && (normSentence.includes(normChunk) || normChunk.includes(normSentence))) {
                    isActive = true;
                }

                if (isActive) {
                    p.className = 'text-xl md:text-3xl leading-relaxed transition-all duration-500 text-yellow-300 font-bold drop-shadow-[0_0_15px_rgba(253,224,71,0.5)] scale-[1.02] transform origin-left';
                } else if (hasAnyActive) {
                    p.className = 'text-xl md:text-3xl leading-relaxed transition-all duration-500 text-white/45';
                } else {
                    p.className = 'text-xl md:text-3xl leading-relaxed transition-all duration-500 text-white font-medium';
                }
            });
        };

        const handleSpeechEnd = () => {
            if (!containerRef.current) return;
            const paragraphs = containerRef.current.querySelectorAll('p');
            paragraphs.forEach((p) => {
                p.className = 'text-xl md:text-3xl leading-relaxed transition-all duration-500 text-white font-medium';
            });
        };

        window.addEventListener('speech-active-chunk', handleSpeechChunk);
        window.addEventListener('speech-end', handleSpeechEnd);
        return () => {
            window.removeEventListener('speech-active-chunk', handleSpeechChunk);
            window.removeEventListener('speech-end', handleSpeechEnd);
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full p-8 md:p-12 overflow-y-auto text-white" style={{ fontFamily: 'var(--font-primary)' }}>
            <div className="max-w-4xl mx-auto space-y-6">
                {sentences.map((sentence, idx) => (
                    <p 
                        key={idx} 
                        data-sentence={sentence}
                        className="text-xl md:text-3xl leading-relaxed transition-all duration-500 text-white font-medium"
                    >
                        {sentence}
                    </p>
                ))}
            </div>
        </div>
    );
}
