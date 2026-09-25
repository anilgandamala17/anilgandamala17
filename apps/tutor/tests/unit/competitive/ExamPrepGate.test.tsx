import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ExamPrepGate from '@/features/competitive/exam/ExamPrepGate';
import type { ExamConfig } from '@/features/competitive/exam/examConfig';

const config: ExamConfig = {
  examId: 'jee-main',
  name: 'JEE Main',
  durationMinutes: 180,
  totalQuestions: 90,
  maximumMarks: 360,
  sections: [
    { id: 'physics', name: 'Physics', questionsCount: 30 },
    { id: 'chemistry', name: 'Chemistry', questionsCount: 30 },
    { id: 'mathematics', name: 'Mathematics', questionsCount: 30 },
  ],
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
  },
};

describe('ExamPrepGate', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
  });

  it('renders instructions stage with Continue to system check', () => {
    render(
      <ExamPrepGate
        config={config}
        stage="instructions"
        onBack={vi.fn()}
        onContinueToChecks={vi.fn()}
        onStartExamination={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /jee main/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to system check/i })).toBeInTheDocument();
  });

  it('renders system check statuses for camera, microphone, and fullscreen', async () => {
    render(
      <ExamPrepGate
        config={config}
        stage="system-check"
        onBack={vi.fn()}
        onContinueToChecks={vi.fn()}
        onStartExamination={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /system check/i })).toBeInTheDocument();
    expect(screen.getByText(/camera/i)).toBeInTheDocument();
    expect(screen.getByText(/microphone/i)).toBeInTheDocument();
    expect(screen.getByText(/fullscreen/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start examination/i })).toBeInTheDocument();
    });
  });
});
