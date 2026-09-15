import { TeachingStep } from '../../types';

export const ecgBasicsSteps: TeachingStep[] = [
    // ========================================
    // PART 1: INTRODUCTION (8 minutes)
    // ========================================
    {
        id: 'ecg-1',
        stepNumber: 1,
        title: 'Welcome to ECG Interpretation',
        content: 'An electrocardiogram (ECG or EKG) is a test that records the electrical activity of your heart. It shows how fast your heart is beating, whether the rhythm is steady, and the strength and timing of electrical signals.',
        spokenContent: 'Welcome to ECG Basics! Over the next 45 minutes, we will master electrocardiogram interpretation from fundamentals to clinical application. The ECG is one of the most important diagnostic tools in medicine, used millions of times daily worldwide. By the end, you will be able to read and interpret basic ECG patterns.',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Electrocardiogram', 'Electrical activity', 'Heart rhythm'],
        realWorldExamples: [
            'The first human ECG was recorded by Willem Einthoven in 1903',
            'Over 300 million ECGs are performed annually worldwide',
            'ECG can detect heart attacks within minutes of symptom onset'
        ],
    },
    {
        id: 'ecg-2',
        stepNumber: 2,
        title: 'The Cardiac Conduction System',
        content: 'The heart has a specialized electrical system: SA node (pacemaker) → AV node → Bundle of His → Bundle branches → Purkinje fibers. This system coordinates the heartbeat.',
        spokenContent: 'Before we read ECGs, let us understand where the electricity comes from. The SA node, located in the right atrium, is your natural pacemaker - it fires 60 to 100 times per minute. The signal travels to the AV node, which delays it slightly, then down the Bundle of His, splitting into right and left bundle branches, finally reaching the Purkinje fibers to activate the ventricles.',
        visualType: 'diagram',
        durationSeconds: 220,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
        keyConcepts: ['SA node', 'AV node', 'Bundle of His', 'Purkinje fibers', 'Pacemaker'],
        subConcepts: ['Automaticity', 'Conduction velocity', 'Refractory period'],
    },
    {
        id: 'ecg-3',
        stepNumber: 3,
        title: 'The 12-Lead ECG System',
        content: 'A standard ECG uses 12 leads: 6 limb leads (I, II, III, aVR, aVL, aVF) and 6 precordial leads (V1-V6). Each lead views the heart from a different angle.',
        spokenContent: 'A complete ECG uses 12 leads created from 10 electrodes. The limb leads - I, II, III, aVR, aVL, and aVF - view the heart in the frontal plane. The precordial leads V1 through V6 view the heart in the horizontal plane. Think of it as 12 different camera angles capturing the heart\'s electrical activity.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['12-lead ECG', 'Limb leads', 'Precordial leads', 'Einthoven\'s triangle'],
        practicalApplications: [
            'Lead II is commonly used for continuous monitoring',
            'V1-V2 best detect right ventricular issues',
            'Lateral leads (I, aVL, V5-V6) show left ventricular activity'
        ],
    },

    // ========================================
    // PART 2: ECG WAVEFORMS (12 minutes)
    // ========================================
    {
        id: 'ecg-4',
        stepNumber: 4,
        title: 'ECG Paper and Measurements',
        content: 'ECG paper is a grid: small squares are 1mm (0.04s horizontally, 0.1mV vertically). Large squares are 5mm. Standard speed is 25mm/second. Standard voltage is 10mm/mV.',
        spokenContent: 'Let us understand the ECG paper. Each small square represents 0.04 seconds horizontally and 0.1 millivolts vertically. Five small squares make one large square - that is 0.2 seconds and 0.5 millivolts. At standard speed of 25 millimeters per second, one second spans 25 small squares or 5 large squares. This standardization allows us to measure intervals precisely.',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['ECG paper', 'Small squares', 'Large squares', 'Time axis', 'Voltage axis'],
    },
    {
        id: 'ecg-5',
        stepNumber: 5,
        title: 'The P Wave - Atrial Depolarization',
        content: 'The P wave represents atrial depolarization. Normal duration: 0.08-0.10s. Normal amplitude: <2.5mm. Should be upright in leads I, II, aVF and inverted in aVR.',
        spokenContent: 'The P wave is the first wave of the cardiac cycle, representing atrial depolarization. A normal P wave is smooth, rounded, and less than 0.12 seconds wide. Its amplitude should not exceed 2.5 millimeters. If the P wave is tall and peaked, think right atrial enlargement. If it is wide and notched, think left atrial enlargement - we call this P mitrale.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['P wave', 'Atrial depolarization', 'P wave duration', 'P wave amplitude'],
        subConcepts: ['P mitrale', 'P pulmonale', 'Right atrial enlargement', 'Left atrial enlargement'],
        realWorldExamples: [
            'Absent P waves suggest atrial fibrillation',
            'Inverted P waves before QRS may indicate junctional rhythm'
        ],
    },
    {
        id: 'ecg-6',
        stepNumber: 6,
        title: 'The PR Interval',
        content: 'The PR interval is measured from the start of the P wave to the start of the QRS. Normal: 0.12-0.20s (3-5 small squares). Prolonged PR indicates first-degree heart block.',
        spokenContent: 'The PR interval represents the time for the electrical signal to travel from the atria to the ventricles. It measures from the beginning of the P wave to the beginning of the QRS complex. Normal is 0.12 to 0.20 seconds. A prolonged PR interval greater than 0.20 seconds indicates first-degree AV block - the signal is taking too long to pass through the AV node. A short PR less than 0.12 seconds may indicate pre-excitation, as in Wolff-Parkinson-White syndrome.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['PR interval', 'AV conduction time', 'First-degree AV block', 'Pre-excitation'],
        practicalApplications: [
            'First-degree AV block often requires no treatment',
            'Short PR with delta wave = WPW syndrome'
        ],
    },
    {
        id: 'ecg-7',
        stepNumber: 7,
        title: 'The QRS Complex - Ventricular Depolarization',
        content: 'The QRS complex represents ventricular depolarization. Normal duration: <0.12s. Q wave: first negative deflection. R wave: first positive. S wave: negative after R.',
        spokenContent: 'The QRS complex is the most prominent waveform, representing ventricular depolarization. Normal QRS duration is less than 0.12 seconds - that is 3 small squares. The Q wave is any initial negative deflection. The R wave is the first positive deflection. The S wave is any negative deflection following an R wave. A wide QRS greater than 0.12 seconds suggests bundle branch block or ventricular origin of the rhythm.',
        visualType: 'diagram',
        durationSeconds: 220,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
        keyConcepts: ['QRS complex', 'Ventricular depolarization', 'Q wave', 'R wave', 'S wave', 'QRS duration'],
        subConcepts: ['Bundle branch block', 'Pathological Q waves', 'R wave progression'],
    },
    {
        id: 'ecg-8',
        stepNumber: 8,
        title: 'The T Wave and QT Interval',
        content: 'The T wave represents ventricular repolarization. It should be concordant with QRS. QT interval measures from QRS start to T wave end. Prolonged QTc (>450ms) is dangerous.',
        spokenContent: 'The T wave represents ventricular repolarization - the ventricles resetting for the next beat. T waves should be upright in leads where the QRS is predominantly upright. Inverted T waves can indicate ischemia. The QT interval spans from the start of the QRS to the end of the T wave. We correct it for heart rate - called QTc. A prolonged QTc greater than 450 milliseconds increases the risk of dangerous arrhythmias like Torsades de Pointes.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['T wave', 'Ventricular repolarization', 'QT interval', 'QTc', 'Torsades de Pointes'],
        realWorldExamples: [
            'Many drugs can prolong the QT interval (antihistamines, antibiotics, antipsychotics)',
            'Cardiac ischemia often causes T wave inversion'
        ],
    },

    // ========================================
    // PART 3: HEART RATE & RHYTHM (10 minutes)
    // ========================================
    {
        id: 'ecg-9',
        stepNumber: 9,
        title: 'Calculating Heart Rate',
        content: 'Heart rate methods: 1) 300 divided by number of large squares between R waves, 2) Count R waves in 6 seconds and multiply by 10, 3) 1500 divided by small squares between R waves.',
        spokenContent: 'Let us learn to calculate heart rate from an ECG. For regular rhythms, use the 300 rule: count large squares between two R waves and divide 300 by that number. So 4 large squares gives you 75 beats per minute. For irregular rhythms, count R waves in a 6-second strip and multiply by 10. You can also divide 1500 by the number of small squares between R waves for more precision.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Heart rate calculation', '300 rule', 'R-R interval', 'Regular vs irregular rhythm'],
        practicalApplications: [
            'Normal rate: 60-100 bpm',
            'Bradycardia: <60 bpm',
            'Tachycardia: >100 bpm'
        ],
    },
    {
        id: 'ecg-10',
        stepNumber: 10,
        title: 'Normal Sinus Rhythm',
        content: 'Normal sinus rhythm criteria: Rate 60-100 bpm, regular R-R intervals, P wave before every QRS, QRS after every P wave, P wave upright in II.',
        spokenContent: 'Normal sinus rhythm is our baseline - the healthy heart rhythm. To diagnose it, check these criteria: Heart rate between 60 and 100 beats per minute. Regular R-R intervals. A P wave preceding every QRS complex. Every P wave followed by a QRS. P waves upright in lead II. If all criteria are met, you have normal sinus rhythm - the heart\'s electrical system is working perfectly.',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Normal sinus rhythm', 'NSR criteria', 'Regular rhythm', 'P-QRS relationship'],
    },
    {
        id: 'ecg-11',
        stepNumber: 11,
        title: 'Common Arrhythmias: Atrial Fibrillation',
        content: 'Atrial fibrillation shows: No discernible P waves, irregularly irregular R-R intervals, fibrillatory baseline. Rate may be fast, normal, or slow.',
        spokenContent: 'Atrial fibrillation is the most common arrhythmia, affecting millions worldwide. On ECG, look for three key features: absence of clear P waves, irregularly irregular R-R intervals - meaning completely random, and a chaotic or fibrillatory baseline. The atria are firing 400 to 600 times per minute, but the AV node only lets some impulses through. AFib increases stroke risk fivefold, which is why anticoagulation is often prescribed.',
        visualType: 'diagram',
        durationSeconds: 220,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 4,
        keyConcepts: ['Atrial fibrillation', 'Irregularly irregular', 'Absent P waves', 'Fibrillatory baseline'],
        realWorldExamples: [
            'AFib affects 1-2% of the general population',
            'Risk increases with age - 10% of people over 80 have AFib',
            'Anticoagulation reduces stroke risk by 60-70%'
        ],
    },
    {
        id: 'ecg-12',
        stepNumber: 12,
        title: 'Ventricular Tachycardia and Fibrillation',
        content: 'Ventricular tachycardia: wide QRS, rate >100, regular. Ventricular fibrillation: chaotic, no discernible QRS - life-threatening, requires immediate defibrillation.',
        spokenContent: 'Now for dangerous rhythms. Ventricular tachycardia shows wide QRS complexes, rate over 100, often 150 to 250, with a regular rhythm. It can be stable or unstable. Ventricular fibrillation is a medical emergency - the ECG shows chaotic electrical activity with no organized QRS complexes. The heart is just quivering, not pumping blood. Without immediate CPR and defibrillation, VFib is fatal within minutes.',
        visualType: 'diagram',
        durationSeconds: 220,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 4,
        keyConcepts: ['Ventricular tachycardia', 'Ventricular fibrillation', 'Wide complex tachycardia', 'Defibrillation'],
        practicalApplications: [
            'VFib is the most common cause of sudden cardiac death',
            'Early defibrillation improves survival by 7-10% per minute',
            'AEDs can detect and treat VFib automatically'
        ],
    },

    // ========================================
    // PART 4: CLINICAL PATTERNS (10 minutes)
    // ========================================
    {
        id: 'ecg-13',
        stepNumber: 13,
        title: 'Recognizing Myocardial Infarction',
        content: 'STEMI shows ST elevation in contiguous leads. NSTEMI shows ST depression or T wave inversion without ST elevation. Q waves appear hours later and may persist.',
        spokenContent: 'Recognizing a heart attack on ECG is life-saving. In ST-elevation MI, or STEMI, you see ST segment elevation in two or more contiguous leads. The degree of elevation often reflects infarct severity. In non-ST elevation MI, you may see ST depression or T wave inversion instead. Pathological Q waves develop hours later as tissue dies and may remain permanently. The leads affected tell you which artery is blocked - inferior leads suggest right coronary artery, anterior leads suggest LAD.',
        visualType: 'diagram',
        durationSeconds: 240,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 4,
        keyConcepts: ['STEMI', 'NSTEMI', 'ST elevation', 'ST depression', 'Pathological Q waves'],
        subConcepts: ['Contiguous leads', 'Reciprocal changes', 'Infarct localization'],
        realWorldExamples: [
            'Door-to-balloon time target for STEMI is 90 minutes',
            'ECG should be obtained within 10 minutes of chest pain presentation'
        ],
    },
    {
        id: 'ecg-14',
        stepNumber: 14,
        title: 'Bundle Branch Blocks',
        content: 'Right BBB: RSR\' pattern in V1 (rabbit ears), wide S in lateral leads. Left BBB: broad R in lateral leads, W pattern in V1. Both show QRS >0.12s.',
        spokenContent: 'Bundle branch blocks occur when conduction through one bundle branch is delayed. Both show widened QRS greater than 0.12 seconds. In right bundle branch block, look for an RSR prime pattern in V1 - we call this rabbit ears - and wide slurred S waves in lateral leads I and V6. In left bundle branch block, you see broad R waves in lateral leads and a W pattern in V1. Remember: William Marrow - W in V1 for LBBB, M in V1 for RBBB.',
        visualType: 'diagram',
        durationSeconds: 220,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 4,
        keyConcepts: ['Right bundle branch block', 'Left bundle branch block', 'Wide QRS', 'RSR prime'],
        practicalApplications: [
            'New LBBB in chest pain may indicate acute MI',
            'RBBB can be normal variant in young people'
        ],
    },
    {
        id: 'ecg-15',
        stepNumber: 15,
        title: 'Systematic ECG Interpretation',
        content: 'A systematic approach: 1) Rate, 2) Rhythm, 3) Axis, 4) Intervals (PR, QRS, QT), 5) P waves, 6) QRS morphology, 7) ST segments, 8) T waves.',
        spokenContent: 'Always use a systematic approach when reading ECGs. Start with rate - is it fast, slow, or normal? Then rhythm - is it regular? Check the axis - is conduction normal? Measure intervals: PR, QRS, and QT. Examine P waves: present, morphology, relationship to QRS? Look at QRS morphology: narrow or wide, any Q waves? Analyze ST segments: elevation or depression? Finally, check T waves: upright, inverted, peaked? This approach ensures you never miss important findings.',
        visualType: 'text',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Systematic approach', 'Rate', 'Rhythm', 'Axis', 'Intervals', 'ST-T changes'],
    },

    // ========================================
    // PART 5: REVIEW & ASSESSMENT (5 minutes)
    // ========================================
    {
        id: 'ecg-16',
        stepNumber: 16,
        title: 'Summary: Key Points',
        content: 'Review: Conduction system, 12-lead views, waveforms (P, QRS, T), intervals (PR, QRS, QT), rate calculation, normal sinus rhythm, common arrhythmias, MI recognition.',
        spokenContent: 'Let us review our key learning points. The cardiac conduction system creates the ECG waveforms. P waves show atrial activity, QRS shows ventricular depolarization, T waves show repolarization. Know your intervals: PR 0.12 to 0.20 seconds, QRS less than 0.12 seconds. Use the 300 rule for heart rate. Recognize normal sinus rhythm criteria. Identify AFib by irregularly irregular rhythm and absent P waves. Spot STEMIs by ST elevation. Use a systematic approach every time!',
        visualType: 'text',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
    },
    {
        id: 'ecg-17',
        stepNumber: 17,
        title: 'Comprehensive ECG Quiz',
        content: 'Test your understanding of ECG interpretation with clinical scenarios.',
        spokenContent: 'Excellent work completing this comprehensive ECG course! Now let us test your knowledge with clinical scenarios and rhythm strips.',
        visualType: 'quiz',
        durationSeconds: 300,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 5,
    },
];

// Total estimated duration: approximately 48 minutes
// Coverage: End-to-end from conduction system to clinical interpretation
