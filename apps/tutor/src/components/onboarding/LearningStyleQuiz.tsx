import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Ear, Eye, Hand, ArrowRight, LucideIcon } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import type { LearningStyle } from '../../types';

type StyleDimension = 'visual' | 'auditory' | 'kinesthetic';

interface Question {
    id: number;
    text: string;
    options: {
        text: string;
        type: StyleDimension;
        icon: LucideIcon;
    }[];
}

const questions: Question[] = [
    {
        id: 1,
        text: "When learning something new, I prefer to...",
        options: [
            { text: "See diagrams, charts, or videos.", type: 'visual', icon: Eye },
            { text: "Listen to an explanation or podcast.", type: 'auditory', icon: Ear },
            { text: "Try it out hands-on or experiment.", type: 'kinesthetic', icon: Hand },
        ]
    },
    {
        id: 2,
        text: "If I need to remember a list of items, I...",
        options: [
            { text: "Write it down or visualize the list.", type: 'visual', icon: Eye },
            { text: "Repeat the items out loud to myself.", type: 'auditory', icon: Ear },
            { text: "Associate items with physical objects or movements.", type: 'kinesthetic', icon: Hand },
        ]
    },
    {
        id: 3,
        text: "When following directions to a new place, I prefer...",
        options: [
            { text: "A map or GPS with visual cues.", type: 'visual', icon: Eye },
            { text: "Someone telling me the directions.", type: 'auditory', icon: Ear },
            { text: "Just going and figuring it out by landmarks.", type: 'kinesthetic', icon: Hand },
        ]
    },
    {
        id: 4,
        text: "In a classroom, I learn best when the teacher...",
        options: [
            { text: "Uses slides and writes on the board.", type: 'visual', icon: Eye },
            { text: "Explains things clearly through speech.", type: 'auditory', icon: Ear },
            { text: "Includes activities or lab work.", type: 'kinesthetic', icon: Hand },
        ]
    },
    {
        id: 5,
        text: "When troubleshooting a device, I...",
        options: [
            { text: "Read the manual or look at diagrams.", type: 'visual', icon: Eye },
            { text: "Ask someone for help or watch a video.", type: 'auditory', icon: Ear }, // Note: Video can be mixed, but often auditory explanation helps
            { text: "Start clicking buttons to see what happens.", type: 'kinesthetic', icon: Hand },
        ]
    }
];

interface Props {
    onComplete: () => void;
    /** Label for the button shown after the results, e.g. "Back to profile". */
    completeLabel?: string;
}

export default function LearningStyleQuiz({ onComplete, completeLabel = 'Go to Dashboard' }: Props) {
    const { updateLearningStyle } = useUserStore();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [scores, setScores] = useState({ visual: 0, auditory: 0, kinesthetic: 0 });
    const [showResults, setShowResults] = useState(false);

    const handleAnswer = (type: keyof typeof scores) => {
        const newScores = { ...scores, [type]: scores[type] + 1 };
        setScores(newScores);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            calculateAndSave(newScores);
        }
    };

    const calculateAndSave = (finalScores: typeof scores) => {
        const total = Object.values(finalScores).reduce((a, b) => a + b, 0);
        const style: Partial<LearningStyle> = {
            visual: Math.round((finalScores.visual / total) * 100),
            auditory: Math.round((finalScores.auditory / total) * 100),
            kinesthetic: Math.round((finalScores.kinesthetic / total) * 100),
            preferredPace: 'normal',
            interactivityLevel: 'medium'
        };
        updateLearningStyle(style);
        setShowResults(true);
    };

    if (showResults) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto text-center space-y-8"
            >
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 border border-transparent dark:border-slate-800">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                        <Brain className="w-8 h-8 text-purple-600 dark:text-purple-300" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Assessment Complete!</h2>
                    <p className="text-gray-600 dark:text-slate-400">Here is your learning profile breakdown:</p>

                    <div className="space-y-4">
                        {([
                            { label: 'Visual', icon: Eye, value: scores.visual, bar: 'bg-blue-500' },
                            { label: 'Auditory', icon: Ear, value: scores.auditory, bar: 'bg-green-500' },
                            { label: 'Kinesthetic', icon: Hand, value: scores.kinesthetic, bar: 'bg-orange-500' },
                        ] as const).map((row) => {
                            const percent = Math.round((row.value / questions.length) * 100);
                            return (
                                <div key={row.label} className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-slate-300">
                                        <span className="flex items-center gap-2"><row.icon className="w-4 h-4" /> {row.label}</span>
                                        <span>{percent}%</span>
                                    </div>
                                    <div
                                        className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden"
                                        role="progressbar"
                                        aria-label={`${row.label} learning preference`}
                                        aria-valuenow={percent}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                    >
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            className={`h-full ${row.bar}`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={onComplete}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                    >
                        {completeLabel}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        );
    }

    const question = questions[currentQuestion];

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
                <span className="text-sm font-bold text-purple-600 dark:text-purple-300 tracking-wider uppercase">Question {currentQuestion + 1} of {questions.length}</span>
                <div className="h-1 w-full bg-gray-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                    <motion.div
                        className="h-full bg-purple-600"
                        initial={{ width: `${(currentQuestion / questions.length) * 100}%` }}
                        animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={question.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-8"
                >
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-100 text-center leading-relaxed">
                        {question.text}
                    </h2>

                    <div className="grid gap-3 sm:gap-4">
                        {question.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(option.type)}
                                className="group p-4 bg-white dark:bg-slate-900 border-2 border-transparent dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl shadow-sm hover:shadow-md transition-all text-left flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                            >
                                <div className="w-12 h-12 shrink-0 bg-gray-50 dark:bg-slate-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-500/20 rounded-lg flex items-center justify-center transition-colors">
                                    <option.icon className="w-6 h-6 text-gray-600 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-300" />
                                </div>
                                <span className="font-medium text-gray-700 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white text-base sm:text-lg">
                                    {option.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
