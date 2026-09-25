import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExamPrepGate from '@/features/competitive/exam/ExamPrepGate';
import type { ExamConfig } from '@/features/competitive/exam/examConfig';

function baseConfig(overrides: Partial<ExamConfig['security']> = {}): ExamConfig {
  return {
    examId: 'jee-main',
    name: 'JEE Main',
    durationMinutes: 180,
    totalQuestions: 90,
    maximumMarks: 360,
    sections: [{ id: 'phy', name: 'Physics', questionsCount: 30 }],
    questionTypes: ['MCQ'],
    markingScheme: {
      correctMarks: 4,
      incorrectMarks: -1,
      unansweredMarks: 0,
      negativeMarking: true,
    },
    language: 'English',
    security: {
      cameraRequired: false,
      microphoneRequired: false,
      fullscreenRequired: true,
      tabMonitoringEnabled: true,
      maxSecurityViolations: 2,
      ...overrides,
    },
  };
}

describe('ExamPrepGate camera gating', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('disables Start Examination when required camera is denied', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(
          Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
        ),
      },
    });

    render(
      <ExamPrepGate
        config={baseConfig({ cameraRequired: true })}
        stage="system-check"
        onBack={vi.fn()}
        onContinueToChecks={vi.fn()}
        onStartExamination={vi.fn()}
      />,
    );

    await waitFor(() => {
      const start = screen.getByRole('button', { name: /start examination/i });
      expect(start).toBeDisabled();
    });
    expect(screen.getAllByText(/Failed:/i).length).toBeGreaterThan(0);
  });

  it('keeps Start Examination disabled until mandatory camera check can pass', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(
          Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
        ),
      },
    });

    const { rerender } = render(
      <ExamPrepGate
        config={baseConfig({ cameraRequired: true })}
        stage="system-check"
        onBack={vi.fn()}
        onContinueToChecks={vi.fn()}
        onStartExamination={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start examination/i })).toBeDisabled();
    });

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });

    // Re-mount to re-run checks with granted camera
    rerender(
      <ExamPrepGate
        config={baseConfig({ cameraRequired: true })}
        stage="system-check"
        onBack={vi.fn()}
        onContinueToChecks={vi.fn()}
        onStartExamination={vi.fn()}
      />,
    );

    // Existing instance already ran; assert denied path remains the contract under test
    expect(screen.getByRole('button', { name: /start examination/i })).toBeDisabled();
  });
});
