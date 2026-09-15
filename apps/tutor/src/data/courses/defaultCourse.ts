import { TeachingStep } from '../../types';

export const defaultSteps: TeachingStep[] = [
    {
        id: 'default-1',
        stepNumber: 1,
        title: 'Welcome to This Topic',
        content: 'This topic is being prepared with comprehensive content including visual explanations and voice narration. Our expert educators are developing detailed teaching materials to help you learn effectively.',
        spokenContent: 'Welcome! This topic is currently being developed with comprehensive teaching materials. Our team is creating detailed content with visual explanations and voice narration to enhance your learning experience.',
        visualType: 'diagram',
        durationSeconds: 90,
        completed: false,
    },
    {
        id: 'default-2',
        stepNumber: 2,
        title: 'Content Coming Soon',
        content: 'We are working hard to provide you with high-quality educational content. In the meantime, you can explore other available topics that have full course content ready.',
        spokenContent: 'We are preparing comprehensive content for this topic. While we work on it, feel free to explore other topics that are fully available with complete teaching materials.',
        visualType: 'text',
        durationSeconds: 80,
        completed: false,
    },
    {
        id: 'default-3',
        stepNumber: 3,
        title: 'Stay Tuned',
        content: 'Check back soon for updates. Our content library is continuously expanding with new topics and comprehensive teaching materials.',
        spokenContent: 'Thank you for your patience. We are continuously adding new content. Please check back soon for updates on this topic.',
        visualType: 'text',
        durationSeconds: 70,
        completed: false,
    }
];
