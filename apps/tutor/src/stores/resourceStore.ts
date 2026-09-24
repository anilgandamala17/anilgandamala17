import { create } from 'zustand';
import type { GeneratedNote, MindMap, MindMapNode, Flashcard, GeneratedSummary, ImageAnalysis, NotesGenerationContext } from '@/types';
import { toast } from './toastStore';
import { aiService } from '@/services/aiService';


interface ResourceStore {
    // Notes
    notes: GeneratedNote[];
    isGeneratingNotes: boolean;
    generateNotes: (
        sessionId: string,
        topicName: string,
        content: string[],
        context?: NotesGenerationContext,
    ) => Promise<GeneratedNote>;

    // Mind Maps
    mindMaps: MindMap[];
    isGeneratingMindMap: boolean;
    generateMindMap: (sessionId: string, topicName: string, subjectArea: string, gradeLevel: string, concepts?: string[], lessonContent?: string[]) => Promise<MindMap>;

    // Flashcards
    flashcards: Flashcard[];
    isGeneratingFlashcards: boolean;
    generateFlashcards: (sessionId: string, topicName: string, subjectArea: string, gradeLevel: string, content?: string[]) => Promise<Flashcard[]>;

    // Summaries
    summaries: GeneratedSummary[];
    isGeneratingSummary: boolean;
    generateSummary: (sessionId: string, topicName: string, content: string[]) => Promise<GeneratedSummary>;

    // Flashcard review
    currentReviewIndex: number;
    setCurrentReviewIndex: (index: number) => void;
    updateFlashcardPerformance: (id: string, performance: 'again' | 'hard' | 'good' | 'easy') => void;

    // Clear
    clearSessionResources: (sessionId: string) => void;

    // AI Analyzer (Image Analysis)
    analyzedImage: ImageAnalysis | null;
    isAnalyzing: boolean;
    generateImageAnalysis: (base64: string) => Promise<ImageAnalysis>;
    clearAnalysis: () => void;
}

import { 
    generateMockNotes, 
    generateMockMindMap, 
    generateMockFlashcards, 
    generateMockSummary,
    createFlashcard 
} from '@/utils/generators';
import { attachMeta, buildNotesPrompt, parseNotesAiResponse } from '@/utils/notesGeneration';

// Increased context limits for better AI grounding (BUG-002)
const MAX_CONTEXT_CHARS = 14000;

export const useResourceStore = create<ResourceStore>((set, get) => ({
    notes: [],
    isGeneratingNotes: false,
    mindMaps: [],
    isGeneratingMindMap: false,
    flashcards: [],
    isGeneratingFlashcards: false,
    summaries: [],
    isGeneratingSummary: false,
    currentReviewIndex: 0,
    analyzedImage: null,
    isAnalyzing: false,

    clearAnalysis: () => set({ analyzedImage: null, isAnalyzing: false }),

    generateImageAnalysis: async (base64) => {
        set({ isAnalyzing: true });
        try {
            const analysis = await aiService.analyzeImageContent(base64);
            set({ analyzedImage: analysis, isAnalyzing: false });
            toast.success('Image analyzed successfully');
            return analysis;
        } catch (error) {
            set({ isAnalyzing: false });
            toast.error('Failed to analyze image');
            throw error;
        }
    },

    generateNotes: async (sessionId, topicName, content, context = {}) => {
        const currentState = get();
        if (currentState.isGeneratingNotes) throw new Error('Already generating');
        set({ isGeneratingNotes: true });
        try {
            if (!sessionId || !topicName || !content || content.length === 0)
                throw new Error('Invalid params');

            const fullContent = content.join('\n\n').substring(0, MAX_CONTEXT_CHARS);
            const prompt = buildNotesPrompt(topicName, fullContent, context);

            let note: GeneratedNote;
            try {
                const aiResponse = await aiService.callAI(prompt, 3, 1000, { temperature: 0.35 });
                const parsed = parseNotesAiResponse(aiResponse);
                note = attachMeta({
                    id: `note_${Date.now()}`,
                    sessionId,
                    topicName,
                    title: parsed.title || `${topicName} — Detailed Study Notes`,
                    content: fullContent,
                    sections: parsed.sections,
                    userDoubts: [],
                    createdAt: new Date().toISOString(),
                    qualityScore: parsed.qualityScore || 88,
                }, context);
            } catch (err) {
                console.warn('[generateNotes] AI path failed, using grounded mock:', err);
                note = attachMeta(generateMockNotes(sessionId, topicName, content, context), context);
            }

            set(state => ({ notes: [...state.notes, note], isGeneratingNotes: false }));
            toast.success('Detailed notes ready');
            return note;
        } catch (error) {
            set({ isGeneratingNotes: false });
            toast.error('Failed to generate notes. Please try again.');
            throw error;
        }
    },

    generateMindMap: async (sessionId, topicName, subjectArea, gradeLevel, concepts, lessonContent) => {
        const currentState = get();
        if (currentState.isGeneratingMindMap) throw new Error('Already generating');
        set({ isGeneratingMindMap: true });
        try {
            if (!sessionId || !topicName) throw new Error('Invalid params');

            const conceptsText = concepts?.join(', ') || topicName;
            const contentSnippet = (lessonContent || []).join('\n\n').substring(0, MAX_CONTEXT_CHARS);

            const prompt = `You are an expert educational mind map creator specializing in ${subjectArea} for ${gradeLevel} level students.
Create a deeply detailed, structured mind map for: "${topicName}"
Subject: ${subjectArea} | Grade: ${gradeLevel}

Key topics from the lesson: ${conceptsText}
Lesson content: ${contentSnippet || `Focus on: ${topicName} in ${subjectArea}`}

STRICT RULES for Content:
- ALL categories and concepts must be DIRECTLY related to "${topicName}" in ${subjectArea}.
- Categories should represent the major thematic pillars of the topic.
- Concepts within each category must be deep, specific facts, laws, or mechanisms.

STRICT RULES for Aesthetic Colors:
- Provide rich, modern HTML hex colors that visually represent the ${subjectArea} (e.g. Biology = lush greens #10b981; Physics = deep blues/purples #6366f1; History = sepia/amber #d97706).
- The "color" for each category should be the primary thematic hex color.
- The "color" for concepts inside the category should be a slightly lighter/complementary hue of the category color.

Return ONLY a valid JSON object:
{
  "categories": [
    {
      "name": "Major Pillar of ${topicName}",
      "color": "#10b981",
      "icon": "🧬",
      "concepts": [
        {"label": "Specific term or law", "description": "A perfectly phrased, rich 2-3 sentence explanation describing exactly what it is, how it works, and its importance.", "color": "#34d399"},
        {"label": "Detailed application", "description": "A perfectly phrased, rich 2-3 sentence explanation describing exactly what it is, how it works, and its importance.", "color": "#6ee7b7"}
      ]
    }
  ]
}
Produce 4-6 categories, each with 3-6 concepts. Use educationally relevant emojis for icons.`;

            let mindMap: MindMap;
            try {
                const aiResponse = await aiService.callAI(prompt);
                const parsed = JSON.parse(aiResponse.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, ''));
                const categories = parsed.categories || [];
                const nodes: MindMapNode[] = [{
                    id: 'central',
                    label: topicName,
                    type: 'central',
                    color: '#8b5cf6',
                    children: categories.map((cat: { name: string; color: string; icon?: string; concepts: Array<{ label: string; description: string; color: string }> }, i: number) => ({
                        id: `cat-${i}`,
                        label: cat.name,
                        description: cat.icon,
                        type: 'category' as const,
                        color: cat.color,
                        children: (cat.concepts || []).map((c: { label: string; description: string; color: string }, j: number) => ({
                            id: `concept-${i}-${j}`,
                            label: c.label,
                            description: c.description,
                            type: 'concept' as const,
                            color: c.color,
                            children: [],
                        })),
                    })),
                }];
                mindMap = {
                    id: `mindmap_${Date.now()}`,
                    sessionId,
                    topicName,
                    centralTopic: topicName,
                    nodes,
                    createdAt: new Date().toISOString(),
                };
            } catch {
                mindMap = generateMockMindMap(sessionId, topicName, concepts);
            }

            set(state => ({ mindMaps: [...state.mindMaps, mindMap], isGeneratingMindMap: false }));
            toast.success('Mind map generated successfully');
            return mindMap;
        } catch (error) {
            set({ isGeneratingMindMap: false });
            toast.error('Failed to generate mind map. Please try again.');
            throw error;
        }
    },

    generateFlashcards: async (sessionId, topicName, subjectArea, gradeLevel, content) => {
        const currentState = get();
        if (currentState.isGeneratingFlashcards) throw new Error('Already generating');
        set({ isGeneratingFlashcards: true });
        try {
            if (!sessionId) throw new Error('Invalid session');
            const fullContent = (content || []).join('\n\n').substring(0, 3000);

            const prompt = `You are an expert educational flashcard creator specializing in ${subjectArea} for ${gradeLevel} level students.
Create exactly 8 high-quality educational flashcards STRICTLY about: "${topicName}"
Subject: ${subjectArea} | Grade Level: ${gradeLevel}

Lesson content for reference:
${fullContent || `Focus purely on the topic: ${topicName} in ${subjectArea}`}

RULES:
- Every question MUST be directly about "${topicName}" in "${subjectArea}"
- Do NOT generate generic or off-topic questions
- Questions must be specific, factual, and curriculum-aligned for ${gradeLevel}
- Mix difficulties: 3 easy, 3 medium, 2 hard

Return ONLY a valid JSON array:
[
  {
    "question": "Specific question about ${topicName}?",
    "answer": "Precise answer",
    "explanation": "Detailed explanation tied to ${topicName}",
    "hint": "Helpful hint",
    "difficulty": "easy",
    "tags": ["${topicName}", "${subjectArea}"]
  }
]`;

            let cards: Flashcard[];
            try {
                const aiResponse = await aiService.callAI(prompt);
                const parsed: Array<{ question: string; answer: string; explanation: string; hint: string; difficulty: 'easy' | 'medium' | 'hard'; tags: string[] }> = JSON.parse(aiResponse.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, ''));
                const baseTime = Date.now();
                cards = parsed.map((c, i) => createFlashcard(
                    sessionId, baseTime, i + 1,
                    c.question, c.answer, c.explanation, c.hint,
                    c.difficulty || 'medium', c.tags || [topicName]
                ));
            } catch {
                cards = generateMockFlashcards(sessionId, topicName, content);
            }

            set(state => ({ flashcards: [...state.flashcards, ...cards], isGeneratingFlashcards: false }));
            toast.success(`Generated ${cards.length} flashcards`);
            return cards;
        } catch (error) {
            set({ isGeneratingFlashcards: false });
            toast.error('Failed to generate flashcards. Please try again.');
            throw error;
        }
    },

    generateSummary: async (sessionId, topicName, content) => {
        const currentState = get();
        if (currentState.isGeneratingSummary) throw new Error('Already generating');
        set({ isGeneratingSummary: true });
        try {
            if (!content || content.length === 0 || content.join('').trim().length < 10) {
                throw new Error('Insufficient content to generate summary');
            }
            const fullContent = content.join('\n\n').substring(0, MAX_CONTEXT_CHARS);
            const prompt = `You are an expert educational content summarizer. Create an executive summary for: "${topicName}".

Lesson content:
${fullContent}

Return ONLY a valid JSON object in this exact format:
{
  "overview": "2-3 sentence overview of the topic...",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4"],
  "furtherReading": ["Advanced concept 1", "Related topic 2", "Practical application 3"]
}`;

            let summary: GeneratedSummary;
            try {
                const aiResponse = await aiService.callAI(prompt);
                const parsed = JSON.parse(aiResponse.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, ''));
                summary = {
                    id: `sum_${Date.now()}`,
                    sessionId,
                    topicName,
                    title: `${topicName} Executive Summary`,
                    overview: parsed.overview || `This session covered the core principles of ${topicName}.`,
                    keyTakeaways: parsed.keyTakeaways || [`Mastered the primary concepts of ${topicName}.`],
                    furtherReading: parsed.furtherReading || [`Advanced concepts in ${topicName}`],
                    createdAt: new Date().toISOString(),
                };
            } catch {
                summary = generateMockSummary(sessionId, topicName, content);
            }

            set(state => ({ summaries: [...state.summaries, summary], isGeneratingSummary: false }));
            toast.success('Summary generated successfully');
            return summary;
        } catch (error) {
            set({ isGeneratingSummary: false });
            toast.error('Failed to generate summary');
            throw error;
        }
    },

    setCurrentReviewIndex: (index) => set({ currentReviewIndex: index }),

    updateFlashcardPerformance: (id, performance) => {
        set((state) => {
            const updated = state.flashcards.map((card) => {
                if (card.id !== id) return card;

                // Simple spaced repetition algorithm
                let newInterval = card.intervalDays;
                let newEaseFactor = card.easeFactor;

                switch (performance) {
                    case 'again':
                        newInterval = 1;
                        newEaseFactor = Math.max(1.3, card.easeFactor - 0.2);
                        break;
                    case 'hard':
                        newInterval = Math.ceil(card.intervalDays * 1.2);
                        newEaseFactor = Math.max(1.3, card.easeFactor - 0.15);
                        break;
                    case 'good':
                        newInterval = Math.ceil(card.intervalDays * card.easeFactor);
                        break;
                    case 'easy':
                        newInterval = Math.ceil(card.intervalDays * card.easeFactor * 1.3);
                        newEaseFactor = card.easeFactor + 0.15;
                        break;
                }

                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + newInterval);

                return {
                    ...card,
                    intervalDays: newInterval,
                    easeFactor: newEaseFactor,
                    repetitions: card.repetitions + 1,
                    lastPerformance: performance,
                    nextReviewDate: nextDate.toISOString(),
                };
            });

            return { flashcards: updated };
        });
    },

    clearSessionResources: (sessionId) => {
        set((state) => ({
            notes: state.notes.filter((n) => n.sessionId !== sessionId),
            mindMaps: state.mindMaps.filter((m) => m.sessionId !== sessionId),
            flashcards: state.flashcards.filter((f) => f.sessionId !== sessionId),
            summaries: state.summaries.filter((s) => s.sessionId !== sessionId),
        }));
    },
}));
