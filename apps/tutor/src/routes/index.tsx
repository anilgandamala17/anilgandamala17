import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import FullPageLoader from '@/components/common/FullPageLoader';
import {
  DemoRolesGate,
  LoginRedirect,
  RootRedirect,
} from '@/routes/guards';
import { DemoRolesPage } from '@/routes/lazyPages';
import { StudentRoutes } from '@/routes/student';
import { TeacherRoutes } from '@/routes/teacher';
import { AdminRoutes } from '@/routes/admin';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginRedirect />} />
      <Route
        path="/dev/demo-roles"
        element={
          <Suspense fallback={<FullPageLoader message="Loading..." />}>
            <DemoRolesGate>
              <DemoRolesPage />
            </DemoRolesGate>
          </Suspense>
        }
      />
      {StudentRoutes()}
      {TeacherRoutes()}
      {AdminRoutes()}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
