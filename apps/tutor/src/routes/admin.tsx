import { Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';
import FullPageLoader from '@/components/common/FullPageLoader';
import { ProtectedRoute, RoleGuard } from '@/routes/guards';
import { adminRoutes } from '@/routes/paths';
import {
  AdminCurriculumContentPage,
  AdminDashboardPage,
  AdminProductAnalyticsPage,
  AdminWeeklyExamsPage,
  ProfilePage,
  SettingsPage,
} from '@/routes/lazyPages';

/** Admin role route table — path strings must stay stable. */
export function AdminRoutes() {
  return (
    <>
      <Route path="/admin" element={<Navigate to={adminRoutes.dashboard} replace />} />
      <Route
        path="/admin/dashboard"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="admin">
                <AdminDashboardPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <Suspense fallback={<FullPageLoader message="Loading analytics..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="admin">
                <AdminProductAnalyticsPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/admin/weekly-exams"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="admin">
                <AdminWeeklyExamsPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/admin/curriculum-content"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="admin">
                <AdminCurriculumContentPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="admin">
                <SettingsPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="admin">
                <ProfilePage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
    </>
  );
}
