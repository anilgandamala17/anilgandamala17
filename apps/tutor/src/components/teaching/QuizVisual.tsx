import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, HelpCircle, Award, ArrowRight } from 'lucide-react';
import type { QuizQuestion } from '../../types';

interface QuizVisualProps {
    quiz: QuizQuestion;
    onComplete?: (correct: boolean) => void;
}

export default function QuizVisual({ quiz, onComplete }: QuizVisualProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const handleAnswer = (index: number) => {
        if (showResult) return;
        setSelectedAnswer(index);
        const correct = index === quiz.correctAnswer;
        setIsCorrect(correct);
        setShowResult(true);
        if (onComplete) onComplete(correct);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
            {/* Quiz Header */}
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                        <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Interactive Quiz</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Test your knowledge</p>
                    </div>
                </div>
                {showResult && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}
                    >
                        {isCorrect ? 'Great Job!' : 'Keep Learning'}
                    </motion.div>
                )}
            </div>

            {/* Question Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-8 leading-tight">
                    {quiz.question}
                </h4>

                <div className="grid grid-cols-1 gap-4">
                    {quiz.options?.map((option, index) => {
                        const isSelected = selectedAnswer === index;
                        const isCorrectAnswer = index === quiz.correctAnswer;

                        let stateStyles = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-600';
                        if (showResult) {
                            if (isCorrectAnswer) stateStyles = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
                            else if (isSelected) stateStyles = 'border-rose-500 bg-rose-50 dark:bg-rose-900/20';
                            else stateStyles = 'opacity-50 border-slate-200 dark:border-slate-800 grayscale-[0.5]';
                        } else if (isSelected) {
                            stateStyles = 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
                        }

                        return (
                            <motion.button
                                key={index}
                                onClick={() => handleAnswer(index)}
                                disabled={showResult}
                                className={`group relative w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4 ${stateStyles}`}
                                whileHover={!showResult ? { x: 8 } : {}}
                                whileTap={!showResult ? { scale: 0.98 } : {}}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors ${showResult && isCorrectAnswer ? 'bg-emerald-500 text-white' :
                                    showResult && isSelected && !isCorrectAnswer ? 'bg-rose-500 text-white' :
                                        isSelected ? 'bg-purple-500 text-white' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                    {showResult && isCorrectAnswer ? <Check className="w-5 h-5" /> :
                                        showResult && isSelected ? <X className="w-5 h-5" /> :
                                            String.fromCharCode(65 + index)}
                                </div>
                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-lg flex-1">
                                    {option}
                                </span>
                                {!showResult && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-5 h-5 text-purple-500" />
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {showResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="w-5 h-5 text-indigo-500" />
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">Explanation</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {quiz.explanation}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
