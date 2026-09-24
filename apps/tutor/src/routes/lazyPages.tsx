import { lazy } from 'react';

export const DemoRolesPage = lazy(() => import('@/pages/shared/DemoRolesPage'));
export const OnboardingPage = lazy(() => import('@/pages/shared/OnboardingPage'));
export const SettingsPage = lazy(() => import('@/pages/shared/SettingsPage'));
export const ProfilePage = lazy(() => import('@/pages/shared/ProfilePage'));

export const TeachingPage = lazy(() => import('@/pages/student/TeachingPage'));
export const DashboardPage = lazy(() => import('@/pages/student/DashboardPage'));
export const CurriculumPage = lazy(() => import('@/pages/student/CurriculumPage'));
export const StudentModeSelectionPage = lazy(
  () => import('@/pages/student/StudentModeSelectionPage'),
);
export const StudentCompetitivePage = lazy(
  () => import('@/pages/student/StudentCompetitivePage'),
);
export const CompetitiveTeachingPage = lazy(
  () => import('@/pages/student/CompetitiveTeachingPage'),
);

export const TeacherDashboardPage = lazy(
  () => import('@/pages/teacher/TeacherDashboardPage'),
);

export const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
export const AdminProductAnalyticsPage = lazy(
  () => import('@/pages/admin/AdminProductAnalyticsPage'),
);
export const AdminWeeklyExamsPage = lazy(
  () => import('@/pages/admin/AdminWeeklyExamsPage'),
);
export const AdminCurriculumContentPage = lazy(
  () => import('@/pages/admin/AdminCurriculumContentPage'),
);
