import { Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';
import FullPageLoader from '@/components/common/FullPageLoader';
import { ProtectedRoute, RoleGuard } from '@/routes/guards';
import { teacherRoutes } from '@/routes/paths';
import { ProfilePage, SettingsPage, TeacherDashboardPage } from '@/routes/lazyPages';

/** Teacher role route table — path strings must stay stable. */
export function TeacherRoutes() {
  return (
    <>
      <Route path="/teacher" element={<Navigate to={teacherRoutes.dashboard} replace />} />
      <Route
        path="/teacher/dashboard"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="teacher">
                <TeacherDashboardPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/teacher/settings"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="teacher">
                <SettingsPage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/teacher/profile"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <ProtectedRoute>
              <RoleGuard allowedRole="teacher">
                <ProfilePage />
              </RoleGuard>
            </ProtectedRoute>
          </Suspense>
        }
      />
    </>
  );
}
