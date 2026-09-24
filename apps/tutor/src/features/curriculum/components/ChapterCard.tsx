import { CheckCircle2, ChevronDown } from 'lucide-react';
import { useId, useState, type CSSProperties, type HTMLAttributes } from 'react';
import type { Chapter } from '@/types';
import { analytics } from '@/services/analyticsService';
import { TopicCard } from './TopicCard';
import {
  SubjectCardPattern,
  resolveSubjectPattern,
  type SubjectPatternKind,
} from './SubjectCardPattern';

type InertProps = HTMLAttributes<HTMLDivElement> & { inert?: string };

export function ChapterCard({
  chapter,
  gradeId,
  subjectId,
  accent,
  completedTopics,
  defaultOpen = false,
  onTopicSelect,
  patternKind,
}: {
  chapter: Chapter;
  gradeId: string;
  subjectId: string;
  accent: string;
  completedTopics: string[];
  defaultOpen?: boolean;
  onTopicSelect: (topicId: string) => void;
  patternKind?: SubjectPatternKind;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();
  const completedCount = chapter.topics.filter((t) =>
    completedTopics.includes(t.id),
  ).length;
  const total = chapter.topics.length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isChapterComplete = total > 0 && completedCount === total;
  const chapterLabel = String(chapter.chapterNumber).padStart(2, '0');
  const kind = patternKind ?? resolveSubjectPattern(subjectId);

  return (
    <article
      className={`curr-chapter${isOpen ? ' is-open' : ''}`}
      style={
        {
          ['--chapter-accent' as string]: accent,
          ['--chapter-accent-soft' as string]: `${accent}12`,
          ['--chapter-accent-border' as string]: `${accent}2E`,
          ['--chapter-accent-muted' as string]: `${accent}18`,
        } as CSSProperties
      }
    >
      <div className="curr-chapter__art" aria-hidden>
        <SubjectCardPattern
          kind={kind}
          color={accent}
          variant="module"
          seed={chapter.chapterNumber}
        />
      </div>

      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) {
            analytics.chapterSelected(gradeId, subjectId, chapter.id);
          }
        }}
        className="curr-chapter__header"
      >
        <span className="curr-chapter__leading" aria-hidden>
          <span className="curr-chapter__toggle">
            <ChevronDown className="curr-chapter__chevron h-4 w-4" />
          </span>
          <span
            className={`curr-chapter__num${isChapterComplete ? ' is-done' : ''}`}
          >
            {chapterLabel}
          </span>
        </span>

        <div className="curr-chapter__main">
          <div className="curr-chapter__badges">
            <span
              className={`curr-chapter__badge${isChapterComplete ? ' is-done' : ''}`}
            >
              Chapter {chapterLabel}
            </span>
            {isChapterComplete ? (
              <span className="curr-chapter__mastered">
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                Mastered
              </span>
            ) : null}
          </div>

          <h3 className="curr-chapter__title">{chapter.name}</h3>

          {chapter.description ? (
            <p className="curr-chapter__desc">{chapter.description}</p>
          ) : null}

          <div className="curr-chapter__mobile-progress">
            <span>
              {completedCount}/{total} topics
            </span>
            <span className="curr-chapter__mobile-bar" aria-hidden>
              <span style={{ width: `${progress}%` }} />
            </span>
            <span className="tabular-nums">{progress}%</span>
          </div>
        </div>

        <div
          className="curr-chapter__stats"
          aria-label={`${completedCount} of ${total} topics mastered`}
        >
          <div className="curr-chapter__stats-value">
            <strong>{completedCount}</strong>
            <span>/ {total}</span>
          </div>
          <span className="curr-chapter__stats-label">Topics mastered</span>
        </div>
      </button>

      <div className="curr-chapter__progress" aria-hidden>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div
        id={panelId}
        className="curr-chapter__panel"
        style={{
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          opacity: isOpen ? 1 : 0,
        }}
        aria-hidden={!isOpen}
        {...(!isOpen ? ({ inert: '' } as InertProps) : {})}
      >
        <div className="curr-chapter__panel-clip">
          <div className="curr-chapter__panel-inner">
            <div className="curr-chapter__panel-head">
              <p>Lessons in this chapter</p>
              <span>
                {total} {total === 1 ? 'topic' : 'topics'}
              </span>
            </div>

            <div className="curr-topic-grid">
              {chapter.topics.map((topic, i) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  gradeId={gradeId}
                  subjectId={subjectId}
                  chapterId={chapter.id}
                  chapterName={chapter.name}
                  chapterNumber={chapter.chapterNumber}
                  accent={accent}
                  index={i}
                  isCompleted={completedTopics.includes(topic.id)}
                  onSelect={() => onTopicSelect(topic.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
