// Topic analysis types and functions

/**
 * Topic Complexity Assessment
 * Analyzes a topic to determine its complexity, scope, and required duration
 */
export interface TopicAnalysis {
    topicId: string;
    topicName: string;
    domain: string; // e.g. 'Chemistry', 'Biology'
    grade: string;
    subject: string;
    chapter: string;
    complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
    estimatedDurationMinutes: number;
    scope: {
        primaryConcepts: string[];
        subConcepts: string[];
        practicalApplications: string[];
        prerequisites: string[];
    };
    conceptGraph: {
        id: string;
        name: string;
        type: string; // e.g. 'chemical_reaction', 'cell_structure'
    }[];
    recommendedStructure: {
        introductionMinutes: number;
        coreContentMinutes: number;
        examplesMinutes: number;
        practiceMinutes: number;
        reviewMinutes: number;
    };
    visualAidsRequired: string[];
    visualMarkers: { id: string; label: string; description: string }[];
    realWorldExamples: string[];
    quizData?: {
        keyQuestions: string[];
        commonMisconceptions: string[];
        distractors: Record<string, string[]>; // concept -> related but incorrect terms
    };
}

/**
 * Analyzes a topic and determines comprehensive teaching requirements
 */
export function analyzeTopic(
    topicId: string,
    topicName: string,
    description?: string,
    subjectArea?: string,
    chapterName?: string,
    gradeName?: string
): TopicAnalysis {
    // 1. Semantic Domain Derivation: INPUT → (Grade, Subject, Chapter, Topic, Syllabus)
    const domain = deriveDomain(topicId, topicName, subjectArea, chapterName, gradeName);

    // 2. Determine complexity
    const complexity = determineComplexity(topicId, topicName, description, subjectArea);

    // 3. Calculate duration
    const estimatedDurationMinutes = calculateDuration(complexity, topicId, topicName);

    // 4. Extract key concepts
    const scope = extractScope(topicId, topicName, domain);

    // 5. Concept Graph Generation
    const conceptGraph = generateConceptGraph(topicId, topicName, scope, domain);

    // 6. Determine recommended structure
    const recommendedStructure = calculateStructure(estimatedDurationMinutes, complexity);

    // 7. Identify required visual aids
    const visualAidsRequired = identifyVisualAids(topicId);

    // 8. Generate real-world examples
    const realWorldExamples = generateRealWorldExamples(topicId, topicName);

    // Dynamic Markers: Extract markers from scope for speech synchronization
    const visualMarkers = generateVisualMarkers(scope);

    return {
        topicId,
        topicName,
        domain,
        grade: gradeName || 'Standard',
        subject: subjectArea || 'General',
        chapter: chapterName || 'Overview',
        complexity,
        estimatedDurationMinutes,
        scope,
        conceptGraph,
        recommendedStructure,
        visualAidsRequired,
        visualMarkers,
        realWorldExamples,
        quizData: generateQuizMetadata(topicId, topicName, scope),
    };
}

export type AcademicDomain =
    | 'Mathematics'
    | 'Physics'
    | 'Chemistry'
    | 'Biology'
    | 'Computer Science'
    | 'English'
    | 'English Literature'
    | 'Hindi'
    | 'Social Science'
    | 'Science'
    | 'History'
    | 'Geography'
    | 'Political Science'
    | 'Economics'
    | 'Information Technology';

export function deriveDomain(topicId: string, topicName: string, subject?: string, chapter?: string, grade?: string): AcademicDomain {
    const context = ` ${topicId} ${topicName} ${subject} ${chapter} ${grade} `.toLowerCase();

    // 1. Hard Domain Matching (Rule 2)
    if (context.includes('chemist') || context.includes('reaction') || context.includes('molecule') || context.includes('element') || context.includes('compound') || context.includes('atom') || context.includes('acid') || context.includes('base') || context.includes('salt') || context.includes('ph-') || context.includes('metal') || context.includes('carbon') || context.includes('bond')) return 'Chemistry';

    if (context.includes('medicine') || context.includes('anatomy') || context.includes('heart') || context.includes('blood') || context.includes('cardiac') || context.includes('neuro') || context.includes('cell') || context.includes('bio') || context.includes('organism') || context.includes('plant') || context.includes('life') || context.includes('nutrition') || context.includes('respiration') || context.includes('transport') || context.includes('excretion') || context.includes('repro') || context.includes('human')) return 'Biology';

    if (context.includes('phy') || context.includes('force') || context.includes('motion') || context.includes('energy') || context.includes('wave') || context.includes('mechanics') || context.includes('laws') || context.includes('light') || context.includes('mirror') || context.includes('lens') || context.includes('electricity') || context.includes('magnet')) return 'Physics';

    if (context.includes('social science') || context.includes('sst-') || context.includes('history') || context.includes('geography') || context.includes('civics') || context.includes('politics') || context.includes('constitution') || context.includes('economics') || context.includes('nationalism') || context.includes('resource') || context.includes('power-sharing') || context.includes('development')) return 'Social Science';

    if (context.includes('math') || context.includes('number') || context.includes('algebra') || context.includes('geometry') || context.includes('arithmetic') || context.includes('calculus') || context.includes('trigonometry') || context.includes('polynomial') || context.includes('quadratic')) return 'Mathematics';

    if (context.includes('computer science') || context.includes('cs-') || context.includes('python') || context.includes('programming') || context.includes('algorithm') || context.includes('data structure')) return 'Computer Science';

    if (context.includes('it-') || context.includes('information technology') || context.includes('digital') || context.includes('ict') || context.includes('operating system') || context.includes('software')) return 'Information Technology';

    if (context.includes('english') || context.includes('literature') || context.includes('poem') || context.includes('prose') || context.includes('drama') || context.includes('fiction') || context.includes('story') || context.includes('letter')) return 'English Literature';

    if (context.includes('hindi') || context.includes('sanskrit') || context.includes('kavita')) return 'Hindi';

    // 2. Defaulting logic based on subject name if no specific keywords hit
    const sub = (subject || '').toLowerCase();
    if (sub.includes('math')) return 'Mathematics';
    if (sub.includes('physics')) return 'Physics';
    if (sub.includes('chemistry')) return 'Chemistry';
    if (sub.includes('biology')) return 'Biology';
    if (sub.includes('science')) return 'Chemistry'; // Default general Science to Chemistry (most common for Class 10 Ch 1-4)
    if (sub.includes('computer science')) return 'Computer Science';
    if (sub.includes('information technology') || sub.includes('computer')) return 'Information Technology';
    if (sub.includes('english')) return 'English Literature';
    if (sub.includes('hindi')) return 'Hindi';
    if (sub.includes('social science')) return 'Social Science';

    return 'Social Science'; // Absolute fallback to General Humanities
}

function generateConceptGraph(_topicId: string, _topicName: string, scope: TopicAnalysis['scope'], domain: string): TopicAnalysis['conceptGraph'] {
    const graph: TopicAnalysis['conceptGraph'] = [];

    // Map primary concepts to types based on domain
    scope.primaryConcepts.forEach((concept, i) => {
        let type = 'general_concept';
        const cLow = concept.toLowerCase();

        if (domain === 'Chemistry') {
            if (cLow.includes('reaction')) type = 'chemical_reaction';
            else if (cLow.includes('structure')) type = 'molecular_structure';
        } else if (domain === 'Biology') {
            if (cLow.includes('cell') || cLow.includes('structure')) type = 'cell_structure';
            else if (cLow.includes('cycle')) type = 'biological_cycle';
        } else if (domain === 'Physics') {
            if (cLow.includes('force') || cLow.includes('motion')) type = 'force_motion';
            else if (cLow.includes('vector')) type = 'vector_physics';
        } else if (domain === 'Mathematics') {
            if (cLow.includes('place value')) type = 'place_value';
        } else if (domain === 'Engineering') {
            if (cLow.includes('code') || cLow.includes('logic')) type = 'algorithm';
        } else if (domain === 'History') {
            if (cLow.includes('event') || cLow.includes('period')) type = 'timeline_event';
        }

        graph.push({ id: `concept_${i}`, name: concept, type });
    });

    return graph;
}

/**
 * Generates semantic visual markers based on the topic scope
 */
export function generateVisualMarkers(scope: TopicAnalysis['scope']): TopicAnalysis['visualMarkers'] {
    const markers: TopicAnalysis['visualMarkers'] = [];

    // Always add a center/foundation marker
    markers.push({
        id: 'center',
        label: scope.primaryConcepts[0] || 'Core Foundation',
        description: 'The fundamental principle of this topic'
    });

    // Add markers for primary concepts (max 3 for the diagram layout)
    scope.primaryConcepts.slice(1, 3).forEach((concept, i) => {
        markers.push({
            id: `concept_${i + 1}`,
            label: concept,
            description: `Key aspect: ${concept}`
        });
    });

    // Add markers for sub-concepts or applications
    const extraInfo = [...scope.subConcepts, ...scope.practicalApplications];
    extraInfo.slice(0, 2).forEach((info, i) => {
        markers.push({
            id: `detail_${i + 1}`,
            label: info,
            description: `Extended detail: ${info}`
        });
    });

    return markers;
}

/**
 * Generates metadata for quiz creation
 */
function generateQuizMetadata(topicId: string, topicName: string, scope: TopicAnalysis['scope']): TopicAnalysis['quizData'] {
    const distractors: Record<string, string[]> = {};
    const misconceptions: string[] = [];
    const questions: string[] = [];

    // Simple heuristic for distractors based on similar topics
    scope.primaryConcepts.forEach(concept => {
        distractors[concept] = [
            `Alternative theory of ${concept}`,
            `Obsolete version of ${concept}`,
            `${concept} inverse process`
        ].slice(0, 3);
    });

    const lowerId = topicId.toLowerCase();
    if (lowerId.includes('ecg')) {
        misconceptions.push('ECG measures the actual pumping of the heart', 'A flatline always means death');
        questions.push('What does the P-wave represent?', 'Which interval represents ventricular depolarization?');
    } else if (lowerId.includes('react')) {
        misconceptions.push('React is a framework, not a library', 'State updates are always synchronous');
        questions.push('What is the main purpose of the Virtual DOM?', 'How do props differ from state?');
    } else if (lowerId.includes('dna')) {
        misconceptions.push('DNA and RNA have the same sugar backbone', 'All mutations are harmful');
        questions.push('Which base pairs always bond together?', 'What is the role of DNA Polymerase?');
    }

    return {
        keyQuestions: questions.length > 0 ? questions : [`What is the core principle of ${topicName}?`],
        commonMisconceptions: misconceptions,
        distractors
    };
}

/**
 * Determines topic complexity level
 */
function determineComplexity(
    topicId: string,
    topicName: string,
    description?: string,
    subjectArea?: string
): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    const lowerName = topicName.toLowerCase();
    const lowerId = topicId.toLowerCase();
    const lowerDesc = (description || '').toLowerCase();

    // Expert-level indicators
    const expertKeywords = [
        'quantum', 'relativity', 'advanced', 'expert', 'specialized',
        'research', 'thesis', 'dissertation', 'phd', 'postgraduate'
    ];

    // Advanced indicators
    const advancedKeywords = [
        'complex', 'advanced', 'sophisticated', 'intricate', 'detailed',
        'comprehensive', 'mastery', 'specialization', 'expertise'
    ];

    // Basic indicators
    const basicKeywords = [
        'basics', 'introduction', 'fundamentals', 'beginner', 'starter',
        'overview', 'primer', 'essentials', '101', 'getting started'
    ];

    const allText = `${lowerName} ${lowerId} ${lowerDesc}`;

    if (expertKeywords.some(kw => allText.includes(kw))) {
        return 'expert';
    }
    if (advancedKeywords.some(kw => allText.includes(kw))) {
        return 'advanced';
    }
    if (basicKeywords.some(kw => allText.includes(kw))) {
        return 'basic';
    }

    // Default based on subject area complexity
    const complexSubjects = ['quantum', 'neurosurgery', 'cardiac-surgery', 'ai-research'];
    if (subjectArea && complexSubjects.some(s => lowerName.includes(s) || lowerId.includes(s))) {
        return 'advanced';
    }

    return 'intermediate';
}

/**
 * Calculates estimated duration based on complexity and topic scope
 */
function calculateDuration(
    complexity: 'basic' | 'intermediate' | 'advanced' | 'expert',
    topicId: string,
    topicName: string
): number {
    // Base duration by complexity
    const baseDurations = {
        basic: 20,
        intermediate: 35,
        advanced: 50,
        expert: 70,
    };

    let duration = baseDurations[complexity];

    // Adjust based on topic characteristics
    const lowerName = topicName.toLowerCase();
    const lowerId = topicId.toLowerCase();

    // Topics that typically require more time
    const extendedTopics = [
        'comprehensive', 'complete', 'full', 'detailed', 'extensive',
        'systematic', 'end-to-end', 'mastery', 'deep-dive'
    ];

    if (extendedTopics.some(keyword => lowerName.includes(keyword) || lowerId.includes(keyword))) {
        duration += 15;
    }

    // Medical/clinical topics often need more time
    const medicalTopics = ['ecg', 'cardiac', 'neurology', 'diagnosis', 'treatment', 'pathology'];
    if (medicalTopics.some(topic => lowerName.includes(topic) || lowerId.includes(topic))) {
        duration += 10;
    }

    // Technical/engineering topics
    const technicalTopics = ['algorithm', 'architecture', 'system', 'design', 'implementation'];
    if (technicalTopics.some(topic => lowerName.includes(topic) || lowerId.includes(topic))) {
        duration += 8;
    }

    // Ensure minimum duration for comprehensive coverage
    if (duration < 30) {
        duration = 30;
    }

    // Cap at reasonable maximum
    if (duration > 90) {
        duration = 90;
    }

    return Math.round(duration);
}

/**
 * Extracts scope and key concepts from topic
 */
export function extractScope(
    topicId: string,
    topicName: string,
    _domain?: string
): TopicAnalysis['scope'] {
    // Determine extraction strategy based on domain
    const lowerName = topicName.toLowerCase();
    const lowerId = topicId.toLowerCase();

    // Extract primary concepts (simplified - in production, use NLP)
    const primaryConcepts: string[] = [];
    const subConcepts: string[] = [];
    const practicalApplications: string[] = [];
    const prerequisites: string[] = [];

    // Medical topics
    if (lowerId.includes('ecg') || lowerName.includes('ecg')) {
        primaryConcepts.push('Electrocardiogram', 'Cardiac conduction', 'ECG interpretation');
        subConcepts.push('P waves', 'QRS complex', 'T waves', 'PR interval', 'QT interval');
        practicalApplications.push('Diagnosing arrhythmias', 'Detecting MI', 'Monitoring heart rate');
    }

    // Software engineering
    if (lowerId.includes('react') || lowerName.includes('react')) {
        primaryConcepts.push('React components', 'JSX', 'State management', 'Props');
        subConcepts.push('Hooks', 'Virtual DOM', 'Component lifecycle', 'Event handling');
        practicalApplications.push('Building UIs', 'Creating reusable components', 'Managing application state');
    }

    // Physics
    if (lowerId.includes('newton') || lowerName.includes('newton')) {
        primaryConcepts.push('Newton\'s Laws', 'Force', 'Mass', 'Acceleration');
        subConcepts.push('Inertia', 'Action-reaction', 'F=ma', 'Momentum');
        practicalApplications.push('Engineering design', 'Motion analysis', 'Force calculations');
    }

    // Biology
    if (lowerId.includes('dna') || lowerName.includes('dna')) {
        primaryConcepts.push('DNA structure', 'Base pairs', 'Double helix', 'Genetic code');
        subConcepts.push('Replication', 'Transcription', 'Translation', 'Mutations');
        practicalApplications.push('Genetic testing', 'Biotechnology', 'Medical diagnosis');
    }

    // Generic fallback - extract words as concepts
    if (primaryConcepts.length === 0) {
        const words = topicName.split(/[\s-]+/).filter(w => w.length > 3);
        primaryConcepts.push(...words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)));
    }

    return {
        primaryConcepts: primaryConcepts.length > 0 ? primaryConcepts : [topicName],
        subConcepts,
        practicalApplications,
        prerequisites,
    };
}

/**
 * Calculates recommended time structure
 */
function calculateStructure(
    totalMinutes: number,
    complexity: 'basic' | 'intermediate' | 'advanced' | 'expert'
): TopicAnalysis['recommendedStructure'] {
    // Allocate time proportionally
    const introductionRatio = 0.15; // 15%
    const coreContentRatio = 0.50; // 50%
    const examplesRatio = 0.20; // 20%
    const practiceRatio = 0.10; // 10%
    const reviewRatio = 0.05; // 5%

    // Adjust for complexity
    let introRatio = introductionRatio;
    let coreRatio = coreContentRatio;
    let examplesRatio_adj = examplesRatio;

    if (complexity === 'basic') {
        introRatio = 0.20;
        coreRatio = 0.45;
        examplesRatio_adj = 0.25;
    } else if (complexity === 'advanced' || complexity === 'expert') {
        introRatio = 0.10;
        coreRatio = 0.55;
        examplesRatio_adj = 0.20;
    }

    return {
        introductionMinutes: Math.round(totalMinutes * introRatio),
        coreContentMinutes: Math.round(totalMinutes * coreRatio),
        examplesMinutes: Math.round(totalMinutes * examplesRatio_adj),
        practiceMinutes: Math.round(totalMinutes * practiceRatio),
        reviewMinutes: Math.round(totalMinutes * reviewRatio),
    };
}

/**
 * Identifies required visual aids for topic
 */
function identifyVisualAids(
    topicId: string
): string[] {
    const lowerId = topicId.toLowerCase();
    const aids: string[] = [];

    // Medical/biological topics
    if (lowerId.includes('heart') || lowerId.includes('cardiac') || lowerId.includes('ecg')) {
        aids.push('3d-model', 'diagram', 'animation');
    }

    if (lowerId.includes('brain') || lowerId.includes('neuron') || lowerId.includes('spinal')) {
        aids.push('3d-model', 'diagram');
    }

    if (lowerId.includes('dna') || lowerId.includes('cell')) {
        aids.push('3d-model', 'diagram', 'animation');
    }

    // Technical topics
    if (lowerId.includes('react') || lowerId.includes('component')) {
        aids.push('diagram', 'interactive');
    }

    if (lowerId.includes('algorithm') || lowerId.includes('sorting') || lowerId.includes('graph')) {
        aids.push('animation', 'interactive', 'diagram');
    }

    // Physics/engineering
    if (lowerId.includes('circuit') || lowerId.includes('electric')) {
        aids.push('diagram', 'animation');
    }

    if (lowerId.includes('kinematics') || lowerId.includes('motion')) {
        aids.push('diagram', 'animation');
    }

    // Default visual aids
    if (aids.length === 0) {
        aids.push('diagram', 'text');
    }

    return Array.from(new Set(aids)); // Remove duplicates
}

/**
 * Generates real-world examples for topic
 */
function generateRealWorldExamples(
    topicId: string,
    topicName: string
): string[] {
    const lowerId = topicId.toLowerCase();
    const examples: string[] = [];

    // Medical examples
    if (lowerId.includes('ecg')) {
        examples.push(
            'ECGs are performed over 300 million times annually worldwide',
            'ECG can detect heart attacks within minutes of symptom onset',
            'First human ECG was recorded by Willem Einthoven in 1903'
        );
    }

    if (lowerId.includes('heart') || lowerId.includes('cardiac')) {
        examples.push(
            'The heart pumps approximately 2,000 gallons of blood daily',
            'Heart disease is the leading cause of death globally',
            'Cardiac surgery has advanced significantly with minimally invasive techniques'
        );
    }

    // Technology examples
    if (lowerId.includes('react')) {
        examples.push(
            'React is used by Facebook, Netflix, Airbnb, and thousands of companies',
            'React powers over 10 million websites worldwide',
            'React Native enables building mobile apps with the same codebase'
        );
    }

    if (lowerId.includes('algorithm') || lowerId.includes('sorting')) {
        examples.push(
            'Sorting algorithms are fundamental to database queries and search engines',
            'Google processes billions of searches daily using efficient sorting',
            'E-commerce sites use sorting to display products by price, rating, or popularity'
        );
    }

    // Physics examples
    if (lowerId.includes('newton') || lowerId.includes('motion')) {
        examples.push(
            'Newton\'s laws explain why seatbelts save lives in car crashes',
            'Rocket launches rely on Newton\'s third law of action-reaction',
            'Sports performance analysis uses kinematics to improve athlete technique'
        );
    }

    // Biology examples
    if (lowerId.includes('dna')) {
        examples.push(
            'DNA testing revolutionized criminal investigations and paternity testing',
            'Genetic engineering enables production of insulin and other medications',
            'DNA sequencing costs have dropped from $100 million to under $1,000'
        );
    }

    // Generic examples if none found
    if (examples.length === 0) {
        examples.push(
            `Understanding ${topicName} is essential for professionals in this field`,
            `Real-world applications of ${topicName} impact millions of people daily`,
            `Mastery of ${topicName} opens doors to advanced career opportunities`
        );
    }

    return examples;
}
