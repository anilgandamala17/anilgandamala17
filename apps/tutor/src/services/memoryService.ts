import type { MemoryEntry, UserProfile, Doubt, TeachingSession } from '../types';
import { useUserStore } from '../stores/userStore';

/**
 * Service to manage AI memories and context propagation
 */
export const memoryService = {
    /**
     * Creates a memory from a resolved doubt
     */
    saveDoubtMemory: (doubt: Doubt, resolution: string) => {
        const { addMemory } = useUserStore.getState();

        addMemory({
            type: 'doubt',
            content: `Learner asked: "${doubt.question}". Explanation provided: ${resolution.substring(0, 100)}...`,
            reasoning: `User had a doubt about ${doubt.context.stepTitle}. This indicates a need for clearer explanations in this area.`,
            relevanceScore: 0.8,
            tags: ['doubt', doubt.context.stepTitle, 'resolution'],
            metadata: {
                doubtId: doubt.id,
                stepNumber: doubt.context.stepNumber
            }
        });
    },

    /**
     * Creates a memory from a completed session
     */
    saveSessionSummaryMemory: (session: TeachingSession) => {
        const { addMemory } = useUserStore.getState();

        const successRate = (session.teachingSteps.filter(s => s.completed).length / session.totalSteps) * 100;

        addMemory({
            type: 'concept_mastery',
            content: `Completed session on "${session.topicName}" with ${successRate.toFixed(0)}% completion.`,
            reasoning: `Systematic record of topic completion to avoid redundant explanations in future sessions.`,
            relevanceScore: 0.9,
            tags: [session.topicId, 'completion', 'mastery'],
            metadata: {
                sessionId: session.id,
                topicId: session.topicId,
                totalSteps: session.totalSteps
            }
        });
    },

    /**
     * Retrieves relevant memories for a given topic or context
     */
    getRelevantMemories: (profile: UserProfile, contextTags: string[]): MemoryEntry[] => {
        if (!profile.memories || profile.memories.length === 0) return [];

        return profile.memories
            .filter(mem =>
                mem.tags.some(tag => contextTags.includes(tag)) ||
                mem.relevanceScore > 0.7
            )
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 5);
    },

    /**
     * Formats memories into a string for AI context injection
     */
    formatMemoriesForAI: (memories: MemoryEntry[]): string => {
        if (memories.length === 0) return '';

        return memories
            .map(mem => `[Memory - ${mem.type}]: ${mem.content}`)
            .join('\n');
    }
};
