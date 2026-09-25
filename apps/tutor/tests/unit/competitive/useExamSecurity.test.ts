import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExamSecurity } from '@/features/competitive/exam/useExamSecurity';

const policy = {
  cameraRequired: false,
  microphoneRequired: false,
  fullscreenRequired: true,
  tabMonitoringEnabled: true,
  maxSecurityViolations: 2,
};

describe('useExamSecurity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    });
    document.hasFocus = () => true;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('coalesces blur + visibility into one violation within the debounce window', () => {
    const onAutoSubmit = vi.fn();
    const { result } = renderHook(() =>
      useExamSecurity({ enabled: true, policy, onAutoSubmit }),
    );

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('blur'));
      vi.advanceTimersByTime(900);
    });

    expect(result.current.violationCount).toBe(1);
    expect(result.current.warningOpen).toBe(true);
    expect(onAutoSubmit).not.toHaveBeenCalled();
  });

  it('auto-submits exactly once at the violation threshold', () => {
    const onAutoSubmit = vi.fn();
    const { result } = renderHook(() =>
      useExamSecurity({ enabled: true, policy, onAutoSubmit }),
    );

    act(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => null,
      });
      document.dispatchEvent(new Event('fullscreenchange'));
      vi.advanceTimersByTime(900);
    });
    expect(result.current.violationCount).toBe(1);

    act(() => {
      result.current.dismissWarning();
    });

    act(() => {
      vi.advanceTimersByTime(1600);
      document.dispatchEvent(new Event('fullscreenchange'));
      vi.advanceTimersByTime(900);
    });

    expect(result.current.violationCount).toBe(2);
    expect(result.current.autoSubmitted).toBe(true);
    expect(onAutoSubmit).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1600);
      document.dispatchEvent(new Event('fullscreenchange'));
      vi.advanceTimersByTime(900);
    });
    expect(onAutoSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not count violations while suppressed', () => {
    const onAutoSubmit = vi.fn();
    const { result } = renderHook(() =>
      useExamSecurity({
        enabled: true,
        policy,
        onAutoSubmit,
        suppressViolations: true,
      }),
    );

    act(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => null,
      });
      document.dispatchEvent(new Event('fullscreenchange'));
      vi.advanceTimersByTime(900);
    });

    expect(result.current.violationCount).toBe(0);
    expect(onAutoSubmit).not.toHaveBeenCalled();
  });
});
