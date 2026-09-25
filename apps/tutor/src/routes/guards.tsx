import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCompetitiveStore } from '@/features/competitive/stores/competitiveStore';
import FullPageLoader from '@/components/common/FullPageLoader';
import { getRoleFromPath } from '@/routes/paths';
import type { AppRole } from '@/types';
import {
  homeForRole,
  loginReturnPathForRole,
  needsEmailVerification,
  redirectAfterSignOut,
  redirectToLandingLogin,
  redirectToLandingVerifyEmail,
} from '@/lib/authSession';
import { shouldAutoElevateDemoRole } from '@/lib/demoRoleElevation';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authReady = useAuthStore((state) => state.authReady);
  const role = useAuthStore((state) => state.role);
  const setRole = useAuthStore((state) => state.setRole);
  const user = useAuthStore((state) => state.user);
  const isDemo = useAuthStore((state) => state.isDemo);
  const isGuest = useAuthStore((state) => state.isGuest);
  const location = useLocation();
  const refreshFirebaseUser = useAuthStore((s) => s.refreshFirebaseUser);
  const [verificationCheckDone, setVerificationCheckDone] = useState(false);
  const mustVerify = needsEmailVerification({ isDemo, isGuest, user });

  useEffect(() => {
    if (isAuthenticated && !role) {
      setRole('student');
    }
  }, [isAuthenticated, role, setRole]);

  useEffect(() => {
    if (!authReady || !isAuthenticated || isDemo || isGuest) {
      setVerificationCheckDone(true);
      return;
    }
    if (!mustVerify) {
      setVerificationCheckDone(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      await refreshFirebaseUser();
      if (!cancelled) setVerificationCheckDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, isAuthenticated, isDemo, isGuest, mustVerify, refreshFirebaseUser]);

  useEffect(() => {
    if (!authReady || isAuthenticated) return;
    const pathRole = getRoleFromPath(location.pathname);
    const returnPath = loginReturnPathForRole(pathRole);
    redirectToLandingLogin(returnPath);
  }, [authReady, isAuthenticated, location.pathname]);

  useEffect(() => {
    if (!authReady || !isAuthenticated || !verificationCheckDone) return;
    const currentUser = useAuthStore.getState().user;
    const stillMustVerify = needsEmailVerification({
      isDemo,
      isGuest,
      user: currentUser,
    });
    if (!stillMustVerify) return;
    const pathRole = getRoleFromPath(location.pathname);
    redirectToLandingVerifyEmail(loginReturnPathForRole(pathRole));
  }, [authReady, isAuthenticated, verificationCheckDone, isDemo, isGuest, location.pathname]);

  useEffect(() => {
    if (!authReady) return;
    useCompetitiveStore.getState().bindUser(user?.id ?? null);
  }, [authReady, user?.id]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const state = useAuthStore.getState();
      if (!state.authReady) return;
      if (!state.isAuthenticated) {
        redirectAfterSignOut();
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  if (!authReady) {
    return <FullPageLoader message="Signing you in" />;
  }

  if (!isAuthenticated) {
    return <FullPageLoader message="Redirecting to sign in…" />;
  }

  if (!verificationCheckDone) {
    return <FullPageLoader message="Checking verification status…" />;
  }

  if (mustVerify) {
    return <FullPageLoader message="Verify your email to continue…" />;
  }

  if (!role) {
    return <FullPageLoader message="Signing you in" />;
  }

  return <>{children}</>;
}

export function RoleGuard({
  allowedRole,
  children,
}: {
  allowedRole: AppRole;
  children: ReactNode;
}) {
  const role = useAuthStore((state) => state.role);
  const isDemo = useAuthStore((state) => state.isDemo);
  const location = useLocation();
  const pathRole = getRoleFromPath(location.pathname);

  // Production builds must not auto-elevate roles via URL. Demo role switching
  // remains available in DEV (and via /dev/demo-roles for authenticated admins).
  const needsDemoSwitch = shouldAutoElevateDemoRole({
    isDev: import.meta.env.DEV,
    isDemo,
    pathRole,
    allowedRole,
    currentRole: role,
  });

  useEffect(() => {
    if (!needsDemoSwitch || !pathRole) return;
    const store = useAuthStore.getState();
    if (pathRole === 'student') store.enterStudentDemo();
    else if (pathRole === 'teacher') store.enterTeacherDemo();
    else if (pathRole === 'admin') store.enterAdminDemo();
  }, [needsDemoSwitch, pathRole]);

  if (needsDemoSwitch) {
    return <FullPageLoader message="Signing you in" />;
  }

  if (role !== allowedRole || pathRole !== allowedRole) {
    return <Navigate to={homeForRole(role)} replace />;
  }

  return <>{children}</>;
}

/** Demo role switcher — only in DEV or for authenticated admins. */
export function DemoRolesGate({ children }: { children: ReactNode }) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const location = useLocation();

  useEffect(() => {
    if (!authReady) return;
    const allowed = import.meta.env.DEV || (isAuthenticated && role === 'admin');
    if (!allowed) {
      redirectToLandingLogin(`${location.pathname}${location.search}`);
    }
  }, [authReady, isAuthenticated, role, location.pathname, location.search]);

  if (!authReady) return <FullPageLoader message="Signing you in" />;
  const allowed = import.meta.env.DEV || (isAuthenticated && role === 'admin');
  if (!allowed) return <FullPageLoader message="Redirecting…" />;
  return <>{children}</>;
}

export function HydrationGuard({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsubFinishHydration = useAuthStore.persist.onFinishHydration(() =>
      setIsHydrated(true),
    );
    setIsHydrated(useAuthStore.persist.hasHydrated());
    return unsubFinishHydration;
  }, []);

  if (!isHydrated) {
    return <FullPageLoader message="Signing you in" />;
  }

  return <>{children}</>;
}

export function RootRedirect() {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      redirectToLandingLogin(homeForRole(role));
    }
  }, [authReady, isAuthenticated, role]);

  if (!authReady) return <FullPageLoader message="Signing you in" />;
  if (!isAuthenticated) return <FullPageLoader message="Redirecting to sign in…" />;
  return <Navigate to={homeForRole(role)} replace />;
}

export function LoginRedirect() {
  useEffect(() => {
    redirectToLandingLogin(homeForRole(useAuthStore.getState().role));
  }, []);
  return <FullPageLoader message="Redirecting to sign in…" />;
}
