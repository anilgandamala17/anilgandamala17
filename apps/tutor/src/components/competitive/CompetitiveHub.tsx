import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Calendar,
    BookOpen,
    Clock,
    Target,
    Menu,
    X,
    ChevronRight,
    BrainCircuit,
    Sparkles,
} from 'lucide-react';
import {
    FLOW_PARAMS,
    SECTION_PARAM,
    isLegacyPerformanceSection,
    normalizeSection,
} from '../../lib/competitiveRoute';
import { analytics } from '../../services/analyticsService';
import { useAuthStore } from '../../stores/authStore';
import { useCompetitiveStore } from '../../stores/competitiveStore';
import { studentRoutes } from '../../utils/routes';

const ExamFlow = lazy(() => import('./ExamFlow'));
const TopicQuizzesFlow = lazy(() => import('./TopicQuizzesFlow'));
const QuestionaryExplanationFlow = lazy(() => import('./QuestionaryExplanationFlow'));
const WeeklyTestsFlow = lazy(() => import('./WeeklyTestsFlow'));

function SectionFallback() {
    return (
        <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Loading…
        </div>
    );
}

const SIDEBAR_ITEMS = [
    { id: 'exams', label: 'Available Exams', icon: LayoutDashboard, hint: 'Catalog' },
    { id: 'weekly', label: 'Weekly Tests', icon: Calendar, hint: 'Rhythm' },
    { id: 'quizzes', label: 'Topic Quizzes', icon: BookOpen, hint: 'Drill' },
    { id: 'questionary', label: 'AI Explanation', icon: BrainCircuit, hint: 'Lecture' },
    { id: 'pyqs', label: 'Previous Years', icon: Clock, hint: 'PYQ' },
    { id: 'mock', label: 'Mock Tests', icon: Target, hint: 'Simulate' },
] as const;

/**
 * Competitive Mode hub — exam-taking workflows only.
 * Analytics overview lives on /student/dashboard?mode=competitive.
 */
export default function CompetitiveHub() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isExamActive, setIsExamActive] = useState(false);
    const userId = useAuthStore((s) => s.user?.id ?? null);
    const bindCompetitiveUser = useCompetitiveStore((s) => s.bindUser);

    useEffect(() => {
        bindCompetitiveUser(userId);
    }, [userId, bindCompetitiveUser]);

    const rawSection = searchParams.get(SECTION_PARAM);

    // Legacy Analytics deep-link → unified dashboard competitive mode
    useEffect(() => {
        if (!isLegacyPerformanceSection(rawSection)) return;
        navigate(`${studentRoutes.dashboard}?mode=competitive`, { replace: true });
    }, [rawSection, navigate]);

    const activeSection = normalizeSection(rawSection);

    useEffect(() => {
        if (isLegacyPerformanceSection(rawSection)) return;
        if (rawSection === activeSection) return;
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set(SECTION_PARAM, activeSection);
                return next;
            },
            { replace: true },
        );
    }, [activeSection, rawSection, setSearchParams]);

    useEffect(() => {
        analytics.competitiveModeOpened();
    }, []);

    useEffect(() => {
        if (isLegacyPerformanceSection(rawSection)) return;
        analytics.competitiveSectionViewed(activeSection);
    }, [activeSection, rawSection]);

    useEffect(() => {
        if (!isMobileMenuOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isMobileMenuOpen]);

    const selectSection = useCallback(
        (sectionId: (typeof SIDEBAR_ITEMS)[number]['id']) => {
            setIsMobileMenuOpen(false);
            if (sectionId === activeSection) return;
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set(SECTION_PARAM, sectionId);
                FLOW_PARAMS.forEach((param) => next.delete(param));
                return next;
            });
        },
        [activeSection, setSearchParams],
    );

    const active = SIDEBAR_ITEMS.find((i) => i.id === activeSection) || SIDEBAR_ITEMS[0];
    const ActiveIcon = active.icon;

    if (isLegacyPerformanceSection(rawSection)) {
        return (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
                Opening competitive dashboard…
            </div>
        );
    }

    const renderNav = (mobile: boolean) => (
        <nav className={mobile ? 'space-y-2' : 'space-y-1.5'}>
            {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => selectSection(item.id)}
                        className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3.5 transition-all ${
                            mobile ? 'min-h-[52px] py-3' : 'py-3.5'
                        } ${
                            isActive
                                ? 'bg-orange-50 font-bold text-orange-900 shadow-sm ring-1 ring-orange-200/80 dark:bg-orange-500/15 dark:text-orange-100 dark:ring-orange-500/30'
                                : mobile
                                  ? 'bg-white font-semibold text-slate-900 ring-1 ring-slate-200/90 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700'
                                  : 'font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/70'
                        }`}
                    >
                        {isActive && (
                            <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-orange-500" />
                        )}
                        <span
                            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                                isActive
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                                    : 'bg-slate-100 text-slate-700 group-hover:text-orange-600 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                        >
                            <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                        </span>
                        <span className="relative z-10 flex min-w-0 flex-1 flex-col text-left">
                            <span className={`truncate tracking-wide ${mobile ? 'text-[15px]' : 'text-sm'}`}>
                                {item.label}
                            </span>
                            {mobile && (
                                <span
                                    className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                                        isActive ? 'text-orange-600/80 dark:text-orange-300/80' : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    {item.hint}
                                </span>
                            )}
                        </span>
                        <ChevronRight
                            className={`relative z-10 h-4 w-4 shrink-0 ${
                                isActive ? 'text-orange-500 opacity-80' : 'text-slate-400 opacity-70'
                            }`}
                        />
                    </button>
                );
            })}
        </nav>
    );

    return (
        <div className="relative mx-auto flex h-full w-full max-w-[1440px] flex-col gap-4 overflow-hidden px-3 py-3 sm:gap-6 sm:px-5 sm:py-4 lg:flex-row lg:px-8 lg:py-6">
            <div
                className={`flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:hidden ${
                    isExamActive ? 'hidden' : ''
                }`}
            >
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/25">
                        <ActiveIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                            {active.hint}
                        </div>
                        <div className="truncate text-sm font-black text-slate-900 dark:text-white">
                            {active.label}
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen((v) => !v)}
                    className="rounded-xl bg-slate-900 p-2.5 text-white shadow-sm dark:bg-orange-500"
                    aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
                    aria-expanded={isMobileMenuOpen}
                >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && !isExamActive && (
                    <motion.button
                        type="button"
                        aria-label="Close navigation"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isMobileMenuOpen && !isExamActive && (
                    <motion.aside
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-x-3 top-[7.25rem] z-50 flex max-h-[min(78dvh,640px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/25 dark:border-slate-700 dark:bg-slate-950 lg:hidden"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-orange-500" />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-100">
                                    Competitive hub
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">{renderNav(true)}</div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <aside
                className={`
                relative z-auto hidden max-h-none w-[280px] shrink-0 flex-col overflow-hidden rounded-3xl
                border border-[var(--comp-border)] bg-[var(--comp-elevated)] shadow-[var(--comp-shadow)]
                lg:flex xl:w-[300px]
                ${isExamActive ? '!hidden' : ''}
            `}
            >
                <div className="relative flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
                    <div className="mb-5 flex items-center gap-2 px-2">
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            Competitive hub
                        </span>
                    </div>
                    {renderNav(false)}
                </div>
            </aside>

            <div
                className={`min-h-0 min-w-0 flex-1 custom-scrollbar ${
                    activeSection === 'questionary'
                        ? 'overflow-hidden pb-0'
                        : 'overflow-y-auto pb-8'
                }`}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.28 }}
                        className={`w-full max-w-none ${
                            activeSection === 'questionary' ? 'flex h-full min-h-0 flex-col' : 'min-h-full'
                        }`}
                    >
                        <Suspense fallback={<SectionFallback />}>
                            {activeSection === 'exams' && (
                                <ExamFlow onExamStateChange={setIsExamActive} isDashboardView flowType="standard" />
                            )}
                            {activeSection === 'pyqs' && (
                                <ExamFlow onExamStateChange={setIsExamActive} isDashboardView flowType="pyq" />
                            )}
                            {activeSection === 'mock' && (
                                <ExamFlow onExamStateChange={setIsExamActive} isDashboardView flowType="mock" />
                            )}
                            {activeSection === 'weekly' && (
                                <WeeklyTestsFlow onExamStateChange={setIsExamActive} />
                            )}
                            {activeSection === 'quizzes' && <TopicQuizzesFlow />}
                            {activeSection === 'questionary' && <QuestionaryExplanationFlow />}
                        </Suspense>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
