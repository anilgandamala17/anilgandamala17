import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTeachingStore } from '@/features/teaching/stores/teachingStore';
import { changeLanguage } from '@/i18n';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ToastContainer from '@/components/common/Toast';
import { useToastStore } from '@/stores/toastStore';
import ScrollToTop from '@/components/common/ScrollToTop';
import { unlockAudioContext } from '@/utils/audioUnlock';
import {
  analytics,
  fireTemporaryAnalyticsDebugTest,
  installGlobalAnalyticsErrorHooks,
  reportNavigationTiming,
} from '@/services/analyticsService';
import { StudentLearningSyncBridge } from '@/hooks/useStudentLearningSync';
import { readDemoSession, subscribeDemoSession } from '@/lib/demoSession';
import { HydrationGuard } from '@/routes/guards';
import { AppRoutes } from '@/routes';

const VERIFICATION_RELOAD_DEBOUNCE_MS = 3000;

/** Sync landing demo session (localStorage) into the tutor Zustand store. */
function MockAuthBridge() {
  const applyDemoSession = useAuthStore((s) => s.applyDemoSession);
  const refreshFirebaseUser = useAuthStore((s) => s.refreshFirebaseUser);

  useEffect(() => {
    installGlobalAnalyticsErrorHooks();
    fireTemporaryAnalyticsDebugTest();
    void applyDemoSession(readDemoSession());
    return subscribeDemoSession((session) => {
      void applyDemoSession(session);
    });
  }, [applyDemoSession]);

  useEffect(() => {
    let lastReloadAt = 0;
    const maybeReloadVerification = () => {
      const state = useAuthStore.getState();
      if (!state.authReady || !state.isAuthenticated || state.isDemo || state.isGuest) return;
      if (!state.user || state.user.authMethod !== 'email' || state.user.isVerified) return;
      const now = Date.now();
      if (now - lastReloadAt < VERIFICATION_RELOAD_DEBOUNCE_MS) return;
      lastReloadAt = now;
      void refreshFirebaseUser();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') maybeReloadVerification();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) maybeReloadVerification();
    };
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [refreshFirebaseUser]);

  return null;
}

function AnalyticsRouteReporter() {
  const location = useLocation();
  useEffect(() => {
    analytics.pageView(location.pathname);
    reportNavigationTiming(location.pathname);
  }, [location.pathname]);
  return null;
}

function SettingsEffect() {
  const settings = useSettingsStore((state) => state.settings);
  const setTeachingSpeaking = useTeachingStore((state) => state.setSpeaking);

  useEffect(() => {
    const html = document.documentElement;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    if (settings.theme === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
      themeColorMeta?.setAttribute('content', '#020617');
    } else if (settings.theme === 'light') {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
      themeColorMeta?.setAttribute('content', '#a855f7');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        html.classList.add('dark');
        html.setAttribute('data-theme', 'dark');
        themeColorMeta?.setAttribute('content', '#020617');
      } else {
        html.classList.remove('dark');
        html.setAttribute('data-theme', 'light');
        themeColorMeta?.setAttribute('content', '#a855f7');
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          html.classList.add('dark');
          html.setAttribute('data-theme', 'dark');
          themeColorMeta?.setAttribute('content', '#020617');
        } else {
          html.classList.remove('dark');
          html.setAttribute('data-theme', 'light');
          themeColorMeta?.setAttribute('content', '#a855f7');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', settings.accessibility.fontSize);
  }, [settings.accessibility.fontSize]);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-high-contrast',
      settings.accessibility.highContrast ? 'true' : 'false',
    );
  }, [settings.accessibility.highContrast]);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-reduce-animations',
      settings.accessibility.reduceAnimations ? 'true' : 'false',
    );
  }, [settings.accessibility.reduceAnimations]);

  useEffect(() => {
    document.documentElement.lang = settings.language;
    changeLanguage(settings.language);
  }, [settings.language]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('app-settings-changed', { detail: settings }));
  }, [settings]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (!settings.accessibility.textToSpeech) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      setTeachingSpeaking(false);
    }
  }, [settings.accessibility.textToSpeech, setTeachingSpeaking]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudioContext();
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('touchend', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });
    document.addEventListener('touchend', handleFirstInteraction, { once: true, passive: true });
    document.addEventListener('click', handleFirstInteraction, { once: true });
    return () => {
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('touchend', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  return null;
}

function App() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  const reduceAnimations = useSettingsStore(
    (state) => state.settings.accessibility.reduceAnimations,
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const warmup = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener('voiceschanged', warmup);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', warmup);
    }
  }, []);

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion={reduceAnimations ? 'always' : 'never'}>
        <BrowserRouter>
          <ScrollToTop />
          <SettingsEffect />
          <HydrationGuard>
            <MockAuthBridge />
            <StudentLearningSyncBridge />
            <AnalyticsRouteReporter />
            <AppRoutes />
          </HydrationGuard>
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
