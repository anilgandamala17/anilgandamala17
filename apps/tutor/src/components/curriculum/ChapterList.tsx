import {
  ChevronDown,
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Layers,
  Heart,
} from 'lucide-react';
import { useId, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCurriculumStore } from '../../stores/curriculumStore';
import { studentRoutes } from '../../utils/routes';
import type { Chapter, Topic } from '../../types';
import { getGradeById, getSubjectById } from '../../data/schoolCurriculum';
import { analytics } from '../../services/analyticsService';
import './curriculum.css';

interface ChapterListProps {
  onTopicSelect?: (topicId: string) => void;
}

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const DIFFICULTY_META: Record<Difficulty, { label: string; bg: string; fg: string; border: string }> = {
  beginner: {
    label: 'Beginner',
    bg: 'rgba(16,185,129,0.10)',
    fg: '#047857',
    border: 'rgba(16,185,129,0.22)',
  },
  intermediate: {
    label: 'Intermediate',
    bg: 'rgba(245,158,11,0.10)',
    fg: '#b45309',
    border: 'rgba(245,158,11,0.24)',
  },
  advanced: {
    label: 'Advanced',
    bg: 'rgba(244,63,94,0.10)',
    fg: '#be123c',
    border: 'rgba(244,63,94,0.22)',
  },
};

function resolveDifficulty(value?: string): Difficulty {
  if (value === 'intermediate' || value === 'advanced' || value === 'beginner') return value;
  return 'beginner';
}

function TopicItem({
  topic,
  gradeId,
  subjectId,
  accent,
  index,
  isCompleted,
  onSelect,
}: {
  topic: Topic;
  gradeId: string;
  subjectId: string;
  accent: string;
  index: number;
  isCompleted: boolean;
  onSelect: () => void;
}) {
  const navigate = useNavigate();
  const liked = useCurriculumStore((s) => s.likedTopicIds.includes(topic.id));
  const toggleTopicLike = useCurriculumStore((s) => s.toggleTopicLike);
  const difficulty = resolveDifficulty(topic.difficulty);
  const diff = DIFFICULTY_META[difficulty];
  const topicIndex = String(index + 1).padStart(2, '0');

  const handleClick = () => {
    analytics.topicSelected({ topicId: topic.id, classId: gradeId, subjectId });
    navigate(`${studentRoutes.learn(topic.id)}?grade=${gradeId}&subject=${subjectId}`);
    onSelect();
  };

  return (
    <div className="curr-topic-card group relative" style={{ ['--topic-accent' as string]: accent }}>
      <button
        type="button"
        onClick={handleClick}
        className="curr-topic-card__hit"
        aria-label={`${isCompleted ? 'Review' : 'Start lesson'} ${topic.name}`}
      />
      {/* Mobile / compact: horizontal row */}
      <div className="curr-topic-card__row">
        <span
          className={`curr-topic-card__icon ${isCompleted ? 'is-done' : ''}`}
          aria-hidden
        >
          {isCompleted ? <CheckCircle2 className="h-[18px] w-[18px]" /> : <Play className="ml-0.5 h-[17px] w-[17px]" />}
        </span>

        <div className="curr-topic-card__body">
          <div className="curr-topic-card__meta">
            <span className="curr-topic-card__index">Topic {topicIndex}</span>
            <span
              className="curr-topic-card__diff"
              style={{ background: diff.bg, color: diff.fg, borderColor: diff.border }}
            >
              {diff.label}
            </span>
            <button
              type="button"
              className={`curr-topic-card__like ${liked ? 'is-liked' : ''}`}
              aria-label={liked ? 'Unlike lesson' : 'Like lesson'}
              aria-pressed={liked}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTopicLike(topic.id);
              }}
            >
              <Heart className="h-3.5 w-3.5" fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>

          <h4 className="curr-topic-card__title">{topic.name}</h4>

          {topic.description ? (
            <p className="curr-topic-card__desc">{topic.description}</p>
          ) : null}

          <div className="curr-topic-card__footer">
            <span className="curr-topic-card__duration">
              <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {topic.duration || '30 min'}
            </span>
            <span className="curr-topic-card__cta">
              {isCompleted ? 'Review' : 'Start lesson'}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChapterAccordion({
  chapter,
  gradeId,
  subjectId,
  accent,
  completedTopics,
  defaultOpen = false,
  onTopicSelect,
}: {
  chapter: Chapter;
  gradeId: string;
  subjectId: string;
  accent: string;
  completedTopics: string[];
  defaultOpen?: boolean;
  onTopicSelect: (topicId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();
  const completedCount = chapter.topics.filter((t) => completedTopics.includes(t.id)).length;
  const total = chapter.topics.length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isChapterComplete = total > 0 && completedCount === total;
  const chapterLabel = String(chapter.chapterNumber).padStart(2, '0');

  return (
    <article
      className={`curr-chapter ${isOpen ? 'is-open' : ''}`}
      style={{ ['--chapter-accent' as string]: accent }}
    >
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
        <span className="curr-chapter__toggle" aria-hidden>
          <ChevronDown className="curr-chapter__chevron h-5 w-5" />
        </span>

        <div className="curr-chapter__main">
          <div className="curr-chapter__badges">
            <span className={`curr-chapter__badge ${isChapterComplete ? 'is-done' : ''}`}>
              Chapter {chapterLabel}
            </span>
            {isChapterComplete ? (
              <span className="curr-chapter__mastered">
                <CheckCircle2 className="h-3 w-3" />
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

        <div className="curr-chapter__stats" aria-label={`${completedCount} of ${total} topics mastered`}>
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
                <TopicItem
                  key={topic.id}
                  topic={topic}
                  gradeId={gradeId}
                  subjectId={subjectId}
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

function SubjectHeader({
  name,
  color,
  chapterCount,
  topicCount,
  progressPercent,
}: {
  name: string;
  color: string;
  chapterCount: number;
  topicCount: number;
  progressPercent: number;
}) {
  const clamped = Math.max(0, Math.min(100, progressPercent));
  const ringSize = 84;
  const stroke = 6;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <header className="curr-subject" style={{ ['--subject-accent' as string]: color }}>
      <div className="curr-subject__rail" aria-hidden />

      <div className="curr-subject__content">
        <div className="curr-subject__identity">
          <span className="curr-subject__icon">
            <BookOpen className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="curr-subject__eyebrow">Subject curriculum</p>
            <h2 className="curr-subject__title">{name}</h2>
            <div className="curr-subject__chips">
              <span>
                <Layers className="h-3.5 w-3.5 opacity-60" />
                {chapterCount} {chapterCount === 1 ? 'Chapter' : 'Chapters'}
              </span>
              <span>
                <BookOpen className="h-3.5 w-3.5 opacity-60" />
                {topicCount} {topicCount === 1 ? 'Topic' : 'Topics'}
              </span>
            </div>
          </div>
        </div>

        <div className="curr-subject__progress">
          <div className="curr-subject__ring" aria-hidden>
            <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="rgba(15,23,42,0.07)"
                strokeWidth={stroke}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                style={{ transition: 'stroke-dashoffset 700ms ease' }}
              />
            </svg>
            <span style={{ color }}>{clamped}%</span>
          </div>

          <div className="curr-subject__progress-copy">
            <p className="curr-subject__percent-mobile" style={{ color }}>
              {clamped}
              <small>%</small>
            </p>
            <p className="curr-subject__progress-label">Course completed</p>
            <div className="curr-subject__bar-mobile" aria-hidden>
              <span style={{ width: `${clamped}%`, background: color }} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function ChapterList({ onTopicSelect }: ChapterListProps) {
  const progressMap = useCurriculumStore((s) => s.progressMap);
  const [searchParams, setSearchParams] = useSearchParams();
  const gradeId = searchParams.get('grade');
  const subjectId = searchParams.get('subject');

  const grade = gradeId ? getGradeById(gradeId) : null;
  const subject = grade && subjectId ? getSubjectById(grade.id, subjectId) : null;

  if (!grade || !subject) {
    return (
      <div className="curr-empty">
        <span style={{ background: 'rgba(14,165,233,0.12)', color: '#0284c7' }}>
          <BookOpen className="h-6 w-6" />
        </span>
        <h3>Subject not found</h3>
        <p>This curriculum link is invalid or out of date. Pick a grade and subject to continue.</p>
        <button
          type="button"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white"
          style={{ background: '#0ea5e9' }}
          onClick={() => setSearchParams(gradeId ? { grade: gradeId } : {})}
        >
          {gradeId ? 'Back to subjects' : 'Back to grades'}
        </button>
      </div>
    );
  }

  const progress = progressMap[`${grade.id}-${subject.id}`] || null;
  const completedTopics = progress?.completedTopics || [];
  const totalTopics = subject.chapters.reduce((sum, ch) => sum + (ch.topics?.length || 0), 0);
  const accent = subject.color || '#0ea5e9';

  if (subject.chapters.length === 0 || totalTopics === 0) {
    return (
      <div className="curr-empty">
        <span style={{ background: `${accent}16`, color: accent }}>
          <BookOpen className="h-6 w-6" />
        </span>
        <h3>Topics coming soon</h3>
        <p>We&apos;re preparing the curriculum for {subject.name}. Check back shortly.</p>
      </div>
    );
  }

  return (
    <div className="curr-shell">
      <SubjectHeader
        name={subject.name}
        color={accent}
        chapterCount={subject.chapters.length}
        topicCount={totalTopics}
        progressPercent={progress?.progressPercent || 0}
      />

      <div className="curr-section-head">
        <div>
          <p>Chapter list</p>
          <h3>Browse chapters &amp; topics</h3>
        </div>
        <span>
          {subject.chapters.length} chapters · {totalTopics} topics
        </span>
      </div>

      <div className="curr-chapter-stack">
        {subject.chapters.map((chapter, idx) => (
          <ChapterAccordion
            key={chapter.id}
            chapter={chapter}
            gradeId={grade.id}
            subjectId={subject.id}
            accent={accent}
            completedTopics={completedTopics}
            defaultOpen={idx === 0}
            onTopicSelect={(topicId) => onTopicSelect?.(topicId)}
          />
        ))}
      </div>
    </div>
  );
}
