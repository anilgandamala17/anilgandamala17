import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDoubtStore } from '@/stores/doubtStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useShallow } from 'zustand/react/shallow';
import { useTeachingStore } from '@/features/teaching/stores/teachingStore';
import type { Doubt } from '@/types';
import {
    HelpCircle, Send, Loader2, CheckCircle,
    Lightbulb, BookOpen, ChevronDown, ChevronUp,
    Paperclip, X, FileText, AlertCircle
} from 'lucide-react';
import { analytics } from '@/services/analyticsService';

interface DoubtPanelProps {
    sessionId: string;
    onDoubtRaised?: () => void;
}

export default function DoubtPanel({ sessionId, onDoubtRaised }: DoubtPanelProps) {
    const [question, setQuestion] = useState('');
    const [expanded, setExpanded] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { currentStep } = useTeachingStore(useShallow(state => ({ currentStep: state.currentStep })));
    const {
        activeDoubt,
        isResolvingDoubt,
        raiseDoubt,
        getSessionDoubts,
    } = useDoubtStore(useShallow(state => ({
        activeDoubt: state.activeDoubt,
        isResolvingDoubt: state.isResolvingDoubt,
        raiseDoubt: state.raiseDoubt,
        getSessionDoubts: state.getSessionDoubts
    })));

    const { fileName, status: docStatus, errorMessage, uploadDocument, clearDocument } = useDocumentStore(
        useShallow(state => ({
            fileName: state.fileName,
            status: state.status,
            errorMessage: state.errorMessage,
            uploadDocument: state.uploadDocument,
            clearDocument: state.clearDocument,
        }))
    );

    const sessionDoubts = getSessionDoubts(sessionId);
    const currentSession = useTeachingStore.getState().currentSession;
    const hasDocument = docStatus === 'ready' && fileName;
    const isProcessingDoc = docStatus === 'processing';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadDocument(file);
        }
        // Reset input so user can re-upload same file
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmitDoubt = () => {
        if (!question.trim() || isResolvingDoubt) return;

        const topicId = currentSession?.topicId;

        // When document is loaded, we don't require a teaching session context
        if (hasDocument) {
            analytics.aiQuestionAsked(topicId);
            raiseDoubt(question, sessionId, 0, 'Document Q&A');
            setQuestion('');
            onDoubtRaised?.();
            return;
        }

        if (!currentSession || !currentSession.teachingSteps || currentSession.teachingSteps.length === 0) return;

        const safeStep = Math.max(0, Math.min(currentStep, currentSession.teachingSteps.length - 1));
        const stepData = currentSession.teachingSteps[safeStep] || null;

        analytics.aiQuestionAsked(topicId);
        raiseDoubt(question, sessionId, safeStep + 1, stepData?.title || 'Unknown Step');
        setQuestion('');
        onDoubtRaised?.();
    };

    const placeholderText = hasDocument
        ? `Ask a question about "${fileName}"…`
        : "What don't you understand?";

    return (
        <div className="flex flex-col h-full">
            {/* Header with toggle */}
            <div
                className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-purple-500" />
                    <span className="font-bold text-gray-700 dark:text-slate-200">
                        {hasDocument ? 'Document Q&A' : 'Ask a Doubt'}
                    </span>
                    {sessionDoubts.length > 0 && (
                        <span className="w-5 h-5 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {sessionDoubts.length}
                        </span>
                    )}
                </div>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                )}
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {/* Document Status Banner */}
                        <AnimatePresence>
                            {(hasDocument || isProcessingDoc || docStatus === 'error') && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="mx-3 mt-3"
                                >
                                    {isProcessingDoc && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl text-blue-600 dark:text-blue-300 text-xs font-medium">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                            <span>Processing document…</span>
                                        </div>
                                    )}
                                    {hasDocument && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl">
                                            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex-1 truncate">{fileName}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); clearDocument(); }}
                                                className="p-0.5 rounded-full text-emerald-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                title="Remove document"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                    {docStatus === 'error' && errorMessage && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-red-600 dark:text-red-400 text-xs">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span className="flex-1">{errorMessage}</span>
                                            <button onClick={() => clearDocument()} className="text-red-400 hover:text-red-600">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Previous doubts */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {sessionDoubts.length === 0 ? (
                                <div className="text-center py-6 text-gray-400 dark:text-slate-500">
                                    {hasDocument ? (
                                        <>
                                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm font-medium">Document ready!</p>
                                            <p className="text-xs mt-1">Ask anything about the uploaded document.</p>
                                        </>
                                    ) : (
                                        <>
                                            <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No doubts yet</p>
                                            <p className="text-xs mt-1">Ask anything about the current topic, or upload a document 📎 to ask questions about it!</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                sessionDoubts.map((doubt) => (
                                    <DoubtCard key={doubt.id} doubt={doubt} isActive={activeDoubt?.id === doubt.id} />
                                ))
                            )}

                            {/* Loading state */}
                            {isResolvingDoubt && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-slate-800 rounded-xl text-purple-600 dark:text-purple-300"
                                >
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">
                                        {hasDocument ? 'AI is reading your document…' : 'AI is analyzing your doubt…'}
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        {/* Input area */}
                        <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.txt,.md,.docx,.csv,.json,.png,.jpg,.jpeg,.gif,.webp"
                                className="hidden"
                                onChange={handleFileChange}
                                id="doc-upload-input"
                            />

                            <div className="flex gap-2 items-center">
                                {/* Upload button */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessingDoc || isResolvingDoubt}
                                    title="Upload a document (PDF, TXT, DOCX)"
                                    className={`p-2.5 rounded-xl border transition-all ${
                                        hasDocument
                                            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
                                            : 'border-gray-200 dark:border-slate-700 text-gray-400 hover:text-purple-500 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800'
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                    <Paperclip className="w-4 h-4" />
                                </button>

                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitDoubt()}
                                    placeholder={placeholderText}
                                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all shadow-inner"
                                    disabled={isResolvingDoubt || isProcessingDoc}
                                />
                                <button
                                    onClick={handleSubmitDoubt}
                                    disabled={!question.trim() || isResolvingDoubt || isProcessingDoc}
                                    className="p-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:opacity-90 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-sm"
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 text-center">
                                {hasDocument
                                    ? '📎 Questions answered from your document only'
                                    : 'Upload a document 📎 or ask about the current topic'}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Individual doubt card component
function DoubtCard({ doubt, isActive }: { doubt: Doubt; isActive: boolean }) {
    const [showDetails, setShowDetails] = useState(isActive);

    const statusColors = {
        pending: 'bg-amber-100 text-amber-600',
        resolving: 'bg-blue-100 text-blue-600',
        resolved: 'bg-green-100 text-green-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border ${isActive ? 'border-purple-300 bg-purple-50 dark:bg-slate-800 dark:border-purple-700' : 'border-gray-200 bg-white dark:bg-slate-900/40 dark:border-slate-700'}`}
        >
            <div
                className="p-3 cursor-pointer"
                onClick={() => setShowDetails(!showDetails)}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{doubt.question}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            {doubt.context.stepTitle === 'Document Q&A'
                                ? '📄 Document Q&A'
                                : `Step ${doubt.context.stepNumber}: ${doubt.context.stepTitle}`}
                        </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[doubt.status]}`}>
                        {doubt.status}
                    </span>
                </div>
            </div>

            <AnimatePresence>
                {showDetails && doubt.resolution && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 dark:border-slate-700"
                    >
                        <div className="p-3 space-y-3">
                            {/* Explanation */}
                            <div className="flex gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">AI Answer</p>
                                    <p className="text-sm text-gray-700 dark:text-slate-200 whitespace-pre-line">
                                        {doubt.resolution.explanation}
                                    </p>
                                </div>
                            </div>

                            {/* Examples */}
                            {doubt.resolution.examples && doubt.resolution.examples.length > 0 && (
                                <div className="flex gap-2">
                                    <BookOpen className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Examples</p>
                                        <ul className="space-y-1">
                                            {doubt.resolution.examples.map((example, i) => (
                                                <li key={i} className="text-sm text-gray-600 dark:text-slate-300 flex items-start gap-1">
                                                    <span className="text-blue-400">•</span>
                                                    {example}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Confirmation */}
                            {doubt.resolution.understandingConfirmed && (
                                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600 dark:text-green-300">Understanding confirmed</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
