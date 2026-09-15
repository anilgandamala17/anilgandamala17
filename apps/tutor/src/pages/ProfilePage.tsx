import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    ArrowLeft, Mail, Globe, Calendar, Award, Target,
    Clock, Flame, BookOpen, Star, TrendingUp, Settings,
    Users, Book, Activity, Shield, AlertCircle, FileText,
    Pencil, Lock, Check, X, Loader2, Info, BadgeCheck,
    type LucideIcon
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { useAnalyticsStore, longestStreakFor, scoredSessions } from '../stores/analyticsStore';
import { useSettingsStore } from '../stores/settingsStore';
import { getRoutesForRole, studentRoutes } from '../utils/routes';
import SignOutButton from '../components/common/SignOutButton';
import { toast } from '../stores/toastStore';
import PageTransition from '../components/common/PageTransition';
import { UserAvatar, displayNameForUser } from '../components/common/UserAvatar';
import AiraLogo from '../components/brand/AiraLogo';
import LearningStyleQuiz from '../components/onboarding/LearningStyleQuiz';
import type { AppRole } from '../types';
import { analytics } from '../services/analyticsService';

const ROLE_LABEL: Record<AppRole, string> = {
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Administrator',
};

const AUTH_METHOD_LABEL: Record<string, string> = {
    google: 'Google',
    apple: 'Apple',
    email: 'email',
    guest: 'a guest pass',
};

interface StatCard {
    icon: LucideIcon;
    label: string;
    value: string;
    unit?: string;
    caption: string;
    tile: string;
    color: string;
    /** Illustrative figure that is not backed by live records yet. */
    sample?: boolean;
}

function plural(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** Firebase hands us `metadata.creationTime`, which is not always parseable. */
function formatDate(value?: string): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Browsers still report legacy aliases like `Asia/Calcutta`. */
function prettyTimezone(zone: string): string {
    return (zone === 'Asia/Calcutta' ? 'Asia/Kolkata' : zone).replace(/_/g, ' ');
}

function learningTimeStat(totalHours: number, sessionCount: number): Pick<StatCard, 'value' | 'unit' | 'caption'> {
    if (sessionCount === 0) return { value: '—', caption: 'No sessions logged yet' };
    const caption = plural(sessionCount, 'session');
    if (totalHours < 1) return { value: String(Math.max(1, Math.round(totalHours * 60))), unit: 'min', caption };
    return { value: totalHours.toFixed(1).replace(/\.0$/, ''), unit: 'h', caption };
}

function SampleBadge() {
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300"
            title="Illustrative figure — not connected to live records yet"
        >
            <Info className="w-3 h-3" aria-hidden="true" />
            Sample
        </span>
    );
}

function InfoChip({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100/80 dark:bg-slate-800/70 px-2.5 py-1 text-xs sm:text-sm text-gray-600 dark:text-slate-300 max-w-full">
            <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{children}</span>
        </span>
    );
}

function SectionCard({ className = '', children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={`bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/40 dark:border-white/10 p-4 sm:p-6 ${className}`}>
            {children}
        </div>
    );
}

function SectionHeading({ icon: Icon, title, action }: { icon: LucideIcon; title: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                <Icon className="w-5 h-5 text-purple-500 dark:text-purple-400 shrink-0" aria-hidden="true" />
                {title}
            </h3>
            {action}
        </div>
    );
}

export default function ProfilePage({ onClose }: { onClose?: () => void }) {
    const user = useAuthStore((s) => s.user);
    const role = useAuthStore((s) => s.role);
    const isGuest = useAuthStore((s) => s.isGuest);
    const isDemo = useAuthStore((s) => s.isDemo);
    const authReady = useAuthStore((s) => s.authReady);
    const updateDisplayName = useAuthStore((s) => s.updateDisplayName);

    const profile = useUserStore((s) => s.profile);
    const updateUserProfile = useUserStore((s) => s.updateProfile);

    const sessions = useAnalyticsStore((s) => s.sessions);
    const metrics = useAnalyticsStore((s) => s.metrics);
    const achievements = useAnalyticsStore((s) => s.achievements);

    const prefersReducedMotion = useReducedMotion();
    const reduceAnimations = useSettingsStore((s) => s.settings.accessibility.reduceAnimations);
    const reduceMotion = Boolean(prefersReducedMotion || reduceAnimations);

    const routes = getRoutesForRole(role);

    const [editing, setEditing] = useState(false);
    const [nameDraft, setNameDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showStyleQuiz, setShowStyleQuiz] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const quizPanelRef = useRef<HTMLDivElement>(null);

    const scored = useMemo(() => scoredSessions(sessions), [sessions]);
    const bestStreak = useMemo(() => longestStreakFor(sessions), [sessions]);
    const deviceTimezone = useMemo(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        analytics.profileViewed();
    }, []);

    useEffect(() => {
        if (editing) nameInputRef.current?.focus();
    }, [editing]);

    useEffect(() => {
        if (!showStyleQuiz) return;
        quizPanelRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setShowStyleQuiz(false);
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [showStyleQuiz]);

    const fade = (delay: number) =>
        reduceMotion
            ? {}
            : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay } };

    const displayName = displayNameForUser(user);
    const email = user?.email?.trim();
    const timezone = profile?.timezone?.trim() || deviceTimezone;
    const joinedOn = formatDate(user?.createdAt);
    const roleLabel = role ? ROLE_LABEL[role] : 'Learner';

    const learningStyle = profile?.learningStyle;
    const styleAssessedOn = formatDate(learningStyle?.assessedAt);

    const unlockedAchievements = achievements.filter((a) => Boolean(a.unlockedAt)).length;

    const studentStats: StatCard[] = [
        {
            icon: Clock,
            label: 'Learning time',
            ...learningTimeStat(metrics.totalHours, sessions.length),
            tile: 'bg-blue-50 dark:bg-blue-500/15',
            color: 'text-blue-500 dark:text-blue-300',
        },
        {
            icon: BookOpen,
            label: 'Topics completed',
            value: metrics.topicsCompleted > 0 ? String(metrics.topicsCompleted) : '—',
            caption: metrics.topicsCompleted > 0 ? 'Finished end to end' : 'Finish a topic to count it',
            tile: 'bg-emerald-50 dark:bg-emerald-500/15',
            color: 'text-emerald-500 dark:text-emerald-300',
        },
        {
            icon: Flame,
            label: 'Current streak',
            value: String(metrics.streakDays),
            unit: metrics.streakDays === 1 ? 'day' : 'days',
            caption: bestStreak > 0 ? `Best: ${plural(bestStreak, 'day')}` : 'Study today to start one',
            tile: 'bg-orange-50 dark:bg-orange-500/15',
            color: 'text-orange-500 dark:text-orange-300',
        },
        {
            icon: TrendingUp,
            label: 'Avg. quiz score',
            value: scored.length > 0 ? String(metrics.averageQuizScore) : '—',
            unit: scored.length > 0 ? '%' : undefined,
            caption: scored.length > 0 ? `${plural(scored.length, 'quiz')} scored` : 'No quizzes scored yet',
            tile: 'bg-purple-50 dark:bg-purple-500/15',
            color: 'text-purple-500 dark:text-purple-300',
        },
    ];

    const teacherStats: StatCard[] = [
        { icon: Book, label: 'Classes taught', value: '124', caption: 'This academic year', tile: 'bg-indigo-50 dark:bg-indigo-500/15', color: 'text-indigo-500 dark:text-indigo-300', sample: true },
        { icon: Users, label: 'Total students', value: '85', caption: 'Across all sections', tile: 'bg-pink-50 dark:bg-pink-500/15', color: 'text-pink-500 dark:text-pink-300', sample: true },
        { icon: Star, label: 'Avg. rating', value: '4.8', unit: '/5', caption: 'From student feedback', tile: 'bg-amber-50 dark:bg-amber-500/15', color: 'text-amber-500 dark:text-amber-300', sample: true },
        { icon: Clock, label: 'Teaching hours', value: '320', unit: 'h', caption: 'Logged this year', tile: 'bg-emerald-50 dark:bg-emerald-500/15', color: 'text-emerald-500 dark:text-emerald-300', sample: true },
    ];

    const adminStats: StatCard[] = [
        { icon: Users, label: 'Active users', value: '1,240', caption: 'Last 30 days', tile: 'bg-blue-50 dark:bg-blue-500/15', color: 'text-blue-500 dark:text-blue-300', sample: true },
        { icon: Activity, label: 'System health', value: '99.9', unit: '%', caption: 'Uptime this month', tile: 'bg-emerald-50 dark:bg-emerald-500/15', color: 'text-emerald-500 dark:text-emerald-300', sample: true },
        { icon: AlertCircle, label: 'Open tickets', value: '5', caption: 'Awaiting triage', tile: 'bg-red-50 dark:bg-red-500/15', color: 'text-red-500 dark:text-red-300', sample: true },
        { icon: Shield, label: 'Security status', value: 'Secure', caption: 'No active incidents', tile: 'bg-purple-50 dark:bg-purple-500/15', color: 'text-purple-500 dark:text-purple-300', sample: true },
    ];

    const currentStats = role === 'teacher' ? teacherStats : role === 'admin' ? adminStats : studentStats;

    const handleSaveName = async () => {
        const trimmed = nameDraft.trim();
        if (!trimmed) {
            setSaveError('Please enter a name.');
            return;
        }
        if (trimmed.length > 60) {
            setSaveError('Names can be at most 60 characters.');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            await updateDisplayName(trimmed);
            updateUserProfile({ name: trimmed, displayName: trimmed });
            setEditing(false);
            toast.success('Profile updated');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not save your name. Please try again.';
            setSaveError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const openEditor = () => {
        setNameDraft(displayName);
        setSaveError(null);
        setEditing(true);
    };

    const backButtonClasses = 'p-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400';
    const continueClasses = 'flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900';

    return (
        // shrink-0 keeps the page at its content height inside TeachingPage's flex modal wrapper,
        // which would otherwise squeeze it to one viewport and hide everything below the fold.
        <div className="min-h-[100dvh] shrink-0 relative bg-slate-50 dark:bg-slate-950">
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-[120px] ${reduceMotion ? '' : 'animate-pulse-slow'}`} />
                <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-[120px] ${reduceMotion ? '' : 'animate-pulse-slow'}`} style={{ animationDelay: '2s' }} />
                <div className={`absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-pink-200/30 dark:bg-pink-900/10 rounded-full blur-[100px] ${reduceMotion ? '' : 'animate-pulse-slow'}`} style={{ animationDelay: '4s' }} />
            </div>

            <div className="relative z-10">
                <header className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-transparent dark:border-slate-800">
                    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-4">
                        {onClose ? (
                            <button type="button" onClick={onClose} className={backButtonClasses} aria-label="Close profile">
                                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                            </button>
                        ) : (
                            <Link to={role === 'student' ? studentRoutes.modeSelection : routes.dashboard} className={backButtonClasses} aria-label="Back">
                                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                            </Link>
                        )}

                        {onClose ? (
                            <button type="button" onClick={onClose} className="hidden sm:block focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded" aria-label="Aɪra home">
                                <AiraLogo height={32} />
                            </button>
                        ) : (
                            <Link to={role === 'student' ? studentRoutes.modeSelection : routes.dashboard} className="hidden sm:block focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded" aria-label="Aɪra home">
                                <AiraLogo height={32} />
                            </Link>
                        )}

                        <h1 className="flex-1 min-w-0 text-center text-base sm:text-xl font-bold text-gray-800 dark:text-slate-100 truncate">
                            {role === 'student' ? 'My Profile' : `${roleLabel} Profile`}
                        </h1>

                        <div className="flex items-center gap-1 sm:gap-2">
                            {role === 'student' && (
                                onClose ? (
                                    <button type="button" onClick={onClose} className={continueClasses}>
                                        <BookOpen className="w-4 h-4" aria-hidden="true" />
                                        <span className="hidden md:inline">Continue Learning</span>
                                        <span className="sr-only md:hidden">Continue learning</span>
                                    </button>
                                ) : (
                                    <Link to={role === 'student' ? studentRoutes.modeSelection : routes.dashboard} className={continueClasses}>
                                        <BookOpen className="w-4 h-4" aria-hidden="true" />
                                        <span className="hidden md:inline">Continue Learning</span>
                                        <span className="sr-only md:hidden">Continue learning</span>
                                    </Link>
                                )
                            )}
                            {!onClose && (
                                <Link to={routes.settings} className={backButtonClasses} aria-label="Settings">
                                    <Settings className="w-5 h-5" aria-hidden="true" />
                                </Link>
                            )}
                            {!onClose && <SignOutButton className={backButtonClasses} />}
                        </div>
                    </div>
                </header>

                {!user ? (
                    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8">
                        {authReady ? (
                            <SectionCard className="text-center">
                                <p className="text-gray-700 dark:text-slate-200 font-medium">You are not signed in.</p>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                    Sign in to see your learning time, streak and achievements.
                                </p>
                            </SectionCard>
                        ) : (
                            <div className="space-y-4" role="status" aria-label="Loading profile">
                                <SectionCard>
                                    <div className="flex items-center gap-4 animate-pulse">
                                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gray-200 dark:bg-slate-800" />
                                        <div className="flex-1 space-y-3">
                                            <div className="h-6 w-40 rounded bg-gray-200 dark:bg-slate-800" />
                                            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-800" />
                                            <div className="h-4 w-56 rounded bg-gray-200 dark:bg-slate-800" />
                                        </div>
                                    </div>
                                </SectionCard>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                    {[0, 1, 2, 3].map((i) => (
                                        <SectionCard key={i}>
                                            <div className="animate-pulse space-y-3">
                                                <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-slate-800" />
                                                <div className="h-7 w-16 rounded bg-gray-200 dark:bg-slate-800" />
                                                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-slate-800" />
                                            </div>
                                        </SectionCard>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <PageTransition className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
                        {(isGuest || isDemo) && (
                            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
                                <Info className="w-5 h-5 text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    You are in a {isGuest ? 'guest' : 'demo'} session. Your progress and profile changes stay on this device
                                    and are not saved to an account.
                                </p>
                            </div>
                        )}

                        <motion.div {...fade(0)} className="mb-4 sm:mb-6">
                            <SectionCard>
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                                    <div className="flex items-start gap-4 min-w-0 flex-1">
                                        <UserAvatar
                                            user={user}
                                            size={96}
                                            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shadow-xl border-4 border-white/50 dark:border-slate-800/50"
                                            fallbackClassName="bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 text-xl sm:text-2xl md:text-3xl"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-100 break-words">
                                                    {displayName}
                                                </h2>
                                                {user.isVerified && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                                        <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                                                        Verified
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-purple-600 dark:text-purple-300 font-semibold text-xs sm:text-sm uppercase tracking-wide mt-0.5">
                                                {roleLabel}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {email && <InfoChip icon={Mail}>{email}</InfoChip>}
                                                {timezone && <InfoChip icon={Globe}>{prettyTimezone(timezone)}</InfoChip>}
                                                {joinedOn && <InfoChip icon={Calendar}>Joined {joinedOn}</InfoChip>}
                                            </div>

                                            {user.authMethod && AUTH_METHOD_LABEL[user.authMethod] && (
                                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                                                    Signed in with {AUTH_METHOD_LABEL[user.authMethod]}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => (editing ? setEditing(false) : openEditor())}
                                        aria-expanded={editing}
                                        className="shrink-0 self-start inline-flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-gray-600 dark:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                                    >
                                        {editing ? <X className="w-4 h-4" aria-hidden="true" /> : <Pencil className="w-4 h-4" aria-hidden="true" />}
                                        {editing ? 'Cancel' : 'Edit profile'}
                                    </button>
                                </div>

                                <AnimatePresence initial={false}>
                                    {editing && (
                                        <motion.div
                                            initial={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                                            animate={reduceMotion ? undefined : { opacity: 1, height: 'auto' }}
                                            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <form
                                                onSubmit={(event) => {
                                                    event.preventDefault();
                                                    void handleSaveName();
                                                }}
                                                className="mt-5 pt-5 border-t border-gray-100 dark:border-slate-800 space-y-3"
                                            >
                                                <label htmlFor="profile-display-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                                    Display name
                                                </label>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <input
                                                        id="profile-display-name"
                                                        ref={nameInputRef}
                                                        value={nameDraft}
                                                        onChange={(event) => {
                                                            setNameDraft(event.target.value);
                                                            setSaveError(null);
                                                        }}
                                                        maxLength={60}
                                                        autoComplete="name"
                                                        aria-invalid={Boolean(saveError)}
                                                        aria-describedby={saveError ? 'profile-name-error' : 'profile-name-hint'}
                                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={saving}
                                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                                                    >
                                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Check className="w-4 h-4" aria-hidden="true" />}
                                                        {saving ? 'Saving…' : 'Save'}
                                                    </button>
                                                </div>
                                                {saveError ? (
                                                    <p id="profile-name-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                                                        {saveError}
                                                    </p>
                                                ) : (
                                                    <p id="profile-name-hint" className="text-xs text-gray-500 dark:text-slate-400">
                                                        Your photo and email come from {AUTH_METHOD_LABEL[user.authMethod] ?? 'your sign-in provider'} and cannot be changed here.
                                                    </p>
                                                )}
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </SectionCard>
                        </motion.div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                            {currentStats.map((stat, index) => (
                                <motion.div key={stat.label} {...fade(0.05 + index * 0.05)}>
                                    <SectionCard className="h-full">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className={`w-11 h-11 ${stat.tile} rounded-xl flex items-center justify-center shrink-0`}>
                                                <stat.icon className={`w-5 h-5 ${stat.color}`} aria-hidden="true" />
                                            </div>
                                            {stat.sample && <SampleBadge />}
                                        </div>
                                        <p className="mt-3 text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight">
                                            {stat.value}
                                            {stat.unit && <span className="ml-1 text-sm font-bold text-gray-500 dark:text-slate-400">{stat.unit}</span>}
                                        </p>
                                        <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{stat.caption}</p>
                                    </SectionCard>
                                </motion.div>
                            ))}
                        </div>

                        {role === 'student' && (
                            <>
                                <motion.div {...fade(0.25)} className="mb-4 sm:mb-6">
                                    <SectionCard>
                                        <SectionHeading
                                            icon={Target}
                                            title="Learning style"
                                            action={
                                                styleAssessedOn ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowStyleQuiz(true)}
                                                        className="text-sm font-semibold text-purple-600 dark:text-purple-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
                                                    >
                                                        Retake
                                                    </button>
                                                ) : undefined
                                            }
                                        />

                                        {learningStyle && styleAssessedOn ? (
                                            <>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                                    {[
                                                        { label: 'Visual', value: learningStyle.visual, bar: 'bg-blue-500' },
                                                        { label: 'Auditory', value: learningStyle.auditory, bar: 'bg-emerald-500' },
                                                        { label: 'Kinesthetic', value: learningStyle.kinesthetic, bar: 'bg-orange-500' },
                                                    ].map((style) => (
                                                        <div key={style.label}>
                                                            <div className="flex justify-between text-sm mb-1.5">
                                                                <span className="text-gray-600 dark:text-slate-400 font-medium">{style.label}</span>
                                                                <span className="font-bold text-gray-800 dark:text-slate-100">{style.value}%</span>
                                                            </div>
                                                            <div
                                                                className="w-full bg-gray-200/70 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden"
                                                                role="progressbar"
                                                                aria-label={`${style.label} learning preference`}
                                                                aria-valuenow={style.value}
                                                                aria-valuemin={0}
                                                                aria-valuemax={100}
                                                            >
                                                                <div className={`${style.bar} h-full rounded-full transition-all`} style={{ width: `${style.value}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">Assessed {styleAssessedOn}</p>
                                            </>
                                        ) : (
                                            <div className="text-center py-2">
                                                <p className="text-sm text-gray-600 dark:text-slate-300">
                                                    We have not measured how you learn best yet.
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                    Answer five quick questions and Aɪra will lean on the formats that suit you.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowStyleQuiz(true)}
                                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                                                >
                                                    <Target className="w-4 h-4" aria-hidden="true" />
                                                    Take the style check
                                                </button>
                                            </div>
                                        )}
                                    </SectionCard>
                                </motion.div>

                                <motion.div {...fade(0.3)}>
                                    <SectionCard>
                                        <SectionHeading
                                            icon={Award}
                                            title="Achievements"
                                            action={
                                                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                    {unlockedAchievements} of {achievements.length} unlocked
                                                </span>
                                            }
                                        />
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {achievements.map((achievement) => {
                                                const target = achievement.target ?? 1;
                                                const progress = Math.min(achievement.progress ?? 0, target);
                                                const percent = target > 0 ? Math.round((progress / target) * 100) : 0;
                                                const unlocked = Boolean(achievement.unlockedAt);
                                                return (
                                                    <li
                                                        key={achievement.id}
                                                        className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${unlocked
                                                            ? 'border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10'
                                                            : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50'
                                                            }`}
                                                    >
                                                        <span className={`text-2xl shrink-0 ${unlocked ? '' : 'grayscale opacity-60'}`} aria-hidden="true">
                                                            {achievement.icon}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-800 dark:text-slate-100">{achievement.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-slate-400">{achievement.description}</p>
                                                            {unlocked ? (
                                                                <p className="text-xs font-semibold text-purple-600 dark:text-purple-300 mt-1.5">
                                                                    Unlocked{formatDate(achievement.unlockedAt) ? ` ${formatDate(achievement.unlockedAt)}` : ''}
                                                                </p>
                                                            ) : (
                                                                <div className="mt-2">
                                                                    <div
                                                                        className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden"
                                                                        role="progressbar"
                                                                        aria-label={`${achievement.name} progress`}
                                                                        aria-valuenow={percent}
                                                                        aria-valuemin={0}
                                                                        aria-valuemax={100}
                                                                    >
                                                                        <div className="h-full rounded-full bg-gray-400 dark:bg-slate-500" style={{ width: `${percent}%` }} />
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">{percent}% complete</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {unlocked ? (
                                                            <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" aria-label="Unlocked" />
                                                        ) : (
                                                            <Lock className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" aria-label="Locked" />
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </SectionCard>
                                </motion.div>
                            </>
                        )}

                        {role === 'teacher' && (
                            <motion.div {...fade(0.25)} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <SectionCard>
                                    <SectionHeading icon={Calendar} title="Today's schedule" action={<SampleBadge />} />
                                    <div className="space-y-4">
                                        {[
                                            { time: '09:00 AM', subject: 'Mathematics', class: 'Grade 9A', room: 'Room 302' },
                                            { time: '11:30 AM', subject: 'Physics', class: 'Grade 10B', room: 'Lab 2' },
                                            { time: '02:00 PM', subject: 'Mathematics', class: 'Grade 9B', room: 'Room 304' },
                                        ].map((item) => (
                                            <div key={item.time} className="flex gap-3 sm:gap-4 items-center">
                                                <div className="w-16 sm:w-20 shrink-0 text-xs sm:text-sm font-bold text-gray-500 dark:text-slate-400">{item.time}</div>
                                                <div className="flex-1 min-w-0 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border-l-4 border-indigo-500">
                                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-200 truncate">{item.subject}</h4>
                                                    <p className="text-xs text-indigo-700 dark:text-indigo-300">{item.class} • {item.room}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>

                                <SectionCard>
                                    <SectionHeading icon={Star} title="Recent feedback" action={<SampleBadge />} />
                                    <div className="space-y-3">
                                        {[
                                            { msg: 'The explanation of Trigonometry was super clear!', rating: 5, time: '2h ago' },
                                            { msg: 'Helped me understand Quadratic formulas finally.', rating: 5, time: '5h ago' },
                                            { msg: 'Good class, but moved a bit fast.', rating: 4, time: '1d ago' },
                                        ].map((review) => (
                                            <div key={review.msg} className="p-3 bg-white dark:bg-slate-800/60 rounded-lg border border-gray-100 dark:border-slate-700">
                                                <div className="flex justify-between mb-1">
                                                    <div className="flex text-amber-500" aria-label={`${review.rating} out of 5`}>
                                                        {Array.from({ length: review.rating }).map((_, i) => (
                                                            <Star key={i} className="w-3 h-3 fill-current" aria-hidden="true" />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-gray-400 dark:text-slate-500">{review.time}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-slate-300 italic">"{review.msg}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>
                            </motion.div>
                        )}

                        {role === 'admin' && (
                            <motion.div {...fade(0.25)} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                <SectionCard className="lg:col-span-2">
                                    <SectionHeading icon={FileText} title="System audit log" action={<SampleBadge />} />
                                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {[
                                            { action: 'User Login', who: 'Sarah Teacher', time: '10 mins ago', ok: true },
                                            { action: 'Grade Update', who: 'Mr. Wilson', time: '25 mins ago', ok: true },
                                            { action: 'Failed Login', who: 'Unknown (IP: 192.168…)', time: '1 hour ago', ok: false },
                                            { action: 'New Registration', who: 'Student #4092', time: '2 hours ago', ok: true },
                                        ].map((log) => (
                                            <div key={log.action} className="py-3 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${log.ok ? 'bg-emerald-500' : 'bg-red-500'}`} aria-hidden="true" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{log.action}</p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{log.who}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400 dark:text-slate-500 font-mono shrink-0">{log.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>

                                <SectionCard>
                                    <SectionHeading icon={Shield} title="Quick governance" />
                                    <div className="space-y-2">
                                        <Link
                                            to={routes.settings}
                                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                                        >
                                            <Settings className="w-4 h-4 text-gray-500 dark:text-slate-400" aria-hidden="true" /> Global settings
                                        </Link>
                                        <Link
                                            to={routes.dashboard}
                                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                                        >
                                            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Admin dashboard
                                        </Link>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 pt-2">
                                            User management and security logs are not available yet.
                                        </p>
                                    </div>
                                </SectionCard>
                            </motion.div>
                        )}
                    </PageTransition>
                )}
            </div>

            <AnimatePresence>
                {showStyleQuiz && (
                    <motion.div
                        // Auto margins on the panel centre it without clipping the top once it
                        // outgrows the viewport, which `items-center` would do.
                        className="fixed inset-0 z-[300] bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto overscroll-contain p-4 flex items-start justify-center"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                        initial={reduceMotion ? undefined : { opacity: 0 }}
                        animate={reduceMotion ? undefined : { opacity: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        onClick={(event) => {
                            if (event.target === event.currentTarget) setShowStyleQuiz(false);
                        }}
                    >
                        <div
                            ref={quizPanelRef}
                            tabIndex={-1}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Learning style check"
                            className="relative w-full max-w-2xl my-auto bg-slate-50 dark:bg-slate-950 rounded-2xl shadow-2xl p-4 sm:p-6 focus:outline-none"
                        >
                            <button
                                type="button"
                                onClick={() => setShowStyleQuiz(false)}
                                className="absolute top-3 right-3 p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                                aria-label="Close learning style check"
                            >
                                <X className="w-5 h-5" aria-hidden="true" />
                            </button>
                            <div className="pt-8">
                                <LearningStyleQuiz
                                    completeLabel="Back to profile"
                                    onComplete={() => {
                                        setShowStyleQuiz(false);
                                        toast.success('Learning style saved');
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
