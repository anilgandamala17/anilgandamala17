import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LiveExamPanel from '@/features/competitive/exam/LiveExamPanel';
import type { Exam } from '@/data/mockData';
import type { Question } from '@/features/competitive/data/competitiveQuestions';

const exam = {
  id: 'jee-main',
  name: 'JEE Main',
  timeMinutes: 180,
  subjects: [],
  papers: [],
} as Exam;

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
    subjectId: 'mathematics',
    subjectName: 'Mathematics',
    questionNumber: 1,
  },
  {
    id: 'q2',
    text: 'What is 3 + 3?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 1,
    explanation: 'Basic addition.',
    difficulty: 'Easy',
    topic: 'Arithmetic',
    examYear: '2024',
    subjectId: 'mathematics',
    subjectName: 'Mathematics',
    questionNumber: 2,
  },
];

const noop = vi.fn();

describe('LiveExamPanel', () => {
  it('renders question, Next, and Review & Submit on mobile action bar', () => {
    render(
      <LiveExamPanel
        exam={exam}
        subjectName="Mathematics"
        questions={questions}
        currentQuestionIndex={0}
        userAnswers={[-1, -1]}
        visitedQuestions={[true, false]}
        markedForReview={[false, false]}
        timeLeftSeconds={3600}
        bookmarked={[false, false]}
        notes={{}}
        onAnswerSelect={noop}
        onNavigate={noop}
        onClear={noop}
        onSaveAndNext={noop}
        onMarkAndNext={noop}
        onPrevious={noop}
        onSubmit={noop}
      />,
    );

    expect(screen.getByRole('heading', { name: /what is 2 \+ 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save and go to next question/i })).toBeInTheDocument();
    expect(screen.getAllByRole('timer', { name: /exam timer/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /review and submit test/i }).length).toBeGreaterThan(0);
  });

  it('shows Save on the final question', () => {
    render(
      <LiveExamPanel
        exam={exam}
        subjectName="Mathematics"
        questions={questions}
        currentQuestionIndex={1}
        userAnswers={[1, -1]}
        visitedQuestions={[true, true]}
        markedForReview={[false, false]}
        timeLeftSeconds={3600}
        bookmarked={[false, false]}
        notes={{}}
        onAnswerSelect={noop}
        onNavigate={noop}
        onClear={noop}
        onSaveAndNext={noop}
        onMarkAndNext={noop}
        onPrevious={noop}
        onSubmit={noop}
      />,
    );

    expect(screen.getByRole('button', { name: /^save answer$/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /review and submit test/i }).length).toBeGreaterThan(0);
  });
});
