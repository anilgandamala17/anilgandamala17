import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Search
} from 'lucide-react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useCurriculumStore } from '../stores/curriculumStore';
import { useAuthStore } from '../stores/authStore';
import { studentHomeForMode, studentRoutes } from '../utils/routes';
import { GradeSelector, SubjectGrid, ChapterList } from '../components/curriculum';
import CurriculumSearch from '../components/curriculum/CurriculumSearch';
import { getGradeById, getSubjectById } from '../data/schoolCurriculum';

import Breadcrumbs from '../components/common/Breadcrumbs';
import SignOutButton from '../components/common/SignOutButton';
import AiraLogo from '../components/brand/AiraLogo';
import { analytics } from '../services/analyticsService';

type ViewState = 'grades' | 'subjects' | 'chapters';

export default function CurriculumPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const role = useAuthStore((s) => s.role);

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const gradeId = searchParams.get('grade');
    const subjectId = searchParams.get('subject');

    // Synchronously resolve grade/subject strictly from URL search params (Single Source of Truth) to prevent single-frame flickering or missing breadcrumbs
    const activeGrade = gradeId ? getGradeById(gradeId) : null;
    const activeSubject = (activeGrade && subjectId) ? getSubjectById(activeGrade.id, subjectId) : null;

    // Sync URL search params -> Zustand store selection (Read state directly without subscribing to avoid double render loops)
    useEffect(() => {
        const store = useCurriculumStore.getState();
        if (gradeId) {
            if (!store.selectedGrade || store.selectedGrade.id !== gradeId) {
                store.setSelectedGrade(gradeId);
            }
            // Fetch updated state after potential grade selection change
            const updatedStore = useCurriculumStore.getState();
            if (subjectId) {
                if (!updatedStore.selectedSubject || updatedStore.selectedSubject.id !== subjectId) {
                    updatedStore.setSelectedSubject(subjectId);
                }
            } else {
                if (updatedStore.selectedSubject) {
                    updatedStore.setSelectedSubject(null);
                }
            }
        } else {
            if (store.selectedGrade || store.selectedSubject) {
                store.clearSelection();
            }
        }
    }, [gradeId, subjectId]);

    useEffect(() => {
        analytics.curriculumView(gradeId || undefined);
        if (gradeId) analytics.classSelected(gradeId);
        if (gradeId && subjectId) analytics.subjectSelected(gradeId, subjectId);
    }, [gradeId, subjectId]);

    // Apply navigation state from breadcrumb deep links (e.g. from Teaching page) — before paint so the correct section shows immediately
    const navState = location.state as { gradeId?: string; subjectId?: string } | null;
    const appliedRef = useRef<string | null>(null);
    useLayoutEffect(() => {
        if (!navState?.gradeId) return;
        const key = `${navState.gradeId}:${navState.subjectId ?? ''}`;
        if (appliedRef.current === key) return;
        appliedRef.current = key;
        
        const params: Record<string, string> = { grade: navState.gradeId };
        if (navState.subjectId != null) {
            params.subject = navState.subjectId;
        }
        setSearchParams(params);
    }, [navState?.gradeId, navState?.subjectId, setSearchParams]);

    // Determine current view based on URL search parameters (Single Source of Truth)
    const getCurrentView = (): ViewState => {
        if (subjectId && activeGrade) return 'chapters';
        if (gradeId && activeGrade) return 'subjects';
        return 'grades';
    };

    const currentView = getCurrentView();

    // Recover from stale/unknown ?grade= without leaving a blank subject grid.
    useEffect(() => {
        if (gradeId && !activeGrade) {
            setSearchParams({}, { replace: true });
        } else if (subjectId && activeGrade && !activeSubject) {
            setSearchParams({ grade: activeGrade.id }, { replace: true });
        }
    }, [gradeId, subjectId, activeGrade, activeSubject, setSearchParams]);

    const handleBack = () => {
        if (currentView === 'chapters') {
            setSearchParams({ grade: activeGrade?.id || '' });
        } else if (currentView === 'subjects') {
            setSearchParams({});
        } else {
            navigate(studentRoutes.modeSelection);
        }
    };

    // Breadcrumb items
    const getBreadcrumbs = () => {
        const items = [
            { label: 'Curriculum', onClick: () => setSearchParams({}) }
        ];

        if (activeGrade) {
            items.push({
                label: activeGrade.name,
                onClick: () => setSearchParams({ grade: activeGrade.id })
            });
        }

        if (activeSubject) {
            items.push({
                label: activeSubject.name,
                onClick: () => { }
            });
        }

        return items;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <div className="w-full">
            <div className="min-h-screen min-h-[100dvh] flex flex-col relative overflow-hidden transition-colors duration-500">
                {/* Enhanced Background elements */}
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

                {/* Header Area */}
                <header className="sticky top-0 z-50 border-b border-[var(--dash-border,rgba(15,23,42,0.08))] bg-white/85 backdrop-blur-xl transition-colors duration-500 safe-top dark:border-slate-800/50 dark:bg-slate-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            {/* Left side */}
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

                            {/* Right side */}
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

                {/* Search Bar Overlay Component */}
                <CurriculumSearch
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                />

                {/* Main content */}
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
                                <GradeSelector onGradeSelect={(id) => setSearchParams({ grade: id })} />
                            </motion.div>
                        )}

                        {currentView === 'subjects' && (
                            <motion.div
                                key="subjects"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                <SubjectGrid onSubjectSelect={(id) => setSearchParams({ grade: gradeId || '', subject: id })} />
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
