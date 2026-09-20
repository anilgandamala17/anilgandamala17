import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { Sparkles, GraduationCap, Crosshair } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import { displayNameForUser } from '../components/common/UserAvatar';
import { toast } from '../stores/toastStore';
import { getRoutesForRole, studentRoutes } from '../utils/routes';
import { useSignOut } from '../hooks/useSignOut';
import { useDashboardInsights, type TopicCardModel } from '../hooks/useDashboardInsights';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { analytics } from '../services/analyticsService';
import {
  computeCompetitiveInsights,
  useCompetitiveStore,
} from '../stores/competitiveStore';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import WelcomeOverview from '../components/dashboard/WelcomeOverview';
import ContinueLearningCard from '../components/dashboard/ContinueLearningCard';
import LearningJourneyChart from '../components/dashboard/LearningJourneyChart';
import SubjectMasteryCard from '../components/dashboard/SubjectMasteryCard';
import LearningInsightsCard from '../components/dashboard/LearningInsightsCard';
import CompetitivePreparationCard from '../components/dashboard/CompetitivePreparationCard';
import RecentActivityList from '../components/dashboard/RecentActivityList';
import { dedupeRecentMissions } from '../components/dashboard/recentActivityUtils';
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
  const updateMetrics = useAnalyticsStore((s) => s.updateMetrics);
  const competitiveAttempts = useCompetitiveStore((s) => s.attempts);
  const bindCompetitiveUser = useCompetitiveStore((s) => s.bindUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('For You');
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('7d');
  const insights = useDashboardInsights(range);

  useEffect(() => {
    analytics.dashboardView('student_dashboard', role || 'student');
  }, [role]);

  useEffect(() => {
    bindCompetitiveUser(user?.id ?? null);
  }, [user?.id, bindCompetitiveUser]);

  const competitiveInsights = useMemo(
    () => computeCompetitiveInsights(competitiveAttempts),
    [competitiveAttempts]
  );

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

  const openCompetitiveAnalytics = () => {
    analytics.dashboardFeatureUsed('student_dashboard', 'open_competitive_analytics');
    if ('competitive' in routes) {
      navigate(`${(routes as typeof studentRoutes).competitive}?section=performance`);
    }
  };

  const openCompetitiveMode = () => {
    analytics.dashboardFeatureUsed('student_dashboard', 'open_competitive_mode');
    if ('competitive' in routes) {
      navigate((routes as typeof studentRoutes).competitive);
    }
  };

  const openCurriculum = () => {
    if ('curriculum' in routes) navigate((routes as { curriculum: string }).curriculum);
  };

  const welcomeDescription = !insights.hasActivity
    ? 'Start a lesson and your study time, streak, and next topic will show up here as you learn.'
    : 'Your study time, quiz accuracy, streak, and next recommended lesson update as you practice.';

  const sectionGap = { marginBottom: 'var(--dash-section-gap)' } as const;

  return (
    <div className="dash-shell relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-60">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(700px 380px at 8% -8%, var(--dash-brand-glow), transparent), radial-gradient(560px 320px at 92% 0%, var(--dash-brand-soft), transparent)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        <DashboardHeader
          homeTo={routes.dashboard}
          liveNow={insights.liveNow}
          user={user}
          onRefresh={() => {
            handleRefresh();
            if (import.meta.env.DEV) {
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
          <PageTransition className="mx-auto px-4 sm:px-6 py-4 sm:py-5 md:py-6 pb-24 sm:pb-20 w-full max-w-[var(--dash-max-w)]">
            {/* P0 — Welcome + KPIs */}
            <div style={sectionGap}>
              <WelcomeOverview
                learnerName={learnerName}
                readiness={insights.readiness}
                description={welcomeDescription}
                orbitLabel={
                  insights.hasActivity
                    ? `${insights.metrics.totalHours}h studied`
                    : 'Ready when you are'
                }
                showGrowth={insights.hasActivity && insights.lastWeekMin > 0}
                growthPct={insights.growthPct}
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

            {/* P0 — Continue Learning */}
            <div style={sectionGap}>
              <ContinueLearningCard
                title={insights.nextTopic?.name || 'Pick a lesson'}
                subjectId={insights.nextTopic?.subjectId || 'mathematics'}
                subjectName={insights.nextTopic?.subject}
                difficulty={insights.nextTopic?.difficulty}
                duration={insights.nextTopic?.duration}
                inProgress={insights.nextTopic?.inProgress}
                mastery={insights.nextTopic?.mastery}
                lastSessionAt={insights.lastSessionAt}
                empty={!insights.nextTopic}
                onBrowse={openCurriculum}
                onLaunch={() => {
                  if (insights.nextTopic) handleStartTopic(insights.nextTopic.id);
                  else openCurriculum();
                }}
              />
            </div>

            {/* P1 — Learning activity + Subject mastery */}
            <div className="dash-grid-row" style={sectionGap}>
              <div className="lg:col-span-7 min-w-0">
                <LearningJourneyChart
                  points={insights.journeyPoints}
                  growthPct={insights.growthPct}
                  hasActivity={insights.hasActivity}
                  range={range}
                  rangeLabel={insights.rangeLabel}
                  onRangeChange={setRange}
                />
              </div>
              <div className="lg:col-span-5 min-w-0">
                <SubjectMasteryCard
                  items={insights.subjectMastery}
                  empty={insights.subjectMastery.length === 0}
                />
              </div>
            </div>

            {/* P1 — Insights + Competitive */}
            <div className="dash-grid-row" style={sectionGap}>
              <div className="lg:col-span-6 min-w-0">
                <LearningInsightsCard
                  strengths={insights.strengths}
                  focusAreas={insights.focusAreas}
                  empty={insights.strengths.length === 0 && insights.focusAreas.length === 0}
                />
              </div>
              <div className="lg:col-span-6 min-w-0">
                <CompetitivePreparationCard
                  insights={competitiveInsights}
                  onOpenAnalytics={openCompetitiveAnalytics}
                  onStart={openCompetitiveMode}
                />
              </div>
            </div>

            {/* P2 — Recent */}
            <div style={sectionGap}>
              <RecentActivityList
                items={recentDeduped}
                onOpen={handleStartTopic}
                empty={recentDeduped.length === 0}
              />
            </div>

            {/* P2 — Browse */}
            <div style={sectionGap}>
              <TopicDiscovery
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                activeCategory={activeCategory}
                onCategory={setActiveCategory}
                topics={filteredTopics}
                onStart={handleStartTopic}
              />
            </div>

            {/* P2 — Quick access (Continue deduped — already above) */}
            <QuickAccess>
              {'modeSelection' in routes && (
                <ActionCard
                  onClick={() => navigate((routes as { modeSelection: string }).modeSelection)}
                  icon={<Sparkles className="w-4 h-4" />}
                  title="Learning mode"
                  body={
                    insights.hasActivity
                      ? 'Switch curriculum or competitive prep'
                      : 'Choose curriculum or competitive'
                  }
                  accent="#0ea5e9"
                />
              )}
              {'curriculum' in routes && (
                <ActionCard
                  onClick={openCurriculum}
                  icon={<GraduationCap className="w-4 h-4" />}
                  title="Curriculum"
                  body={
                    insights.hasActivity
                      ? `${insights.completedCount} done · ${insights.inProgressCount} in progress`
                      : 'Browse topics — progress syncs as you study'
                  }
                  accent="#0d9488"
                />
              )}
              {'competitive' in routes && (
                <ActionCard
                  onClick={openCompetitiveMode}
                  icon={<Crosshair className="w-4 h-4" />}
                  title="Competitive"
                  body={
                    competitiveInsights.attemptCount > 0
                      ? `${competitiveInsights.overallAccuracy}% accuracy · ${competitiveInsights.attemptCount} attempts`
                      : 'Mocks and topic quizzes for exam prep'
                  }
                  accent="#0284c7"
                />
              )}
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
