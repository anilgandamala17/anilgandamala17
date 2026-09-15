import { TeachingStep } from '../../types';

export const newtonsLawsSteps: TeachingStep[] = [
    // ========================================
    // PART 1: INTRODUCTION (8 minutes)
    // ========================================
    {
        id: 'nl-1',
        stepNumber: 1,
        title: 'Welcome to Newton\'s Laws',
        content: 'Newton\'s three laws of motion, published in 1687, describe the relationship between forces and motion. These principles form the foundation of classical mechanics.',
        spokenContent: 'Welcome to our comprehensive study of Newton\'s Laws of Motion! Over the next 35 minutes, we will explore the three fundamental laws that govern how everything moves - from falling apples to orbiting planets. Isaac Newton published these laws in 1687 in his masterwork Principia Mathematica. They remain the foundation of physics and engineering today.',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Classical mechanics', 'Force', 'Motion', 'Principia Mathematica'],
        realWorldExamples: [
            'Newton reportedly was inspired by watching an apple fall from a tree',
            'These laws enabled us to send humans to the Moon',
            'Every car, plane, and building is designed using Newton\'s laws'
        ],
    },
    {
        id: 'nl-2',
        stepNumber: 2,
        title: 'Understanding Forces',
        content: 'A force is a push or pull that can change an object\'s motion. Forces are vectors with magnitude and direction. Common forces include gravity, friction, normal force, and tension.',
        spokenContent: 'Before diving into the laws, let us understand forces. A force is simply a push or pull on an object. Forces are vectors, meaning they have both magnitude - how strong - and direction - which way. Common forces include gravity pulling everything downward, friction opposing motion between surfaces, normal force pushing perpendicular to surfaces, and tension pulling along ropes or cables. Forces are measured in Newtons - appropriately named!',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Force', 'Vector', 'Magnitude', 'Direction', 'Newton unit'],
        subConcepts: ['Gravity', 'Friction', 'Normal force', 'Tension', 'Applied force'],
    },
    {
        id: 'nl-3',
        stepNumber: 3,
        title: 'Free Body Diagrams',
        content: 'A free body diagram shows all forces acting on an object represented as arrows. The arrow length indicates force magnitude; direction indicates force direction.',
        spokenContent: 'A critical skill in physics is drawing free body diagrams. You isolate an object and draw arrows representing every force acting on it. Arrow length shows force magnitude - longer arrows mean stronger forces. Arrow direction shows where the force points. A book on a table has gravity pulling down and normal force pushing up. If you push it, you add an applied force and friction appears to oppose motion.',
        visualType: 'diagram',
        durationSeconds: 160,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Free body diagram', 'Force arrows', 'Force isolation', 'Visual representation'],
    },

    // ========================================
    // PART 2: FIRST LAW - INERTIA (7 minutes)
    // ========================================
    {
        id: 'nl-4',
        stepNumber: 4,
        title: 'First Law: The Law of Inertia',
        content: 'An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by a net external force. This is the law of inertia.',
        spokenContent: 'Newton\'s First Law states: An object at rest remains at rest, and an object in motion continues moving at constant velocity, unless acted upon by a net external force. This property of matter to resist changes in motion is called inertia. A book on a table stays put because forces are balanced. A hockey puck slides across ice for a long time because friction is minimal. Objects don\'t naturally stop - something has to stop them.',
        visualType: 'animation',
        durationSeconds: 200,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Inertia', 'Rest', 'Constant velocity', 'Net force', 'Equilibrium'],
        realWorldExamples: [
            'Seatbelts prevent you from continuing forward when a car stops suddenly',
            'Tablecloth trick works because dishes have inertia',
            'Space probes continue moving without fuel because there\'s no friction in space'
        ],
    },
    {
        id: 'nl-5',
        stepNumber: 5,
        title: 'Inertia and Mass',
        content: 'Mass is the measure of inertia - how much an object resists acceleration. More massive objects have more inertia. Mass is not the same as weight (which depends on gravity).',
        spokenContent: 'Mass is the quantitative measure of inertia. The more massive an object, the more it resists changes in motion. A bowling ball is harder to start moving than a soccer ball - and harder to stop. This is because the bowling ball has more mass, hence more inertia. Important: mass is not weight. Mass is intrinsic to the object - it is the same on Earth, the Moon, or in space. Weight is the force of gravity on that mass and changes with location.',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Mass', 'Inertia', 'Weight', 'Mass vs weight', 'Kilograms'],
        practicalApplications: [
            'Astronauts have the same mass but no weight in orbit',
            'Truck brakes work harder than car brakes because of greater inertia'
        ],
    },

    // ========================================
    // PART 3: SECOND LAW - F=ma (8 minutes)
    // ========================================
    {
        id: 'nl-6',
        stepNumber: 6,
        title: 'Second Law: F = ma',
        content: 'The acceleration of an object equals the net force divided by its mass: a = F/m, or equivalently F = ma. Acceleration is directly proportional to force, inversely proportional to mass.',
        spokenContent: 'Newton\'s Second Law is the most important equation in mechanics: F equals m times a. The net force on an object equals its mass times its acceleration. Rearranging, acceleration equals force divided by mass. This tells us two things: more force means more acceleration, and more mass means less acceleration for the same force. Push a shopping cart - empty, it accelerates quickly. Load it with groceries, and the same push produces less acceleration.',
        visualType: 'diagram',
        durationSeconds: 220,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
        keyConcepts: ['F=ma', 'Net force', 'Acceleration', 'Direct proportionality', 'Inverse proportionality'],
    },
    {
        id: 'nl-7',
        stepNumber: 7,
        title: 'Calculating with F = ma',
        content: 'Using SI units: Force in Newtons (N), Mass in kilograms (kg), Acceleration in meters per second squared (m/s²). 1 N = 1 kg·m/s².',
        spokenContent: 'Let us work with numbers. In SI units, force is measured in Newtons, mass in kilograms, and acceleration in meters per second squared. One Newton is defined as the force needed to accelerate one kilogram at one meter per second squared. Example: A 1000-kilogram car accelerating at 3 meters per second squared requires F = 1000 times 3 = 3000 Newtons of force. If you know any two values, you can find the third.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Newton unit', 'SI units', 'Calculations', 'Problem solving'],
        practicalApplications: [
            'Engineers calculate required engine force based on desired acceleration',
            'Airbag deployment timing based on deceleration forces'
        ],
    },
    {
        id: 'nl-8',
        stepNumber: 8,
        title: 'Gravity and Weight',
        content: 'Weight is the gravitational force on an object: W = mg, where g ≈ 9.8 m/s² on Earth. Weight changes with location; mass stays constant.',
        spokenContent: 'Weight is a specific application of F equals ma. Near Earth\'s surface, gravity accelerates objects at about 9.8 meters per second squared - we call this g. So weight equals mass times g, or W = mg. A 70-kilogram person has a weight of 70 times 9.8 = 686 Newtons on Earth. On the Moon, where g is about 1.6, the same person weighs only 112 Newtons - but their mass remains 70 kilograms.',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Weight equation', 'Gravitational acceleration', 'g = 9.8 m/s²', 'W = mg'],
    },

    // ========================================
    // PART 4: THIRD LAW - ACTION-REACTION (6 minutes)
    // ========================================
    {
        id: 'nl-9',
        stepNumber: 9,
        title: 'Third Law: Action and Reaction',
        content: 'For every action force, there is an equal and opposite reaction force. These forces act on different objects and occur simultaneously.',
        spokenContent: 'Newton\'s Third Law states: For every action, there is an equal and opposite reaction. When you push on a wall, the wall pushes back on you with equal force. Crucially, these forces act on different objects. You push on the wall; the wall pushes on you. That is why you do not accelerate through the wall. These action-reaction pairs always occur simultaneously and are always equal in magnitude but opposite in direction.',
        visualType: 'animation',
        durationSeconds: 200,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Action force', 'Reaction force', 'Equal and opposite', 'Force pairs'],
        realWorldExamples: [
            'When you walk, you push backward on the ground; the ground pushes forward on you',
            'A gun recoils backward when a bullet is fired forward',
            'Rockets push exhaust downward; exhaust pushes the rocket upward'
        ],
    },
    {
        id: 'nl-10',
        stepNumber: 10,
        title: 'Why Objects Move: Unbalanced Forces',
        content: 'If action and reaction are equal, why do things move? Because the forces act on different objects. Net force on each object determines its acceleration.',
        spokenContent: 'A common confusion: if action equals reaction, why does anything move? The key is that these forces act on different objects. When you push a chair, you exert force on the chair; the chair exerts equal force on you. But the net force on the chair may be unbalanced - your push overcomes friction - so the chair accelerates. The net force on you might be balanced by your feet gripping the floor, so you don\'t move.',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Unbalanced forces', 'Net force', 'Different objects', 'Acceleration analysis'],
    },

    // ========================================
    // PART 5: APPLICATIONS & REVIEW (6 minutes)
    // ========================================
    {
        id: 'nl-11',
        stepNumber: 11,
        title: 'Real-World Applications',
        content: 'Newton\'s laws explain cars, rockets, sports, and more. Friction, air resistance, and gravity combine in complex ways that these laws help us analyze.',
        spokenContent: 'These laws explain our physical world. Cars: the engine creates force; F=ma determines acceleration; friction lets tires grip the road. Rockets: exhaust expelled downward pushes the rocket upward via the third law. Sports: kicking a soccer ball - your foot exerts force; ball accelerates; ball exerts equal force back on your foot. Skydiving: gravity accelerates you down; air resistance increases until forces balance at terminal velocity - then the first law says velocity stays constant.',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Automotive physics', 'Rocket propulsion', 'Sports physics', 'Terminal velocity'],
    },
    {
        id: 'nl-12',
        stepNumber: 12,
        title: 'Summary: The Three Laws',
        content: 'First Law: Inertia - objects resist changes in motion. Second Law: F=ma - force causes acceleration. Third Law: Action-reaction - forces come in pairs.',
        spokenContent: 'Let us summarize Newton\'s three laws. First Law: Objects at rest stay at rest; objects in motion stay in motion at constant velocity unless acted upon by net force. This is inertia. Second Law: F equals ma. Net force causes acceleration proportional to force and inversely proportional to mass. Third Law: For every action, there is an equal and opposite reaction. Forces always come in pairs acting on different objects.',
        visualType: 'text',
        durationSeconds: 160,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
    },
    {
        id: 'nl-13',
        stepNumber: 13,
        title: 'Comprehensive Quiz',
        content: 'Test your understanding of Newton\'s laws with problems and scenarios.',
        spokenContent: 'Excellent work mastering Newton\'s Laws! Now let us test your understanding with some physics problems.',
        visualType: 'quiz',
        durationSeconds: 240,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
    },
];

// Total estimated duration: approximately 35 minutes
// Coverage: End-to-end from forces to real-world applications
