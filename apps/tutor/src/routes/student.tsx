import { Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';
import FullPageLoader from '@/components/common/FullPageLoader';
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

/** Student role route table — path strings must stay stable. */
export function StudentRoutes() {
  return (
    <>
      <Route path="/student" element={<Navigate to={homeForRole('student')} replace />} />
      <Route
        path="/student/mode-selection"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="student">
                <StudentModeSelectionPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/student/competitive"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="student">
                <StudentCompetitivePage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/student/onboarding"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="student">
                <OnboardingPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/student/competitive-explain"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="student">
                <CompetitiveTeachingPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/student/learn/:topicId?"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="student">
                <TeachingPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="student">
                <DashboardPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/student/curriculum"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="student">
                <CurriculumPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/student/settings"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="student">
                <SettingsPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/student/profile"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="student">
                <ProfilePage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
    </>
  );
}
