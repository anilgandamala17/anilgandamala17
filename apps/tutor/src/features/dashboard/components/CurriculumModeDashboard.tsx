import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, GraduationCap, Crosshair, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { displayNameForUser } from '@/components/common/UserAvatar';
import { getRoutesForRole, studentRoutes } from '@/utils/routes';
import { useDashboardInsights, type TopicCardModel } from '@/features/dashboard/hooks/useDashboardInsights';
import { analytics } from '@/services/analyticsService';
import {
  computeCompetitiveInsights,
  useCompetitiveStore,
} from '@/features/competitive/stores/competitiveStore';

import WelcomeOverview from './WelcomeOverview';
import ContinueLearningCard from './ContinueLearningCard';
import LearningJourneyChart from './LearningJourneyChart';
import SubjectMasteryCard from './SubjectMasteryCard';
import LearningInsightsCard from './LearningInsightsCard';
import RecentActivityList from './RecentActivityList';
import { dedupeRecentMissions } from './recentActivityUtils';
import TopicDiscovery from './TopicDiscovery';
import QuickAccess, { ActionCard, ProfileCard } from './QuickAccess';

function firstName(full: string) {
  return full.split(/\s+/)[0] || full;
}

type CurriculumModeDashboardProps = {
  onOpenCompetitiveDashboard: () => void;
};

/**
 * Curriculum dashboard body — Phase 3 hierarchy.
 * P1 Continue → P2 Journey/Mastery → P3 Insights → P4 Activity → P5 Discovery → P6 Quick access
 */
export default function CurriculumModeDashboard({
  onOpenCompetitiveDashboard,
}: CurriculumModeDashboardProps) {
  const navigate = useNavigate();
  const { user, role } = useAuthStore(
    useShallow((s) => ({ user: s.user, role: s.role })),
  );
  const routes = getRoutesForRole(role);
  const competitiveAttempts = useCompetitiveStore((s) => s.attempts);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('For You');
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('7d');
  const insights = useDashboardInsights(range);

  const competitiveInsights = useMemo(
    () => computeCompetitiveInsights(competitiveAttempts),
    [competitiveAttempts],
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
          matchesQuery(t),
      );
    }
    return base.slice(0, 8);
  }, [activeCategory, searchQuery, insights.allTopics, insights.nextTopic?.id]);

  const recentDeduped = useMemo(
    () => dedupeRecentMissions(insights.recentSessions),
    [insights.recentSessions],
  );

  const handleStartTopic = (topicId: string) => {
    analytics.dashboardFeatureUsed('student_dashboard', 'start_topic');
    analytics.topicSelected({ topicId });
    const learnPath =
      'learn' in routes
        ? (routes as typeof studentRoutes).learn(topicId)
        : studentRoutes.learn(topicId);
    navigate(learnPath);
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
    ? 'Continue where you left off and keep making progress — start a lesson to unlock your study insights.'
    : 'Continue where you left off and keep making progress.';

  return (
    <div
      id="dash-panel-curriculum"
      role="tabpanel"
      aria-labelledby="dash-mode-curriculum"
      className="dash-stack"
    >
      {/* Welcome — compact context */}
      <WelcomeOverview
        learnerName={learnerName}
        readiness={insights.readiness}
        description={welcomeDescription}
        showGrowth={insights.hasActivity && insights.lastWeekMin > 0}
        growthPct={insights.growthPct}
        stats={[
          {
            label: 'Study time',
            value: insights.hasActivity ? `${insights.metrics.totalHours}h` : '—',
            emptyHint: !insights.hasActivity ? 'After first session' : undefined,
          },
          {
            label: 'Accuracy',
            value: insights.hasActivity ? `${insights.metrics.averageQuizScore}%` : '—',
            onClick: () => navigate(routes.profile),
            emptyHint: !insights.hasActivity ? 'Unlocks with quizzes' : undefined,
          },
          {
            label: 'Streak',
            value: insights.hasActivity ? `${insights.metrics.streakDays}d` : '—',
            emptyHint: !insights.hasActivity ? 'Study daily to build' : undefined,
          },
          {
            label: 'Completed',
            value: insights.hasActivity ? `${insights.completedCount}` : '—',
            emptyHint: !insights.hasActivity ? 'Finish a topic' : undefined,
          },
        ]}
      />

      {/* P1 — Continue Learning */}
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

      {/* P2 / P3 — Journey + Mastery */}
      <div className="dash-grid-row">
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

      {/* Insights — actionable, full width */}
      <LearningInsightsCard
        strengths={insights.strengths}
        focusAreas={insights.focusAreas}
        empty={insights.strengths.length === 0 && insights.focusAreas.length === 0}
      />

      {/* Cross-mode bridge — flat secondary, not equal to Continue */}
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between rounded-[var(--dash-radius-md)] px-3.5 py-3 border"
        style={{
          borderColor: 'var(--dash-border)',
          background: 'var(--dash-surface-1)',
        }}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>
            Preparing for competitive exams?
          </p>
          <p className="dash-type-caption mt-0.5">
            {competitiveInsights.attemptCount > 0
              ? `${competitiveInsights.overallAccuracy}% accuracy · ${competitiveInsights.attemptCount} attempts recorded`
              : 'Switch modes to track mocks, year practice, and exam drafts.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            className="dash-btn dash-btn--ghost dash-btn--sm"
            onClick={() => {
              analytics.dashboardFeatureUsed('student_dashboard', 'open_competitive_analytics');
              onOpenCompetitiveDashboard();
            }}
          >
            Competitive dashboard
          </button>
          <button
            type="button"
            className="dash-btn dash-btn--sm"
            style={{
              background: 'var(--dash-surface-0)',
              color: 'var(--dash-text)',
              border: '1px solid var(--dash-border)',
            }}
            onClick={openCompetitiveMode}
          >
            Open hub
            <ChevronRight className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {/* P4 — Recent activity */}
      <RecentActivityList
        items={recentDeduped}
        onOpen={handleStartTopic}
        empty={recentDeduped.length === 0}
      />

      {/* P5 — Topic discovery */}
      <TopicDiscovery
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        activeCategory={activeCategory}
        onCategory={setActiveCategory}
        topics={filteredTopics}
        onStart={handleStartTopic}
      />

      {/* P6 — Quick access (visually secondary) */}
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
            accent="var(--dash-brand)"
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
            accent="var(--mode-curriculum, #0f9d58)"
          />
        )}
        {'competitive' in routes && (
          <ActionCard
            onClick={openCompetitiveMode}
            icon={<Crosshair className="w-4 h-4" />}
            title="Competitive hub"
            body={
              competitiveInsights.attemptCount > 0
                ? `${competitiveInsights.overallAccuracy}% accuracy · ${competitiveInsights.attemptCount} attempts`
                : 'Mocks and year practice for exam prep'
            }
            accent="var(--mode-competitive, #f5722f)"
          />
        )}
        <ProfileCard
          user={user}
          profession="Student"
          badgeCount={insights.unlockedAchievements.length}
          onClick={() => navigate(routes.profile)}
        />
      </QuickAccess>
    </div>
  );
}
