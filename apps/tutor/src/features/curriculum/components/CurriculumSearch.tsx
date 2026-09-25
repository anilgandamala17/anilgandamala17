import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, BookOpen, GraduationCap, ArrowRight, Layers } from 'lucide-react';
import { schoolGrades } from '@/features/curriculum/data/schoolCurriculum';
import {
    STREAM_PARAM,
    inferStreamFromSubject,
    isSeniorGrade,
    normalizeStream,
    type SeniorStreamId,
} from '@/features/curriculum/data/seniorStreams';
import { studentRoutes } from '@/utils/routes';
import type { SchoolGrade, SchoolSubject, Chapter, Topic } from '@/types';
import { analytics } from '@/services/analyticsService';

interface CurriculumSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

type SearchResultItem = {
    id: string;
    type: 'grade' | 'subject' | 'chapter' | 'topic';
    title: string;
    subtitle: string;
    gradeId: string;
    subjectId?: string;
    chapterId?: string;
    topicId?: string;
    /** Senior stream when known (inferred or from current URL context). */
    stream?: SeniorStreamId;
    icon: React.ReactNode;
    color: string;
};

function resolveSearchStream(
    gradeId: string,
    subjectId: string | undefined,
    urlStream: SeniorStreamId | null,
): SeniorStreamId | undefined {
    if (!isSeniorGrade(gradeId)) return undefined;
    const inferred = inferStreamFromSubject(subjectId);
    if (inferred) return inferred;
    return urlStream ?? undefined;
}

export default function CurriculumSearch({ isOpen, onClose }: CurriculumSearchProps) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const urlStream = normalizeStream(searchParams.get(STREAM_PARAM));

    useEffect(() => {
        if (isOpen) analytics.searchStarted('curriculum');
    }, [isOpen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 50);
        }
        return () => {
            if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
        };
    }, [isOpen]);

    // Handle Escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Expensive search operation memoized to prevent lag during typing
    const searchResults = useMemo(() => {
        if (!query.trim() || query.length < 2) return [];

        const lowerQuery = query.toLowerCase();
        const results: SearchResultItem[] = [];

        schoolGrades.forEach((grade: SchoolGrade) => {
            // 1. Check Grade Match
            if (grade.name.toLowerCase().includes(lowerQuery)) {
                results.push({
                    id: grade.id,
                    type: 'grade',
                    title: grade.name,
                    subtitle: grade.description,
                    gradeId: grade.id,
                    icon: <GraduationCap className="w-5 h-5 text-white" />,
                    color: grade.color
                });
            }

            grade.subjects.forEach((subject: SchoolSubject) => {
                const stream = resolveSearchStream(grade.id, subject.id, urlStream);

                // 2. Check Subject Match
                if (subject.name.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        id: `${grade.id}-${subject.id}`,
                        type: 'subject',
                        title: subject.name,
                        subtitle: `${grade.name} • ${subject.description}`,
                        gradeId: grade.id,
                        subjectId: subject.id,
                        stream,
                        icon: <BookOpen className="w-5 h-5 text-white" />,
                        color: subject.color
                    });
                }

                subject.chapters.forEach((chapter: Chapter) => {
                    // 3. Check Chapter Match
                    if (chapter.name.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            id: `${grade.id}-${chapter.id}`,
                            type: 'chapter',
                            title: `Ch ${chapter.chapterNumber}: ${chapter.name}`,
                            subtitle: `${grade.name} • ${subject.name}`,
                            gradeId: grade.id,
                            subjectId: subject.id,
                            chapterId: chapter.id,
                            stream,
                            icon: <Layers className="w-5 h-5 text-white" />,
                            color: subject.color
                        });
                    }

                    chapter.topics.forEach((topic: Topic) => {
                        // 4. Check Topic Match
                        if (topic.name.toLowerCase().includes(lowerQuery)) {
                            results.push({
                                id: `${grade.id}-${topic.id}`,
                                type: 'topic',
                                title: topic.name,
                                subtitle: `${grade.name} • ${subject.name} • Ch ${chapter.chapterNumber}`,
                                gradeId: grade.id,
                                subjectId: subject.id,
                                chapterId: chapter.id,
                                topicId: topic.id,
                                stream,
                                icon: <Search className="w-5 h-5 text-white" />,
                                color: subject.color
                            });
                        }
                    });
                });
            });
        });

        // Limit to top 20 results for performance
        return results.slice(0, 20);
    }, [query, urlStream]);

    useEffect(() => {
        if (!isOpen || query.trim().length < 2) return;
        if (searchResults.length === 0) {
            analytics.searchNoResults('curriculum');
        } else {
            analytics.searchCompleted('curriculum', searchResults.length);
        }
    }, [isOpen, query, searchResults]);

    // Handle Selection Routing — always preserve senior stream when known
    const handleSelectResult = (result: SearchResultItem) => {
        const stream =
            result.stream ??
            resolveSearchStream(result.gradeId, result.subjectId, urlStream);

        if (result.type === 'topic' && result.topicId) {
            analytics.topicSelected({
                topicId: result.topicId,
                classId: result.gradeId,
                subjectId: result.subjectId,
            });
            const params = new URLSearchParams({ grade: result.gradeId });
            if (result.subjectId) params.set('subject', result.subjectId);
            if (stream) params.set(STREAM_PARAM, stream);
            navigate(`${studentRoutes.learn(result.topicId)}?${params.toString()}`);
            onClose();
            setQuery('');
            return;
        }

        const params: Record<string, string> = { grade: result.gradeId };
        if (result.subjectId) {
            params.subject = result.subjectId;
        }
        if (stream) {
            params[STREAM_PARAM] = stream;
        }
        setSearchParams(params);
        onClose();
        setQuery('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm"
                    />

                    {/* Search Panel Overlay */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed inset-x-4 top-20 md:inset-x-auto md:w-[600px] md:left-1/2 md:-translate-x-1/2 z-[110] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col"
                        style={{ maxHeight: 'calc(100vh - 120px)' }}
                    >
                        {/* Search Input Header */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                            <Search className="w-6 h-6 text-purple-500 shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search grades, subjects, chapters, or topics..."
                                className="flex-1 bg-transparent border-none text-[17px] font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-0 p-0 outline-none"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-3 py-1.5 ml-2 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
                            >
                                ESC
                            </button>
                        </div>

                        {/* Search Results Area */}
                        <div className="flex-1 overflow-y-auto min-h-[300px] custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
                            {query.length < 2 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                                    <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Type at least 2 characters to search the entire curriculum data.</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Find algebra, history, cells, or anything else.</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <p
                                        className="font-semibold text-lg"
                                        style={{ color: 'var(--dash-text, #0f172a)' }}
                                    >
                                        No topics found
                                    </p>
                                    <p
                                        className="mt-2 text-sm max-w-sm"
                                        style={{ color: 'var(--dash-text-2, #475569)' }}
                                    >
                                        No results for &ldquo;{query}&rdquo;. Try another subject,
                                        chapter, or search term.
                                    </p>
                                    <button
                                        type="button"
                                        className="mt-4 min-h-[44px] rounded-[var(--dash-radius-sm)] px-4 text-sm font-bold text-white"
                                        style={{ background: 'var(--dash-brand, #1d4ed8)' }}
                                        onClick={() => setQuery('')}
                                    >
                                        Clear search
                                    </button>
                                </div>
                            ) : (
                                <div className="p-3">
                                    {searchResults.map((result, index) => (
                                        <button
                                            key={`${result.type}-${result.id}-${index}`}
                                            onClick={() => handleSelectResult(result)}
                                            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all text-left group border border-transparent hover:border-gray-200 dark:hover:border-gray-700 mb-1"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                                style={{ backgroundColor: result.color }}
                                            >
                                                {result.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">{result.title}</h4>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase tracking-widest shrink-0">
                                                        {result.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{result.subtitle}</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transform -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
