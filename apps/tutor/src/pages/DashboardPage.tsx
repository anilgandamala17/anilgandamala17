import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { Sparkles, GraduationCap, Rocket } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import { displayNameForUser } from '../components/common/UserAvatar';
import { toast } from '../stores/toastStore';
import { getRoutesForRole, studentRoutes } from '../utils/routes';
import { useSignOut } from '../hooks/useSignOut';
import { useTeachingStore } from '../stores/teachingStore';
import { useDashboardInsights, type TopicCardModel } from '../hooks/useDashboardInsights';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { analytics } from '../services/analyticsService';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import HeroCard from '../components/dashboard/HeroCard';
import SuperStrengthCard from '../components/dashboard/SuperStrengthCard';
import NextMissionCard from '../components/dashboard/NextMissionCard';
import LearningJourneyChart from '../components/dashboard/LearningJourneyChart';
import ExamMissionCard from '../components/dashboard/ExamMissionCard';
import RecentMissionsStrip, { dedupeRecentMissions } from '../components/dashboard/RecentMissionsStrip';
import TopicDiscovery from '../components/dashboard/TopicDiscovery';
import QuickAccess, { ActionCard, ProfileCard } from '../components/dashboard/QuickAccess';

function firstName(full: string) {
  return full.split(/\s+/)[0] || full;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, role } = useAuthStore(
    useShallow((s) => ({ user: s.user, role: s.role }))
  );
  const signOut = useSignOut();
  const routes = getRoutesForRole(role);
  const { currentSession } = useTeachingStore(
    useShallow((s) => ({ currentSession: s.currentSession }))
  );
  const updateMetrics = useAnalyticsStore((s) => s.updateMetrics);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('For You');
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('7d');
  const insights = useDashboardInsights(range);

  useEffect(() => {
    analytics.dashboardView('student_dashboard', role || 'student');
  }, [role]);

  const learnerName = firstName(displayNameForUser(user));

  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = (t: TopicCardModel) =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.grade.toLowerCase().includes(q);

    let base: TopicCardModel[] = [];
    if (activeCategory === 'For You') {
      const ranked = [...insights.allTopics].sort((a, b) => {
        const score = (t: TopicCardModel) =>
          (t.inProgress ? 1000 : 0) +
          (t.liked ? 80 : 0) +
          (t.isNew ? 120 : 0) +
          (t.completed ? -40 : 0) +
          t.totalMinutes +
          (insights.nextTopic?.id === t.id ? 500 : 0);
        return score(b) - score(a);
      });
      // When searching, scan the full catalog; otherwise keep the recommended top 8
      base = q ? ranked.filter(matchesQuery) : ranked.slice(0, 8);
    } else if (activeCategory === 'Liked') {
      base = insights.allTopics.filter((t) => t.liked && matchesQuery(t));
    } else {
      base = insights.allTopics.filter(
        (t) =>
          (t.subject === activeCategory ||
            t.subjectId === activeCategory.toLowerCase().replace(/\s+/g, '-')) &&
          matchesQuery(t)
      );
    }
    return base.slice(0, 8);
  }, [activeCategory, searchQuery, insights.allTopics, insights.nextTopic?.id]);

  const recentDeduped = useMemo(
    () => dedupeRecentMissions(insights.recentSessions),
    [insights.recentSessions]
  );

  const weeklySpark = insights.metrics.weeklyHours;

  const handleLogout = () => void signOut();

  const handleRefresh = () => {
    if (import.meta.env.DEV) {
      // Long-press alternative: double-tap refresh opens demo roles in DEV
    }
    updateMetrics();
    toast.success('Dashboard data refreshed');
  };

  const handleStartTopic = (topicId: string) => {
    analytics.dashboardFeatureUsed('student_dashboard', 'start_topic');
    analytics.topicSelected({ topicId });
    const learnPath =
      'learn' in routes ? (routes as typeof studentRoutes).learn(topicId) : studentRoutes.learn(topicId);
    navigate(learnPath);
  };

  const homeLearn =
    'learn' in routes
      ? (routes as typeof studentRoutes).learn(
          currentSession?.topicId ||
            insights.nextTopic?.id ||
            insights.allTopics[0]?.id ||
            'math-6-1-large-numbers'
        )
      : routes.dashboard;

  const heroDescription = !insights.hasActivity
    ? 'Start a lesson and your study time, streak, and next topic will show up here as you learn.'
    : 'Your study time, quiz accuracy, streak, and next recommended lesson update here as you practice.';

  const strengthSubtitle = !insights.hasActivity
    ? 'Finish a quiz to unlock your strength map.'
    : insights.strength && insights.strength.avgScore > 0
      ? `Top ${insights.peerPercentile}% peer band`
      : insights.strength
        ? `Most studied · ${Math.round(insights.strength.minutes)} min`
        : 'Keep practicing to reveal your strongest subject.';

  const strengthProgress = !insights.hasActivity
    ? 0
    : insights.strength?.avgScore ||
      Math.min(90, Math.round((insights.strength?.minutes || 0) / 5)) ||
      0;

  return (
    <div className="dash-shell relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 500px at 10% -10%, var(--dash-brand-glow), transparent), radial-gradient(700px 420px at 90% 0%, var(--dash-brand-soft), transparent)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.3] dark:opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(var(--dash-border) 1px, transparent 1px), linear-gradient(90deg, var(--dash-border) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        <DashboardHeader
          homeTo={homeLearn}
          liveNow={insights.liveNow}
          user={user}
          onRefresh={() => {
            handleRefresh();
            if (import.meta.env.DEV && (window as unknown as { __airaRefreshCount?: number })) {
              const w = window as unknown as { __airaRefreshCount?: number };
              w.__airaRefreshCount = (w.__airaRefreshCount || 0) + 1;
              if (w.__airaRefreshCount >= 3) {
                w.__airaRefreshCount = 0;
                navigate('/dev/demo-roles');
              }
            }
          }}
          onProfile={() => navigate(routes.profile)}
          onLogout={handleLogout}
        />

        <main className="flex-1 w-full" id="main-content" tabIndex={-1}>
          <PageTransition className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 pb-24 sm:pb-20">
            <div
              className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4"
              style={{ marginBottom: 'var(--dash-card-gap)' }}
            >
              <div className="lg:col-span-8 min-w-0 order-1">
                <HeroCard
                  learnerName={learnerName}
                  readiness={insights.readiness}
                  description={heroDescription}
                  orbitLabel={
                    insights.hasActivity
                      ? `${insights.metrics.totalHours}h studied · learning active`
                      : 'Ready when you are · start your first lesson'
                  }
                  stats={[
                    {
                      label: 'Study time',
                      value: `${insights.metrics.totalHours}h`,
                      tone: 'sky',
                      sparkline: weeklySpark,
                      emptyHint: !insights.hasActivity ? 'Logs after first session' : undefined,
                    },
                    {
                      label: 'Accuracy',
                      value: `${insights.metrics.averageQuizScore}%`,
                      tone: 'amber',
                      sparkline: insights.weeklyQuizBars,
                      onClick: () => navigate(routes.profile),
                      emptyHint: !insights.hasActivity ? 'Unlocks with quizzes' : undefined,
                    },
                    {
                      label: 'Streak',
                      value: `${insights.metrics.streakDays}d`,
                      tone: 'rose',
                      sparkline: weeklySpark.map((h) => (h > 0 ? 1 : 0)),
                      emptyHint: !insights.hasActivity ? 'Study daily to build it' : undefined,
                    },
                    {
                      label: 'Completed',
                      value: `${insights.completedCount}`,
                      tone: 'teal',
                      emptyHint: !insights.hasActivity ? 'Finish a topic to count' : undefined,
                    },
                  ]}
                />
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-4 min-w-0 order-2">
                <SuperStrengthCard
                  subjectName={insights.strength?.name || 'Getting started'}
                  subtitle={strengthSubtitle}
                  progressPct={strengthProgress}
                  contextLine={
                    insights.hasActivity
                      ? 'Based on your recent practice sessions'
                      : 'Updates as you practice with AIra'
                  }
                  empty={!insights.hasActivity || !insights.strength}
                />
                <NextMissionCard
                  title={insights.nextTopic?.name || insights.focus?.name || 'Pick a lesson'}
                  meta={
                    insights.nextTopic
                      ? `${insights.nextTopic.duration} · ${insights.nextTopic.subject}`
                      : 'Browse curriculum to start your next lesson'
                  }
                  duration={insights.nextTopic?.duration}
                  subjectName={insights.nextTopic?.subject}
                  subjectId={insights.nextTopic?.subjectId || insights.focus?.id || 'mathematics'}
                  difficulty={insights.nextTopic?.difficulty}
                  inProgress={insights.nextTopic?.inProgress}
                  mastery={insights.nextTopic?.mastery}
                  empty={!insights.nextTopic}
                  onLaunch={() => {
                    if (insights.nextTopic) handleStartTopic(insights.nextTopic.id);
                    else if ('curriculum' in routes)
                      navigate((routes as { curriculum: string }).curriculum);
                  }}
                />
              </div>
            </div>

            <div
              className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4"
              style={{ marginBottom: 'var(--dash-section-gap)' }}
            >
              <div className="lg:col-span-7 xl:col-span-8 min-w-0 flex flex-col gap-3 sm:gap-4 order-1">
                <LearningJourneyChart
                  points={insights.journeyPoints}
                  growthPct={insights.growthPct}
                  hasActivity={insights.hasActivity}
                  range={range}
                  rangeLabel={insights.rangeLabel}
                  onRangeChange={setRange}
                />
                <div
                  className="dash-card shrink-0"
                  style={{ background: 'linear-gradient(165deg, #ffffff 0%, #f8fafc 55%, #eef2ff 100%)' }}
                >
                  <RecentMissionsStrip
                    items={recentDeduped}
                    onOpen={handleStartTopic}
                    empty={recentDeduped.length === 0}
                  />
                </div>
              </div>
              <div className="lg:col-span-5 xl:col-span-4 min-w-0 order-2">
                <ExamMissionCard
                  readiness={insights.readiness}
                  weeklyScores={insights.weeklyQuizBars}
                  growthPct={insights.growthPct}
                  accuracy={insights.metrics.averageQuizScore}
                  efficiencyMinPerQ={insights.efficiencyMinPerQ}
                  streakDays={insights.metrics.streakDays}
                  topicsCompleted={insights.completedCount}
                  targetLabel="Exam readiness"
                  hasActivity={insights.hasActivity}
                />
              </div>
            </div>

            <TopicDiscovery
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
              activeCategory={activeCategory}
              onCategory={setActiveCategory}
              topics={filteredTopics}
              onStart={handleStartTopic}
            />

            <QuickAccess>
              {'modeSelection' in routes && (
                <ActionCard
                  onClick={() => navigate((routes as { modeSelection: string }).modeSelection)}
                  icon={<Sparkles className="w-4 h-4" />}
                  title="Learning mode"
                  body={
                    insights.hasActivity
                      ? 'Switch between school curriculum and competitive prep'
                      : 'Choose school curriculum or competitive prep'
                  }
                  accent="#4f46e5"
                />
              )}
              {'curriculum' in routes && (
                <ActionCard
                  onClick={() => navigate((routes as { curriculum: string }).curriculum)}
                  icon={<GraduationCap className="w-4 h-4" />}
                  title="Curriculum"
                  body={
                    insights.hasActivity
                      ? `${insights.completedCount} completed · ${insights.inProgressCount} in progress`
                      : 'Browse topics — progress syncs as you study'
                  }
                  accent="#0d9488"
                />
              )}
              <ActionCard
                onClick={() =>
                  insights.nextTopic
                    ? handleStartTopic(insights.nextTopic.id)
                    : 'curriculum' in routes &&
                      navigate((routes as { curriculum: string }).curriculum)
                }
                icon={<Rocket className="w-4 h-4" />}
                title="Continue learning"
                body={
                  insights.nextTopic
                    ? insights.nextTopic.name
                    : 'Start your first lesson with AIra'
                }
                accent="#0284c7"
              />
              <ProfileCard
                user={user}
                profession="Student"
                badgeCount={insights.unlockedAchievements.length}
                onClick={() => navigate(routes.profile)}
              />
            </QuickAccess>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
