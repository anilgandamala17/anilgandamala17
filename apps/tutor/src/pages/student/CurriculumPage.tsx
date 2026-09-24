import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useCurriculumStore } from '@/features/curriculum/stores/curriculumStore';
import { useAuthStore } from '@/stores/authStore';
import { studentHomeForMode, studentRoutes } from '@/utils/routes';
import {
    GradeSelector,
    SubjectGrid,
    ChapterList,
    StreamSelection,
} from '@/features/curriculum/components';
import CurriculumSearch from '@/features/curriculum/components/CurriculumSearch';
import { getGradeById, getSubjectById } from '@/features/curriculum/data/schoolCurriculum';
import {
    STREAM_PARAM,
    getStreamSubjectIds,
    inferStreamFromSubject,
    isSeniorGrade,
    normalizeStream,
    streamDisplayName,
    type SeniorStreamId,
} from '@/features/curriculum/data/seniorStreams';

import Breadcrumbs from '@/components/common/Breadcrumbs';
import SignOutButton from '@/components/common/SignOutButton';
import AiraLogo from '@/components/brand/AiraLogo';
import { analytics } from '@/services/analyticsService';

type ViewState = 'grades' | 'streams' | 'subjects' | 'chapters';

export default function CurriculumPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const role = useAuthStore((s) => s.role);

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const gradeId = searchParams.get('grade');
    const subjectId = searchParams.get('subject');
    const streamRaw = searchParams.get(STREAM_PARAM);
    const stream = normalizeStream(streamRaw);

    const activeGrade = gradeId ? getGradeById(gradeId) : null;
    const activeSubject =
        activeGrade && subjectId ? getSubjectById(activeGrade.id, subjectId) : null;
    const senior = Boolean(activeGrade && isSeniorGrade(activeGrade.id));

    useEffect(() => {
        const store = useCurriculumStore.getState();
        if (gradeId) {
            if (!store.selectedGrade || store.selectedGrade.id !== gradeId) {
                store.setSelectedGrade(gradeId);
            }
            const updatedStore = useCurriculumStore.getState();
            if (subjectId) {
                if (!updatedStore.selectedSubject || updatedStore.selectedSubject.id !== subjectId) {
                    updatedStore.setSelectedSubject(subjectId);
                }
            } else if (updatedStore.selectedSubject) {
                updatedStore.setSelectedSubject(null);
            }
        } else if (store.selectedGrade || store.selectedSubject) {
            store.clearSelection();
        }
    }, [gradeId, subjectId]);

    useEffect(() => {
        analytics.curriculumView(gradeId || undefined);
        if (gradeId) analytics.classSelected(gradeId);
        if (gradeId && subjectId) analytics.subjectSelected(gradeId, subjectId);
    }, [gradeId, subjectId]);

    const navState = location.state as {
        gradeId?: string;
        subjectId?: string;
        stream?: string;
    } | null;
    const appliedRef = useRef<string | null>(null);
    useLayoutEffect(() => {
        if (!navState?.gradeId) return;
        const key = `${navState.gradeId}:${navState.stream ?? ''}:${navState.subjectId ?? ''}`;
        if (appliedRef.current === key) return;
        appliedRef.current = key;

        const params: Record<string, string> = { grade: navState.gradeId };
        const navStream = normalizeStream(navState.stream ?? null);
        if (navStream) params[STREAM_PARAM] = navStream;
        if (navState.subjectId != null) params.subject = navState.subjectId;
        setSearchParams(params);
    }, [navState?.gradeId, navState?.subjectId, navState?.stream, setSearchParams]);

    const getCurrentView = (): ViewState => {
        if (subjectId && activeGrade && (!senior || stream)) return 'chapters';
        if (gradeId && activeGrade && senior && stream) return 'subjects';
        if (gradeId && activeGrade && senior && !stream) return 'streams';
        if (gradeId && activeGrade && !senior) return 'subjects';
        return 'grades';
    };

    const currentView = getCurrentView();

    // Deep-link / stale param repair for senior grades + streams
    useEffect(() => {
        if (gradeId && !activeGrade) {
            setSearchParams({}, { replace: true });
            return;
        }
        if (!activeGrade) return;

        if (isSeniorGrade(activeGrade.id)) {
            // Unknown stream token → streams view
            if (streamRaw && !stream) {
                setSearchParams({ grade: activeGrade.id }, { replace: true });
                return;
            }

            // CS removed from senior — never keep it in the URL
            if (subjectId === 'computer-science') {
                setSearchParams({ grade: activeGrade.id }, { replace: true });
                return;
            }

            // Subject without stream: infer when unique, else streams
            if (subjectId && !stream) {
                const inferred = inferStreamFromSubject(subjectId);
                if (inferred) {
                    setSearchParams(
                        { grade: activeGrade.id, [STREAM_PARAM]: inferred, subject: subjectId },
                        { replace: true },
                    );
                } else {
                    setSearchParams({ grade: activeGrade.id }, { replace: true });
                }
                return;
            }

            // Subject not in selected stream
            if (subjectId && stream && activeSubject) {
                const inStream = getStreamSubjectIds(stream).includes(subjectId);
                if (!inStream) {
                    setSearchParams(
                        { grade: activeGrade.id, [STREAM_PARAM]: stream },
                        { replace: true },
                    );
                }
            } else if (subjectId && stream && !activeSubject) {
                setSearchParams(
                    { grade: activeGrade.id, [STREAM_PARAM]: stream },
                    { replace: true },
                );
            }
            return;
        }

        // Non-senior: strip stream if present; recover bad subject
        if (streamRaw) {
            const next: Record<string, string> = { grade: activeGrade.id };
            if (subjectId && activeSubject) next.subject = subjectId;
            setSearchParams(next, { replace: true });
            return;
        }
        if (subjectId && !activeSubject) {
            setSearchParams({ grade: activeGrade.id }, { replace: true });
        }
    }, [
        gradeId,
        subjectId,
        streamRaw,
        stream,
        activeGrade,
        activeSubject,
        setSearchParams,
    ]);

    const handleBack = () => {
        if (currentView === 'chapters') {
            const next: Record<string, string> = { grade: activeGrade?.id || '' };
            if (stream) next[STREAM_PARAM] = stream;
            setSearchParams(next);
        } else if (currentView === 'subjects') {
            if (senior) setSearchParams({ grade: activeGrade?.id || '' });
            else setSearchParams({});
        } else if (currentView === 'streams') {
            setSearchParams({});
        } else {
            navigate(studentRoutes.modeSelection);
        }
    };

    const getBreadcrumbs = () => {
        const items = [{ label: 'Curriculum', onClick: () => setSearchParams({}) }];

        if (activeGrade) {
            items.push({
                label: activeGrade.name,
                onClick: () => setSearchParams({ grade: activeGrade.id }),
            });
        }

        if (activeGrade && stream && (currentView === 'subjects' || currentView === 'chapters')) {
            items.push({
                label: streamDisplayName(stream),
                onClick: () =>
                    setSearchParams({ grade: activeGrade.id, [STREAM_PARAM]: stream }),
            });
        }

        if (activeSubject) {
            items.push({
                label: activeSubject.name,
                onClick: () => {},
            });
        }

        return items;
    };

    const breadcrumbs = getBreadcrumbs();

    const selectStream = (id: SeniorStreamId) => {
        if (!activeGrade) return;
        setSearchParams({ grade: activeGrade.id, [STREAM_PARAM]: id });
    };

    const selectSubject = (id: string) => {
        const next: Record<string, string> = { grade: gradeId || '', subject: id };
        if (stream) next[STREAM_PARAM] = stream;
        setSearchParams(next);
    };

    return (
        <div className="w-full">
            <div className="min-h-screen min-h-[100dvh] flex flex-col relative overflow-hidden transition-colors duration-500">
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-[var(--dash-bg,#eef2f7)] dark:bg-slate-950 transition-colors duration-700" />
                    <div className="absolute inset-0 opacity-[0.9] dark:opacity-[0.5] transition-opacity duration-700">
                        <div className="absolute top-[-22%] left-[-14%] h-[70%] w-[70%] bg-[radial-gradient(circle,rgba(14,165,233,0.18)_0%,transparent_68%)]" />
                        <div className="absolute bottom-[-26%] right-[-14%] h-[62%] w-[62%] bg-[radial-gradient(circle,rgba(13,148,136,0.16)_0%,transparent_70%)]" />
                        <div className="absolute top-[28%] right-[-18%] h-[48%] w-[48%] bg-[radial-gradient(circle,rgba(217,119,6,0.12)_0%,transparent_70%)]" />
                    </div>
                    <div
                        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px)',
                            backgroundSize: '48px 48px',
                            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
                        }}
                    />
                </div>

                <header className="sticky top-0 z-50 border-b border-[var(--dash-border,rgba(15,23,42,0.08))] bg-white/85 backdrop-blur-xl transition-colors duration-500 safe-top dark:border-slate-800/50 dark:bg-slate-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                    aria-label="Back"
                                >
                                    <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                </button>

                                <div className="flex items-center gap-3">
                                    <Link
                                        to={studentHomeForMode('curriculum')}
                                        className="px-1 transition-opacity hover:opacity-80"
                                    >
                                        <AiraLogo height={32} />
                                    </Link>
                                    <Breadcrumbs
                                        role={role}
                                        homePath={studentHomeForMode('curriculum')}
                                        items={breadcrumbs}
                                        className="hidden sm:flex"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <SignOutButton />
                                <button
                                    type="button"
                                    onClick={() => setIsSearchOpen(true)}
                                    className="group flex items-center gap-2 rounded-xl bg-slate-100 px-2.5 py-2 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                                    aria-label="Search curriculum"
                                >
                                    <Search className="h-4 w-4 text-slate-500 transition-colors group-hover:text-teal-700 dark:text-slate-400 dark:group-hover:text-teal-300" />
                                    <span className="hidden pr-1 text-sm font-medium text-slate-500 transition-colors group-hover:text-teal-700 sm:block dark:text-slate-400 dark:group-hover:text-teal-300">
                                        Search...
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <CurriculumSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

                <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
                    <AnimatePresence mode="wait">
                        {currentView === 'grades' && (
                            <motion.div
                                key="grades"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                <GradeSelector
                                    onGradeSelect={(id) => setSearchParams({ grade: id })}
                                />
                            </motion.div>
                        )}

                        {currentView === 'streams' && activeGrade && (
                            <motion.div
                                key="streams"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                <StreamSelection grade={activeGrade} onStreamSelect={selectStream} />
                            </motion.div>
                        )}

                        {currentView === 'subjects' && (
                            <motion.div
                                key={`subjects-${stream ?? 'all'}`}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                <SubjectGrid onSubjectSelect={selectSubject} />
                            </motion.div>
                        )}

                        {currentView === 'chapters' && (
                            <motion.div
                                key="chapters"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                <ChapterList />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
