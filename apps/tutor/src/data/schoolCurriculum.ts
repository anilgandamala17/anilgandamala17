import type { SchoolGrade, SchoolSubject, Chapter, Topic } from '../types';

// ============================================
// SUBJECT TEMPLATES FOR EACH GRADE LEVEL
// ============================================


// Middle Level Subjects (Classes 6-8)
const createMiddleSubjects = (gradeNumber: number): SchoolSubject[] => [
    {
        id: 'english',
        name: 'English',
        icon: 'book-open',
        color: '#FF5E7E',
        description: 'Language, literature, and grammar',
        chapters: createEnglishChapters(gradeNumber)
    },
    {
        id: 'hindi',
        name: 'Hindi',
        icon: 'languages',
        color: '#FF9E2C',
        description: 'Hindi language and literature',
        chapters: createHindiChapters(gradeNumber)
    },
    {
        id: 'mathematics',
        name: 'Mathematics',
        icon: 'calculator',
        color: '#2C8CFF',
        description: 'Algebra, geometry, and arithmetic',
        chapters: createMathChapters(gradeNumber)
    },
    {
        id: 'science',
        name: 'Science',
        icon: 'flask',
        color: '#1DD186',
        description: 'Physics, chemistry, and biology fundamentals',
        chapters: createScienceChapters(gradeNumber)
    },
    {
        id: 'social-science',
        name: 'Social Science',
        icon: 'globe',
        color: '#8A4FFF',
        description: 'History, geography, and civics',
        chapters: createSocialScienceChapters(gradeNumber)
    },
    {
        id: 'computer',
        name: 'Computer Science',
        icon: 'monitor',
        color: '#00C2D1',
        description: 'Basic computer skills and programming',
        chapters: createComputerChapters(gradeNumber)
    }
];

// Secondary Level Subjects (Classes 9-10)
const createSecondarySubjects = (gradeNumber: number): SchoolSubject[] => [
    {
        id: 'english',
        name: 'English',
        icon: 'book-open',
        color: '#FF5E7E',
        description: 'Literature, writing, and communication',
        chapters: createEnglishChapters(gradeNumber)
    },
    {
        id: 'hindi',
        name: 'Hindi',
        icon: 'languages',
        color: '#FF9E2C',
        description: 'Hindi literature and grammar',
        chapters: createHindiChapters(gradeNumber)
    },
    {
        id: 'mathematics',
        name: 'Mathematics',
        icon: 'calculator',
        color: '#2C8CFF',
        description: 'Advanced algebra, geometry, and trigonometry',
        chapters: createMathChapters(gradeNumber)
    },
    {
        id: 'science',
        name: 'Science',
        icon: 'flask',
        color: '#1DD186',
        description: 'Physics, chemistry, and biology',
        chapters: createScienceChapters(gradeNumber)
    },
    {
        id: 'social-science',
        name: 'Social Science',
        icon: 'globe',
        color: '#8A4FFF',
        description: 'History, geography, political science, economics',
        chapters: createSocialScienceChapters(gradeNumber)
    },
    {
        id: 'it',
        name: 'Information Technology',
        icon: 'code',
        color: '#00C2D1',
        description: 'Programming and IT fundamentals',
        chapters: createITChapters(gradeNumber)
    }
];

// Senior Secondary Science Stream (Classes 11-12)
const createSeniorScienceSubjects = (gradeNumber: number): SchoolSubject[] => [
    {
        id: 'physics',
        name: 'Physics',
        icon: 'atom',
        color: '#00C2D1',
        description: 'Mechanics, thermodynamics, electromagnetism',
        chapters: createPhysicsChapters(gradeNumber)
    },
    {
        id: 'chemistry',
        name: 'Chemistry',
        icon: 'flask',
        color: '#8A4FFF',
        description: 'Organic, inorganic, and physical chemistry',
        chapters: createChemistryChapters(gradeNumber)
    },
    {
        id: 'mathematics',
        name: 'Mathematics',
        icon: 'calculator',
        color: '#2C8CFF',
        description: 'Calculus, algebra, and coordinate geometry',
        chapters: createMathChapters(gradeNumber)
    },
    {
        id: 'biology',
        name: 'Biology',
        icon: 'dna',
        color: '#1DD186',
        description: 'Botany, zoology, and human physiology',
        chapters: createBiologyChapters(gradeNumber)
    },
    {
        id: 'english',
        name: 'English',
        icon: 'book-open',
        color: '#FF5E7E',
        description: 'English literature and writing',
        chapters: createEnglishChapters(gradeNumber)
    },
    {
        id: 'computer-science',
        name: 'Computer Science',
        icon: 'code',
        color: '#00C2D1',
        description: 'Programming, data structures, and algorithms',
        chapters: createCSChapters(gradeNumber)
    }
];

// ============================================
// CHAPTER GENERATORS BY SUBJECT
// ============================================

function createEnglishChapters(gradeNumber: number): Chapter[] {
    const chapters: Record<number, Chapter[]> = {
        6: [
            { id: 'eng-6-1', name: 'Who Did Patrick\'s Homework?', chapterNumber: 1, topics: createTopics(['Fantasy Fiction', 'Moral Lessons', 'Comprehension'], 'eng-6-1') },
            { id: 'eng-6-2', name: 'How the Dog Found Himself a New Master', chapterNumber: 2, topics: createTopics(['Folk Tales', 'Character Analysis', 'Writing'], 'eng-6-2') },
            { id: 'eng-6-3', name: 'Taro\'s Reward', chapterNumber: 3, topics: createTopics(['Japanese Tales', 'Gratitude', 'Summary Writing'], 'eng-6-3') },
        ],
        7: [
            { id: 'eng-7-1', name: 'Three Questions', chapterNumber: 1, topics: createTopics(['Philosophy', 'Moral Stories', 'Critical Thinking'], 'eng-7-1') },
            { id: 'eng-7-2', name: 'A Gift of Chappals', chapterNumber: 2, topics: createTopics(['Indian Culture', 'Kindness', 'Vocabulary'], 'eng-7-2') },
            { id: 'eng-7-3', name: 'Gopal and the Hilsa Fish', chapterNumber: 3, topics: createTopics(['Wit and Humor', 'Problem Solving', 'Drama'], 'eng-7-3') },
        ],
        8: [
            { id: 'eng-8-1', name: 'The Best Christmas Present', chapterNumber: 1, topics: createTopics(['Historical Fiction', 'Family Bonds', 'Analysis'], 'eng-8-1') },
            { id: 'eng-8-2', name: 'The Tsunami', chapterNumber: 2, topics: createTopics(['Natural Disasters', 'Survival Stories', 'Report Writing'], 'eng-8-2') },
            { id: 'eng-8-3', name: 'Glimpses of the Past', chapterNumber: 3, topics: createTopics(['Indian History', 'Comics', 'Timeline'], 'eng-8-3') },
        ],
        9: [
            { id: 'eng-9-1', name: 'The Fun They Had', chapterNumber: 1, topics: createTopics(['Science Fiction', 'Future of Education', 'Analysis'], 'eng-9-1') },
            { id: 'eng-9-2', name: 'The Sound of Music', chapterNumber: 2, topics: createTopics(['Biography', 'Music', 'Inspiration'], 'eng-9-2') },
            { id: 'eng-9-3', name: 'The Little Girl', chapterNumber: 3, topics: createTopics(['Relationships', 'Character Study', 'Writing'], 'eng-9-3') },
        ],
        10: [
            { id: 'eng-10-1', name: 'A Letter to God', chapterNumber: 1, topics: createTopics(['Faith', 'Irony', 'Literary Devices'], 'eng-10-1') },
            { id: 'eng-10-2', name: 'Nelson Mandela', chapterNumber: 2, topics: createTopics(['Autobiography', 'Freedom', 'Leadership'], 'eng-10-2') },
            { id: 'eng-10-3', name: 'Two Stories About Flying', chapterNumber: 3, topics: createTopics(['Adventure', 'Courier', 'Narrative'], 'eng-10-3') },
            { id: 'eng-10-4', name: 'Diary of Anne Frank', chapterNumber: 4, topics: createTopics(['Diary Anne Frank'], 'eng-10-4') },
            { id: 'eng-10-5', name: 'The Hundred Dresses', chapterNumber: 5, topics: createTopics(['Hundred Dresses'], 'eng-10-5') },
        ],
        11: [
            { id: 'eng-11-1', name: 'The Portrait of a Lady', chapterNumber: 1, topics: createTopics(['Prose', 'Character Sketch', 'Relationships'], 'eng-11-1') },
            { id: 'eng-11-2', name: 'We\'re Not Afraid to Die', chapterNumber: 2, topics: createTopics(['Adventure', 'Survival', 'Determination'], 'eng-11-2') },
            { id: 'eng-11-3', name: 'Discovering Tut', chapterNumber: 3, topics: createTopics(['History', 'Archaeology', 'Scientific Writing'], 'eng-11-3') },
        ],
        12: [
            { id: 'eng-12-1', name: 'The Last Lesson', chapterNumber: 1, topics: createTopics(['War Literature', 'Patriotism', 'Analysis'], 'eng-12-1') },
            { id: 'eng-12-2', name: 'Lost Spring', chapterNumber: 2, topics: createTopics(['Social Issues', 'Child Labor', 'Critical Analysis'], 'eng-12-2') },
            { id: 'eng-12-3', name: 'Deep Water', chapterNumber: 3, topics: createTopics(['Autobiography', 'Fear', 'Overcoming'], 'eng-12-3') },
        ],
    };
    return chapters[gradeNumber] || [];
}

function createHindiChapters(gradeNumber: number): Chapter[] {
    const chapters: Record<number, Chapter[]> = {
        2: [
            { id: 'hin-2-1', name: 'ऊँट चला', chapterNumber: 1, topics: createTopics(['कविता', 'तुकबंदी', 'अभ्यास'], 'hin-2-1') },
            { id: 'hin-2-2', name: 'भालू ने खेली फुटबॉल', chapterNumber: 2, topics: createTopics(['कहानी', 'खेल', 'व्याकरण'], 'hin-2-2') },
        ],
        // Add more grades...
    };
    if (gradeNumber === 10) {
        return [
            { id: 'hin-10-1', name: 'संचयन', chapterNumber: 1, topics: createTopics(['Sanchayan'], 'hin-10-1') },
            { id: 'hin-10-2', name: 'स्पर्श', chapterNumber: 2, topics: createTopics(['Sparsh'], 'hin-10-2') },
            { id: 'hin-10-3', name: 'कृतिका', chapterNumber: 3, topics: createTopics(['Kritika'], 'hin-10-3') },
            { id: 'hin-10-4', name: 'क्षितिज', chapterNumber: 4, topics: createTopics(['Kshitij'], 'hin-10-4') },
            { id: 'hin-10-5', name: 'हिन्दी व्याकरण', chapterNumber: 5, topics: createTopics(['Grammar'], 'hin-10-5') },
            { id: 'hin-10-6', name: 'लेखन कौशल', chapterNumber: 6, topics: createTopics(['Writing Skills'], 'hin-10-6') },
            { id: 'hin-10-7', name: 'अभ्यास कार्य', chapterNumber: 7, topics: createTopics(['Hindi Practice'], 'hin-10-7') },
        ];
    }
    return chapters[gradeNumber] || [
        { id: `hin-${gradeNumber}-1`, name: 'पाठ 1', chapterNumber: 1, topics: createTopics(['पठन', 'व्याकरण', 'लेखन'], `hin-${gradeNumber}-1`) },
        { id: `hin-${gradeNumber}-2`, name: 'पाठ 2', chapterNumber: 2, topics: createTopics(['कविता', 'शब्द भंडार', 'अभ्यास'], `hin-${gradeNumber}-2`) },
    ];
}

function createMathChapters(gradeNumber: number): Chapter[] {
    const chapters: Record<number, Chapter[]> = {
        6: [
            { id: 'math-6-1', name: 'Knowing Our Numbers', chapterNumber: 1, topics: createTopics(['Large Numbers', 'Indian System', 'International System'], 'math-6-1') },
            { id: 'math-6-2', name: 'Whole Numbers', chapterNumber: 2, topics: createTopics(['Properties', 'Operations', 'Number Line'], 'math-6-2') },
            { id: 'math-6-3', name: 'Playing with Numbers', chapterNumber: 3, topics: createTopics(['Factors', 'Multiples', 'Divisibility'], 'math-6-3') },
            { id: 'math-6-4', name: 'Basic Geometrical Ideas', chapterNumber: 4, topics: createTopics(['Points', 'Lines', 'Curves', 'Polygons'], 'math-6-4') },
        ],
        7: [
            { id: 'math-7-1', name: 'Integers', chapterNumber: 1, topics: createTopics(['Negative Numbers', 'Operations', 'Properties'], 'math-7-1') },
            { id: 'math-7-2', name: 'Fractions and Decimals', chapterNumber: 2, topics: createTopics(['Operations', 'Conversion', 'Word Problems'], 'math-7-2') },
            { id: 'math-7-3', name: 'Data Handling', chapterNumber: 3, topics: createTopics(['Mean', 'Median', 'Mode', 'Graphs'], 'math-7-3') },
            { id: 'math-7-4', name: 'Simple Equations', chapterNumber: 4, topics: createTopics(['Variables', 'Solving Equations', 'Applications'], 'math-7-4') },
        ],
        8: [
            { id: 'math-8-1', name: 'Rational Numbers', chapterNumber: 1, topics: createTopics(['Properties', 'Operations', 'Number Line'], 'math-8-1') },
            { id: 'math-8-2', name: 'Linear Equations in One Variable', chapterNumber: 2, topics: createTopics(['Solving Equations', 'Word Problems', 'Applications'], 'math-8-2') },
            { id: 'math-8-3', name: 'Understanding Quadrilaterals', chapterNumber: 3, topics: createTopics(['Types', 'Properties', 'Angle Sum'], 'math-8-3') },
            { id: 'math-8-4', name: 'Squares and Square Roots', chapterNumber: 4, topics: createTopics(['Perfect Squares', 'Finding Roots', 'Patterns'], 'math-8-4') },
        ],
        9: [
            { id: 'math-9-1', name: 'Number Systems', chapterNumber: 1, topics: createTopics(['Real Numbers', 'Irrational Numbers', 'Rationalization'], 'math-9-1') },
            { id: 'math-9-2', name: 'Polynomials', chapterNumber: 2, topics: createTopics(['Types', 'Zeroes', 'Factorization'], 'math-9-2') },
            { id: 'math-9-3', name: 'Coordinate Geometry', chapterNumber: 3, topics: createTopics(['Cartesian System', 'Plotting Points', 'Quadrants'], 'math-9-3') },
            { id: 'math-9-4', name: 'Linear Equations in Two Variables', chapterNumber: 4, topics: createTopics(['Graphical Method', 'Solutions', 'Applications'], 'math-9-4') },
            { id: 'math-9-5', name: 'Triangles', chapterNumber: 5, topics: createTopics(['Congruence', 'Criteria', 'Properties'], 'math-9-5') },
        ],
        10: [
            { id: 'math-10-1', name: 'Real Numbers', chapterNumber: 1, topics: createTopics(['Euclid\'s Division', 'Fundamental Theorem', 'Irrational Proofs'], 'math-10-1') },
            { id: 'math-10-2', name: 'Polynomials', chapterNumber: 2, topics: createTopics(['Division Algorithm', 'Zeroes Relationship', 'Polynomial Factorization'], 'math-10-2') },
            { id: 'math-10-3', name: 'Pair of Linear Equations', chapterNumber: 3, topics: createTopics(['Graphical Method', 'Algebraic Methods', 'Cross Multiplication'], 'math-10-3') },
            { id: 'math-10-4', name: 'Quadratic Equations', chapterNumber: 4, topics: createTopics(['Quadratic Factorization', 'Quadratic Formula', 'Nature of Roots'], 'math-10-4') },
            { id: 'math-10-5', name: 'Arithmetic Progressions', chapterNumber: 5, topics: createTopics(['AP nth Term', 'Sum of Terms', 'AP Applications'], 'math-10-5') },
        ],
        11: [
            { id: 'math-11-1', name: 'Sets', chapterNumber: 1, topics: createTopics(['Types of Sets', 'Operations', 'Venn Diagrams'], 'math-11-1') },
            { id: 'math-11-2', name: 'Relations and Functions', chapterNumber: 2, topics: createTopics(['Cartesian Product', 'Domain and Range', 'Types of Functions'], 'math-11-2') },
            { id: 'math-11-3', name: 'Trigonometric Functions', chapterNumber: 3, topics: createTopics(['Ratios', 'Identities', 'Graphs'], 'math-11-3') },
            { id: 'math-11-4', name: 'Complex Numbers', chapterNumber: 4, topics: createTopics(['Imaginary Unit', 'Operations', 'Argand Plane'], 'math-11-4') },
            { id: 'math-11-5', name: 'Linear Inequalities', chapterNumber: 5, topics: createTopics(['Solving', 'Graphing', 'Systems'], 'math-11-5') },
        ],
        12: [
            { id: 'math-12-1', name: 'Relations and Functions', chapterNumber: 1, topics: createTopics(['Types', 'Composition', 'Inverse'], 'math-12-1') },
            { id: 'math-12-2', name: 'Inverse Trigonometric Functions', chapterNumber: 2, topics: createTopics(['Principal Values', 'Properties', 'Graphs'], 'math-12-2') },
            { id: 'math-12-3', name: 'Matrices', chapterNumber: 3, topics: createTopics(['Types', 'Operations', 'Transpose'], 'math-12-3') },
            { id: 'math-12-4', name: 'Determinants', chapterNumber: 4, topics: createTopics(['Properties', 'Minors', 'Cofactors', 'Applications'], 'math-12-4') },
            { id: 'math-12-5', name: 'Continuity and Differentiability', chapterNumber: 5, topics: createTopics(['Limits', 'Derivatives', 'Chain Rule'], 'math-12-5') },
        ],
    };
    return chapters[gradeNumber] || [];
}

function createScienceChapters(gradeNumber: number): Chapter[] {
    const chapters: Record<number, Chapter[]> = {
        6: [
            { id: 'sci-6-1', name: 'Food: Where Does It Come From?', chapterNumber: 1, topics: createTopics(['Food Sources', 'Food Habits', 'Ingredients'], 'sci-6-1') },
            { id: 'sci-6-2', name: 'Components of Food', chapterNumber: 2, topics: createTopics(['Nutrients', 'Balanced Diet', 'Deficiency Diseases'], 'sci-6-2') },
            { id: 'sci-6-3', name: 'Fibre to Fabric', chapterNumber: 3, topics: createTopics(['Natural Fibres', 'Spinning', 'Weaving'], 'sci-6-3') },
            { id: 'sci-6-4', name: 'Sorting Materials into Groups', chapterNumber: 4, topics: createTopics(['Material Properties', 'Classification', 'Uses'], 'sci-6-4') },
        ],
        7: [
            { id: 'sci-7-1', name: 'Nutrition in Plants', chapterNumber: 1, topics: createTopics(['Photosynthesis', 'Modes of Nutrition', 'Parasites'], 'sci-7-1') },
            { id: 'sci-7-2', name: 'Nutrition in Animals', chapterNumber: 2, topics: createTopics(['Digestion', 'Digestive System', 'Ruminants'], 'sci-7-2') },
            { id: 'sci-7-3', name: 'Heat', chapterNumber: 3, topics: createTopics(['Temperature', 'Conduction', 'Convection', 'Radiation'], 'sci-7-3') },
            { id: 'sci-7-4', name: 'Acids, Bases and Salts', chapterNumber: 4, topics: createTopics(['Indicators', 'Neutralization', 'Applications'], 'sci-7-4') },
        ],
        8: [
            { id: 'sci-8-1', name: 'Crop Production and Management', chapterNumber: 1, topics: createTopics(['Agricultural Practices', 'Irrigation', 'Harvesting'], 'sci-8-1') },
            { id: 'sci-8-2', name: 'Microorganisms', chapterNumber: 2, topics: createTopics(['Types', 'Useful Microbes', 'Diseases'], 'sci-8-2') },
            { id: 'sci-8-3', name: 'Synthetic Fibres and Plastics', chapterNumber: 3, topics: createTopics(['Types of Plastics', '4R Principle', 'Environmental Impact'], 'sci-8-3') },
            { id: 'sci-8-4', name: 'Metals and Non-metals', chapterNumber: 4, topics: createTopics(['Properties of Metals', 'Reactivity', 'Uses'], 'sci-8-4') },
        ],
        9: [
            { id: 'sci-9-1', name: 'Matter in Our Surroundings', chapterNumber: 1, topics: createTopics(['States of Matter', 'Changes of State', 'Evaporation'], 'sci-9-1') },
            { id: 'sci-9-2', name: 'Is Matter Around Us Pure?', chapterNumber: 2, topics: createTopics(['Mixtures', 'Solutions', 'Separation Techniques'], 'sci-9-2') },
            { id: 'sci-9-3', name: 'Atoms and Molecules', chapterNumber: 3, topics: createTopics(['Atomic Theory', 'Molecules', 'Mole Concept'], 'sci-9-3') },
            { id: 'sci-9-4', name: 'Structure of the Atom', chapterNumber: 4, topics: createTopics(['Subatomic Particles', 'Atomic Models', 'Electronic Configuration'], 'sci-9-4') },
            { id: 'sci-9-5', name: 'The Fundamental Unit of Life', chapterNumber: 5, topics: createTopics(['Cell Structure', 'Organelles', 'Cell Division'], 'sci-9-5') },
        ],
        10: [
            { id: 'sci-10-1', name: 'Chemical Reactions and Equations', chapterNumber: 1, topics: createTopics(['Chemical Reaction Types', 'Balancing Equations', 'Reaction Effects'], 'sci-10-1') },
            { id: 'sci-10-2', name: 'Acids, Bases and Salts', chapterNumber: 2, topics: createTopics(['pH Scale', 'Acid Reactions', 'Salts Formation'], 'sci-10-2') },
            { id: 'sci-10-3', name: 'Metals and Non-metals', chapterNumber: 3, topics: createTopics(['Metal Occurrence', 'Metal Extraction', 'Metal Corrosion'], 'sci-10-3') },
            { id: 'sci-10-4', name: 'Carbon and Its Compounds', chapterNumber: 4, topics: createTopics(['Covalent Bonding', 'Hydrocarbons', 'Functional Groups'], 'sci-10-4') },
            { id: 'sci-10-5', name: 'Life Processes', chapterNumber: 5, topics: createTopics(['Human Nutrition', 'Human Respiration', 'Human Transportation', 'Human Excretion'], 'sci-10-5') },
        ],
    };
    return chapters[gradeNumber] || [];
}


function createSocialScienceChapters(gradeNumber: number): Chapter[] {
    const chapters: Record<number, Chapter[]> = {
        6: [
            { id: 'sst-6-1', name: 'What, Where, How and When?', chapterNumber: 1, topics: createTopics(['History Introduction', 'Sources', 'Timeline'], 'sst-6-1') },
            { id: 'sst-6-2', name: 'The Earth in the Solar System', chapterNumber: 2, topics: createTopics(['Planets', 'Earth', 'Moon'], 'sst-6-2') },
            { id: 'sst-6-3', name: 'Understanding Diversity', chapterNumber: 3, topics: createTopics(['Indian Diversity', 'Culture', 'Unity'], 'sst-6-3') },
        ],
        7: [
            { id: 'sst-7-1', name: 'Tracing Changes Through a Thousand Years', chapterNumber: 1, topics: createTopics(['Medieval India', 'Sources', 'Changes'], 'sst-7-1') },
            { id: 'sst-7-2', name: 'Environment', chapterNumber: 2, topics: createTopics(['Ecosystem', 'Natural Environment', 'Human Impact'], 'sst-7-2') },
            { id: 'sst-7-3', name: 'Equality in Indian Democracy', chapterNumber: 3, topics: createTopics(['Constitution', 'Rights', 'Equality'], 'sst-7-3') },
        ],
        8: [
            { id: 'sst-8-1', name: 'How, When and Where', chapterNumber: 1, topics: createTopics(['Modern History', 'British Rule', 'Sources'], 'sst-8-1') },
            { id: 'sst-8-2', name: 'Resources', chapterNumber: 2, topics: createTopics(['Resource Types', 'Conservation', 'Sustainable Development'], 'sst-8-2') },
            { id: 'sst-8-3', name: 'The Indian Constitution', chapterNumber: 3, topics: createTopics(['Preamble', 'Features', 'Fundamental Rights'], 'sst-8-3') },
        ],
        9: [
            { id: 'sst-9-1', name: 'The French Revolution', chapterNumber: 1, topics: createTopics(['Causes', 'Events', 'Impact'], 'sst-9-1') },
            { id: 'sst-9-2', name: 'India: Size and Location', chapterNumber: 2, topics: createTopics(['Location', 'Size', 'India and World', 'Neighbours'], 'sst-9-2') },
            { id: 'sst-9-3', name: 'What is Democracy? Why Democracy?', chapterNumber: 3, topics: createTopics(['Definition', 'Features', 'Why Democracy?'], 'sst-9-3') },
            { id: 'sst-9-4', name: 'Story of Village Palampur', chapterNumber: 4, topics: createTopics(['Farming', 'Non-farming', 'Capital'], 'sst-9-4') },
        ],
        10: [
            { id: 'sst-10-1', name: 'The Rise of Nationalism in Europe', chapterNumber: 1, topics: createTopics(['Nation States', 'Unification', 'Nationalism'], 'sst-10-1') },
            { id: 'sst-10-2', name: 'Resources and Development', chapterNumber: 2, topics: createTopics(['Soil Types', 'Resource Planning', 'Resource Conservation'], 'sst-10-2') },
            { id: 'sst-10-3', name: 'Power Sharing', chapterNumber: 3, topics: createTopics(['Power Sharing Forms', 'Belgium Model', 'Power Sharing in India'], 'sst-10-3') },
            { id: 'sst-10-4', name: 'Development', chapterNumber: 4, topics: createTopics(['National Income', 'HDI', 'Sustainability'], 'sst-10-4') },
        ],
    };
    return chapters[gradeNumber] || [];
}


function createComputerChapters(gradeNumber: number): Chapter[] {
    const chapters: Record<number, Chapter[]> = {
        6: [
            { id: 'comp-6-1', name: 'Introduction to Computers', chapterNumber: 1, topics: createTopics(['History', 'Components', 'Types'], 'comp-6-1') },
            { id: 'comp-6-2', name: 'Operating System', chapterNumber: 2, topics: createTopics(['Windows', 'Desktop', 'File Management'], 'comp-6-2') },
        ],
        7: [
            { id: 'comp-7-1', name: 'Word Processing', chapterNumber: 1, topics: createTopics(['MS Word', 'Formatting', 'Documents'], 'comp-7-1') },
            { id: 'comp-7-2', name: 'Spreadsheets', chapterNumber: 2, topics: createTopics(['MS Excel', 'Formulas', 'Charts'], 'comp-7-2') },
        ],
        8: [
            { id: 'comp-8-1', name: 'Internet Basics', chapterNumber: 1, topics: createTopics(['Browsing', 'Email', 'Safety'], 'comp-8-1') },
            { id: 'comp-8-2', name: 'Introduction to HTML', chapterNumber: 2, topics: createTopics(['Tags', 'Structure', 'Web Pages'], 'comp-8-2') },
        ],
    };
    return chapters[gradeNumber] || [];
}

function createITChapters(gradeNumber: number): Chapter[] {
    const chapters: Record<number, Chapter[]> = {
        9: [
            { id: 'it-9-1', name: 'Communication Skills', chapterNumber: 1, topics: createTopics(['Verbal', 'Written', 'Body Language'], 'it-9-1') },
            { id: 'it-9-2', name: 'Self-Management Skills', chapterNumber: 2, topics: createTopics(['Time Management', 'Stress', 'Goals'], 'it-9-2') },
            { id: 'it-9-3', name: 'ICT Skills', chapterNumber: 3, topics: createTopics(['Computer Basics', 'Internet', 'Digital Literacy'], 'it-9-3') },
        ],
        10: [
            { id: 'it-10-1', name: 'Digital Documentation', chapterNumber: 1, topics: createTopics(['Word Processing', 'Doc Formatting', 'Doc Templates'], 'it-10-1') },
            { id: 'it-10-2', name: 'Electronic Spreadsheet', chapterNumber: 2, topics: createTopics(['Spreadsheet Formulas', 'Spreadsheet Functions', 'Spreadsheet Analysis'], 'it-10-2') },
            { id: 'it-10-3', name: 'Database Management', chapterNumber: 3, topics: createTopics(['DBMS Concepts', 'DB Tables', 'SQL Queries'], 'it-10-3') },
        ],
    };
    return chapters[gradeNumber] || [];
}

function createPhysicsChapters(gradeNumber: number): Chapter[] {
    const chapters: Record<number, Chapter[]> = {
        11: [
            { id: 'phy-11-1', name: 'Physical World', chapterNumber: 1, topics: createTopics(['Nature of Physics', 'Scope', 'Scientific Method'], 'phy-11-1') },
            { id: 'phy-11-2', name: 'Units and Measurement', chapterNumber: 2, topics: createTopics(['SI Units', 'Errors', 'Significant Figures'], 'phy-11-2') },
            { id: 'phy-11-3', name: 'Motion in a Straight Line', chapterNumber: 3, topics: createTopics(['Kinematics', 'Equations', 'Graphs'], 'phy-11-3') },
            { id: 'phy-11-4', name: 'Motion in a Plane', chapterNumber: 4, topics: createTopics(['Vectors', 'Projectile Motion', 'Circular Motion'], 'phy-11-4') },
            { id: 'phy-11-5', name: 'Laws of Motion', chapterNumber: 5, topics: createTopics(['Newton\'s Laws', 'Friction', 'Dynamics'], 'phy-11-5') },
        ],
        12: [
            { id: 'phy-12-1', name: 'Electric Charges and Fields', chapterNumber: 1, topics: createTopics(['Coulomb\'s Law', 'Electric Field', 'Gauss Law'], 'phy-12-1') },
            { id: 'phy-12-2', name: 'Current Electricity', chapterNumber: 2, topics: createTopics(['Ohm\'s Law', 'Kirchhoff\'s Laws', 'Circuits'], 'phy-12-2') },
            { id: 'phy-12-3', name: 'Moving Charges and Magnetism', chapterNumber: 3, topics: createTopics(['Biot-Savart', 'Ampere\'s Law', 'Force'], 'phy-12-3') },
            { id: 'phy-12-4', name: 'Electromagnetic Induction', chapterNumber: 4, topics: createTopics(['Faraday\'s Law', 'Lenz\'s Law', 'AC Generator'], 'phy-12-4') },
        ],
    };
    return chapters[gradeNumber] || [];
}

function createChemistryChapters(gradeNumber: number): Chapter[] {
    const chapters: Record<number, Chapter[]> = {
        11: [
            { id: 'chem-11-1', name: 'Some Basic Concepts', chapterNumber: 1, topics: createTopics(['Atomic Mass', 'Mole Concept', 'Stoichiometry'], 'chem-11-1') },
            { id: 'chem-11-2', name: 'Structure of Atom', chapterNumber: 2, topics: createTopics(['Bohr Model', 'Quantum Numbers', 'Orbitals'], 'chem-11-2') },
            { id: 'chem-11-3', name: 'Chemical Bonding', chapterNumber: 3, topics: createTopics(['VSEPR Theory', 'Hybridization', 'Molecular Orbitals'], 'chem-11-3') },
            { id: 'chem-11-4', name: 'Thermodynamics', chapterNumber: 4, topics: createTopics(['Enthalpy', 'Entropy', 'Gibbs Energy'], 'chem-11-4') },
        ],
        12: [
            { id: 'chem-12-1', name: 'Solid State', chapterNumber: 1, topics: createTopics(['Crystal Lattice', 'Defects', 'Properties'], 'chem-12-1') },
            { id: 'chem-12-2', name: 'Solutions', chapterNumber: 2, topics: createTopics(['Concentration', 'Raoult\'s Law', 'Osmosis'], 'chem-12-2') },
            { id: 'chem-12-3', name: 'Electrochemistry', chapterNumber: 3, topics: createTopics(['Cells', 'Nernst Equation', 'Batteries'], 'chem-12-3') },
            { id: 'chem-12-4', name: 'Chemical Kinetics', chapterNumber: 4, topics: createTopics(['Rate Laws', 'Order', 'Mechanism'], 'chem-12-4') },
        ],
    };
    return chapters[gradeNumber] || [];
}

function createBiologyChapters(gradeNumber: number): Chapter[] {
    const chapters: Record<number, Chapter[]> = {
        11: [
            { id: 'bio-11-1', name: 'The Living World', chapterNumber: 1, topics: createTopics(['Characteristics', 'Taxonomy', 'Classification'], 'bio-11-1') },
            { id: 'bio-11-2', name: 'Biological Classification', chapterNumber: 2, topics: createTopics(['Five Kingdoms', 'Monera', 'Protista'], 'bio-11-2') },
            { id: 'bio-11-3', name: 'Plant Kingdom', chapterNumber: 3, topics: createTopics(['Algae', 'Bryophytes', 'Angiosperms'], 'bio-11-3') },
            { id: 'bio-11-4', name: 'Animal Kingdom', chapterNumber: 4, topics: createTopics(['Invertebrates', 'Vertebrates', 'Classification'], 'bio-11-4') },
            { id: 'bio-11-5', name: 'Morphology of Flowering Plants', chapterNumber: 5, topics: createTopics(['Morphology Flower', 'Root Systems'], 'bio-11-5') },
            { id: 'bio-11-6', name: 'Anatomy of Flowering Plants', chapterNumber: 6, topics: createTopics(['Plant Tissues'], 'bio-11-6') },
            { id: 'bio-11-7', name: 'Structural Organisation in Animals', chapterNumber: 7, topics: createTopics(['Animal Tissues'], 'bio-11-7') },
            { id: 'bio-11-8', name: 'Cell: The Unit of Life', chapterNumber: 8, topics: createTopics(['Prokaryotic Cell', 'Cell Membrane', 'Mitochondria', 'Chloroplast'], 'bio-11-8') },
        ],
        12: [
            { id: 'bio-12-1', name: 'Reproduction', chapterNumber: 1, topics: createTopics(['Sexual Reproduction', 'Fertilization', 'Embryogenesis'], 'bio-12-1') },
            { id: 'bio-12-2', name: 'Genetics', chapterNumber: 2, topics: createTopics(['Mendelism', 'DNA Structure', 'Inheritance'], 'bio-12-2') },
            { id: 'bio-12-3', name: 'Evolution', chapterNumber: 3, topics: createTopics(['Darwinism', 'Evidence of Evolution', 'Adaptation'], 'bio-12-3') },
            { id: 'bio-12-4', name: 'Biotechnology', chapterNumber: 4, topics: createTopics(['Cloning', 'PCR', 'Genetic Engineering'], 'bio-12-4') },
        ],
    };
    return chapters[gradeNumber] || [];
}

function createCSChapters(gradeNumber: number): Chapter[] {
    const chapters: Record<number, Chapter[]> = {
        11: [
            { id: 'cs-11-1', name: 'Computer Systems', chapterNumber: 1, topics: createTopics(['Hardware', 'Software', 'Operating Systems'], 'cs-11-1') },
            { id: 'cs-11-2', name: 'Python Basics', chapterNumber: 2, topics: createTopics(['Data Types', 'Operators', 'Conditionals', 'Loops'], 'cs-11-2') },
            { id: 'cs-11-3', name: 'Algorithms', chapterNumber: 3, topics: createTopics(['Flowcharts', 'Pseudocode', 'Sorting'], 'cs-11-3') },
            { id: 'cs-11-4', name: 'Control Structures', chapterNumber: 4, topics: createTopics(['Conditionals', 'Loops', 'Jump Statements'], 'cs-11-4') },
        ],
        12: [
            { id: 'cs-12-1', name: 'Functions', chapterNumber: 1, topics: createTopics(['Definition', 'Arguments', 'Recursion'], 'cs-12-1') },
            { id: 'cs-12-2', name: 'Data Structures', chapterNumber: 2, topics: createTopics(['Lists', 'Tuples', 'Dictionaries', 'Stacks'], 'cs-12-2') },
            { id: 'cs-12-3', name: 'File Handling', chapterNumber: 3, topics: createTopics(['Text Files', 'Binary Files', 'CSV'], 'cs-12-3') },
            { id: 'cs-12-4', name: 'SQL', chapterNumber: 4, topics: createTopics(['DDL', 'DML', 'Queries', 'Joins'], 'cs-12-4') },
        ],
    };
    return chapters[gradeNumber] || [];
}

const DEVANAGARI_TOPIC_SLUGS: Record<string, string> = {
    'कविता': 'kavita',
    'तुकबंदी': 'tukbandi',
    'अभ्यास': 'abhyas',
    'कहानी': 'kahani',
    'खेल': 'khel',
    'व्याकरण': 'vyakaran',
    'पठन': 'pathan',
    'लेखन': 'lekhan',
    'शब्द भंडार': 'shabd-bhandar',
};

function latinSlugForTopicName(name: string): string {
    const mapped = DEVANAGARI_TOPIC_SLUGS[name.trim()];
    if (mapped) return mapped;
    return name
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Helper function to create topics from names
function createTopics(topicNames: string[], prefix?: string): Topic[] {
    const usedIds = new Set<string>();
    return topicNames.map((name, index) => {
        let slug = latinSlugForTopicName(name);
        if (!slug) slug = `topic-${index + 1}`;

        let id = prefix ? `${prefix}-${slug}` : slug;
        if (usedIds.has(id)) {
            id = `${id}-${index + 1}`;
        }
        usedIds.add(id);

        return {
            id,
            name,
            difficulty: index === 0 ? 'beginner' : index === topicNames.length - 1 ? 'advanced' : 'intermediate',
            duration: `${20 + index * 5} min`,
            progress: 0,
        };
    });
}

// ============================================
// SCHOOL GRADES (CLASSES 1-12)
// ============================================

export const schoolGrades: SchoolGrade[] = [
    {
        id: 'grade-6',
        name: 'Grade 6',
        gradeNumber: 6,
        level: 'middle',
        image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&q=90&w=800&sat=100', // Colorful notebooks and pens
        ageGroup: '11-12',
        description: 'Foundation for middle school academics',
        color: '#2C8CFF',
        subjects: createMiddleSubjects(6)
    },
    {
        id: 'grade-7',
        name: 'Grade 7',
        gradeNumber: 7,
        level: 'middle',
        image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=90&w=800&sat=80', // Student writing/studying
        ageGroup: '12-13',
        description: 'Intermediate middle school concepts',
        color: '#2C8CFF',
        subjects: createMiddleSubjects(7)
    },
    {
        id: 'grade-8',
        name: 'Grade 8',
        gradeNumber: 8,
        level: 'middle',
        image: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=90&w=800', // Students in bright classroom
        ageGroup: '13-14',
        description: 'Advanced middle school and high school prep',
        color: '#2C8CFF',
        subjects: createMiddleSubjects(8)
    },
    {
        id: 'grade-9',
        name: 'Grade 9',
        gradeNumber: 9,
        level: 'secondary',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=90&w=800', // Students in a study environment
        ageGroup: '14-15',
        description: 'Beginning of secondary school journey',
        color: '#8A4FFF',
        subjects: createSecondarySubjects(9)
    },
    {
        id: 'grade-10',
        name: 'Grade 10',
        gradeNumber: 10,
        level: 'secondary',
        image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=90&w=800', // Students focusing in an academic setting
        ageGroup: '15-16',
        description: 'Preparation for board examinations',
        color: '#8A4FFF',
        subjects: createSecondarySubjects(10)
    },
    {
        id: 'grade-11-science',
        name: 'Grade 11 (Science)',
        gradeNumber: 11,
        level: 'senior-secondary',
        image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=90&w=800', // Science lab / chemistry
        ageGroup: '16-17',
        description: 'Advanced science and mathematics stream',
        color: '#FF9E2C',
        subjects: createSeniorScienceSubjects(11)
    },
    {
        id: 'grade-12-science',
        name: 'Grade 12 (Science)',
        gradeNumber: 12,
        level: 'senior-secondary',
        image: 'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?auto=format&fit=crop&q=90&w=800', // Students solving exam problem
        ageGroup: '17-18',
        description: 'Completion of senior secondary school',
        color: '#FF9E2C',
        subjects: createSeniorScienceSubjects(12)
    }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getGradeById = (gradeId: string): SchoolGrade | undefined => {
    return schoolGrades.find(g => g.id === gradeId);
};

export const getSubjectById = (gradeId: string, subjectId: string): SchoolSubject | undefined => {
    const grade = getGradeById(gradeId);
    return grade?.subjects.find(s => s.id === subjectId);
};

export const getChapterById = (gradeId: string, subjectId: string, chapterId: string): Chapter | undefined => {
    const subject = getSubjectById(gradeId, subjectId);
    return subject?.chapters.find(c => c.id === chapterId);
};

export const getGradesByLevel = (level: SchoolGrade['level']): SchoolGrade[] => {
    return schoolGrades.filter(g => g.level === level);
};

export const getTotalTopicsInGrade = (gradeId: string): number => {
    const grade = getGradeById(gradeId);
    if (!grade) return 0;
    return grade.subjects.reduce((total, subject) =>
        total + subject.chapters.reduce((chTotal, chapter) =>
            chTotal + chapter.topics.length, 0
        ), 0
    );
};

export const getTotalTopicsInSubject = (gradeId: string, subjectId: string): number => {
    const subject = getSubjectById(gradeId, subjectId);
    if (!subject) return 0;
    return subject.chapters.reduce((total, chapter) => total + chapter.topics.length, 0);
};
