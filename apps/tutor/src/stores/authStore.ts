// FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState, AppRole } from '../types';
import { useCurriculumStore } from './curriculumStore';
import { normalizeAppRole } from '../lib/authSession';
import { clearRoleHint, readRoleHint, writeRoleHint } from '../lib/sessionHints';
import { analytics } from '../services/analyticsService';
import {
  clearDemoSession,
  createDemoSession,
  mapDemoSessionToUser,
  readDemoSession,
  writeDemoSession,
  type DemoSession,
} from '../lib/demoSession';

function normalizeEmailAppRole(role?: AppRole): AppRole {
  return normalizeAppRole(role);
}

interface AuthStore extends AuthState {
  /** True after first mock-session hydration. */
  authReady: boolean;
  login: (user: User) => void;
  setRole: (role: AppRole) => void;
  updateDisplayName: (name: string) => Promise<void>;
  /** Apply a landing demo session into the tutor store. */
  applyDemoSession: (session: DemoSession | null) => Promise<void>;
  /** @deprecated Alias for applyDemoSession — kept for call-site compatibility. */
  applyFirebaseUser: (fbUser: { uid: string } | null) => Promise<void>;
  refreshFirebaseUser: () => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  loginWithEmail: (email: string, password: string, appRole?: AppRole) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, appRole?: AppRole) => Promise<void>;
  loginWithRollNumber: (rollNumber: string, dob: string) => Promise<void>;
  signUpWithRollNumber: (rollNumber: string, dob: string, name: string) => Promise<void>;
  continueAsGuest: () => void;
  skipToDemo: () => void;
  enterStudentDemo: () => void;
  enterTeacherDemo: () => void;
  enterAdminDemo: () => void;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const createGuestUser = (): User => ({
  id: 'guest_' + Date.now(),
  email: 'guest@aitutor.demo',
  name: 'Guest User',
  displayName: 'Guest',
  authMethod: 'guest',
  isVerified: false,
  createdAt: new Date().toISOString(),
});

const createDemoUser = (roleLabel: string): User => ({
  id: `demo_${roleLabel}_${Date.now()}`,
  email: `demo-${roleLabel}@aitutor.app`,
  name: `${roleLabel} Demo User`,
  displayName: `${roleLabel} Demo`,
  authMethod: 'email',
  isVerified: true,
  createdAt: new Date().toISOString(),
});

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isGuest: false,
      role: null,
      isDemo: false,
      authReady: false,

      login: (user) =>
        set({
          user,
          isAuthenticated: true,
          isGuest: user.authMethod === 'guest',
          role: 'student',
          isDemo: false,
        }),

      setRole: (role) => set({ role }),

      updateDisplayName: async (name) => {
        const trimmed = name.trim();
        const current = get().user;
        if (!trimmed || !current) return;
        const session = readDemoSession();
        if (session && session.uid === current.id) {
          writeDemoSession({ ...session, displayName: trimmed });
        }
        set({ user: { ...current, name: trimmed, displayName: trimmed } });
      },

      applyDemoSession: async (session) => {
        if (!session) {
          if (get().isDemo) {
            set({
              authReady: true,
              isAuthenticated: Boolean(get().user),
              isGuest: false,
            });
            return;
          }
          void analytics.clearUser();
          set({
            user: null,
            isAuthenticated: false,
            isGuest: false,
            role: null,
            isDemo: false,
            isLoading: false,
            authReady: true,
          });
          return;
        }

        const user = mapDemoSessionToUser(session);
        const role = normalizeAppRole(
          session.role || readRoleHint() || get().role || 'student',
        );
        void analytics.setUser(session.uid);
        void analytics.setUserProperties({ user_role: role });
        writeRoleHint(role);
        set({
          user,
          isAuthenticated: true,
          isGuest: false,
          role,
          isDemo: false,
          isLoading: false,
          authReady: true,
        });
      },

      applyFirebaseUser: async (fbUser) => {
        if (!fbUser) {
          await get().applyDemoSession(null);
          return;
        }
        const session = readDemoSession();
        if (session?.uid === fbUser.uid) {
          await get().applyDemoSession(session);
          return;
        }
        await get().applyDemoSession(session);
      },

      refreshFirebaseUser: async () => {
        const session = readDemoSession();
        await get().applyDemoSession(session);
        return true;
      },

      loginWithGoogle: async () => {
        set({ isLoading: true });
        try {
          const session = createDemoSession({
            email: 'demo.google@aira.local',
            displayName: 'Google Demo',
            role: 'student',
            providerId: 'google.com',
          });
          writeDemoSession(session);
          await get().applyDemoSession(session);
          set({ isLoading: false });
        } catch (error) {
          console.error('Google login failed:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithApple: async () => {
        set({ isLoading: true });
        try {
          const session = createDemoSession({
            email: 'demo.apple@aira.local',
            displayName: 'Apple Demo',
            role: 'student',
            providerId: 'apple.com',
          });
          writeDemoSession(session);
          await get().applyDemoSession(session);
          set({ isLoading: false });
        } catch (error) {
          console.error('Apple login failed:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithEmail: async (email, password, appRole) => {
        set({ isLoading: true });
        try {
          void password;
          const role = appRole
            ? normalizeEmailAppRole(appRole)
            : normalizeEmailAppRole(readRoleHint() ?? 'student');
          const session = createDemoSession({
            email,
            displayName: email.split('@')[0],
            role,
            providerId: 'password',
          });
          writeDemoSession(session);
          await get().applyDemoSession(session);
          set({ isLoading: false });
        } catch (error) {
          console.error('Email login failed:', error);
          set({ isLoading: false });
          throw new Error('Sign in failed. Please check your email and password.');
        }
      },

      signUpWithEmail: async (email, password, name, appRole) => {
        set({ isLoading: true });
        try {
          void password;
          const app = normalizeEmailAppRole(appRole);
          const session = createDemoSession({
            email,
            displayName: name,
            role: app,
            providerId: 'password',
          });
          writeDemoSession(session);
          await get().applyDemoSession(session);
          set({ isLoading: false });
        } catch (error) {
          console.error('Email signup failed:', error);
          set({ isLoading: false });
          throw new Error('Could not create your account. Please try again.');
        }
      },

      loginWithRollNumber: async (rollNumber, dob) => {
        set({ isLoading: true });
        try {
          const session = createDemoSession({
            email: `${rollNumber.toLowerCase()}@aitutor.internal`,
            displayName: `Student ${rollNumber}`,
            role: 'student',
            providerId: 'password',
          });
          void dob;
          writeDemoSession(session);
          await get().applyDemoSession(session);
          set({ isLoading: false });
        } catch (error) {
          console.error('Roll number login failed:', error);
          set({ isLoading: false });
          throw new Error('Invalid Roll Number or Date of Birth');
        }
      },

      signUpWithRollNumber: async (rollNumber, dob, name) => {
        set({ isLoading: true });
        try {
          void dob;
          const session = createDemoSession({
            email: `${rollNumber.toLowerCase()}@aitutor.internal`,
            displayName: name,
            role: 'student',
            providerId: 'password',
          });
          writeDemoSession(session);
          await get().applyDemoSession(session);
          set({ isLoading: false });
        } catch (error) {
          console.error('Roll number signup failed:', error);
          set({ isLoading: false });
          throw new Error('Registration failed. Please try again.');
        }
      },

      continueAsGuest: () => {
        const user = createGuestUser();
        set({ user, isAuthenticated: true, isGuest: true, role: 'student', isDemo: false });
      },

      skipToDemo: () => {
        const user = createDemoUser('Student');
        clearRoleHint();
        set({ user, isAuthenticated: true, isGuest: false, role: 'student', isDemo: true });
      },

      enterStudentDemo: () => {
        const user = createDemoUser('Student');
        clearRoleHint();
        writeRoleHint('student');
        set({ user, isAuthenticated: true, isGuest: false, role: 'student', isDemo: true });
      },

      enterTeacherDemo: () => {
        const user = createDemoUser('Teacher');
        clearRoleHint();
        writeRoleHint('teacher');
        set({ user, isAuthenticated: true, isGuest: false, role: 'teacher', isDemo: true });
      },

      enterAdminDemo: () => {
        const user = createDemoUser('Admin');
        clearRoleHint();
        set({ user, isAuthenticated: true, isGuest: false, role: 'admin', isDemo: true });
      },

      logout: async () => {
        clearDemoSession();
        analytics.logout();
        useCurriculumStore.getState().clearSelection();
        clearRoleHint();
        set({
          user: null,
          isAuthenticated: false,
          isGuest: false,
          role: null,
          isDemo: false,
        });
      },

      recoverPassword: async (_email) => {
        void _email;
        // FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
        await new Promise((resolve) => setTimeout(resolve, 400));
      },

      resetPassword: async (_token, _newPassword) => {
        void _token;
        void _newPassword;
        // FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
        await new Promise((resolve) => setTimeout(resolve, 400));
      },
    }),
    {
      name: 'ai-tutor-auth',
      version: 5,
      partialize: (state) => ({
        role: state.role,
        isDemo: state.isDemo,
        user: state.isDemo ? state.user : null,
      }),
      migrate: () => ({
        user: null,
        isAuthenticated: false,
        isGuest: false,
        role: null,
        isDemo: false,
      }),
    },
  ),
);
