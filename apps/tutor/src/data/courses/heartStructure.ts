import { TeachingStep } from '../../types';

export const heartStructureSteps: TeachingStep[] = [
    // ========================================
    // PART 1: INTRODUCTION (8 minutes)
    // ========================================
    {
        id: 'hs-1',
        stepNumber: 1,
        title: 'Welcome to Cardiac Anatomy',
        content: 'The heart is a muscular organ about the size of your fist, located in the mediastinum. It pumps about 2,000 gallons of blood daily through a network of vessels.',
        spokenContent: 'Welcome to our comprehensive study of heart structure! Over the next 40 minutes, we will explore every aspect of cardiac anatomy. Your heart, roughly the size of your fist, beats about 100,000 times a day, pumping blood through 60,000 miles of blood vessels. Understanding its structure is fundamental to understanding cardiovascular medicine.',
        visualType: '3d-model',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Heart size', 'Mediastinum', 'Cardiac function'],
        realWorldExamples: [
            'Your heart pumps about 2,000 gallons (7,570 liters) of blood per day',
            'The heart beats over 2.5 billion times in an average lifetime',
            'A healthy heart pumps blood completely around the body in about 1 minute'
        ],
    },
    {
        id: 'hs-2',
        stepNumber: 2,
        title: 'Heart Position and Orientation',
        content: 'The heart sits in the middle mediastinum, between the lungs. The apex points left and inferiorly. Two-thirds of the heart is on the left side of the midline.',
        spokenContent: 'Where exactly is the heart? It sits in the middle mediastinum, a compartment in the chest between the lungs. The base is at the top where the great vessels attach. The apex points down and to the left, typically at the 5th intercostal space in the midclavicular line - this is where you can feel the heartbeat most strongly. About two-thirds of the heart is on the left side.',
        visualType: '3d-model',
        durationSeconds: 160,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Mediastinum', 'Base', 'Apex', 'Heart orientation'],
        practicalApplications: [
            'The apex beat helps diagnose heart enlargement',
            'Heart position changes with breathing and body position'
        ],
    },
    {
        id: 'hs-3',
        stepNumber: 3,
        title: 'The Pericardium',
        content: 'The heart is enclosed in the pericardium, a double-layered sac. The fibrous pericardium is tough outer layer. The serous pericardium has parietal and visceral layers with fluid between.',
        spokenContent: 'The heart is protected by the pericardium, a double-layered sac. The outer fibrous pericardium is tough and inelastic, anchoring the heart to surrounding structures. The inner serous pericardium has two layers: the parietal layer lines the fibrous pericardium, and the visceral layer, also called the epicardium, adheres to the heart itself. Between them is a small amount of pericardial fluid - about 25 milliliters - that reduces friction as the heart beats.',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Fibrous pericardium', 'Serous pericardium', 'Pericardial fluid', 'Epicardium'],
        realWorldExamples: [
            'Pericarditis causes chest pain that worsens with breathing',
            'Pericardial effusion is excess fluid that can compress the heart'
        ],
    },

    // ========================================
    // PART 2: HEART CHAMBERS (10 minutes)
    // ========================================
    {
        id: 'hs-4',
        stepNumber: 4,
        title: 'The Four Chambers',
        content: 'The heart has four chambers: right atrium, right ventricle, left atrium, and left ventricle. The atria receive blood; the ventricles pump blood out.',
        spokenContent: 'The heart has four chambers. The two upper chambers are the atria - they act as receiving chambers. The two lower chambers are the ventricles - they are the powerful pumping chambers. The right side handles deoxygenated blood going to the lungs. The left side handles oxygenated blood going to the body. The left ventricle has walls three times thicker than the right because it pumps against much higher resistance.',
        visualType: '3d-model',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Right atrium', 'Right ventricle', 'Left atrium', 'Left ventricle', 'Ventricular thickness'],
        subConcepts: ['Pulmonary circulation', 'Systemic circulation'],
    },
    {
        id: 'hs-5',
        stepNumber: 5,
        title: 'Right Atrium in Detail',
        content: 'The right atrium receives deoxygenated blood from the SVC, IVC, and coronary sinus. It contains the SA node, FO, crista terminalis, and pectinate muscles.',
        spokenContent: 'Let us examine the right atrium in detail. Blood enters from three sources: the superior vena cava bringing blood from the upper body, the inferior vena cava from the lower body, and the coronary sinus draining the heart itself. Important structures include the sinoatrial node - the heart\'s pacemaker - located where the SVC enters. The fossa ovalis is a remnant of the fetal foramen ovale. The crista terminalis is a smooth ridge, and pectinate muscles give the appendage a comb-like appearance.',
        visualType: '3d-model',
        durationSeconds: 200,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 3,
        keyConcepts: ['Superior vena cava', 'Inferior vena cava', 'Coronary sinus', 'SA node', 'Fossa ovalis'],
    },
    {
        id: 'hs-6',
        stepNumber: 6,
        title: 'Right Ventricle in Detail',
        content: 'The right ventricle pumps blood to the lungs via the pulmonary artery. It has trabeculae carneae, papillary muscles, and the moderator band containing part of the conduction system.',
        spokenContent: 'The right ventricle receives blood from the right atrium and pumps it to the lungs through the pulmonary valve. Its walls are thinner than the left because pulmonary pressure is much lower. Inside, you see trabeculae carneae - irregular muscle ridges. Papillary muscles attach to the tricuspid valve via chordae tendineae, preventing valve prolapse. The moderator band crosses from the septum to the anterior wall, carrying part of the right bundle branch.',
        visualType: '3d-model',
        durationSeconds: 180,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 3,
        keyConcepts: ['Trabeculae carneae', 'Papillary muscles', 'Chordae tendineae', 'Moderator band'],
    },
    {
        id: 'hs-7',
        stepNumber: 7,
        title: 'Left Atrium and Ventricle',
        content: 'The left atrium receives oxygenated blood from four pulmonary veins. The left ventricle, the thickest chamber, pumps blood through the aortic valve to the entire body.',
        spokenContent: 'The left atrium receives freshly oxygenated blood from four pulmonary veins - two from each lung. It is mostly smooth-walled except for the left atrial appendage. Blood passes through the mitral valve into the left ventricle. The left ventricle is the workhorse of the heart, with walls 10 to 15 millimeters thick. It generates systolic pressures of 120 millimeters of mercury to push blood through the entire systemic circulation via the aortic valve.',
        visualType: '3d-model',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Pulmonary veins', 'Mitral valve', 'Aortic valve', 'LV thickness', 'Systemic pressure'],
    },

    // ========================================
    // PART 3: HEART VALVES (8 minutes)
    // ========================================
    {
        id: 'hs-8',
        stepNumber: 8,
        title: 'Overview of Heart Valves',
        content: 'Four valves ensure unidirectional blood flow: two atrioventricular valves (tricuspid, mitral) and two semilunar valves (pulmonary, aortic). All valves open and close passively based on pressure.',
        spokenContent: 'The heart has four valves, all designed to ensure blood flows in one direction only. There are two types: atrioventricular valves between atria and ventricles, and semilunar valves between ventricles and arteries. They have no muscles - they open and close passively in response to pressure differences. When ventricles relax, AV valves open. When ventricles contract, AV valves snap shut, creating the first heart sound - lub. Then semilunar valves open for ejection, then close, creating the second heart sound - dub.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Unidirectional flow', 'AV valves', 'Semilunar valves', 'Heart sounds'],
        realWorldExamples: [
            'Lub-dub: S1 is AV valve closure, S2 is semilunar valve closure',
            'Heart murmurs are sounds of abnormal blood flow through valves'
        ],
    },
    {
        id: 'hs-9',
        stepNumber: 9,
        title: 'AV Valves: Tricuspid and Mitral',
        content: 'The tricuspid valve (right) has three cusps; the mitral/bicuspid valve (left) has two cusps. Both are anchored by chordae tendineae to papillary muscles to prevent prolapse.',
        spokenContent: 'The atrioventricular valves are truly remarkable structures. The tricuspid valve on the right has three cusps or leaflets. The mitral valve on the left has two cusps - hence also called the bicuspid valve. Both are attached via chordae tendineae - string-like cords - to papillary muscles on the ventricular walls. During ventricular systole, pressure would push the valves into the atria, but papillary muscles contract to hold them in place. Damage to chordae or papillary muscles causes regurgitation.',
        visualType: '3d-model',
        durationSeconds: 180,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Tricuspid valve', 'Mitral valve', 'Cusps', 'Chordae tendineae', 'Papillary muscles'],
    },
    {
        id: 'hs-10',
        stepNumber: 10,
        title: 'Semilunar Valves: Pulmonary and Aortic',
        content: 'The pulmonary and aortic valves each have three cusps shaped like half-moons. They have no chordae. Coronary arteries arise from the aortic sinuses just above the aortic valve.',
        spokenContent: 'The semilunar valves - pulmonary and aortic - guard the exits from the ventricles. Each has three pocket-shaped cusps that fill with blood and snap shut when pressure drops after ventricular contraction. They do not need chordae because the pocket shape naturally prevents backflow. Importantly, the coronary arteries originate from dilations called sinuses of Valsalva, located just above the aortic valve cusps. This is why coronary filling occurs during diastole, not systole.',
        visualType: '3d-model',
        durationSeconds: 180,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 3,
        keyConcepts: ['Pulmonary valve', 'Aortic valve', 'Semilunar cusps', 'Sinuses of Valsalva', 'Coronary ostia'],
    },

    // ========================================
    // PART 4: GREAT VESSELS & BLOOD SUPPLY (8 minutes)
    // ========================================
    {
        id: 'hs-11',
        stepNumber: 11,
        title: 'The Great Vessels',
        content: 'Great vessels include: Superior/Inferior Vena Cava (systemic venous return), Pulmonary Artery (to lungs), Pulmonary Veins (from lungs), and Aorta (to body).',
        spokenContent: 'The great vessels are the major highways connecting the heart to the circulation. The superior and inferior vena cavae return deoxygenated blood from the upper and lower body to the right atrium. The pulmonary trunk splits into left and right pulmonary arteries carrying deoxygenated blood to the lungs. Four pulmonary veins - the only veins carrying oxygenated blood - return to the left atrium. The aorta, the largest artery, distributes oxygenated blood throughout the body.',
        visualType: '3d-model',
        durationSeconds: 180,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Vena cava', 'Pulmonary arteries', 'Pulmonary veins', 'Aorta', 'Pulmonary trunk'],
    },
    {
        id: 'hs-12',
        stepNumber: 12,
        title: 'Coronary Arteries',
        content: 'The heart\'s own blood supply comes from left and right coronary arteries. LCA branches into LAD and circumflex. RCA supplies right heart and typically the SA node.',
        spokenContent: 'The heart needs its own blood supply - the coronary arteries. The left coronary artery quickly divides into two major branches: the left anterior descending, or LAD, supplying the anterior left ventricle and septum, and the circumflex artery supplying the lateral left heart. The right coronary artery supplies the right heart and usually the SA node. Blockage of these arteries causes heart attacks - the LAD is sometimes called the widow-maker due to its critical territory.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 3,
        keyConcepts: ['Left coronary artery', 'LAD', 'Circumflex', 'Right coronary artery', 'Widow-maker'],
        realWorldExamples: [
            'LAD blockage causes anterior MI (most dangerous)',
            'RCA blockage can cause heart block by affecting SA node',
            'Coronary artery disease is the leading cause of death worldwide'
        ],
    },
    {
        id: 'hs-13',
        stepNumber: 13,
        title: 'The Cardiac Cycle',
        content: 'The cardiac cycle has two phases: systole (contraction/ejection) and diastole (relaxation/filling). Atria contract before ventricles to complete ventricular filling.',
        spokenContent: 'Understanding the cardiac cycle brings everything together. Diastole is the relaxation phase when the heart fills with blood - AV valves are open, semilunar valves closed. Late in diastole, atria contract to top off the ventricles - the atrial kick provides about 20% of ventricular filling. Then systole begins - ventricles contract, AV valves snap shut creating S1, pressure builds until it exceeds arterial pressure, then semilunar valves open and blood is ejected. At the end, semilunar valves close creating S2.',
        visualType: 'animation',
        durationSeconds: 220,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
        keyConcepts: ['Systole', 'Diastole', 'Atrial kick', 'Isovolumetric contraction', 'Ejection'],
    },

    // ========================================
    // PART 5: REVIEW & ASSESSMENT (5 minutes)
    // ========================================
    {
        id: 'hs-14',
        stepNumber: 14,
        title: 'Summary: Key Points',
        content: 'Review: Four chambers with distinct functions, four valves for unidirectional flow, great vessels connecting to circulation, coronary arteries for heart blood supply, cardiac cycle timing.',
        spokenContent: 'Let us summarize our journey through cardiac anatomy. The heart has four chambers - two atria receiving blood, two ventricles pumping it out. Four valves ensure blood flows in one direction only. Great vessels connect the heart to pulmonary and systemic circulations. Coronary arteries provide the heart\'s own blood supply. The cardiac cycle alternates between systole and diastole, with perfect coordination of electrical and mechanical events.',
        visualType: 'text',
        durationSeconds: 160,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
    },
    {
        id: 'hs-15',
        stepNumber: 15,
        title: 'Comprehensive Quiz',
        content: 'Test your understanding of cardiac anatomy with clinical scenarios.',
        spokenContent: 'Excellent work completing this comprehensive course on heart structure! Now let us test your knowledge with some clinical scenarios.',
        visualType: 'quiz',
        durationSeconds: 240,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
    },
];

// Total estimated duration: approximately 42 minutes
// Coverage: End-to-end cardiac anatomy from pericardium to cardiac cycle
