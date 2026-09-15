import { TeachingStep } from '../../types';

export const valvesSteps: TeachingStep[] = [
    {
        id: 'valves-1',
        stepNumber: 1,
        title: 'Heart Valves Overview',
        content: 'The heart has four valves that ensure one-way blood flow: the Tricuspid, Mitral, Pulmonary, and Aortic valves. Each valve opens and closes at specific times during the cardiac cycle to prevent backflow.',
        spokenContent: 'The heart contains four crucial valves that act as one-way doors. The Tricuspid and Mitral valves are atrioventricular valves, while the Pulmonary and Aortic valves are semilunar valves. They work together to ensure blood flows in the correct direction.',
        visualType: '3d-model',
        durationSeconds: 120,
        completed: false,
    },
    {
        id: 'valves-2',
        stepNumber: 2,
        title: 'Valve Function and Structure',
        content: 'Valves consist of flaps (leaflets or cusps) that open when pressure is higher on one side and close to prevent backflow. The AV valves have chordae tendineae and papillary muscles to prevent prolapse.',
        spokenContent: 'Each valve has specialized structures. The atrioventricular valves have leaflets attached to chordae tendineae, which connect to papillary muscles. This prevents the valves from inverting during ventricular contraction.',
        visualType: 'diagram',
        durationSeconds: 150,
        completed: false,
    },
];
