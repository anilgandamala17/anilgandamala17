import type { GeneratedNote, MindMap, MindMapNode, Flashcard, GeneratedSummary, NotesGenerationContext } from '@/types';
import { buildFallbackDiagram } from './notesGeneration';

/**
 * MOCK GENERATORS
 * These act as fallbacks when AI services are unavailable or for rapid testing.
 */

// ─── NOTES ──────────────────────────────────────────────────────────────────

export const generateMockNotes = (
    sessionId: string,
    topicName: string,
    content: string[],
    context: NotesGenerationContext = {},
): GeneratedNote => {
    const fullContent = content.join('\n\n');
    const sentences = fullContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyConcepts = [
        ...(context.keyConcepts || []),
        ...extractKeyConcepts(fullContent, topicName),
    ].filter((v, i, a) => a.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i).slice(0, 8);
    const mainPoints = extractMainPoints(fullContent, sentences);
    const subject = context.subjectArea || 'this subject';
    const grade = context.gradeLevel || 'your level';
    const chapter = context.chapterName;
    const sections = generateNoteSections(topicName, fullContent, keyConcepts, mainPoints, subject, grade, chapter);

    return {
        id: `note_${Date.now()}`,
        sessionId,
        topicName,
        title: `${topicName} — Detailed Study Notes`,
        content: fullContent,
        sections,
        userDoubts: [],
        createdAt: new Date().toISOString(),
        qualityScore: calculateQualityScore(sections, fullContent),
        subjectArea: context.subjectArea,
        gradeLevel: context.gradeLevel,
        chapterName: context.chapterName,
    };
};

function extractKeyConcepts(content: string, topicName: string): string[] {
    const topicWords = topicName.toLowerCase().split(/\s+/);
    const words = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    return Array.from(new Set(words)).filter(w =>
        w.length > 3 &&
        !topicWords.some(tw => w.toLowerCase().includes(tw)) &&
        !['The', 'This', 'That', 'These', 'Those', 'What', 'When', 'Where', 'How', 'Why'].includes(w)
    ).slice(0, 8);
}

function extractMainPoints(_content: string, sentences: string[]): string[] {
    const keyIndicators = ['important', 'key', 'essential', 'critical', 'fundamental', 'main', 'primary', 'significant', 'because', 'means', 'defined'];
    return sentences
        .filter(s => {
            const lower = s.toLowerCase();
            return keyIndicators.some(indicator => lower.includes(indicator)) ||
                (s.length > 50 && s.length < 220);
        })
        .slice(0, 12)
        .map(s => s.trim());
}

function generateNoteSections(
    topicName: string,
    _content: string,
    keyConcepts: string[],
    mainPoints: string[],
    subject: string,
    grade: string,
    chapter?: string,
): GeneratedNote['sections'] {
    const snippet = (i: number, fallback: string) => mainPoints[i] || fallback;
    const conceptList = keyConcepts.length
        ? keyConcepts.map(c => `**${c}**`).join(', ')
        : `the core ideas in **${topicName}**`;
    const chapterLine = chapter ? ` (chapter: ${chapter})` : '';

    const overviewDiagram = buildFallbackDiagram(topicName, keyConcepts);

    return [
        {
            heading: 'Introduction & Learning Goals',
            content: `These notes are for **${topicName}** in ${subject} at ${grade}${chapterLine}.\n\n${snippet(0, `You will learn what ${topicName} means, why it matters in ${subject}, and how to use it correctly.`)}\n\nStay grounded in the lesson: every section below is built from the teaching content for this topic.`,
            highlights: [
                `Topic focus: ${topicName}`,
                `Subject: ${subject}`,
                chapter ? `Chapter: ${chapter}` : `Level: ${grade}`,
            ].filter(Boolean),
            diagrams: [overviewDiagram],
        },
        {
            heading: 'Key Concepts & Definitions',
            content: `The essential vocabulary for **${topicName}** includes ${conceptList}.\n\n${snippet(1, `Learn each definition carefully — exam questions usually test precise language, not vague summaries.`)}\n\n${snippet(2, `Connect each concept back to ${topicName} instead of memorizing isolated words.`)}`,
            highlights: keyConcepts.slice(0, 6).map(c => `${c}: core idea in ${topicName}`),
        },
        {
            heading: 'Detailed Explanation',
            content: `${snippet(2, `Let's unpack ${topicName} step by step.`)}\n\n${snippet(3, `Pay attention to cause-and-effect and the order of ideas — that is where most marks come from.`)}\n\n${snippet(4, `If a diagram appears in class, reconstruct it from memory using the figure in these notes.`)}`,
            highlights: [
                `Explain ${topicName} in your own words`,
                'Track mechanism / sequence, not just labels',
                'Link back to definitions above',
            ],
            diagrams: keyConcepts.length >= 2
                ? [{
                    type: 'process' as const,
                    title: `How to reason about ${topicName}`,
                    caption: 'A practical sequence for studying and answering questions on this topic.',
                    nodes: [
                        { id: 'p1', label: 'Define', detail: topicName.slice(0, 28) },
                        { id: 'p2', label: 'Break down', detail: keyConcepts[0]?.slice(0, 28) },
                        { id: 'p3', label: 'Relate', detail: keyConcepts[1]?.slice(0, 28) },
                        { id: 'p4', label: 'Apply', detail: 'Example / problem' },
                    ],
                    edges: [
                        { from: 'p1', to: 'p2' },
                        { from: 'p2', to: 'p3' },
                        { from: 'p3', to: 'p4' },
                    ],
                }]
                : undefined,
        },
        {
            heading: 'Examples & Applications',
            content: `${snippet(5, `Apply ${topicName} to a concrete situation from the lesson.`)}\n\n${snippet(6, `Write one short worked example: given → method → answer → why it works.`)}\n\nPrefer examples that appear in your ${subject} curriculum rather than generic workplace advice.`,
            highlights: [
                `Worked example for ${topicName}`,
                'Show the method, not only the final answer',
                'Name which concept each step uses',
            ],
            diagrams: keyConcepts.length >= 2
                ? [{
                    type: 'compare' as const,
                    title: `${topicName}: check vs mix-up`,
                    caption: 'Use the left column for the correct idea and the right for a common mix-up.',
                    nodes: [
                        { id: 'c1', label: 'Correct', detail: keyConcepts[0]?.slice(0, 28) },
                        { id: 'c2', label: 'Mix-up', detail: keyConcepts[1]?.slice(0, 28) },
                        { id: 'c3', label: 'Check', detail: 'Does it match the stem?' },
                        { id: 'c4', label: 'Trap', detail: 'Looks similar, wrong job' },
                    ],
                }]
                : undefined,
        },
        {
            heading: 'Common Mistakes & Quick Checks',
            content: `Students often confuse parts of **${topicName}** or skip a required condition.\n\n${snippet(7, `Before finishing an answer, check definitions, units/conditions, and whether you answered the exact question asked.`)}\n\nUse the checklist in Key Takeaways as a pre-exam drill.`,
            highlights: [
                'Do not swap similar terms',
                'State assumptions / conditions',
                'Re-read the question stem carefully',
            ],
        },
        {
            heading: 'Key Takeaways & Revision Checklist',
            content: `To revise **${topicName}**:\n\n- Restate the definition without looking\n- Redraw any diagram from memory\n- Solve one short problem or give one example\n- Explain the idea aloud in under a minute\n\n${snippet(8, `Regular, short practice beats one long cram session.`)}`,
            highlights: [
                `Master the definition of ${topicName}`,
                'Redraw the concept diagram',
                'Complete one practice check',
            ],
        },
    ];
}

function calculateQualityScore(sections: GeneratedNote['sections'], content: string): number {
    let score = 72;
    const length = content.trim().length;
    if (length >= 500) score += 6;
    if (length >= 1200) score += 6;
    if (sections.length >= 5) score += 6;
    const diagramCount = sections.reduce((n, s) => n + (s.diagrams?.length || 0), 0);
    if (diagramCount > 0) score += 5;
    if (diagramCount > 1) score += 3;
    return Math.min(95, score);
}

// ─── MIND MAP ────────────────────────────────────────────────────────────────

export const generateMockMindMap = (sessionId: string, topicName: string, concepts?: string[]): MindMap => {
    const categories = generateTopicCategories(topicName, concepts);
    const nodes: MindMapNode[] = [
        {
            id: 'central',
            label: topicName,
            type: 'central',
            color: '#8b5cf6',
            children: categories.map((category, index) => ({
                id: `category-${index}`,
                label: category.name,
                type: 'category',
                color: category.color,
                children: category.concepts.map((concept, cIndex: number) => ({
                    id: `concept-${index}-${cIndex}`,
                    label: concept.label,
                    description: concept.description,
                    type: 'concept',
                    color: concept.color,
                    children: [],
                })),
            })),
        },
    ];

    return {
        id: `mindmap_${Date.now()}`,
        sessionId,
        topicName,
        centralTopic: topicName,
        nodes,
        createdAt: new Date().toISOString(),
    };
};

function generateTopicCategories(topicName: string, concepts?: string[]): Array<{ name: string; color: string; concepts: Array<{ label: string; description: string; color: string }> }> {
    const lowerTopic = topicName.toLowerCase();
    const categories: Array<{ name: string; color: string; concepts: Array<{ label: string; description: string; color: string }> }> = [];

    if (lowerTopic.includes('ecg') || lowerTopic.includes('heart') || lowerTopic.includes('cardiac')) {
        categories.push(
            { name: 'Waves & Components', color: '#3b82f6', concepts: [{ label: 'P Wave', description: 'Atrial depolarization', color: '#60a5fa' }, { label: 'QRS Complex', description: 'Ventricular depolarization', color: '#60a5fa' }, { label: 'T Wave', description: 'Ventricular repolarization', color: '#60a5fa' }] },
            { name: 'Intervals', color: '#10b981', concepts: [{ label: 'PR Interval', description: '0.12-0.20 sec', color: '#34d399' }, { label: 'QT Interval', description: 'Varies with HR', color: '#34d399' }, { label: 'RR Interval', description: 'Determines HR', color: '#34d399' }] },
            { name: 'Clinical Applications', color: '#f59e0b', concepts: [{ label: 'Arrhythmias', description: 'Abnormal rhythms', color: '#fbbf24' }, { label: 'Ischemia', description: 'Blood flow issues', color: '#fbbf24' }, { label: 'Electrolyte Issues', description: 'Imbalance detection', color: '#fbbf24' }] }
        );
    } else {
        categories.push(
            { name: 'Fundamentals', color: '#3b82f6', concepts: [{ label: 'Core Concepts', description: 'Basic principles', color: '#60a5fa' }, { label: 'Key Definitions', description: 'Important terms', color: '#60a5fa' }, { label: 'Foundations', description: 'Building blocks', color: '#60a5fa' }] },
            { name: 'Advanced Topics', color: '#10b981', concepts: [{ label: 'Complex Scenarios', description: 'Advanced cases', color: '#34d399' }, { label: 'Specialized Areas', description: 'Niche topics', color: '#34d399' }, { label: 'Expert Level', description: 'Mastery concepts', color: '#34d399' }] },
            { name: 'Applications', color: '#f59e0b', concepts: [{ label: 'Real-World Use', description: 'Practical application', color: '#fbbf24' }, { label: 'Case Studies', description: 'Examples', color: '#fbbf24' }, { label: 'Best Practices', description: 'Recommended approaches', color: '#fbbf24' }] }
        );
    }

    if (concepts && concepts.length > 0) {
        concepts.slice(0, 3).forEach((concept, index) => {
            if (categories[0].concepts[index]) categories[0].concepts[index].label = concept;
        });
    }

    return categories;
}

// ─── FLASHCARDS ─────────────────────────────────────────────────────────────

export const createFlashcard = (
    sessionId: string,
    baseTime: number,
    index: number,
    question: string,
    answer: string,
    explanation: string,
    hint: string,
    difficulty: 'easy' | 'medium' | 'hard',
    tags: string[]
): Flashcard => ({
    id: `fc_${baseTime}_${index}`,
    sessionId,
    question,
    answer,
    explanation,
    hint,
    difficulty,
    tags,
    nextReviewDate: new Date().toISOString(),
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
});

export const generateMockFlashcards = (sessionId: string, topicName?: string, content?: string[]): Flashcard[] => {
    const baseTime = Date.now();
    if (!topicName) {
        return [
            createFlashcard(sessionId, baseTime, 1, 'What is the main concept?', 'The main concept involves understanding fundamental principles', 'This topic covers essential knowledge that forms the foundation for advanced learning.', 'Think about the core principles.', 'easy', ['General']),
            createFlashcard(sessionId, baseTime, 2, 'How is this applied in practice?', 'This is applied through real-world scenarios', 'Practical application involves understanding how theoretical concepts translate to actual situations.', 'Consider real-world examples.', 'medium', ['General']),
        ];
    }

    const lowerTopic = topicName.toLowerCase();
    if (lowerTopic.includes('ecg') || lowerTopic.includes('heart') || lowerTopic.includes('cardiac')) {
        return [
            createFlashcard(sessionId, baseTime, 1, 'What does the P wave represent on an ECG?', 'Atrial depolarization', 'First deflection, electrical split through atria.', 'Atrial action.', 'easy', ['ECG', 'Atrial']),
            createFlashcard(sessionId, baseTime, 2, 'What does the QRS complex represent?', 'Ventricular depolarization', 'Spread through ventricles.', 'Main pumping.', 'easy', ['ECG', 'Ventricular']),
        ];
    }

    // Generic fallback based on content
    const concepts = content ? extractFlashcardConcepts(content) : [];
    return concepts.slice(0, 3).map((c, i) => createFlashcard(
        sessionId, baseTime, i + 1,
        `What is ${c}?`, `${c} is a key concept in ${topicName}`, `Foundational knowledge for ${topicName}.`, `Relates to ${topicName}.`, 'medium', [topicName]
    ));
};

function extractFlashcardConcepts(content: string[]): string[] {
    const fullText = content.join(' ');
    const matches = fullText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    return Array.from(new Set(matches)).filter(c => c.length > 3).slice(0, 10);
}

// ─── SUMMARY ────────────────────────────────────────────────────────────────

export const generateMockSummary = (sessionId: string, topicName: string, content: string[]): GeneratedSummary => ({
    id: `sum_${Date.now()}`,
    sessionId,
    topicName,
    title: `${topicName} Executive Summary`,
    overview: content.join(' ').substring(0, 300) + '...',
    keyTakeaways: [
        `Mastered the primary definitions of ${topicName}.`,
        `Explored complex relationships within ${topicName}.`,
        `Analyzed real-world case studies.`,
    ],
    furtherReading: [`Advanced concepts in ${topicName}`, `Historical evolution`, `Latest trends`],
    createdAt: new Date().toISOString(),
});
