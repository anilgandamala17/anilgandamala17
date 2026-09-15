// ============================================
// USER & AUTHENTICATION TYPES
// ============================================

export interface User {
    id: string;
    email: string;
    name: string;
    displayName?: string;
    avatar?: string;
    authMethod: 'google' | 'apple' | 'email' | 'guest';
    isVerified: boolean;
    createdAt: string;
}

export type AppRole = 'student' | 'teacher' | 'admin';

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isGuest: boolean;
    role: AppRole | null;
    isDemo: boolean;
}

// ============================================
// PROFILE TYPES
// ============================================

export interface LearningStyle {
    visual: number; // 0-100
    auditory: number;
    kinesthetic: number;
    preferredPace: 'slow' | 'normal' | 'fast';
    interactivityLevel: 'low' | 'medium' | 'high';
    /** Set once the learner takes the style check; absent means the split is unmeasured. */
    assessedAt?: string;
}

export interface LearningPreferences {
    teachingStyle: 'encouraging' | 'friendly' | 'disciplined' | 'professional' | 'interactive';
    explanationDepth: 'basic' | 'comprehensive' | 'detailed' | 'expert';
    sessionLength: 'short' | 'medium' | 'long';
    quizFrequency: 'after_concept' | 'after_topic' | 'end_of_session';
    reviewStrategy: 'spaced_repetition' | 'immediate' | 'weekly';
}

export interface UserProfile {
    userId: string;
    name: string;
    email: string;
    displayName: string;
    avatar?: string;
    title?: string;
    organization?: string;
    location?: string;
    timezone: string;

    // Professional info
    profession: Profession | null;
    subProfession: string | null;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    verificationStatus: 'none' | 'pending' | 'verified';
    subject?: string;
    currentTopic?: string;

    // Learning profile
    learningStyle: LearningStyle;
    learningPreferences: LearningPreferences;
    learningGoals: string[];
    weeklyCommitmentHours: number;

    // Stats
    totalLearningHours: number;
    topicsCompleted: number;
    currentStreak: number;
    longestStreak: number;

    // AI Memory
    memories?: MemoryEntry[];
}

export interface MemoryEntry {
    id: string;
    type: 'preference' | 'concept_mastery' | 'doubt' | 'feedback' | 'personal_context';
    content: string;
    reasoning?: string;
    timestamp: string;
    relevanceScore: number; // 0-1
    tags: string[];
    metadata?: Record<string, unknown>;
}

// ============================================
// PROFESSION & CONTENT TYPES
// ============================================

export interface Profession {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
    subProfessions: SubProfession[];
}

export interface SubProfession {
    id: string;
    name: string;
    description: string;
    subjects: Subject[];
}

export interface Subject {
    id: string;
    name: string;
    icon: string;
    topics: Topic[];
}

export interface Topic {
    id: string;
    name: string;
    description?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    durationMinutes?: number;
    duration?: string;
    progress?: number;
    prerequisites?: string[];
    objectives?: string[];
    subtopics?: Subtopic[];
}


export interface Subtopic {
    id: string;
    name: string;
    description?: string;
    teachingSegments: TeachingSegment[];
}

export interface TeachingSegment {
    id: string;
    title: string;
    explanationText: string;
    visualId: string;
    visualType: 'diagram' | 'text' | 'animation' | 'quiz' | 'interactive' | '3d-model' | 'flowchart' | 'map' | 'timeline';
    visualMarkers?: VisualMarker[];
}

export interface VisualMarker {
    id: string;
    label: string;
    description: string;
    timestamp?: number; // fallback if char index not used
    charIndex?: number; // position in narration text (after stripping [VISUAL:id])
    action?: 'highlight' | 'show' | 'hide' | 'pulse' | 'arrow';
    targetId?: string;
}

/** Universal Visual-Synced Teaching: one segment = one explanation + one visual + sync markers */
export interface TeachingSegment {
    segment_id: string;
    explanation_text: string;
    narration_audio?: string; // optional pre-rendered; usually we use spokenContent + TTS
    visual_id: string;
    visual_type: TeachingStep['visualType'];
    timing_markers: VisualMarker[];
}

/** Visual types supported by the green board (platform standard) */
export type BoardVisualType =
    | 'static_labeled_diagram'
    | 'highlight_animation'
    | 'stepwise_drawing'
    | 'flowchart'
    | 'process_diagram'
    | 'comparison_table'
    | 'math_derivation'
    | 'graph_plotting'
    | 'structure_breakdown'
    | 'map'
    | 'timeline'
    | 'diagram'
    | 'text'
    | 'animation'
    | 'quiz'
    | 'interactive'
    // Domain-Specific Diagram Families
    | 'equation_flow_diagram'
    | 'labeled_biology_diagram'
    | 'vector_physics_diagram'
    | 'place_value_chart'
    | 'timeline_diagram'
    | 'flowchart_algorithm';

// ============================================
// VISUAL PROGRESSION TYPES (Hard Rules 13, 20)
// ============================================

/**
 * Subject-locked diagram type. Only types valid for the topic's subject
 * may be used. Enforced by verifyDiagrams.ts.
 */
export type DiagramType =
    | 'anatomy' | 'cycle' | 'pathway' | 'process' | 'structure'
    | 'reaction' | 'energy-profile' | 'apparatus' | 'lattice' | 'atom_model'
    | 'force' | 'vector' | 'ray' | 'circuit' | 'graph'
    | 'geometry' | 'number-line' | 'construction'
    | 'flowchart' | 'tree' | 'memory-map' | 'array-state'
    | 'map' | 'cross-section' | 'climatic-chart'
    | 'timeline' | 'cause-effect'
    | 'brain-region' | 'response-loop'
    | 'flow' | 'circular-flow' | 'demand-supply' | 'candlestick'
    | 'plot-arc' | 'character-web' | 'story-map';

/**
 * Hard Rule 20 — Every concept diagram must declare its purpose.
 */
export type DiagramPurpose = 'Structure' | 'Process' | 'Comparison' | 'Equation' | 'Graph' | 'Flow';

/**
 * A single diagram within a concept.
 * svg_path: path relative to public/tutor-media/diagrams/ e.g. "atomic_theory/atom_bohr.svg"
 */
export interface ConceptDiagram {
    /** Unique within the concept: e.g. 'dalton', 'bohr', 'overview' */
    diagram_id: string;
    /** Human-readable title shown on the board */
    title: string;
    /** Subject-locked diagram type */
    diagram_type?: DiagramType;
    /** Path relative to public/tutor-media/diagrams/ — the SVG file to render (new engine) */
    svg_path?: string;
    /** Legacy: React component key (deprecated — use svg_path) */
    component_key?: string;
    /** Hard Rule 20 — required purpose classification */
    purpose: DiagramPurpose;
    /** Labels visible on this diagram */
    labels: string[];
    /** Optional: parts to highlight when this diagram is active */
    highlightParts?: string[];
}

/**
 * Hard Rule 13 — Concept-level visual registry node.
 */
export interface VisualConcept {
    concept_id: string;
    concept_name: string;
    diagrams: ConceptDiagram[];
    keyword_hints?: string[];
}

// ============================================
// SCHOOL CURRICULUM TYPES
// ============================================

export type GradeLevel = 'middle' | 'secondary' | 'senior-secondary';

export interface SchoolGrade {
    id: string;
    name: string;
    gradeNumber: number;
    level: GradeLevel;
    image?: string;
    ageGroup: string;
    description: string;
    color: string;
    subjects: SchoolSubject[];
}

export interface SchoolSubject {
    id: string;
    name: string;
    icon: string;
    image?: string;
    color: string;
    description: string;
    chapters: Chapter[];
}

export interface Chapter {
    id: string;
    name: string;
    chapterNumber: number;
    description?: string;
    topics: Topic[];
}

export interface CurriculumProgress {
    gradeId: string;
    subjectId: string;
    chapterId?: string;
    topicId?: string;
    completedTopics: string[];
    totalTopics: number;
    progressPercent: number;
    lastAccessedAt: string;
}

// ============================================
// TEACHING TYPES
// ============================================

export interface TeachingStep {
    id: string;
    stepNumber: number;
    title: string;
    content: string;
    spokenContent: string;
    visualType: 'diagram' | 'text' | 'animation' | 'quiz' | 'interactive' | '3d-model' | 'flowchart' | 'map' | 'timeline';
    visualId?: string; // Links to a specific visual component implementation
    visualData?: Record<string, unknown>;
    visualMarkers?: VisualMarker[]; // Extracted from spokenContent or pre-defined
    durationSeconds: number;
    completed: boolean;
    type?: 'intro' | 'concept' | 'practice' | 'assessment' | 'summary';
    quiz?: QuizQuestion;

    // Enhanced content fields
    complexity?: 'basic' | 'intermediate' | 'advanced';
    estimatedMinutes?: number;
    realWorldExamples?: string[];
    keyConcepts?: string[];
    subConcepts?: string[];
    practicalApplications?: string[];
    conceptId?: string;
    markerId?: string;
    visualDomain?: string;
}

export interface TeachingSession {
    id: string;
    userId: string;
    topicId: string;
    topicName: string;
    startTime: string;
    endTime?: string;
    status: 'active' | 'paused' | 'completed' | 'abandoned';
    currentStep: number;
    totalSteps: number;
    progress: number;
    teachingSteps: TeachingStep[];
    doubts: Doubt[];
    language?: string;
    teachingStyle?: string;
    contentVersion?: number;
    /** Pre-generated segment audio from cache-first pipeline */
    cachedSegments?: import('./contentPipeline').CachedTeachingSegment[];
    contentSource?: 'cached' | 'curated' | 'ai' | 'default';
}

export interface TeachingState {
    currentSession: TeachingSession | null;
    currentStep: number;
    isPaused: boolean;
    isInDoubtMode: boolean;
    isSpeaking: boolean;
    collaborators: Collaborator[];
    isScreenSharing: boolean;
}

export interface Collaborator {
    id: string;
    name: string;
    avatar?: string;
    cursorPosition?: { x: number; y: number };
    isActive: boolean;
}

// ============================================
// DOUBT & CHAT TYPES
// ============================================

export interface Doubt {
    id: string;
    sessionId: string;
    question: string;
    timestamp: string;
    context: {
        stepNumber: number;
        stepTitle: string;
        visualState?: string;
    };
    resolution?: DoubtResolution;
    status: 'pending' | 'resolving' | 'resolved';
}

export interface DoubtResolution {
    explanation: string;
    visualAids?: string[];
    examples?: string[];
    quizQuestion?: QuizQuestion;
    resolvedAt: string;
    understandingConfirmed: boolean;
}

export interface ChatMessage {
    id: string;
    type: 'user' | 'ai' | 'system';
    content: string;
    timestamp: string;
    attachments?: Attachment[];
    /** True while tokens are still arriving for this AI message */
    isStreaming?: boolean;
}

export interface Attachment {
    id: string;
    type: 'image' | 'document' | 'link';
    name: string;
    url: string;
}

// ============================================
// RESOURCE TYPES
// ============================================

/** Structured study diagram embedded in a note section (rendered as SVG). */
export type NoteDiagramType = 'process' | 'hierarchy' | 'cycle' | 'compare' | 'concept-map';

export interface NoteDiagramNode {
    id: string;
    label: string;
    detail?: string;
}

export interface NoteDiagramEdge {
    from: string;
    to: string;
    label?: string;
}

export interface NoteDiagram {
    type: NoteDiagramType;
    title: string;
    caption?: string;
    nodes: NoteDiagramNode[];
    edges?: NoteDiagramEdge[];
}

export interface NotesGenerationContext {
    subjectArea?: string;
    gradeLevel?: string;
    chapterName?: string;
    topicDescription?: string;
    subjectDescription?: string;
    keyConcepts?: string[];
}

export interface GeneratedNote {
    id: string;
    sessionId: string;
    topicName: string;
    title: string;
    content: string;
    sections: NoteSection[];
    userDoubts: string[];
    createdAt: string;
    qualityScore?: number;
    /** Curriculum metadata captured at generation time. */
    subjectArea?: string;
    gradeLevel?: string;
    chapterName?: string;
}

export interface GeneratedSummary {
    id: string;
    sessionId: string;
    topicName: string;
    title: string;
    overview: string;
    keyTakeaways: string[];
    furtherReading?: string[];
    createdAt: string;
}

export interface NoteSection {
    heading: string;
    /** Plain text or light markdown (bold, lists, inline code). */
    content: string;
    highlights: string[];
    /** Optional visual explanations grounded in the section content. */
    diagrams?: NoteDiagram[];
}

export interface MindMapNode {
    id: string;
    label: string;
    description?: string;
    type: 'central' | 'category' | 'concept' | 'detail';
    color: string;
    icon?: string;
    children: MindMapNode[];
    connections?: { targetId: string; label?: string }[];
}

export interface MindMap {
    id: string;
    sessionId: string;
    topicName: string;
    centralTopic: string;
    nodes: MindMapNode[];
    createdAt: string;
}

export interface Flashcard {
    id: string;
    sessionId: string;
    question: string;
    answer: string;
    explanation?: string;
    hint?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];

    // Spaced repetition
    nextReviewDate: string;
    intervalDays: number;
    easeFactor: number;
    repetitions: number;
    lastPerformance?: 'again' | 'hard' | 'good' | 'easy';
}

export interface QuizQuestion {
    id: string;
    question: string;
    type: 'multiple_choice' | 'true_false' | 'fill_blank';
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
}

export interface ImageAnalysis {
    visualSummary: string;
    extractedContent: string;
    keyConcepts: string[];
    learningInsights: string[];
    imageBase64?: string; // Cache the source image
    analyzedAt: string;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface AppSettings {
    // Account
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';

    // Notifications
    notifications: {
        studyReminders: boolean;
        reminderTime: string;
        goalAchievements: boolean;
        reviewReminders: boolean;
        emailDigest: 'none' | 'daily' | 'weekly';
    };

    // Accessibility
    accessibility: {
        fontSize: 'small' | 'medium' | 'large' | 'xlarge';
        highContrast: boolean;
        reduceAnimations: boolean;
        textToSpeech: boolean;
        ttsSpeed: number;
        ttsVoice: string; // Browser TTS
        ttsLanguage: string; // Sarvam TTS Language (e.g. en-IN, hi-IN)
        ttsSpeaker: string; // Sarvam Speaker (e.g. meera, amartya)
    };

    // Privacy
    privacy: {
        analyticsEnabled: boolean;
        shareProgress: boolean;
        dataRetentionMonths: number;
    };

    // AI Tutor
    aiTutor: {
        personality: 'encouraging' | 'direct' | 'humorous' | 'formal';
        responseStyle: 'concise' | 'detailed' | 'interactive' | 'adaptive';
        analogiesEnabled: boolean;
        clinicalExamplesEnabled: boolean;
    };
}

export interface SettingsTemplate {
    id: string;
    name: string;
    description: string;
    settings: Partial<AppSettings>;
    isBuiltIn: boolean;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface SessionAnalytics {
    sessionId: string;
    date: string;
    durationMinutes: number;
    topicId: string;
    completionPercentage: number;
    doubtsCount: number;
    quizScore?: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
    progress?: number;
    target?: number;
}

export interface ProgressMetrics {
    totalHours: number;
    topicsCompleted: number;
    averageQuizScore: number;
    knowledgeRetention: number;
    weeklyHours: number[];
    streakDays: number;

    // Enhanced Metrics
    conceptMastery: Record<string, number>; // topicId -> mastery percentage
    dailyActivity: DailyActivity[];
    learningVelocity: number; // topics per week
}

export interface DailyActivity {
    date: string;
    minutes: number;
    topicsStarted: string[];
    topicsCompleted: string[];
    doubtsRaised: number;
}
