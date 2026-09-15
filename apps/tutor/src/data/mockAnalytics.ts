
export interface TopicPerformance {
    id: string;
    name: string;
    score: number; // 0-100
    classAverage: number;
}

export interface StudentError {
    topicId: string;
    topicName: string;
    errorType: 'conceptual' | 'careless' | 'procedural';
    description: string;
}

export interface Student {
    id: string;
    name: string;
    avatar: string;
    overallScore: number;
    weakTopics: TopicPerformance[];
    strongTopics: TopicPerformance[];
    recentErrors: StudentError[];
}

export interface TeacherStats {
    id: string;
    name: string;
    subject: string;
    classes: string[];
    averagePerformance: number;
    studentCount: number;
}

export const MOCK_CLASS_PERFORMANCE: TopicPerformance[] = [
    { id: 'linear-eq', name: 'Linear Equations', score: 58, classAverage: 62 },
    { id: 'quadratic', name: 'Quadratic Equations', score: 72, classAverage: 70 },
    { id: 'trig', name: 'Trigonometry', score: 45, classAverage: 55 },
    { id: 'geometry', name: 'Triangle Geometry', score: 85, classAverage: 82 },
    { id: 'stats', name: 'Statistics', score: 90, classAverage: 88 },
];

export const MOCK_STUDENTS: Student[] = [
    {
        id: 's1',
        name: 'Alex Johnson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        overallScore: 78,
        weakTopics: [
            { id: 'trig', name: 'Trigonometry', score: 40, classAverage: 55 },
            { id: 'linear-eq', name: 'Linear Equations', score: 55, classAverage: 62 }
        ],
        strongTopics: [
            { id: 'geometry', name: 'Triangle Geometry', score: 92, classAverage: 82 }
        ],
        recentErrors: [
            { topicId: 'trig', topicName: 'Trigonometry', errorType: 'conceptual', description: 'Confused Sine and Cosine definitions' },
            { topicId: 'linear-eq', topicName: 'Linear Equations', errorType: 'careless', description: 'Sign error in transposition' }
        ]
    },
    {
        id: 's2',
        name: 'Sam Smith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
        overallScore: 65,
        weakTopics: [
            { id: 'quadratic', name: 'Quadratic Equations', score: 50, classAverage: 70 },
            { id: 'trig', name: 'Trigonometry', score: 48, classAverage: 55 }
        ],
        strongTopics: [],
        recentErrors: [
            { topicId: 'quadratic', topicName: 'Quadratic Equations', errorType: 'conceptual', description: 'Difficulty with quadratic formula' }
        ]
    },
    {
        id: 's3',
        name: 'Emma Wilson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
        overallScore: 92,
        weakTopics: [],
        strongTopics: [
            { id: 'all', name: 'All Subjects', score: 92, classAverage: 75 }
        ],
        recentErrors: []
    }
];

export const MOCK_TEACHERS: TeacherStats[] = [
    { id: 't1', name: 'Mrs. Davis', subject: 'Mathematics', classes: ['Grade 9A', 'Grade 10B'], averagePerformance: 78, studentCount: 65 },
    { id: 't2', name: 'Mr. Wilson', subject: 'Physics', classes: ['Grade 9B', 'Grade 11A'], averagePerformance: 72, studentCount: 58 },
    { id: 't3', name: 'Ms. Brown', subject: 'Chemistry', classes: ['Grade 10A'], averagePerformance: 85, studentCount: 30 },
];

export const SYSTEMIC_ISSUES = [
    { topic: 'Trigonometry', subject: 'Mathematics', affectedGrades: ['Grade 9', 'Grade 10'], description: 'Consistently low scores across all sections (>40% below par)' },
    { topic: 'Thermodynamics', subject: 'Physics', affectedGrades: ['Grade 11'], description: 'Conceptual gaps identified in 65% of students' },
];
