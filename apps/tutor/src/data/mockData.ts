export interface ExamSubject {
    id: string;
    name: string;
    questionsCount: number;
}

export interface Paper {
    id: string;
    year: number;
    name: string;
    shift?: string;
}

export interface Exam {
    id: string;
    name: string;
    subjects: ExamSubject[];
    timeMinutes: number;
    papers: Paper[];
}

const generatePapers = (): Paper[] => {
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 - i);
    return years.map((year, i) => ({
        id: `p-${year}`,
        year,
        // Practice sets tagged by year — not verified official archived papers
        name: `${year} Practice Set`,
        shift: String((i % 2) + 1),
    }));
};

export const COMPETITIVE_EXAMS: Exam[] = [
    {
        id: 'jee-main',
        name: 'JEE Main',
        timeMinutes: 180,
        subjects: [
            { id: 'phy', name: 'Physics', questionsCount: 30 },
            { id: 'chem', name: 'Chemistry', questionsCount: 30 },
            { id: 'math', name: 'Mathematics', questionsCount: 30 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'neet',
        name: 'NEET',
        timeMinutes: 200,
        subjects: [
            { id: 'phy', name: 'Physics', questionsCount: 50 },
            { id: 'chem', name: 'Chemistry', questionsCount: 50 },
            { id: 'bot', name: 'Botany', questionsCount: 50 },
            { id: 'zoo', name: 'Zoology', questionsCount: 50 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'eamcet',
        name: 'EAMCET',
        timeMinutes: 180,
        subjects: [
            { id: 'math', name: 'Mathematics', questionsCount: 80 },
            { id: 'phy', name: 'Physics', questionsCount: 40 },
            { id: 'chem', name: 'Chemistry', questionsCount: 40 },
            { id: 'bot', name: 'Botany', questionsCount: 40 },
            { id: 'zoo', name: 'Zoology', questionsCount: 40 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'jee-advanced',
        name: 'JEE Advanced',
        timeMinutes: 180,
        subjects: [
            { id: 'phy', name: 'Physics', questionsCount: 34 },
            { id: 'chem', name: 'Chemistry', questionsCount: 34 },
            { id: 'math', name: 'Mathematics', questionsCount: 34 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'polycet',
        name: 'POLYCET',
        timeMinutes: 120,
        subjects: [
            { id: 'math', name: 'Mathematics', questionsCount: 60 },
            { id: 'phy', name: 'Physics', questionsCount: 30 },
            { id: 'chem', name: 'Chemistry', questionsCount: 30 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'ntse',
        name: 'NTSE',
        timeMinutes: 120,
        subjects: [
            { id: 'mat', name: 'Mental Ability', questionsCount: 100 },
            { id: 'sat-sci', name: 'Science', questionsCount: 40 },
            { id: 'sat-sst', name: 'Social Science', questionsCount: 40 },
            { id: 'sat-math', name: 'Mathematics', questionsCount: 20 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'rjc-cet',
        name: 'RJC CET',
        timeMinutes: 150,
        subjects: [
            { id: 'math', name: 'Mathematics', questionsCount: 50 },
            { id: 'sci', name: 'Science', questionsCount: 50 },
            { id: 'eng', name: 'English', questionsCount: 50 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'gate',
        name: 'GATE',
        timeMinutes: 180,
        subjects: [
            { id: 'eng-core', name: 'Engineering Core', questionsCount: 45 },
            { id: 'eng-math', name: 'Engineering Mathematics', questionsCount: 13 },
            { id: 'ga', name: 'General Aptitude', questionsCount: 10 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'sainik',
        name: 'Sainik School',
        timeMinutes: 150,
        subjects: [
            { id: 'math', name: 'Mathematics', questionsCount: 50 },
            { id: 'intel', name: 'Intelligence', questionsCount: 25 },
            { id: 'lang', name: 'Language', questionsCount: 25 },
            { id: 'gk', name: 'General Knowledge', questionsCount: 25 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'navodaya',
        name: 'JNVST (Navodaya)',
        timeMinutes: 120,
        subjects: [
            { id: 'mat', name: 'Mental Ability', questionsCount: 40 },
            { id: 'arith', name: 'Arithmetic', questionsCount: 20 },
            { id: 'lang', name: 'Language', questionsCount: 20 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'kv',
        name: 'KV Admission',
        timeMinutes: 180,
        subjects: [
            { id: 'eng', name: 'English', questionsCount: 20 },
            { id: 'hin', name: 'Hindi', questionsCount: 20 },
            { id: 'math', name: 'Mathematics', questionsCount: 20 },
            { id: 'sci', name: 'Science', questionsCount: 20 },
            { id: 'sst', name: 'Social Science', questionsCount: 20 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'emrs',
        name: 'EMRS Entrance',
        timeMinutes: 120,
        subjects: [
            { id: 'mat', name: 'Mental Ability', questionsCount: 50 },
            { id: 'arith', name: 'Arithmetic', questionsCount: 25 },
            { id: 'lang', name: 'Language', questionsCount: 25 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'nmms',
        name: 'NMMS',
        timeMinutes: 180,
        subjects: [
            { id: 'mat', name: 'Mental Ability', questionsCount: 90 },
            { id: 'sat-sci', name: 'Science', questionsCount: 35 },
            { id: 'sat-sst', name: 'Social Science', questionsCount: 35 },
            { id: 'sat-math', name: 'Mathematics', questionsCount: 20 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'olympiad',
        name: 'Olympiads',
        timeMinutes: 120,
        subjects: [
            { id: 'math', name: 'Mathematics', questionsCount: 35 },
            { id: 'sci', name: 'Science', questionsCount: 35 },
            { id: 'eng', name: 'English', questionsCount: 15 },
            { id: 'mat', name: 'Logical Reasoning', questionsCount: 15 },
        ],
        papers: generatePapers(),
    },
    {
        id: 'rgukt-iiit',
        name: 'RGUKT IIIT',
        timeMinutes: 120,
        subjects: [
            { id: 'math', name: 'Mathematics', questionsCount: 40 },
            { id: 'phy', name: 'Physics', questionsCount: 20 },
            { id: 'chem', name: 'Chemistry', questionsCount: 20 },
            { id: 'bio', name: 'Biology', questionsCount: 20 },
        ],
        papers: generatePapers(),
    },
];

