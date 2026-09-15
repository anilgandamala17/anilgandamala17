import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizQuestion } from '../../types';
import { Check, X, HelpCircle, Award } from 'lucide-react';

interface VerificationQuizProps {
    quiz: QuizQuestion;
    onComplete: (correct: boolean) => void;
    onSkip: () => void;
    /** Use absolute when portaled into immersive fullscreen overlay */
    overlayMode?: 'fixed' | 'absolute';
}

export default function VerificationQuiz({ quiz, onComplete, onSkip, overlayMode = 'fixed' }: VerificationQuizProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleAnswer = (index: number) => {
        if (showResult) return;

        setSelectedAnswer(index);
        const correct = index === quiz.correctAnswer;
        setIsCorrect(correct);

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setShowResult(true);
            timeoutRef.current = null;
        }, 300);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleContinue = () => {
        onComplete(isCorrect);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`${overlayMode === 'absolute' ? 'absolute' : 'fixed'} inset-0 bg-black/50 flex items-center justify-center z-[90] p-4`}
            onClick={(e) => e.target === e.currentTarget && onSkip()}
        >
            <motion.div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" />
                        <h3 className="font-bold">Quick Check</h3>
                    </div>
                    <p className="text-sm text-purple-200 mt-1">
                        Let's verify your understanding
                    </p>
                </div>

                {/* Question */}
                <div className="p-6">
                    <p className="text-lg font-medium text-gray-800 dark:text-slate-100 mb-6">
                        {quiz.question}
                    </p>

                    {/* Options */}
                    {quiz.type === 'multiple_choice' && quiz.options && (
                        <div className="space-y-3">
                            {quiz.options.map((option, index) => {
                                const isSelected = selectedAnswer === index;
                                const isCorrectAnswer = index === quiz.correctAnswer;

                                let buttonClass = 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-slate-800';

                                if (showResult) {
                                    if (isCorrectAnswer) {
                                        buttonClass = 'border-green-400 bg-green-50 dark:bg-green-950/30 dark:border-green-800';
                                    } else if (isSelected && !isCorrectAnswer) {
                                        buttonClass = 'border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-800';
                                    }
                                } else if (isSelected) {
                                    buttonClass = 'border-purple-400 bg-purple-50 dark:bg-slate-800';
                                }

                                return (
                                    <motion.button
                                        key={index}
                                        onClick={() => handleAnswer(index)}
                                        disabled={showResult}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${buttonClass}`}
                                        whileHover={!showResult ? { scale: 1.01 } : {}}
                                        whileTap={!showResult ? { scale: 0.99 } : {}}
                                    >
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${showResult && isCorrectAnswer
                                                ? 'bg-green-500 text-white'
                                                : showResult && isSelected && !isCorrectAnswer
                                                    ? 'bg-red-500 text-white'
                                                    : isSelected
                                                        ? 'bg-purple-500 text-white'
                                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-200'
                                            }`}>
                                            {showResult && isCorrectAnswer ? (
                                                <Check className="w-4 h-4" />
                                            ) : showResult && isSelected && !isCorrectAnswer ? (
                                                <X className="w-4 h-4" />
                                            ) : (
                                                String.fromCharCode(65 + index)
                                            )}
                                        </span>
                                        <span className="flex-1 text-gray-700 dark:text-slate-200">{option}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}

                    {/* Result */}
                    <AnimatePresence>
                        {showResult && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6"
                            >
                                <div className={`p-4 rounded-xl ${isCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {isCorrect ? (
                                            <>
                                                <Award className="w-5 h-5 text-green-500" />
                                                <span className="font-bold text-green-700 dark:text-green-300">Correct!</span>
                                            </>
                                        ) : (
                                            <>
                                                <HelpCircle className="w-5 h-5 text-amber-500" />
                                                <span className="font-bold text-amber-700 dark:text-amber-300">Not quite!</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-slate-300">
                                        {quiz.explanation}
                                    </p>
                                </div>

                                <button
                                    onClick={handleContinue}
                                    className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                                >
                                    Continue Learning →
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Skip button */}
                {!showResult && (
                    <div className="px-6 pb-4">
                        <button
                            onClick={onSkip}
                            className="w-full py-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors text-sm"
                        >
                            Skip for now
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
