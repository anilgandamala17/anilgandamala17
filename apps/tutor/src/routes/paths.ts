import type { AppRole } from '@/types';

export const roleBase: Record<AppRole, string> = {
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
};

export type RoleRoutes = typeof studentRoutes | typeof teacherRoutes | typeof adminRoutes;

export function studentPath(path: string): string {
  return path.startsWith('/') ? `/student${path}` : `/student/${path}`;
}

export function teacherPath(path: string): string {
  return path.startsWith('/') ? `/teacher${path}` : `/teacher/${path}`;
}

export function adminPath(path: string): string {
  return path.startsWith('/') ? `/admin${path}` : `/admin/${path}`;
}

export function rolePath(role: AppRole, path: string): string {
  const base = roleBase[role];
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function getRoleFromPath(pathname: string): AppRole | null {
  if (pathname.startsWith('/student')) return 'student';
  if (pathname.startsWith('/teacher')) return 'teacher';
  if (pathname.startsWith('/admin')) return 'admin';
  return null;
}

export const studentRoutes = {
  modeSelection: '/student/mode-selection',
  onboarding: '/student/onboarding',
  dashboard: '/student/dashboard',
  curriculum: '/student/curriculum',
  competitive: '/student/competitive',
  competitiveExplain: '/student/competitive-explain',
  learn: (topicId?: string) => (topicId ? `/student/learn/${topicId}` : '/student/learn'),
  settings: '/student/settings',
  profile: '/student/profile',
};

/**
 * Home control while already inside a student mode.
 * Curriculum lessons/browser chrome go to the student dashboard (not mode picker).
 * Competitive stays on the competitive hub.
 */
export function studentHomeForMode(mode: 'curriculum' | 'competitive'): string {
  return mode === 'competitive' ? studentRoutes.competitive : studentRoutes.dashboard;
}

export const teacherRoutes = {
  dashboard: '/teacher/dashboard',
  settings: '/teacher/settings',
  profile: '/teacher/profile',
};

export const adminRoutes = {
  dashboard: '/admin/dashboard',
  analytics: '/admin/analytics',
  weeklyExams: '/admin/weekly-exams',
  curriculumContent: '/admin/curriculum-content',
  settings: '/admin/settings',
  profile: '/admin/profile',
};

/** Returns the route set for the current role; defaults to student if no role. */
export function getRoutesForRole(role: AppRole | null): RoleRoutes {
  if (role === 'teacher') return teacherRoutes;
  if (role === 'admin') return adminRoutes;
  return studentRoutes;
}
