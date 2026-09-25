import { memo, useCallback, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Minus,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import type { Question } from '@/features/competitive/data/competitiveQuestions';
import type { ExamMarkingScheme } from './examConfig';
import { formatExamMath } from '@/utils/examText';

export type ResultReviewFilter = 'all' | 'correct' | 'incorrect' | 'unattempted';
export type ResultItemStatus = 'correct' | 'incorrect' | 'unattempted';

export type ResultReviewItem = {
  question: Question;
  index: number;
  status: ResultItemStatus;
};

type ExamResultReportProps = {
  accentColor: string;
  examName: string;
  scopeLabel: string;
  paperYear?: number | string | null;
  rawScore: number;
  maxScore: number;
  accuracyPercent: number;
  attemptPercent: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  attemptedCount: number;
  questionCount: number;
  timeTakenSeconds: number;
  formatTime: (seconds: number) => string;
  markingScheme: ExamMarkingScheme;
  reviewFilter: ResultReviewFilter;
  onReviewFilterChange: (filter: ResultReviewFilter) => void;
  reviewItems: ResultReviewItem[];
  userAnswers: number[];
  subjectFallbackName?: string;
  explainBuildingId: string | null;
  isGenerating: boolean;
  onExit: () => void;
  onRetake: () => void;
  onExplainWithAI: (question: Question, index: number) => void;
};

function statusLabel(status: ResultItemStatus) {
  if (status === 'correct') return 'Correct';
  if (status === 'incorrect') return 'Incorrect';
  return 'Not Attempted';
}

function statusIcon(status: ResultItemStatus) {
  if (status === 'correct') return <CheckCircle2 className="h-4 w-4" aria-hidden />;
  if (status === 'incorrect') return <XCircle className="h-4 w-4" aria-hidden />;
  return <Minus className="h-4 w-4" aria-hidden />;
}

function marksForStatus(status: ResultItemStatus, marking: ExamMarkingScheme) {
  if (status === 'correct') return `+${marking.correctMarks}`;
  if (status === 'incorrect') return String(marking.incorrectMarks);
  return String(marking.unansweredMarks);
}

function optionLetter(index: number) {
  return String.fromCharCode(65 + index);
}

function QuestionResultItem({
  item,
  accentColor,
  markingScheme,
  userAnswers,
  subjectFallbackName,
  explainBuildingId,
  expanded,
  onToggle,
  onExplainWithAI,
}: {
  item: ResultReviewItem;
  accentColor: string;
  markingScheme: ExamMarkingScheme;
  userAnswers: number[];
  subjectFallbackName?: string;
  explainBuildingId: string | null;
  expanded: boolean;
  onToggle: () => void;
  onExplainWithAI: (question: Question, index: number) => void;
}) {
  const { question: q, index: idx, status } = item;
  const selectedAnswer = userAnswers[idx];
  const explanationSteps = (q.explanation || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const yourLetter =
    selectedAnswer !== undefined && selectedAnswer >= 0 ? optionLetter(selectedAnswer) : null;
  const correctLetter =
    typeof q.correctAnswer === 'number' && q.correctAnswer >= 0
      ? optionLetter(q.correctAnswer)
      : null;
  const panelId = `result-q-panel-${q.id}`;
  const buttonId = `result-q-toggle-${q.id}`;

  return (
    <article
      id={`result-q-${idx}`}
      className={`comp-result-q comp-result-q--${status}${expanded ? ' is-open' : ''}`}
      aria-label={`Question ${idx + 1}, ${statusLabel(status)}`}
    >
      <button
        id={buttonId}
        type="button"
        className="comp-result-q__hit"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <div className="comp-result-q__summary">
          <div className="comp-result-q__lead">
            <span className="comp-result-q__num">Q{String(idx + 1).padStart(2, '0')}</span>
            <span className={`comp-result-q__badge comp-result-q__badge--${status}`}>
              {statusIcon(status)}
              <span>{statusLabel(status)}</span>
            </span>
          </div>
          <div className="comp-result-q__meta">
            <span className="comp-result-q__marks">{marksForStatus(status, markingScheme)}</span>
          </div>
        </div>

        <div className="comp-result-q__preview">
          <p className="comp-result-q__topic">
            {q.subjectName || subjectFallbackName || 'Subject'}
            {q.topic ? ` · ${q.topic}` : ''}
            {q.difficulty ? ` · ${q.difficulty}` : ''}
          </p>
          <p className="comp-result-q__stem">{formatExamMath(q.text)}</p>
          <p className="comp-result-q__answers">
            {yourLetter ? (
              <>
                Your answer: <strong>{yourLetter}</strong>
                {correctLetter ? (
                  <>
                    {' '}
                    · Correct: <strong>{correctLetter}</strong>
                  </>
                ) : null}
              </>
            ) : (
              <>
                Not attempted
                {correctLetter ? (
                  <>
                    {' '}
                    · Correct: <strong>{correctLetter}</strong>
                  </>
                ) : null}
              </>
            )}
          </p>
        </div>

        <span className="comp-result-q__hint">
          <span>{expanded ? 'Hide options' : 'View options & explanation'}</span>
          <ChevronDown
            className={`comp-result-q__chevron ${expanded ? 'is-open' : ''}`}
            aria-hidden
          />
        </span>
      </button>

      {expanded ? (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="comp-result-q__detail">
          <div className="comp-result-q__options" role="list">
            {q.options.map((opt, optIdx) => {
              const isUser = selectedAnswer === optIdx;
              const isCorrect = q.correctAnswer === optIdx;
              return (
                <div
                  key={`${q.id}-opt-${optIdx}`}
                  role="listitem"
                  className={`comp-result-opt ${isCorrect ? 'is-correct' : ''} ${isUser && !isCorrect ? 'is-user-wrong' : ''} ${isUser && isCorrect ? 'is-user-correct' : ''}`}
                >
                  <span className="comp-result-opt__letter" aria-hidden>
                    {optionLetter(optIdx)}
                  </span>
                  <span className="comp-result-opt__text">{formatExamMath(opt)}</span>
                  {isCorrect ? <span className="comp-result-opt__tag">✓ Correct</span> : null}
                  {isUser && !isCorrect ? (
                    <span className="comp-result-opt__tag is-wrong">✕ Your answer — Incorrect</span>
                  ) : null}
                  {isUser && isCorrect ? (
                    <span className="comp-result-opt__tag">✓ Your answer</span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {explanationSteps.length > 0 ? (
            <div className="comp-result-explain">
              <h4>Explanation</h4>
              <ol>
                {explanationSteps.map((stepText, stepIndex) => (
                  <li key={`${q.id}-exp-${stepIndex}`}>{stepText}</li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="comp-result-explain-empty">No explanation available for this question.</p>
          )}

          <div className="comp-result-q__actions">
            <button
              type="button"
              className="comp-result-ai"
              style={{ backgroundColor: accentColor }}
              disabled={explainBuildingId === q.id}
              onClick={() => onExplainWithAI(q, idx)}
            >
              {explainBuildingId === q.id ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden />
              )}
              {explainBuildingId === q.id ? 'Building explanation…' : 'Explain with AI'}
              {explainBuildingId !== q.id ? <ChevronRight className="h-4 w-4" aria-hidden /> : null}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ExamResultReport({
  accentColor,
  examName,
  scopeLabel,
  paperYear,
  rawScore,
  maxScore,
  accuracyPercent,
  attemptPercent,
  correctCount,
  incorrectCount,
  unattemptedCount,
  attemptedCount,
  questionCount,
  timeTakenSeconds,
  formatTime,
  markingScheme,
  reviewFilter,
  onReviewFilterChange,
  reviewItems,
  userAnswers,
  subjectFallbackName,
  explainBuildingId,
  isGenerating,
  onExit,
  onRetake,
  onExplainWithAI,
}: ExamResultReportProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const correctShare = questionCount ? (correctCount / questionCount) * 100 : 0;
  const incorrectShare = questionCount ? (incorrectCount / questionCount) * 100 : 0;
  const unansweredShare = questionCount ? (unattemptedCount / questionCount) * 100 : 0;

  const filters = [
    ['all', 'All', questionCount],
    ['correct', 'Correct', correctCount],
    ['incorrect', 'Incorrect', incorrectCount],
    ['unattempted', 'Not Attempted', unattemptedCount],
  ] as const;

  return (
    <div
      className="comp-result"
      style={{ '--result-accent': accentColor } as CSSProperties}
    >
      <header className="comp-result-topbar">
        <button type="button" className="comp-result-back" onClick={onExit}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span>Back to Competitive Mode</span>
        </button>
        <p className="comp-result-topbar__title">Exam Result</p>
      </header>

      <section className="comp-result-hero" aria-labelledby="comp-result-heading">
        <div className="comp-result-hero__status">
          <span className="comp-result-badge">
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            Exam completed
          </span>
          <h1 id="comp-result-heading">{examName}</h1>
          <p className="comp-result-hero__scope">
            {scopeLabel}
            {paperYear != null && paperYear !== '' ? ` · ${paperYear}` : ''}
          </p>
        </div>

        <div className="comp-result-scoreblock" aria-label="Net score">
          <div
            className="comp-result-ring"
            style={{
              background: `conic-gradient(${accentColor} ${Math.min(100, Math.max(0, accuracyPercent)) * 3.6}deg, color-mix(in srgb, ${accentColor} 12%, transparent) 0deg)`,
            }}
            aria-hidden
          >
            <div className="comp-result-ring__inner">
              <span>Score</span>
              <strong>
                {rawScore}
                <small>/{maxScore}</small>
              </strong>
              <em>{accuracyPercent}%</em>
            </div>
          </div>
        </div>
      </section>

      <section className="comp-result-metrics" aria-label="Score metrics">
        <div className="comp-result-metric">
          <span>Score</span>
          <strong>
            {rawScore} / {maxScore}
          </strong>
        </div>
        <div className="comp-result-metric">
          <span>Accuracy</span>
          <strong>{accuracyPercent}%</strong>
          <small>{correctCount} correct</small>
        </div>
        <div className="comp-result-metric">
          <span>Attempted</span>
          <strong>
            {attemptedCount} / {questionCount}
          </strong>
          <small>{attemptPercent}% attempt rate</small>
        </div>
        <div className="comp-result-metric">
          <span>Time</span>
          <strong>{formatTime(timeTakenSeconds)}</strong>
          <small>
            <Clock className="inline h-3 w-3" aria-hidden /> invested
          </small>
        </div>
      </section>

      <section className="comp-result-overview" aria-labelledby="comp-result-overview-title">
        <div className="comp-result-overview__head">
          <Target className="h-4 w-4" aria-hidden style={{ color: accentColor }} />
          <h2 id="comp-result-overview-title">Performance overview</h2>
        </div>
        <div className="comp-result-overview__counts">
          <div>
            <span className="is-correct">✓ Correct</span>
            <strong>{correctCount}</strong>
          </div>
          <div>
            <span className="is-wrong">✕ Incorrect</span>
            <strong>{incorrectCount}</strong>
          </div>
          <div>
            <span className="is-skip">— Not Attempted</span>
            <strong>{unattemptedCount}</strong>
          </div>
        </div>
        <div
          className="comp-result-bar"
          role="img"
          aria-label={`Correct ${correctCount}, incorrect ${incorrectCount}, not attempted ${unattemptedCount}`}
        >
          <span className="is-correct" style={{ width: `${correctShare}%` }} />
          <span className="is-wrong" style={{ width: `${incorrectShare}%` }} />
          <span className="is-skip" style={{ width: `${unansweredShare}%` }} />
        </div>
      </section>

      <section className="comp-result-analysis" aria-labelledby="comp-result-analysis-title">
        <header className="comp-result-analysis__header">
          <div>
            <p className="comp-result-kicker">
              <FileText className="h-3.5 w-3.5" aria-hidden /> Question analysis
            </p>
            <h2 id="comp-result-analysis-title">Answer review</h2>
          </div>
          <div className="comp-result-filters" role="tablist" aria-label="Filter reviewed answers">
            {filters.map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={reviewFilter === value}
                onClick={() => onReviewFilterChange(value)}
                className={reviewFilter === value ? 'is-active' : ''}
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </div>
        </header>

        {reviewItems.length === 0 ? (
          <p className="comp-result-empty">No questions match this filter.</p>
        ) : (
          <>
            <nav className="comp-result-nav" aria-label="Question navigator">
              {reviewItems.map(({ question: q, index: idx, status }) => (
                <a
                  key={`nav-${q.id}`}
                  href={`#result-q-${idx}`}
                  className={`comp-result-nav__chip comp-result-nav__chip--${status}`}
                  aria-label={`Go to question ${idx + 1}, ${statusLabel(status)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`result-q-${idx}`)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }}
                >
                  {String(idx + 1).padStart(2, '0')}
                  <span aria-hidden>
                    {status === 'correct' ? '✓' : status === 'incorrect' ? '✕' : '—'}
                  </span>
                </a>
              ))}
            </nav>

            <div className="comp-result-list">
              {reviewItems.map((item) => (
                <QuestionResultItem
                  key={item.question.id}
                  item={item}
                  accentColor={accentColor}
                  markingScheme={markingScheme}
                  userAnswers={userAnswers}
                  subjectFallbackName={subjectFallbackName}
                  explainBuildingId={explainBuildingId}
                  expanded={expandedIds.has(item.question.id)}
                  onToggle={() => toggleExpanded(item.question.id)}
                  onExplainWithAI={onExplainWithAI}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="comp-result-actions">
        <button type="button" className="comp-result-actions__secondary" onClick={onExit}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Choose another test
        </button>
        <button
          type="button"
          className="comp-result-actions__primary"
          style={{ backgroundColor: accentColor }}
          disabled={isGenerating}
          onClick={onRetake}
        >
          <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} aria-hidden />
          {isGenerating ? 'Generating…' : 'Retake assessment'}
        </button>
      </footer>
    </div>
  );
}

export default memo(ExamResultReport);
