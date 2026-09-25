import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExamResultReport from '@/features/competitive/exam/ExamResultReport';
import type { Question } from '@/features/competitive/data/competitiveQuestions';

const questions: Question[] = [
  {
    id: 'q1',
    text: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
    explanation: 'Basic addition.',
    difficulty: 'Easy',
    topic: 'Arithmetic',
    examYear: '2024',
    subjectId: 'math',
    subjectName: 'Mathematics',
  },
  {
    id: 'q2',
    text: 'What is 3 + 3?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 1,
    explanation: '',
    difficulty: 'Easy',
    topic: 'Arithmetic',
    examYear: '2024',
    subjectId: 'math',
    subjectName: 'Mathematics',
  },
  {
    id: 'q3',
    text: 'What is 4 + 4?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    explanation: 'Eight.',
    difficulty: 'Easy',
    topic: 'Arithmetic',
    examYear: '2024',
    subjectId: 'math',
    subjectName: 'Mathematics',
  },
];

const markingScheme = {
  correctMarks: 4,
  incorrectMarks: -1,
  unansweredMarks: 0,
  negativeMarking: true,
};

describe('ExamResultReport', () => {
  const userAnswers = [1, 0, -1]; // correct, incorrect, unattempted
  const reviewItems = [
    { question: questions[0], index: 0, status: 'correct' as const },
    { question: questions[1], index: 1, status: 'incorrect' as const },
    { question: questions[2], index: 2, status: 'unattempted' as const },
  ];

  const baseProps = {
    accentColor: '#ea580c',
    examName: 'JEE Main',
    scopeLabel: 'Full examination',
    paperYear: 2024,
    rawScore: 3,
    maxScore: 12,
    accuracyPercent: 33,
    attemptPercent: 67,
    correctCount: 1,
    incorrectCount: 1,
    unattemptedCount: 1,
    attemptedCount: 2,
    questionCount: 3,
    timeTakenSeconds: 125,
    formatTime: (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
    markingScheme,
    reviewFilter: 'all' as const,
    onReviewFilterChange: vi.fn(),
    reviewItems,
    userAnswers,
    explainBuildingId: null,
    isGenerating: false,
    onExit: vi.fn(),
    onRetake: vi.fn(),
    onExplainWithAI: vi.fn(),
  };

  it('renders score, metrics, and status labels without inventing data', () => {
    render(<ExamResultReport {...baseProps} />);
    expect(screen.getByRole('heading', { name: /jee main/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/net score/i)).toHaveTextContent('3');
    expect(screen.getByLabelText(/net score/i)).toHaveTextContent('/12');
    expect(screen.getAllByText('33%').length).toBeGreaterThan(0);
    expect(screen.getByText(/2:05/)).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /question 1, correct/i })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /question 2, incorrect/i })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /question 3, not attempted/i })).toBeInTheDocument();
  });

  it('keeps user and correct answers unchanged when question card is clicked', async () => {
    const user = userEvent.setup();
    render(<ExamResultReport {...baseProps} />);
    const q1 = screen.getByRole('article', { name: /question 1, correct/i });
    await user.click(within(q1).getByRole('button', { name: /view options/i }));
    expect(within(q1).getByText('✓ Correct')).toBeInTheDocument();
    expect(within(q1).getByText('✓ Your answer')).toBeInTheDocument();
    expect(within(q1).getByText('Basic addition.')).toBeInTheDocument();

    const q2 = screen.getByRole('article', { name: /question 2, incorrect/i });
    await user.click(within(q2).getByRole('button', { name: /view options/i }));
    expect(within(q2).getByText(/✕ Your answer — Incorrect/i)).toBeInTheDocument();
    expect(within(q2).getByText('No explanation available for this question.')).toBeInTheDocument();
  });

  it('exposes aria-expanded on full question card disclosure controls', async () => {
    const user = userEvent.setup();
    render(<ExamResultReport {...baseProps} />);
    const q1 = screen.getByRole('article', { name: /question 1, correct/i });
    const toggle = within(q1).getByRole('button', { name: /view options/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAccessibleName(/hide options/i);
  });

  it('preserves score, counts, and marking marks in compact layout', () => {
    render(<ExamResultReport {...baseProps} />);
    const metrics = screen.getByLabelText(/score metrics/i);
    expect(within(metrics).getByText('3 / 12')).toBeInTheDocument();
    expect(within(metrics).getByText('2 / 3')).toBeInTheDocument();

    const overview = screen.getByRole('region', { name: /performance overview/i });
    expect(within(overview).getByText(/✓ Correct/i)).toBeInTheDocument();
    expect(within(overview).getByText(/✕ Incorrect/i)).toBeInTheDocument();
    expect(within(overview).getByText(/— Not Attempted/i)).toBeInTheDocument();
    expect(
      within(overview).getByLabelText(/Correct 1, incorrect 1, not attempted 1/i),
    ).toBeInTheDocument();

    const q1 = screen.getByRole('article', { name: /question 1, correct/i });
    expect(within(q1).getByText('+4')).toBeInTheDocument();
    expect(within(q1).getByText((_, el) => el?.classList.contains('comp-result-q__answers') === true)).toHaveTextContent(
      /Your answer:\s*B\s*·\s*Correct:\s*B/i,
    );

    const q2 = screen.getByRole('article', { name: /question 2, incorrect/i });
    expect(within(q2).getByText('-1')).toBeInTheDocument();
    expect(within(q2).getByText((_, el) => el?.classList.contains('comp-result-q__answers') === true)).toHaveTextContent(
      /Your answer:\s*A\s*·\s*Correct:\s*B/i,
    );

    const q3 = screen.getByRole('article', { name: /question 3, not attempted/i });
    expect(within(q3).getByText('0')).toBeInTheDocument();
    expect(within(q3).getByText((_, el) => el?.classList.contains('comp-result-q__answers') === true)).toHaveTextContent(
      /Not attempted\s*·\s*Correct:\s*C/i,
    );
  });

  it('invokes existing review filter callback without inventing filters', async () => {
    const user = userEvent.setup();
    const onReviewFilterChange = vi.fn();
    render(<ExamResultReport {...baseProps} onReviewFilterChange={onReviewFilterChange} />);
    await user.click(screen.getByRole('tab', { name: /Incorrect/i }));
    expect(onReviewFilterChange).toHaveBeenCalledWith('incorrect');
  });
});
