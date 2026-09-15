import { TeachingStep } from '../../types';

export const brainStructureSteps: TeachingStep[] = [
    {
        id: 'brain-1',
        stepNumber: 1,
        title: 'Major Brain Regions',
        content: 'The brain is divided into three main parts: the cerebrum (largest part, responsible for higher functions), cerebellum (coordination and balance), and brainstem (vital functions like breathing and heart rate).',
        spokenContent: 'The brain consists of three major regions. The cerebrum handles thinking, memory, and voluntary actions. The cerebellum coordinates movement and balance. The brainstem controls essential life functions.',
        visualType: '3d-model',
        durationSeconds: 120,
        completed: false,
    },
    {
        id: 'brain-2',
        stepNumber: 2,
        title: 'Cerebral Hemispheres',
        content: 'The cerebrum is divided into left and right hemispheres, connected by the corpus callosum. Each hemisphere has four lobes: frontal, parietal, temporal, and occipital, each with specialized functions.',
        spokenContent: 'The cerebrum splits into two hemispheres linked by the corpus callosum. Four lobes exist in each hemisphere: the frontal lobe for reasoning, parietal for sensation, temporal for hearing and memory, and occipital for vision.',
        visualType: 'diagram',
        durationSeconds: 150,
        completed: false,
    },
];
