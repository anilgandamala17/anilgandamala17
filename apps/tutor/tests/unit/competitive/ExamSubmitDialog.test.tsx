import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExamSubmitDialog from '@/features/competitive/exam/ExamSubmitDialog';

describe('ExamSubmitDialog', () => {
  const base = {
    unansweredCount: 2,
    totalQuestions: 10,
    answeredCount: 8,
    onCancel: vi.fn(),
    onReviewUnanswered: vi.fn(),
    onSubmitAnyway: vi.fn(),
    onConfirmSubmit: vi.fn(),
  };

  it('renders unanswered warning with Review Unanswered and Submit Anyway', () => {
    render(<ExamSubmitDialog {...base} mode="has-unanswered" />);
    expect(screen.getByRole('dialog', { name: /unanswered questions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review unanswered/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit anyway/i })).toBeInTheDocument();
  });

  it('renders final confirmation', () => {
    render(<ExamSubmitDialog {...base} mode="final-confirm" unansweredCount={0} answeredCount={10} />);
    expect(screen.getByRole('dialog', { name: /submit exam/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^submit exam$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('closes on Escape when not submitting', () => {
    const onCancel = vi.fn();
    render(<ExamSubmitDialog {...base} mode="all-attempted" unansweredCount={0} answeredCount={10} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });
});
