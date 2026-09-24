import type { TeachingStep } from '@/types';
import { analyzeTopic, type TopicAnalysis } from './topicAnalyzer';
import { memoryService } from './memoryService';
import { useUserStore } from '@/stores/userStore';
import { aiService, GeneratedContent } from './aiService';
import { collectDiagramLookupKeys, getVisualsForTopic } from '@/data/visualRegistry';
import { injectCurriculumVisualMarkers } from '@/utils/curriculumVisualSync';

/**
 * Generates comprehensive teaching steps for a topic
 * Based on AI analysis of scope, duration, and complexity
 */
export async function generateComprehensiveCourse(
    topicId: string,
    topicName: string,
    description?: string,
    subjectArea?: string,
    chapterName?: string,
    gradeName?: string,
    targetLanguage?: string
): Promise<TeachingStep[]> {
    // Analyze the topic
    const analysis = analyzeTopic(topicId, topicName, description, subjectArea, chapterName, gradeName);

    // Fetch authoritative visual structures
    const registryEntry = getVisualsForTopic(topicId);

    // Try to fetch dynamic AI content first (bounded wait — fall back to local templates).
    const AI_CONTENT_TIMEOUT_MS = 2500;
    let aiContent: GeneratedContent | null = null;
    try {
        aiContent = await Promise.race([
            aiService.generateTopicContent(analysis, registryEntry, targetLanguage),
            new Promise<null>((resolve) => {
                setTimeout(() => resolve(null), AI_CONTENT_TIMEOUT_MS);
            }),
        ]);
    } catch {
        aiContent = null;
    }

    // Generate steps based on analysis
    const infoSteps: TeachingStep[] = [];

    // 1. Introduction section
    infoSteps.push(...generateIntroductionSteps(analysis, aiContent));

    // 2. Core content section
    infoSteps.push(...generateCoreContentSteps(analysis, aiContent));

    // 3. Examples and applications section
    infoSteps.push(...generateExamplesSteps(analysis, aiContent));

    // 4. Review and summary section
    infoSteps.push(...generateReviewSteps(analysis, aiContent));

    // Merge all info steps into a single "Masterclass" step for seamless, uninterrupted 30-minute playback
    const mergedContent = infoSteps.map(s => s.content).filter(Boolean).join('\n\n');
    let mergedSpokenContent = infoSteps.map(s => s.spokenContent).filter(Boolean).join(' ');
    const diagramKeys = collectDiagramLookupKeys(registryEntry);
    mergedSpokenContent = injectCurriculumVisualMarkers(mergedSpokenContent, diagramKeys, topicId);

    // Combine metadata arrays safely
    const allKeyConcepts = Array.from(new Set(infoSteps.flatMap(s => s.keyConcepts || [])));
    const allRealWorldExamples = Array.from(new Set(infoSteps.flatMap(s => s.realWorldExamples || [])));
    const allPracticalApplications = Array.from(new Set(infoSteps.flatMap(s => s.practicalApplications || [])));
    const allSubConcepts = Array.from(new Set(infoSteps.flatMap(s => s.subConcepts || [])));

    const masterclassStep: TeachingStep = {
        id: `${analysis.topicId}-masterclass`,
        stepNumber: 1,
        title: `${analysis.topicName} Masterclass`,
        content: mergedContent,
        spokenContent: mergedSpokenContent,
        visualId: analysis.topicId,
        visualType: 'diagram', // Keep diagram canvas active for the whole duration
        durationSeconds: infoSteps.reduce((acc, s) => acc + (s.durationSeconds || 0), 0),
        completed: false,
        complexity: analysis.complexity === 'expert' ? 'advanced' : analysis.complexity,
        estimatedMinutes: infoSteps.reduce((acc, s) => acc + (s.estimatedMinutes || 0), 0),
        keyConcepts: allKeyConcepts,
        realWorldExamples: allRealWorldExamples,
        practicalApplications: allPracticalApplications,
        subConcepts: allSubConcepts,
    };

    const steps: TeachingStep[] = [masterclassStep];

    // 5. Practice/Interactive section
    steps.push(...generatePracticeSteps(analysis));

    // Update step numbers and attach visual markers for dynamic visuals
    steps.forEach((step, index) => {
        step.stepNumber = index + 1;
        step.visualMarkers = analysis.visualMarkers; // Attach the full set of markers for the topic
    });

    return steps;
}

/**
 * Generates introduction steps
 */
function generateIntroductionSteps(analysis: TopicAnalysis, aiContent: GeneratedContent | null): TeachingStep[] {
    const steps: TeachingStep[] = [];
    const introMinutes = analysis.recommendedStructure.introductionMinutes;
    const stepsCount = Math.max(2, Math.ceil(introMinutes / 3)); // ~3 minutes per step

    // Suppress unused variable warning - stepsCount is used in conditional logic below
    void stepsCount;

    // Welcome step
    steps.push({
        id: `${analysis.topicId}-intro-1`,
        stepNumber: 0, // Will be updated later
        title: `Welcome to ${analysis.topicName}`,
        content: aiContent ? aiContent.introductionContent : generateWelcomeContent(analysis),
        spokenContent: aiContent ? aiContent.introductionContent : generateWelcomeSpokenContent(analysis),
        visualType: 'diagram',
        durationSeconds: 300, // Accommodate ultra-long introduction (5 minutes)
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 1,
        keyConcepts: analysis.scope.primaryConcepts.slice(0, 3),
        realWorldExamples: analysis.realWorldExamples.slice(0, 2),
    });

    // Overview step
    if (stepsCount > 1) {
        steps.push({
            id: `${analysis.topicId}-intro-2`,
            stepNumber: 0,
            title: `Overview of ${analysis.topicName}`,
            content: generateOverviewContent(analysis),
            spokenContent: generateOverviewSpokenContent(analysis),
            visualType: 'diagram',
            durationSeconds: 180,
            completed: false,
            complexity: 'basic',
            estimatedMinutes: 3,
            keyConcepts: analysis.scope.primaryConcepts,
        });
    }

    // Learning objectives step
    if (stepsCount > 2) {
        steps.push({
            id: `${analysis.topicId}-intro-3`,
            stepNumber: 0,
            title: 'What You Will Learn',
            content: generateLearningObjectivesContent(analysis),
            spokenContent: generateLearningObjectivesSpokenContent(analysis),
            visualType: 'text',
            durationSeconds: 120,
            completed: false,
            complexity: 'basic',
            estimatedMinutes: 2,
        });
    }

    return steps;
}

/**
 * Generates core content steps
 */
function generateCoreContentSteps(analysis: TopicAnalysis, aiContent: GeneratedContent | null): TeachingStep[] {
    const steps: TeachingStep[] = [];
    const primaryConcepts = analysis.scope.primaryConcepts;
    const subConcepts = analysis.scope.subConcepts;

    // Generate steps for primary concepts
    primaryConcepts.forEach((concept, index) => {
        const stepIndex = index + 1;
        const duration = 600; // Ultra-extended pace for 10-minute masterclass core node

        const aiConceptContent = aiContent ? getMatchingCoreConcept(concept, aiContent) : null;

        steps.push({
            id: `${analysis.topicId}-core-${stepIndex}`,
            stepNumber: 0,
            title: concept,
            content: aiConceptContent ? aiConceptContent : generateConceptContent(concept, analysis),
            spokenContent: aiConceptContent ? aiConceptContent : generateConceptSpokenContent(concept, analysis),
            visualType: getVisualTypeForConcept(concept, analysis),
            durationSeconds: duration,
            completed: false,
            complexity: analysis.complexity === 'expert' ? 'advanced' : analysis.complexity,
            estimatedMinutes: 1,
            keyConcepts: [concept],
            subConcepts: getRelatedSubConcepts(concept, subConcepts),
            realWorldExamples: getRelevantExamples(concept, analysis.realWorldExamples),
            practicalApplications: getPracticalApplications(concept, analysis.scope.practicalApplications),
        });
    });

    // Generate steps for important sub-concepts
    const importantSubConcepts = subConcepts.slice(0, Math.ceil(subConcepts.length / 2));
    importantSubConcepts.forEach((subConcept, index) => {
        const stepIndex = primaryConcepts.length + index + 1;

        steps.push({
            id: `${analysis.topicId}-core-sub-${stepIndex}`,
            stepNumber: 0,
            title: subConcept,
            content: generateSubConceptContent(subConcept, analysis),
            spokenContent: generateSubConceptSpokenContent(subConcept, analysis),
            visualType: 'diagram',
            durationSeconds: 180,
            completed: false,
            complexity: analysis.complexity === 'basic' ? 'intermediate' : (analysis.complexity === 'expert' ? 'advanced' : analysis.complexity),
            estimatedMinutes: 3,
            keyConcepts: [subConcept],
        });
    });

    return steps;
}

/**
 * Generates examples and applications steps
 */
function generateExamplesSteps(analysis: TopicAnalysis, aiContent: GeneratedContent | null): TeachingStep[] {
    const steps: TeachingStep[] = [];
    const examplesMinutes = analysis.recommendedStructure.examplesMinutes;
    const stepsCount = Math.max(1, Math.ceil(examplesMinutes / 4));

    // Real-world examples step
    if (analysis.realWorldExamples.length > 0) {
        const hasAiExamples = aiContent && aiContent.realWorldExamples && aiContent.realWorldExamples.length > 0;
        steps.push({
            id: `${analysis.topicId}-examples-1`,
            stepNumber: 0,
            title: 'Real-World Applications',
            content: hasAiExamples ? aiContent.realWorldExamples.map((ex, i) => `${i + 1}. ${ex}`).join('\n\n') : generateRealWorldExamplesContent(analysis),
            spokenContent: hasAiExamples ? aiContent.realWorldExamples.join('. ') : generateRealWorldExamplesSpokenContent(analysis),
            visualType: 'text',
            durationSeconds: 30, // Strict 2-min pace
            completed: false,
            complexity: 'intermediate',
            estimatedMinutes: 1,
            realWorldExamples: analysis.realWorldExamples,
            practicalApplications: analysis.scope.practicalApplications,
        });
    }

    // Case studies or detailed examples
    if (stepsCount > 1 && analysis.complexity !== 'basic') {
        steps.push({
            id: `${analysis.topicId}-examples-2`,
            stepNumber: 0,
            title: 'Case Studies and Scenarios',
            content: generateCaseStudiesContent(analysis),
            spokenContent: generateCaseStudiesSpokenContent(analysis),
            visualType: 'interactive',
            durationSeconds: 300,
            completed: false,
            complexity: analysis.complexity === 'expert' ? 'advanced' : analysis.complexity,
            estimatedMinutes: 5,
        });
    }

    return steps;
}

/**
 * Generates practice/interactive steps
 */
function generatePracticeSteps(analysis: TopicAnalysis): TeachingStep[] {
    const steps: TeachingStep[] = [];
    const practiceMinutes = analysis.recommendedStructure.practiceMinutes;

    if (practiceMinutes >= 3) {
        steps.push({
            id: `${analysis.topicId}-practice-1`,
            stepNumber: 0,
            title: 'Knowledge Check',
            content: 'Let\'s see how well you understand the concepts we just covered.',
            spokenContent: `Before we move on, let's do a quick knowledge check. I have a question about ${analysis.scope.primaryConcepts[0] || analysis.topicName}.`,
            visualType: 'quiz',
            quiz: generateQuizQuestion(analysis, 0),
            type: 'practice',
            durationSeconds: Math.max(180, practiceMinutes * 60),
            completed: false,
            complexity: analysis.complexity === 'expert' ? 'advanced' : analysis.complexity,
            estimatedMinutes: practiceMinutes,
        });
    }

    return steps;
}

/**
 * Generates review and summary steps
 */
function generateReviewSteps(analysis: TopicAnalysis, aiContent: GeneratedContent | null): TeachingStep[] {
    const steps: TeachingStep[] = [];

    // Summary step
    steps.push({
        id: `${analysis.topicId}-review-1`,
        stepNumber: 0,
        title: 'Key Takeaways',
        content: aiContent ? aiContent.summaryContent : generateSummaryContent(analysis),
        spokenContent: aiContent ? aiContent.summaryContent : generateSummarySpokenContent(analysis),
        visualType: 'text',
        type: 'summary',
        durationSeconds: 300, // Extended pace for ultra-long 5-minute conclusion
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 1,
        keyConcepts: analysis.scope.primaryConcepts,
    });

    // Quiz/Assessment step
    steps.push({
        id: `${analysis.topicId}-review-2`,
        stepNumber: 0,
        title: 'Final Assessment',
        content: 'Complete this final quiz to master the topic.',
        spokenContent: `Excellent work! Now, let's wrap up with a final assessment. This will cover everything we've discussed today.`,
        visualType: 'quiz',
        quiz: generateQuizQuestion(analysis, 1),
        type: 'assessment',
        durationSeconds: 300,
        completed: false,
        complexity: analysis.complexity === 'expert' ? 'advanced' : analysis.complexity,
        estimatedMinutes: 5,
    });

    return steps;
}

/**
 * Generates a relevant quiz question based on topic analysis
 */
function generateQuizQuestion(analysis: TopicAnalysis, index: number): TeachingStep['quiz'] {
    const { quizData, scope } = analysis;
    const questions = quizData?.keyQuestions || [`What is the core principle of ${analysis.topicName}?`];
    const questionText = questions[index % questions.length];

    // Choose a random concept to quiz on
    const concept = scope.primaryConcepts[index % scope.primaryConcepts.length] || analysis.topicName;
    const distractors = quizData?.distractors[concept] || [`An unrelated aspect of ${analysis.topicName}`, 'A different principle entirely', 'Not relevant here'];

    const options = [concept, ...distractors.slice(0, 3)];
    // Shuffle options
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    const correctIndex = shuffled.indexOf(concept);

    return {
        id: `q-${analysis.topicId}-${index}`,
        question: questionText,
        type: 'multiple_choice',
        options: shuffled,
        correctAnswer: correctIndex,
        explanation: `${concept} is the correct answer because it directly addresses the core principles of ${analysis.topicName} discussed in this section.`
    };
}

// ============================================
// CONTENT GENERATION HELPERS
// ============================================

function generateWelcomeContent(analysis: TopicAnalysis): string {
    return `Welcome to our comprehensive course on ${analysis.topicName}! 

This ${analysis.estimatedDurationMinutes}-minute course will take you from fundamentals to practical application. We'll cover ${analysis.scope.primaryConcepts.length} primary concepts and explore real-world applications.

By the end of this course, you'll have a thorough understanding of ${analysis.topicName} and be able to apply this knowledge in practical scenarios.`;
}

function generateWelcomeSpokenContent(analysis: TopicAnalysis): string {
    const { profile } = useUserStore.getState();
    let memoryContext = '';

    if (profile) {
        const relevantMemories = memoryService.getRelevantMemories(profile, [analysis.topicId, ...analysis.scope.primaryConcepts]);
        if (relevantMemories.length > 0) {
            const memoryList = relevantMemories.slice(0, 1).map(m => m.content).join(' ');
            memoryContext = ` I remember we previously covered ${memoryList}, which will be very helpful here. `;
        }
    }

    const concepts = analysis.scope.primaryConcepts;
    const conceptList = concepts.length > 2 ? `${concepts.slice(0, -1).join(', ')}, and ${concepts[concepts.length - 1]}` : concepts.join(' and ');

    return `Hello and welcome! I am your teacher, and today I am going to walk you through ${analysis.topicName} in a way that will be easy to understand and genuinely interesting. [[VISUAL:center]]${memoryContext}

Before we begin, let me tell you why ${analysis.topicName} matters so much. This is not just another topic to study for exams. This is something that has real significance in how the world works around us. Whether you are a student preparing for an exam, a professional looking to strengthen your fundamentals, or simply someone curious about this subject, understanding ${analysis.topicName} will open new doors of thinking for you.

So here is our plan for today. Over the next several minutes, I am going to explain ${conceptList} in great detail. We will go step by step, starting from the very basics and building up to the more advanced ideas. I will use real-world examples, analogies from everyday life, and visual illustrations on the board to make every point crystal clear.

Now, one important thing. If at any point something feels unclear or confusing, do not worry at all. I am going to revisit key ideas multiple times throughout this lesson, each time from a slightly different angle. This way, by the end, you will have a solid, well-rounded understanding of ${analysis.topicName}. Think of this as a conversation, not a lecture. I want you to think along with me, ask yourself questions, and try to predict what comes next.

Let me also set the right mindset. This is a ${analysis.complexity}-level course, which means I will explain things thoroughly without rushing. I believe that deep understanding is far more valuable than just memorizing facts. So take your time, pay attention to the visuals on the board, and let us begin this learning journey together.`;
}

function generateOverviewContent(analysis: TopicAnalysis): string {
    const concepts = analysis.scope.primaryConcepts.join(', ');
    return `In this course, we'll explore:
 
• ${concepts}

We'll start with foundational concepts, then dive deeper into ${analysis.scope.subConcepts.length > 0 ? analysis.scope.subConcepts.slice(0, 3).join(', ') : 'advanced topics'}, and conclude with practical applications and real-world examples.

This course is designed for ${analysis.complexity}-level learners and includes interactive visual aids to enhance your understanding.`;
}

function generateOverviewSpokenContent(analysis: TopicAnalysis): string {
    const concepts = analysis.scope.primaryConcepts;
    const subs = analysis.scope.subConcepts.slice(0, 4);

    return `Now, let me give you a complete overview of what we are going to cover today. [[VISUAL:center]] Think of ${analysis.topicName} as a big picture made up of several important pieces. Each piece is a concept that connects to the others, and when you understand all of them together, the entire picture becomes clear.

Here are the main concepts we will explore. ${concepts.map((c, i) => `Number ${i + 1}: ${c}. This is ${i === 0 ? 'the foundation of everything else we will discuss' : i === concepts.length - 1 ? 'the piece that ties everything together and shows you the bigger picture' : 'a critical building block that connects to what comes before and after it'}.`).join(' ')}

${subs.length > 0 ? `Beyond these main ideas, we will also look at some important sub-topics like ${subs.join(', ')}. These might seem like small details, but they often make the difference between surface-level knowledge and true understanding.` : ''}

The way I have structured this lesson is deliberate. We start with the simplest, most foundational ideas first. Then, once you are comfortable with those, we build on top of them, layer by layer. By the time we reach the advanced topics, you will already have the mental framework to understand them easily. This is how real learning works, not by jumping to difficult concepts, but by building a strong base first.

Let me also tell you about the real-world connections we will make. ${analysis.topicName} is not just academic theory. It has practical applications in ${analysis.realWorldExamples.slice(0, 2).join(' and ') || 'many fields and everyday situations'}. I will point these out as we go, so you can see how what you are learning connects to the real world.

Now, with this roadmap in mind, let us move into our first major concept.`;
}

function generateLearningObjectivesContent(analysis: TopicAnalysis): string {
    return `By completing this course, you will be able to:

1. Understand the fundamental concepts of ${analysis.topicName}
2. ${analysis.scope.primaryConcepts.length > 0 ? `Apply knowledge of ${analysis.scope.primaryConcepts[0]}` : 'Apply key principles'}
3. Recognize real-world applications
4. Solve practical problems related to this topic
5. ${analysis.complexity !== 'basic' ? 'Analyze complex scenarios' : 'Build a solid foundation for advanced learning'}`;
}

function generateLearningObjectivesSpokenContent(analysis: TopicAnalysis): string {
    const concepts = analysis.scope.primaryConcepts;
    return `Before we dive deeper, let me share what you will be able to do by the end of this lesson. These are your learning objectives, and I want you to keep them in mind as we progress.

First, you will be able to clearly explain what ${analysis.topicName} is and why it matters. This might sound simple, but being able to explain something in your own words is the truest test of understanding.

Second, you will understand each core concept, specifically ${concepts.slice(0, 3).join(', ')}. Not just their definitions, but how they work, why they exist, and how they connect to each other.

Third, you will be able to recognize ${analysis.topicName} in real-world situations. This is incredibly important because it bridges the gap between classroom learning and practical knowledge.

Fourth, you will develop problem-solving skills related to this topic. I will give you the tools and frameworks you need to approach problems confidently.

${analysis.complexity !== 'basic' ? `And fifth, because this is a ${analysis.complexity}-level course, you will also learn to analyze complex scenarios, compare different approaches, and make informed decisions based on your understanding.` : `And fifth, you will build a solid foundation that prepares you for more advanced learning in the future. Every expert started exactly where you are right now.`}

Now, keep these objectives in your mind as a mental checklist. As we cover each topic, you can check off whether you feel confident about it. Alright, let us get into the actual content now.`;
}

function generateConceptContent(concept: string, analysis: TopicAnalysis): string {
    return `${concept} is a fundamental aspect of ${analysis.topicName}. 

In this section, we'll explore:
• The definition and core principles of ${concept}
• How ${concept} relates to other concepts in ${analysis.topicName}
• Key characteristics and important details
• Common misconceptions to avoid
• Practical applications you'll encounter

Understanding ${concept} is essential for mastering ${analysis.topicName}. Pay close attention to the visual diagram on the board - it will help illustrate these concepts clearly.`;
}

function generateConceptSpokenContent(concept: string, analysis: TopicAnalysis): string {
    const marker = analysis.visualMarkers.find(m => m.label.toLowerCase().includes(concept.toLowerCase()) || concept.toLowerCase().includes(m.label.toLowerCase()));
    const markerTag = marker ? ` [[VISUAL:${marker.id}]]` : ' [[VISUAL:center]]';
    const relatedConcepts = analysis.scope.primaryConcepts.filter(c => c !== concept);
    const relatedExamples = analysis.realWorldExamples.filter(ex => ex.toLowerCase().includes(concept.toLowerCase().split(' ')[0]) || concept.toLowerCase().split(' ').some(w => ex.toLowerCase().includes(w)));
    const example = relatedExamples.length > 0 ? relatedExamples[0] : analysis.realWorldExamples[0] || '';

    return `Alright, now we come to one of the most important parts of today's lesson. Let us talk about ${concept}.${markerTag} I want you to pay close attention here because this is truly fundamental to understanding ${analysis.topicName} as a whole.

So, what exactly is ${concept}? Let me explain it in the simplest possible way first, and then we will add layers of detail. At its core, ${concept} is about understanding a specific aspect of ${analysis.topicName} that forms the basis for everything else we will discuss. Think of it like this: if ${analysis.topicName} were a building, then ${concept} would be one of its main pillars. Without understanding this pillar, the entire structure would not make sense.

Now, let me take you through this step by step. The first thing to understand about ${concept} is its definition and scope. When experts talk about ${concept}, they are referring to a well-defined set of principles and ideas that govern how this particular aspect of ${analysis.topicName} works. This is not something abstract or vague. It has very specific rules, patterns, and characteristics that we can observe, measure, and apply.

Let me give you an analogy to make this clearer. Imagine you are learning to cook a new dish. You do not just throw ingredients together randomly. You follow a recipe, you understand why each ingredient is needed, and you learn the techniques for combining them. ${concept} works in a very similar way. It provides the recipe, the ingredients, and the techniques for understanding this part of ${analysis.topicName}.

Now, here is something that many students get confused about, and I want to clear it up right away. A common misconception about ${concept} is that it is simple or straightforward. In reality, while the basic idea might seem simple on the surface, there is a lot of depth underneath. The more you explore it, the more nuances you will discover. And that is exactly what we are going to do now.

${example ? `Let me connect this to the real world. Think about ${example}. This is a perfect example of ${concept} in action. When you see this happening in real life, you are actually witnessing the principles of ${concept} at work. This is why understanding this concept is so valuable. It does not just help you pass exams. It helps you understand the world around you.` : `In the real world, you encounter ${concept} more often than you might think. Every time you observe how ${analysis.topicName} plays out in practical situations, the principles of ${concept} are at work behind the scenes.`}

${relatedConcepts.length > 0 ? `Now, an important point. ${concept} does not exist in isolation. It is closely connected to ${relatedConcepts.slice(0, 2).join(' and ')}. As we explore those topics later, you will start to see how they all fit together like pieces of a puzzle. For now, just keep in mind that what you are learning here will become even more meaningful as we progress.` : ''}

Let me highlight the key characteristics of ${concept} that you absolutely need to remember. First, it has specific properties that distinguish it from other aspects of ${analysis.topicName}. Second, it follows predictable patterns that you can learn to recognize. Third, it has practical applications that make it relevant beyond just academic study. And fourth, understanding it deeply gives you an advantage in grasping more advanced topics later.

Take a moment to look at the visual on the board. Notice how it illustrates ${concept} and shows the relationships between its different components. This visual representation is designed to help you build a mental model that you can carry with you and use whenever you need to recall or apply this concept.

Before we move on, let me make sure the key points have landed. ${concept} is a fundamental part of ${analysis.topicName}. It has clear definitions, follows specific patterns, connects to other concepts, and has real-world applications. If you can explain these four aspects to someone else, you have truly understood ${concept}.`;
}

function generateSubConceptContent(subConcept: string, analysis: TopicAnalysis): string {
    return `${subConcept} is an important detail within ${analysis.topicName}.

This concept builds upon the foundational knowledge we've covered and provides deeper insight into how ${analysis.topicName} works in practice.

Key points about ${subConcept}:
• How it connects to the main concepts
• Why it matters in real-world scenarios
• Common applications and examples
• Tips for remembering and applying this concept

Take a moment to observe the visual on the board - it demonstrates ${subConcept} in action.`;
}

function generateSubConceptSpokenContent(subConcept: string, analysis: TopicAnalysis): string {
    const marker = analysis.visualMarkers.find(m => m.id.startsWith('detail') || m.label.toLowerCase().includes(subConcept.toLowerCase()));
    const markerTag = marker ? ` [[VISUAL:${marker.id}]]` : '';

    return `Wonderful. Now that we have covered the main concepts, let us go a level deeper and explore ${subConcept}.${markerTag} This is where things start to get really interesting, because ${subConcept} takes what we have already learned and shows us the finer details and nuances.

Think of it this way. The main concepts we covered are like the trunk of a tree. ${subConcept} is like one of the important branches. It grows from the trunk, extends in a specific direction, and has its own characteristics, but it is still connected to everything we have discussed so far.

So why does ${subConcept} matter? Well, in practice, when you apply ${analysis.topicName} to real problems, it is often the sub-concepts like this one that determine success or failure. The main ideas give you the framework, but the details give you the precision. And ${subConcept} provides exactly that kind of precision.

Let me walk you through the key aspects. First, ${subConcept} helps us understand a specific aspect of ${analysis.topicName} that the broader concepts do not fully cover. It fills in the gaps and provides additional clarity. Second, it has its own set of rules and patterns that you need to be aware of. Third, and perhaps most importantly, it connects theory to practice in a very direct way.

Here is something I want you to think about. When professionals work with ${analysis.topicName} in the real world, they rarely think only in terms of the big concepts. They think in terms of these specific details. ${subConcept} is exactly the kind of detail that separates someone who has surface-level knowledge from someone who truly understands the subject.

Take a look at the visual representation on the board. Notice how ${subConcept} fits into the bigger picture and how it relates to the main concepts we covered earlier. This visual connection is important because it helps your brain organize this information in a way that makes it easy to recall later.

Let us continue building our understanding as we move to the next section.`;
}

function generateRealWorldExamplesContent(analysis: TopicAnalysis): string {
    const examples = analysis.realWorldExamples.slice(0, 3).map((ex, i) => `${i + 1}. ${ex}`).join('\n\n');
    return `Real-World Applications of ${analysis.topicName}:

${examples}

These examples demonstrate how ${analysis.topicName} is applied in professional settings and everyday scenarios. Understanding these applications helps bridge the gap between theory and practice.`;
}

function generateRealWorldExamplesSpokenContent(analysis: TopicAnalysis): string {
    const examples = analysis.realWorldExamples.slice(0, 4);

    return `Now we come to one of my favorite parts of any lesson, the real-world applications. This is where everything we have studied comes alive and you get to see why ${analysis.topicName} actually matters in the real world.

I always believe that the true test of understanding is not whether you can recite definitions, but whether you can recognize and apply concepts in real situations. So let me show you exactly how ${analysis.topicName} shows up in practice.

${examples.map((ex, i) => `${i === 0 ? 'Our first example is' : i === 1 ? 'Here is another fascinating example.' : i === 2 ? 'Let me share one more example that I find particularly compelling.' : 'And finally, consider this.'} ${ex}. When you look at this example carefully, you can see the principles we discussed earlier at work. The concepts of ${analysis.scope.primaryConcepts[Math.min(i, analysis.scope.primaryConcepts.length - 1)] || analysis.topicName} are directly applicable here. This is not a coincidence. It is because ${analysis.topicName} describes fundamental patterns that appear across many different contexts.`).join(' ')}

What I want you to take away from these examples is this: ${analysis.topicName} is not confined to textbooks. It is a living, breathing subject that influences decisions, designs, processes, and outcomes in the real world every single day. The more you train your mind to see these connections, the more valuable your understanding becomes.

Now, as you encounter ${analysis.topicName} in your own life, whether in your studies, work, or everyday experiences, try to identify which concepts are at play. This kind of active recognition is one of the most powerful ways to deepen your learning.`;
}

function generateCaseStudiesContent(analysis: TopicAnalysis): string {
    return `Let's examine detailed case studies that illustrate ${analysis.topicName} in action.

These scenarios will help you:
• Understand how concepts are applied in real situations
• Recognize patterns and common approaches
• Develop problem-solving skills
• Prepare for similar challenges you may encounter`;
}

function generateCaseStudiesSpokenContent(analysis: TopicAnalysis): string {
    const concepts = analysis.scope.primaryConcepts;
    return `Now, let us take this a step further with some detailed case studies. Case studies are powerful learning tools because they force us to apply what we know to specific, realistic scenarios. This is where passive knowledge transforms into active problem-solving ability.

Imagine you are faced with a real situation involving ${analysis.topicName}. How would you approach it? What concepts would you apply? What would you look for? These are the kinds of questions that case studies help us answer.

Let us consider our first scenario. Picture a situation where someone needs to work with ${concepts[0] || analysis.topicName} in a professional context. They have all the theoretical knowledge, but now they need to apply it to solve a specific problem. The first step would be to identify which aspects of ${analysis.topicName} are most relevant. Then, they would need to analyze the situation using the frameworks we discussed. Finally, they would develop a solution that addresses the core challenge.

What makes this interesting is that there is rarely just one right answer. Different approaches can work, but some are more effective than others. The key is understanding the principles well enough to choose the best approach for each situation.

Now consider a second scenario, this one slightly more complex. Here, multiple concepts from ${analysis.topicName} need to work together. ${concepts.length > 1 ? `Both ${concepts[0]} and ${concepts[1]} play important roles, and the challenge is figuring out how they interact and influence each other.` : `The challenge lies in understanding how different aspects of ${concepts[0]} interact in practice.`} This is where deep understanding truly pays off, because surface-level knowledge would not be enough to navigate this complexity.

These case studies illustrate an important truth. ${analysis.topicName} is not just about knowing individual facts. It is about understanding how those facts connect, interact, and apply to real situations. And that is exactly the kind of understanding we have been building throughout this lesson.`;
}

function generateSummaryContent(analysis: TopicAnalysis): string {
    const concepts = analysis.scope.primaryConcepts.join(', ');
    return `Key Takeaways from ${analysis.topicName}:

• We've covered ${concepts}
• You've learned about ${analysis.scope.subConcepts.length > 0 ? analysis.scope.subConcepts.slice(0, 3).join(', ') : 'important details'}
• Real-world applications include ${analysis.scope.practicalApplications.length > 0 ? analysis.scope.practicalApplications[0] : 'various practical scenarios'}

Remember these key points as you continue your learning journey!`;
}

function generateSummarySpokenContent(analysis: TopicAnalysis): string {
    const concepts = analysis.scope.primaryConcepts;

    return `We have reached the final section of our lesson, and I want to take a few minutes to pull everything together. This summary is not just a quick recap. It is an opportunity for you to solidify what you have learned and identify any areas where you might want to review.

Let us go through the key takeaways from today's session on ${analysis.topicName}.

${concepts.map((c, i) => `${i === 0 ? 'First and foremost' : i === 1 ? 'Second' : i === 2 ? 'Third' : `Next`}, we covered ${c}. Remember, this is ${i === 0 ? 'the foundational concept that everything else builds upon' : 'a critical piece of the overall picture'}. The key points to remember here are its definition, its characteristics, and how it connects to the other concepts we discussed.`).join(' ')}

${analysis.scope.subConcepts.length > 0 ? `We also explored important sub-topics including ${analysis.scope.subConcepts.slice(0, 3).join(', ')}. These details are what give you depth of understanding beyond the basics.` : ''}

Through our real-world examples and case studies, we saw that ${analysis.topicName} is not just theoretical knowledge. It has direct, practical applications that you will encounter in professional settings and everyday life.

Now, here is my advice for what to do next. First, take a few minutes after this lesson to review the visuals and notes. Research shows that reviewing material within the first hour significantly improves retention. Second, try to explain what you learned to someone else, even if it is just in your head. Teaching is the best form of learning. Third, look for examples of ${analysis.topicName} in your daily life. The more connections you make, the stronger your understanding becomes.

I am proud of the progress you have made today. ${analysis.topicName} is not an easy subject, and you have shown real dedication by working through this entire lesson. Remember, understanding builds over time. Each time you revisit these concepts, you will discover new layers of meaning and connection. Keep learning, keep questioning, and keep growing. You are doing an excellent job.`;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getMatchingCoreConcept(targetConcept: string, aiContent: GeneratedContent): string | null {
    if (!aiContent || !aiContent.coreConceptsContent) return null;

    // 1. Exact match
    if (aiContent.coreConceptsContent[targetConcept]) {
        return aiContent.coreConceptsContent[targetConcept];
    }

    // 2. Case-insensitive match
    const keys = Object.keys(aiContent.coreConceptsContent);
    const lowerTarget = targetConcept.toLowerCase();
    for (const key of keys) {
        if (key.toLowerCase() === lowerTarget) return aiContent.coreConceptsContent[key];
    }

    // 3. Partial match (if AI added/removed words)
    for (const key of keys) {
        if (key.toLowerCase().includes(lowerTarget) || lowerTarget.includes(key.toLowerCase())) {
            return aiContent.coreConceptsContent[key];
        }
    }

    return null;
}

function getVisualTypeForConcept(concept: string, analysis: TopicAnalysis): TeachingStep['visualType'] {
    const lowerConcept = concept.toLowerCase();

    // Check if 3D model is available
    if (analysis.visualAidsRequired.includes('3d-model')) {
        return '3d-model';
    }

    // Check for animation needs
    if (lowerConcept.includes('flow') || lowerConcept.includes('process') || lowerConcept.includes('motion')) {
        return 'animation';
    }

    // Check for interactive needs
    if (lowerConcept.includes('practice') || lowerConcept.includes('exercise') || lowerConcept.includes('simulation')) {
        return 'interactive';
    }

    // Default to diagram
    return 'diagram';
}

function getRelatedSubConcepts(concept: string, subConcepts: string[]): string[] {
    const lowerConcept = concept.toLowerCase();
    return subConcepts.filter(sub =>
        sub.toLowerCase().includes(lowerConcept) ||
        lowerConcept.includes(sub.toLowerCase().split(' ')[0])
    ).slice(0, 3);
}

function getRelevantExamples(concept: string, examples: string[]): string[] {
    const lowerConcept = concept.toLowerCase();
    const relevant = examples.filter(ex =>
        ex.toLowerCase().includes(lowerConcept) ||
        lowerConcept.split(' ').some(word => ex.toLowerCase().includes(word))
    );
    return relevant.length > 0 ? relevant.slice(0, 2) : examples.slice(0, 1);
}

function getPracticalApplications(concept: string, applications: string[]): string[] {
    if (applications.length === 0) return [];
    const lowerConcept = concept.toLowerCase();
    const relevant = applications.filter(app =>
        app.toLowerCase().includes(lowerConcept) ||
        lowerConcept.split(' ').some(word => app.toLowerCase().includes(word))
    );
    return relevant.length > 0 ? relevant.slice(0, 2) : applications.slice(0, 1);
}
