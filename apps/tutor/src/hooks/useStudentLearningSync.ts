import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/stores/authStore';
import { startStudentLearningSync, stopStudentLearningSync } from '@/services/studentLearningSync';

/** Keep curriculum dashboard progress/likes live for the signed-in student. */
export function useStudentLearningSync(): void {
  const { userId, isGuest, isDemo, role, isAuthenticated, authReady } = useAuthStore(
    useShallow((s) => ({
      userId: s.user?.id ?? null,
      isGuest: s.isGuest,
      isDemo: s.isDemo,
      role: s.role,
      isAuthenticated: s.isAuthenticated,
      authReady: s.authReady,
    })),
  );

  useEffect(() => {
    if (!authReady || !isAuthenticated || role !== 'student' || !userId) {
      stopStudentLearningSync();
      return;
    }
    startStudentLearningSync({ userId, isGuest, isDemo });
    return () => {
      stopStudentLearningSync();
    };
  }, [authReady, isAuthenticated, role, userId, isGuest, isDemo]);
}

export function StudentLearningSyncBridge() {
  useStudentLearningSync();
  return null;
}
