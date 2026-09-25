import { Suspense, type ReactNode } from 'react';
import { Route, Navigate } from 'react-router-dom';
import FullPageLoader from '@/components/common/FullPageLoader';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { ProtectedRoute, RoleGuard } from '@/routes/guards';
import { homeForRole } from '@/lib/authSession';
import {
  CompetitiveTeachingPage,
  CurriculumPage,
  DashboardPage,
  OnboardingPage,
  ProfilePage,
  SettingsPage,
  StudentCompetitivePage,
  StudentModeSelectionPage,
  TeachingPage,
} from '@/routes/lazyPages';

function StudentPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<FullPageLoader message="Loading..." />}>
      <ProtectedRoute>
        <RoleGuard allowedRole="student">
          <ErrorBoundary>{children}</ErrorBoundary>
        </RoleGuard>
      </ProtectedRoute>
    </Suspense>
  );
}

/** Student role route table — path strings must stay stable. */
export function StudentRoutes() {
  return (
    <>
      <Route path="/student" element={<Navigate to={homeForRole('student')} replace />} />
      <Route
        path="/student/mode-selection"
        element={
          <StudentPage>
            <StudentModeSelectionPage />
          </StudentPage>
        }
      />
      <Route
        path="/student/competitive"
        element={
          <StudentPage>
            <StudentCompetitivePage />
          </StudentPage>
        }
      />
      <Route
        path="/student/onboarding"
        element={
          <StudentPage>
            <OnboardingPage />
          </StudentPage>
        }
      />
      <Route
        path="/student/competitive-explain"
        element={
          <StudentPage>
            <CompetitiveTeachingPage />
          </StudentPage>
        }
      />
      <Route
        path="/student/learn/:topicId?"
        element={
          <StudentPage>
            <TeachingPage />
          </StudentPage>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <StudentPage>
            <DashboardPage />
          </StudentPage>
        }
      />
      <Route
        path="/student/curriculum"
        element={
          <StudentPage>
            <CurriculumPage />
          </StudentPage>
        }
      />
      <Route
        path="/student/settings"
        element={
          <StudentPage>
            <SettingsPage />
          </StudentPage>
        }
      />
      <Route
        path="/student/profile"
        element={
          <StudentPage>
            <ProfilePage />
          </StudentPage>
        }
      />
    </>
  );
}
