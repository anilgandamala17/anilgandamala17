import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Flashcard } from '../../types';
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Clock, Brain, Award, Download } from 'lucide-react';
import { ExportService } from '../../services/exportService';

interface FlashcardViewerProps {
    flashcards: Flashcard[];
    topicName?: string;
    onPerformanceUpdate?: (id: string, performance: 'again' | 'hard' | 'good' | 'easy') => void;
}

export default function FlashcardViewer({ flashcards, topicName, onPerformanceUpdate }: FlashcardViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [stats, setStats] = useState({ easy: 0, good: 0, hard: 0, again: 0 });
    const [isSessionComplete, setIsSessionComplete] = useState(false);

    const currentCard = flashcards?.[currentIndex];

    const handleNext = () => {
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
            setShowHint(false);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsFlipped(false);
            setShowHint(false);
        }
    };

    const handlePerformance = (performance: 'again' | 'hard' | 'good' | 'easy') => {
        setStats(prev => ({ ...prev, [performance]: prev[performance] + 1 }));
        if (onPerformanceUpdate && currentCard) {
            onPerformanceUpdate(currentCard.id, performance);
        }

        if (currentIndex < flashcards.length - 1) {
            handleNext();
        } else {
            setIsSessionComplete(true);
        }
    };

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (isSessionComplete) return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                setIsFlipped(prev => !prev);
                break;
            case 'ArrowRight':
                handleNext();
                break;
            case 'ArrowLeft':
                handlePrevious();
                break;
            case 'h':
            case 'H':
                if (!isFlipped) setShowHint(prev => !prev);
                break;
            case '1':
                if (isFlipped) handlePerformance('again');
                break;
            case '2':
                if (isFlipped) handlePerformance('hard');
                break;
            case '3':
                if (isFlipped) handlePerformance('good');
                break;
            case '4':
                if (isFlipped) handlePerformance('easy');
                break;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFlipped, currentIndex, isSessionComplete]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!currentCard) {
        return (
            <div className="text-center text-gray-500 dark:text-slate-400 py-8">
                No flashcards available
            </div>
        );
    }

    const difficultyColors = {
        easy: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300',
        medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300',
        hard: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300',
    };

    if (isSessionComplete) {
        const total = stats.easy + stats.good + stats.hard + stats.again;
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-xl text-center"
            >
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Session Complete!</h3>
                <p className="text-gray-500 dark:text-slate-400 mb-6">You've reviewed {total} flashcards</p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">{stats.easy}</div>
                        <div className="text-xs text-blue-500 uppercase font-bold">Easy</div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                        <div className="text-xl font-bold text-green-600">{stats.good}</div>
                        <div className="text-xs text-green-500 uppercase font-bold">Good</div>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                        <div className="text-xl font-bold text-amber-600">{stats.hard}</div>
                        <div className="text-xs text-amber-500 uppercase font-bold">Hard</div>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <div className="text-xl font-bold text-red-600">{stats.again}</div>
                        <div className="text-xs text-red-500 uppercase font-bold">Again</div>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setCurrentIndex(0);
                        setIsSessionComplete(false);
                        setStats({ easy: 0, good: 0, hard: 0, again: 0 });
                    }}
                    className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all mx-auto shadow-lg shadow-purple-200 dark:shadow-none"
                >
                    <RotateCcw className="w-5 h-5" />
                    Reset Session
                </button>
            </motion.div>
        );
    }

    const handleDownloadPDF = async () => {
        await ExportService.exportFlashcardsToPDF(flashcards, topicName || 'Topic');
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
            {/* Export Header */}
            <div className="w-full flex justify-end mb-6">
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-purple-300 transition-all text-gray-700 dark:text-slate-200 shadow-sm"
                >
                    <Download className="w-4 h-4 text-purple-500" />
                    Download Flashcards PDF
                </button>
            </div>

            {/* Progress */}
            <div className="w-full flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 dark:text-slate-400">
                    Card {currentIndex + 1} of {flashcards.length}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[currentCard.difficulty]}`}>
                    {currentCard.difficulty}
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mb-4">
                <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                />
            </div>

            {/* Card */}
            <div className="relative w-full h-64 perspective-1000">
                <motion.div
                    className="absolute inset-0 cursor-pointer"
                    onClick={() => setIsFlipped(!isFlipped)}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Front */}
                    <div
                        className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-lg ${isFlipped ? 'backface-hidden' : ''}`}
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <Brain className="w-8 h-8 mb-4 opacity-50" />
                        <p className="text-center text-lg font-medium">{currentCard.question}</p>
                        <p className="text-sm text-purple-200 mt-4">Tap to reveal answer</p>
                    </div>

                    {/* Back */}
                    <div
                        className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl p-6 flex flex-col items-center justify-center shadow-lg border-2 border-purple-200 dark:border-slate-700"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <Check className="w-8 h-8 mb-4 text-green-500" />
                        <p className="text-center text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">{currentCard.answer}</p>
                        {currentCard.explanation && (
                            <p className="text-sm text-gray-500 dark:text-slate-400 text-center mt-2">{currentCard.explanation}</p>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Hint */}
            <AnimatePresence>
                {showHint && currentCard.hint && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    className="w-full mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg text-sm text-amber-700 dark:text-amber-200"
                    >
                        💡 <strong>Hint:</strong> {currentCard.hint}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-4">
                <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-slate-300" />
                </button>

                {currentCard.hint && !isFlipped && (
                    <button
                        onClick={() => setShowHint(!showHint)}
                        className="px-3 py-1.5 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                    >
                        {showHint ? 'Hide Hint' : 'Show Hint'}
                    </button>
                )}

                <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <RotateCcw className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                </button>

                <button
                    onClick={handleNext}
                    disabled={currentIndex === flashcards.length - 1}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30"
                >
                    <ChevronRight className="w-6 h-6 text-gray-600 dark:text-slate-300" />
                </button>
            </div>

            {/* Performance buttons (shown when flipped) */}
            <AnimatePresence>
                {isFlipped && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex gap-2 mt-4"
                    >
                        <button
                            onClick={() => handlePerformance('again')}
                            className="flex items-center gap-1 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Again
                        </button>
                        <button
                            onClick={() => handlePerformance('hard')}
                            className="flex items-center gap-1 px-3 py-2 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                        >
                            <Clock className="w-4 h-4" />
                            Hard
                        </button>
                        <button
                            onClick={() => handlePerformance('good')}
                            className="flex items-center gap-1 px-3 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            Good
                        </button>
                        <button
                            onClick={() => handlePerformance('easy')}
                            className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                            🎯 Easy
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
