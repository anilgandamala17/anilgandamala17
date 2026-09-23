import { lazy, Suspense, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import PageTransition from '../components/common/PageTransition';
import { toast } from '../stores/toastStore';
import { getRoutesForRole } from '../utils/routes';
import { useSignOut } from '../hooks/useSignOut';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { analytics } from '../services/analyticsService';
import { useCompetitiveStore } from '../stores/competitiveStore';
import { useDashboardInsights } from '../hooks/useDashboardInsights';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardModeSwitcher, {
  type DashboardMode,
} from '../components/dashboard/DashboardModeSwitcher';
import CurriculumModeDashboard from '../components/dashboard/CurriculumModeDashboard';

const CompetitiveModeDashboard = lazy(
  () => import('../components/dashboard/CompetitiveModeDashboard'),
);

const MODE_PARAM = 'mode';

function parseMode(raw: string | null): DashboardMode {
  return raw === 'competitive' ? 'competitive' : 'curriculum';
}

function ModeFallback() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      <div
        className="h-28 rounded-2xl"
        style={{ background: 'var(--dash-surface-1)' }}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl"
            style={{ background: 'var(--dash-surface-1)' }}
          />
        ))}
      </div>
      <div
        className="h-40 rounded-2xl"
        style={{ background: 'var(--dash-surface-1)' }}
      />
    </div>
  );
}

/**
 * Unified student dashboard at /student/dashboard.
 * Modes: curriculum | competitive (query ?mode=). No route change on switch.
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, role } = useAuthStore(
    useShallow((s) => ({ user: s.user, role: s.role })),
  );
  const signOut = useSignOut();
  const routes = getRoutesForRole(role);
  const updateMetrics = useAnalyticsStore((s) => s.updateMetrics);
  const bindCompetitiveUser = useCompetitiveStore((s) => s.bindUser);
  const insights = useDashboardInsights('7d');

  const mode = parseMode(searchParams.get(MODE_PARAM));

  const setMode = useCallback(
    (next: DashboardMode) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next === 'curriculum') p.delete(MODE_PARAM);
          else p.set(MODE_PARAM, next);
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    analytics.dashboardView('student_dashboard', role || 'student');
  }, [role]);

  useEffect(() => {
    bindCompetitiveUser(user?.id ?? null);
  }, [user?.id, bindCompetitiveUser]);

  useEffect(() => {
    if (mode === 'competitive') {
      analytics.dashboardFeatureUsed('student_dashboard', 'competitive_mode_view');
    }
  }, [mode]);

  const handleLogout = () => void signOut();

  const handleRefresh = () => {
    updateMetrics();
    toast.success('Dashboard data refreshed');
  };

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
            <div style={{ marginBottom: 'var(--dash-section-gap)' }}>
              <DashboardModeSwitcher value={mode} onChange={setMode} />
            </div>

            {mode === 'curriculum' ? (
              <CurriculumModeDashboard onOpenCompetitiveDashboard={() => setMode('competitive')} />
            ) : (
              <Suspense fallback={<ModeFallback />}>
                <CompetitiveModeDashboard />
              </Suspense>
            )}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
