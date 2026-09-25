import { lazy, Suspense, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import PageTransition from '@/components/common/PageTransition';
import { toast } from '@/stores/toastStore';
import { getRoutesForRole } from '@/utils/routes';
import { useSignOut } from '@/hooks/useSignOut';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { analytics } from '@/services/analyticsService';
import { useCompetitiveStore } from '@/features/competitive/stores/competitiveStore';
import { useDashboardInsights } from '@/features/dashboard/hooks/useDashboardInsights';

import DashboardHeader from '@/features/dashboard/components/DashboardHeader';
import DashboardModeSwitcher, {
  type DashboardMode,
} from '@/features/dashboard/components/DashboardModeSwitcher';
import CurriculumModeDashboard from '@/features/dashboard/components/CurriculumModeDashboard';
import {
  DASHBOARD_MODE_PARAM,
  isCanonicalDashboardModeParam,
  parseDashboardMode,
} from '@/features/dashboard/lib/dashboardMode';

const CompetitiveModeDashboard = lazy(
  () => import('@/features/dashboard/components/CompetitiveModeDashboard'),
);

function ModeFallback() {
  return (
    <div className="dash-stack" aria-busy="true" aria-label="Loading competitive dashboard">
      <div className="dash-skeleton h-28 rounded-[var(--dash-radius-lg)]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="dash-skeleton h-20 rounded-[var(--dash-radius-sm)]" />
        ))}
      </div>
      <div className="dash-skeleton h-40 rounded-[var(--dash-radius-lg)]" />
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

  const mode = parseDashboardMode(searchParams.get(DASHBOARD_MODE_PARAM));

  // Canonicalize invalid ?mode= values so refresh/share URLs stay valid.
  useEffect(() => {
    const raw = searchParams.get(DASHBOARD_MODE_PARAM);
    if (isCanonicalDashboardModeParam(raw)) return;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete(DASHBOARD_MODE_PARAM);
        return p;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  const setMode = useCallback(
    (next: DashboardMode) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next === 'curriculum') p.delete(DASHBOARD_MODE_PARAM);
          else p.set(DASHBOARD_MODE_PARAM, next);
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
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-50" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(640px 340px at 6% -6%, var(--dash-brand-glow), transparent), radial-gradient(480px 280px at 94% 0%, var(--dash-brand-soft), transparent)',
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
            <div className="mb-4 sm:mb-5">
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
