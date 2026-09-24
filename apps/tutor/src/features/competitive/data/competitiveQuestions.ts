import { COMPETITIVE_EXAMS } from '@/data/mockData';
import { generateContentFallbackQuestions } from './examContentFallbacks';
import { allocateDifficultySequence } from './examSyllabus';
import { dedupeQuestions } from '@/features/competitive/services/examQuestionQuality';

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number; // 0-3
    explanation: string;
    topic: string;
    /** When set, describes stem structure (e.g. assertion–reason, best-answer subjective-style MCQ). */
    questionFormat?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    examYear: string;
    subjectId: string;
    subjectName: string;
    /** Stable 1-based index within a full multi-subject paper. */
    questionNumber?: number;
    /** Optional stem diagram / figure URLs from source data (never fabricated). */
    imageUrl?: string;
    imageUrls?: string[];
    /** Internal validation metadata — not shown in exam UI */
    examId?: string;
    topicId?: string;
    syllabusUnit?: string;
    sourceBasis?: 'NCERT' | 'INTERMEDIATE' | 'OFFICIAL_SYLLABUS';
}

export const EXAM_QUESTION_BANKS: Record<string, Partial<Question>[]> = {
    'jee-advanced': [
        { id: 'ja1', text: "A solid cylinder rests on a rough horizontal surface. A horizontal force F is applied at the highest point. The minimum coefficient of friction for pure rolling is:", options: ["F/3Mg", "2F/3Mg", "F/2Mg", "F/Mg"], correctAnswer: 0, explanation: "Acceleration a = 2F/3M. F - f = M*a. f*R = I*time(alpha). Solving gives f = F/3. Thus μ ≥ F/3Mg.", topic: "Mechanics", difficulty: "Hard", subjectId: 'phy' },
        { id: 'ja2', text: "Which of the following compounds will not undergo Friedel-Crafts alkylation easily?", options: ["Toluene", "Nitrobenzene", "Chlorobenzene", "Anisole"], correctAnswer: 1, explanation: "Nitrobenzene has a strongly deactivating -NO2 group, preventing the Friedel-Crafts reaction.", topic: "Organic Chemistry", difficulty: "Medium", subjectId: 'chem' },
        { id: 'ja3', text: "The integral of e^(x) * (1/x - 1/x^2) dx is:", options: ["e^x / x + C", "e^x / x^2 + C", "e^x * x + C", "-e^x / x + C"], correctAnswer: 0, explanation: "Uses the standard integral form int e^x[f(x) + f'(x)]dx = e^x f(x). Here f(x) = 1/x.", topic: "Calculus", difficulty: "Easy", subjectId: 'math' }
    ],
    'polycet': [
        { id: 'poly1', text: "If the polynomial p(x) = x² - 5x + k has zeros α and β such that α - β = 1, then the value of k is:", options: ["6", "4", "5", "7"], correctAnswer: 0, explanation: "Sum of roots α+β = 5. Difference α-β = 1. Solving gives α=3, β=2. Product = k = 3*2=6.", topic: "Polynomials", difficulty: "Medium", subjectId: 'math' },
        { id: 'poly2', text: "The SI unit of resistivity is:", options: ["Ohm", "Ohm meter", "Siemens", "Ampere"], correctAnswer: 1, explanation: "Resistivity (ρ) = R(A/L), where R is resistance in Ohms, A is area in m², and L is length in m. Unit is Ohm * m.", topic: "Electricity", difficulty: "Easy", subjectId: 'phy' },
        { id: 'poly3', text: "Which gas is evolved when zinc reacts with dilute sulphuric acid?", options: ["Oxygen", "Chlorine", "Hydrogen", "Nitrogen"], correctAnswer: 2, explanation: "Zn + H2SO4 -> ZnSO4 + H2. Hydrogen gas is evolved.", topic: "Acids & Bases", difficulty: "Easy", subjectId: 'chem' }
    ],
    'ntse': [
        { id: 'ntse1', text: "Look at this series: 2, 1, 1/2, 1/4... What number should come next?", options: ["1/3", "1/8", "1/6", "1/16"], correctAnswer: 1, explanation: "This is a simple division series; each number is one-half of the previous number.", topic: "Series", difficulty: "Easy", subjectId: 'mat' },
        { id: 'ntse3', text: "The value of acceleration due to gravity (g) is maximum at:", options: ["Equator", "Poles", "Center of Earth", "Equal everywhere"], correctAnswer: 1, explanation: "The Earth is an oblate spheroid. It is flattened at the poles, making the radius minimum at the poles, hence g is maximum.", topic: "Gravitation", difficulty: "Easy", subjectId: 'sat-sci' },
        { id: 'ntse4', text: "When was the French Revolution?", options: ["1789", "1804", "1776", "1815"], correctAnswer: 0, explanation: "The French Revolution began in 1789 with the storming of the Bastille.", topic: "History", difficulty: "Medium", subjectId: 'sat-sst' },
    ],
    'rjc-cet': [
        { id: 'rjc1', text: "Which of the following elements exhibits maximum electron affinity?", options: ["Fluorine", "Chlorine", "Oxygen", "Nitrogen"], correctAnswer: 1, explanation: "Chlorine has the highest electron affinity among all elements, greater than Fluorine due to Fluorine's extremely small size leading to electron-electron repulsion.", topic: "Periodic Table", difficulty: "Medium", subjectId: 'sci' },
        { id: 'rjc2', text: "Select the correctly spelt word:", options: ["Accomodation", "Accommodation", "Acommodation", "Acomodation"], correctAnswer: 1, explanation: "The correct spelling has double 'c' and double 'm': Accommodation.", topic: "Vocabulary", difficulty: "Easy", subjectId: 'eng' },
        { id: 'rjc3', text: "If the simple interest on a sum of money for 2 years at 5% per annum is $50, what is the principal?", options: ["$400", "$500", "$600", "$1000"], correctAnswer: 1, explanation: "SI = (P*R*T)/100 => 50 = (P * 5 * 2) / 100 => P = (50*100)/10 = 500.", topic: "Interest", difficulty: "Easy", subjectId: 'math' }
    ],
    'neet': [
        { id: 'neet1', text: "The pacemaker of the human heart is:", options: ["SA node", "AV node", "Purkinje fibers", "Bundle of His"], correctAnswer: 0, explanation: "Sinoatrial (SA) node is the natural pacemaker of the heart.", topic: "Human Physiology", difficulty: "Easy", subjectId: 'zoo' },
        { id: 'neet2', text: "Which law states that the total pressure of a mixture of non-reacting gases is equal to the sum of their partial pressures?", options: ["Boyle's Law", "Charles's Law", "Dalton's Law", "Avogadro's Law"], correctAnswer: 2, explanation: "Dalton's Law of Partial Pressures describes this property.", topic: "States of Matter", difficulty: "Easy", subjectId: 'chem' },
        { id: 'neet3', text: "In a uniform magnetic field, a charged particle moves in a circular path. The radius of the path depends on:", options: ["Charge only", "Velocity only", "Magnetic field only", "All of the above"], correctAnswer: 3, explanation: "Radius r = mv/qB. It depends on mass, velocity, charge, and magnetic field.", topic: "Magnetism", difficulty: "Medium", subjectId: 'phy' },
        { id: 'neet4', text: "Which of the following is responsible for peat formation?", options: ["Marchantia", "Riccia", "Funaria", "Sphagnum"], correctAnswer: 3, explanation: "Sphagnum, a moss, provides peat that has long been used as fuel.", topic: "Plant Kingdom", difficulty: "Medium", subjectId: 'bot' }
    ],
    'jee-main': [
        { id: 'jeem1', text: "The value of limit x->0 (sin x - x) / x^3 is:", options: ["1/6", "-1/6", "1", "-1"], correctAnswer: 1, explanation: "Using Taylor expansion: sin x ≈ x - x^3/3! => (sin x - x)/x^3 = -1/6.", topic: "Limits", difficulty: "Medium", subjectId: 'math' },
        { id: 'jeem2', text: "Which of the following is an intensive property?", options: ["Mass", "Volume", "Temperature", "Enthalpy"], correctAnswer: 2, explanation: "Temperature does not depend on the amount of substance, making it an intensive property.", topic: "Thermodynamics", difficulty: "Easy", subjectId: 'chem' },
        { id: 'jeem3', text: "The escape velocity from the Earth is v. If a planet has twice the mass and twice the radius of Earth, its escape velocity is:", options: ["v", "v/2", "2v", "v/sqrt(2)"], correctAnswer: 0, explanation: "v_e = sqrt(2GM/R). For the new planet, M'=2M, R'=2R => sqrt(2G(2M)/(2R)) = sqrt(2GM/R) = v.", topic: "Gravitation", difficulty: "Medium", subjectId: 'phy' }
    ],
    'eamcet': [
        { id: 'eamcet1', text: "The number of subsets of a set containing n elements is:", options: ["n", "2n", "n^2", "2^n"], correctAnswer: 3, explanation: "By the binomial theorem or combinatorial logic, a set of size n has 2^n subsets.", topic: "Sets", difficulty: "Easy", subjectId: 'math' },
        { id: 'eamcet2', text: "The oxidation state of Oxygen in H2O2 is:", options: ["-2", "-1", "0", "+1"], correctAnswer: 1, explanation: "In peroxides, oxygen has an oxidation state of -1.", topic: "Redox", difficulty: "Medium", subjectId: 'chem' },
        { id: 'eamcet3', text: "For a projectile, the maximum range is achieved when the angle of projection is:", options: ["30 degrees", "45 degrees", "60 degrees", "90 degrees"], correctAnswer: 1, explanation: "Range = u^2 sin(2θ) / g. Max range occurs when sin(2θ) = 1 => 2θ = 90 => θ = 45.", topic: "Kinematics", difficulty: "Easy", subjectId: 'phy' }
    ],
    'sainik': [
        { id: 'snk1', text: "What is the Least Common Multiple (LCM) of 12, 15, and 21?", options: ["315", "420", "60", "210"], correctAnswer: 1, explanation: "Prime factorization: 12 = 2^2 * 3, 15 = 3 * 5, 21 = 3 * 7. LCM = 2^2 * 3 * 5 * 7 = 420.", topic: "LCM and HCF", difficulty: "Medium", subjectId: 'math' },
        { id: 'snk2', text: "Find the odd one out:", options: ["Apple", "Orange", "Banana", "Potato"], correctAnswer: 3, explanation: "Apple, Orange, and Banana are fruits, whereas Potato is a vegetable.", topic: "Classification", difficulty: "Easy", subjectId: 'intel' }
    ],
    'navodaya': [
        { id: 'nav1', text: "If 15 men can complete a piece of work in 20 days, how many days will 10 men take to complete the same work?", options: ["30 days", "25 days", "15 days", "40 days"], correctAnswer: 0, explanation: "M1*D1 = M2*D2. 15 * 20 = 10 * D2. D2 = 300 / 10 = 30 days.", topic: "Time and Work", difficulty: "Medium", subjectId: 'arith' },
        { id: 'nav2', text: "Choose the synonym of the word 'HAPPY'.", options: ["Sad", "Joyful", "Angry", "Tired"], correctAnswer: 1, explanation: "Joyful means feeling or expressing great happiness.", topic: "Vocabulary", difficulty: "Easy", subjectId: 'lang' }
    ],
    'kv': [
        { id: 'kv1', text: "Solve for x: 3x - 5 = 16", options: ["7", "6", "5", "8"], correctAnswer: 0, explanation: "3x = 16 + 5. 3x = 21. x = 7.", topic: "Linear Equations", difficulty: "Easy", subjectId: 'math' },
        { id: 'kv2', text: "Which part of the cell is known as the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"], correctAnswer: 2, explanation: "Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions.", topic: "Cell Biology", difficulty: "Easy", subjectId: 'sci' }
    ],
    'emrs': [
        { id: 'emrs1', text: "Pointing to a photograph, a man said, 'I have no brother, and that man's father is my father's son.' Whose photograph was it?", options: ["His own", "His son's", "His father's", "His nephew's"], correctAnswer: 1, explanation: "Since the narrator has no brother, 'my father's son' is the narrator himself. So, the man in the photograph's father is the narrator. Hence, the photograph is of his son.", topic: "Blood Relations", difficulty: "Hard", subjectId: 'mat' },
        { id: 'emrs2', text: "What is 20% of 400?", options: ["40", "60", "80", "100"], correctAnswer: 2, explanation: "20% of 400 = (20/100) * 400 = 80.", topic: "Percentages", difficulty: "Easy", subjectId: 'arith' }
    ],
    'nmms': [
        { id: 'nmms1', text: "Find the next term in the series: 3, 7, 15, 31, 63, ...", options: ["127", "95", "125", "111"], correctAnswer: 0, explanation: "Each term is obtained by doubling the previous term and adding 1: (3*2)+1=7, (7*2)+1=15, etc. Thus, (63*2)+1 = 127.", topic: "Number Series", difficulty: "Medium", subjectId: 'mat' },
        { id: 'nmms2', text: "Which of the following is a synthetic fibre?", options: ["Cotton", "Nylon", "Wool", "Silk"], correctAnswer: 1, explanation: "Nylon is a synthetic (man-made) fibre made from coal, water, and air, whereas Cotton, Wool, and Silk are natural fibres.", topic: "Synthetic Fibres", difficulty: "Easy", subjectId: 'sat-sci' },
        { id: 'nmms3', text: "Who was the first Governor-General of British India?", options: ["Lord Canning", "Warren Hastings", "Lord Dalhousie", "Lord Mountbatten"], correctAnswer: 1, explanation: "Warren Hastings was appointed as the first Governor-General of Bengal (later India) under the Regulating Act of 1773.", topic: "Modern Indian History", difficulty: "Medium", subjectId: 'sat-sst' },
        { id: 'nmms4', text: "What is the square root of 625?", options: ["15", "25", "35", "45"], correctAnswer: 1, explanation: "Since 25 * 25 = 625, the square root of 625 is 25.", topic: "Squares and Square Roots", difficulty: "Easy", subjectId: 'sat-math' }
    ],
    'olympiad': [
        { id: 'oly1', text: "The sum of three consecutive integers is 72. The largest of these integers is:", options: ["23", "24", "25", "26"], correctAnswer: 2, explanation: "Let the integers be x-1, x, and x+1. Their sum is 3x = 72 => x = 24. The largest is x+1 = 25.", topic: "Algebraic Equations", difficulty: "Medium", subjectId: 'math' },
        { id: 'oly2', text: "Which of the following is a physical change?", options: ["Rusting of iron", "Melting of ice", "Burning of wood", "Souring of milk"], correctAnswer: 1, explanation: "Melting of ice is a physical change because it only changes the physical state of water from solid to liquid, and can be reversed back. The others are chemical changes.", topic: "Physical & Chemical Changes", difficulty: "Easy", subjectId: 'sci' },
        { id: 'oly3', text: "Identify the antonym of the word 'BENEVOLENT'.", options: ["Malevolent", "Kind", "Generous", "Friendly"], correctAnswer: 0, explanation: "Benevolent means well-meaning and kindly. Its antonym is Malevolent, which means wishing to do evil to others.", topic: "Vocabulary", difficulty: "Medium", subjectId: 'eng' },
        { id: 'oly4', text: "In a certain code, 'LIGHT' is written as 'MJHIU'. How is 'SOUND' written in that code?", options: ["TPEOE", "TPEOF", "TOEPE", "TPFOE"], correctAnswer: 0, explanation: "Each letter is shifted to the next alphabetical character (+1 shift): L->M, I->J, G->H, H->I, T->U. SOUND becomes T->P->E->O->E.", topic: "Coding-Decoding", difficulty: "Medium", subjectId: 'mat' }
    ],
    'rgukt-iiit': [
        { id: 'rgukt1', text: "If the roots of the quadratic equation x² + px + q = 0 are equal, then:", options: ["p² = 4q", "p² = -4q", "p² = q", "p = 4q²"], correctAnswer: 0, explanation: "For equal roots, the discriminant D = b² - 4ac must be zero. So, p² - 4(1)(q) = 0 => p² = 4q.", topic: "Quadratic Equations", difficulty: "Medium", subjectId: 'math' },
        { id: 'rgukt2', text: "The focal length of a concave mirror of radius of curvature 30 cm is:", options: ["15 cm", "-15 cm", "30 cm", "-30 cm"], correctAnswer: 1, explanation: "By sign convention, the focal length (f) of a concave mirror is negative. f = -R/2 = -30/2 = -15 cm.", topic: "Reflection of Light", difficulty: "Medium", subjectId: 'phy' },
        { id: 'rgukt3', text: "What is the pH value of a neutral solution at 298 K?", options: ["0", "7", "14", "1"], correctAnswer: 1, explanation: "A neutral solution has a pH of 7 at standard room temperature (298 K).", topic: "Acids, Bases & Salts", difficulty: "Easy", subjectId: 'chem' },
        { id: 'rgukt4', text: "The green pigment in leaves responsible for trapping solar energy is:", options: ["Chlorophyll", "Hemoglobin", "Carotene", "Xanthophyll"], correctAnswer: 0, explanation: "Chlorophyll is the green pigment in chloroplasts that absorbs light energy during photosynthesis.", topic: "Life Processes", difficulty: "Easy", subjectId: 'bio' }
    ]
};

/**
 * Procedurally generates a FULL Mock Exam Paper tailored to the exam's exact specification
 * e.g., POLYCET: Math 50, Phy 40, Chem 30.
 * Populates with authentic questions where possible, then fills the rest with procedural mock patterns.
 */
export const generateFullExamPaper = (examId: string, year: string): Question[] => {
    const exam = COMPETITIVE_EXAMS.find(e => e.id === examId);
    if (!exam) return [];

    const bank = EXAM_QUESTION_BANKS[examId] || [];
    const fullPaper: Question[] = [];

    exam.subjects.forEach((subject, subjectIndex) => {
        const authenticSubjectQs = bank
            .filter((q) => q.subjectId === subject.id)
            .map((q, i) => ({
                ...q,
                id: `${q.id}-${year}-${i}`,
                examYear: year,
                subjectId: subject.id,
                subjectName: subject.name,
            } as Question));

        const difficulties = allocateDifficultySequence(examId, subject.questionsCount);
        const generated = generateContentFallbackQuestions({
            examId,
            examName: exam.name,
            subjectId: subject.id,
            subjectName: subject.name,
            count: subject.questionsCount,
            year,
            difficulties,
            seed: subjectIndex * 10007 + Number(year),
        });

        const merged = dedupeQuestions([...authenticSubjectQs, ...generated]).slice(0, subject.questionsCount);
        fullPaper.push(...merged);
    });

    return fullPaper;
};

/**
 * Questionary Explanation Feature Data
 */

export interface SyllabusTopic {
    id: string;
    name: string;
}

// Exam Subject Topics
export const SYLLABUS_TOPICS: Record<string, SyllabusTopic[]> = {
    'phy': [
        { id: 'phy-mech', name: 'Mechanics & Kinematics' },
        { id: 'phy-thermo', name: 'Thermodynamics' },
        { id: 'phy-em', name: 'Electromagnetism' },
        { id: 'phy-optics', name: 'Optics & Modern Physics' }
    ],
    'chem': [
        { id: 'chem-phys', name: 'Physical Chemistry' },
        { id: 'chem-inorg', name: 'Inorganic Chemistry' },
        { id: 'chem-org', name: 'Organic Chemistry' }
    ],
    'math': [
        { id: 'math-alg', name: 'Algebra' },
        { id: 'math-calc', name: 'Calculus' },
        { id: 'math-trig', name: 'Trigonometry & Geometry' }
    ],
    'bot': [
        { id: 'bot-cell', name: 'Cell Structure & Function' },
        { id: 'bot-physio', name: 'Plant Physiology' },
        { id: 'bot-genetics', name: 'Genetics' }
    ],
    'zoo': [
        { id: 'zoo-physio', name: 'Human Physiology' },
        { id: 'zoo-repro', name: 'Reproduction' },
        { id: 'zoo-eco', name: 'Ecology & Environment' }
    ],
    'mat': [
        { id: 'mat-logic', name: 'Logical Reasoning' },
        { id: 'mat-spatial', name: 'Spatial Reasoning' },
        { id: 'mat-verbal', name: 'Verbal Reasoning' }
    ],
    'arith': [
        { id: 'arith-basic', name: 'Basic Arithmetic' },
        { id: 'arith-adv', name: 'Advanced Arithmetic' }
    ],
    'lang': [
        { id: 'lang-vocab', name: 'Vocabulary' },
        { id: 'lang-gram', name: 'Grammar' },
        { id: 'lang-comp', name: 'Reading Comprehension' }
    ],
    'intel': [
        { id: 'intel-pat', name: 'Pattern Recognition' },
        { id: 'intel-ana', name: 'Analogies' }
    ],
    'gk': [
        { id: 'gk-hist', name: 'History & Culture' },
        { id: 'gk-sci', name: 'General Science' },
        { id: 'gk-curr', name: 'Current Affairs' }
    ],
    'hin': [
        { id: 'hin-vyak', name: 'Vyakaran' },
        { id: 'hin-sahitya', name: 'Sahitya' }
    ],
    'sst': [
        { id: 'sst-hist', name: 'History' },
        { id: 'sst-geo', name: 'Geography' },
        { id: 'sst-civ', name: 'Civics' }
    ],
    'eng': [
        { id: 'eng-gram', name: 'Grammar' },
        { id: 'eng-comp', name: 'Comprehension' }
    ],
    'sci': [
        { id: 'sci-phy', name: 'Physical Science' },
        { id: 'sci-life', name: 'Life Science' }
    ],
    'sat-sci': [
        { id: 'sat-sci-phy', name: 'Physics' },
        { id: 'sat-sci-chem', name: 'Chemistry' },
        { id: 'sat-sci-bio', name: 'Biology & Life Science' }
    ],
    'sat-math': [
        { id: 'sat-math-arith', name: 'Arithmetic & Number Systems' },
        { id: 'sat-math-alg', name: 'Algebra' },
        { id: 'sat-math-geo', name: 'Geometry & Mensuration' }
    ],
    'bio': [
        { id: 'bio-cell', name: 'Cellular Biology' },
        { id: 'bio-physio', name: 'Plant & Animal Physiology' },
        { id: 'bio-eco', name: 'Ecology & Environment' }
    ],
    // Fallback topics
    'default': [
        { id: 'def-1', name: 'Core Concepts' },
        { id: 'def-2', name: 'Advanced Applications' },
        { id: 'def-3', name: 'Problem Solving Techniques' }
    ]
};

// Model Questions tied to specific Topics
export const QUESTIONARY_BANK: Record<string, Question[]> = {
    'phy-mech': [
        {
            id: 'mod-phy-1',
            text: 'A particle moves along a straight line such that its displacement at any time t is given by s = t^3 - 6t^2 + 3t + 4. The velocity when the acceleration is zero is:',
            options: ['-9 m/s', '-12 m/s', '3 m/s', '42 m/s'],
            correctAnswer: 0,
            explanation: `Step 1: Find velocity v = ds/dt = 3t^2 - 12t + 3.\nStep 2: Find acceleration a = dv/dt = 6t - 12.\nStep 3: Set acceleration to zero: 6t - 12 = 0 => t = 2 s.\nStep 4: Substitute t = 2 into the velocity equation: v = 3(2)^2 - 12(2) + 3 = 12 - 24 + 3 = -9 m/s.`,
            topic: 'Kinematics',
            difficulty: 'Medium',
            examYear: 'Model',
            subjectId: 'phy',
            subjectName: 'Physics'
        },
        {
            id: 'mod-phy-2',
            text: 'A block of mass M is pulled along a horizontal frictionless surface by a rope of mass m. If a force F is applied at the free end of the rope, the force exerted by the rope on the block is:',
            options: ['F', 'F * M / (M + m)', 'F * m / (M + m)', 'F * M / m'],
            correctAnswer: 1,
            explanation: `Step 1: The total acceleration of the system is a = F / (M + m).\nStep 2: The only force acting on the block M is the tension from the rope.\nStep 3: Force on block = M * a = M * [F / (M + m)].`,
            topic: 'Newton\'s Laws',
            difficulty: 'Hard',
            examYear: 'Model',
            subjectId: 'phy',
            subjectName: 'Physics'
        }
    ],
    'chem-org': [
        {
            id: 'mod-chem-1',
            text: 'Which of the following undergoes nucleophilic substitution exclusively by an SN1 mechanism?',
            options: ['Ethyl chloride', 'Isopropyl chloride', 'Benzyl chloride', 'tert-Butyl chloride'],
            correctAnswer: 3,
            explanation: `Step 1: The SN1 mechanism favors substrates that can form the most stable carbocations.\nStep 2: Compare the given alkyl halides: primary (Ethyl), secondary (Isopropyl), primary benzylic (Benzyl), and tertiary (tert-Butyl).\nStep 3: A tertiary carbocation is highly stable due to hyperconjugation and inductive effects (+I) from three methyl groups.\nStep 4: Therefore, tert-Butyl chloride undergoes substitution exclusively via the SN1 pathway due to steric hindrance preventing SN2 and high carbocation stability favoring SN1.`,
            topic: 'Organic Reaction Mechanisms',
            difficulty: 'Medium',
            examYear: 'Model',
            subjectId: 'chem',
            subjectName: 'Chemistry'
        }
    ],
    'math-calc': [
        {
            id: 'mod-math-1',
            text: 'Evaluate the definite integral of x*sin(x) from 0 to π/2.',
            options: ['1', 'π/2 - 1', 'π/2', '0'],
            correctAnswer: 0,
            explanation: `Step 1: Use integration by parts: ∫u dv = uv - ∫v du.\nStep 2: Let u = x, dv = sin(x)dx. Then du = dx, v = -cos(x).\nStep 3: ∫x*sin(x)dx = -x*cos(x) - ∫(-cos(x))dx = -x*cos(x) + sin(x).\nStep 4: Evaluate from 0 to π/2: [-(π/2)*cos(π/2) + sin(π/2)] - [-0*cos(0) + sin(0)] = [0 + 1] - [0 + 0] = 1.`,
            topic: 'Integration',
            difficulty: 'Medium',
            examYear: 'Model',
            subjectId: 'math',
            subjectName: 'Mathematics'
        }
    ]
};
