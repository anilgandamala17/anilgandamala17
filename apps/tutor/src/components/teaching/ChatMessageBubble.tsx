import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import type { ChatMessage } from '../../types';
import ChatMarkdown from './ChatMarkdown';

interface ChatMessageBubbleProps {
    message: ChatMessage;
    reduceAnimations?: boolean;
    /** True while this specific message is being spoken aloud by the AI teacher */
    isSpeaking?: boolean;
}

/** Small circular Aɪra avatar shown next to AI replies. */
function AiraAvatar({ speaking }: { speaking?: boolean }) {
    return (
        <div
            className={`chat-aira-avatar ${speaking ? 'chat-aira-avatar-speaking' : ''}`}
            aria-hidden="true"
        >
            <span className="chat-aira-avatar-glyph">Aɪ</span>
        </div>
    );
}

export default function ChatMessageBubble({ message, reduceAnimations, isSpeaking }: ChatMessageBubbleProps) {
    if (message.type === 'system') {
        return (
            <motion.div
                initial={reduceAnimations ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceAnimations ? 0 : 0.25 }}
                className="flex justify-center"
            >
                <span className="text-[11px] sm:text-xs text-gray-400 dark:text-slate-500 italic text-center px-3">
                    {message.content}
                </span>
            </motion.div>
        );
    }

    const isUser = message.type === 'user';

    if (isUser) {
        return (
            <motion.div
                initial={reduceAnimations ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceAnimations ? 0 : 0.25, ease: 'easeOut' }}
                className="flex justify-end"
            >
                <div className="chat-bubble chat-bubble-user max-w-[85%] md:max-w-[80%]">
                    <p className="chat-bubble-user-text whitespace-pre-wrap break-words">
                        {message.content}
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={reduceAnimations ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceAnimations ? 0 : 0.25, ease: 'easeOut' }}
            className="flex justify-start"
        >
            <div className="flex items-start gap-2 max-w-[92%] md:max-w-[88%] min-w-0">
                <AiraAvatar speaking={isSpeaking} />
                <div className="min-w-0 flex-1">
                    <div className="chat-aira-label">
                        <span>Aɪra AI Teacher</span>
                        {isSpeaking && (
                            <span className="chat-aira-speaking" role="status" aria-label="Aɪra is speaking">
                                <Volume2 className="w-3 h-3" />
                                Speaking
                            </span>
                        )}
                    </div>
                    <div className={`chat-bubble chat-bubble-ai ${isSpeaking ? 'chat-bubble-ai-speaking' : ''}`}>
                        <ChatMarkdown
                            content={message.content}
                            isStreaming={message.isStreaming}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export function ChatThinkingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
        >
            <div className="flex items-start gap-2">
                <AiraAvatar />
                <div className="chat-bubble chat-bubble-ai chat-bubble-thinking px-4 py-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-slow" />
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-slow [animation-delay:0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-slow [animation-delay:0.3s]" />
                </div>
            </div>
        </motion.div>
    );
}
