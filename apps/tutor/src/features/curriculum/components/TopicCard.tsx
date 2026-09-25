import { ArrowRight, CheckCircle2, Clock, Heart } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, type CSSProperties } from 'react';
import { useCurriculumStore } from '@/features/curriculum/stores/curriculumStore';
import { studentRoutes } from '@/utils/routes';
import type { Topic } from '@/types';
import { analytics } from '@/services/analyticsService';
import { STREAM_PARAM, normalizeStream } from '@/features/curriculum/data/seniorStreams';
import {
  TopicVisual,
  resolveTopicVisual,
  validateTopicVisualsOnce,
} from './topic-visuals';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; bg: string; fg: string; border: string }
> = {
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

function parseDifficulty(value?: string): Difficulty | null {
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced') {
    return value;
  }
  return null;
}

function formatDuration(topic: Topic): string | null {
  if (topic.duration?.trim()) return topic.duration.trim();
  if (typeof topic.durationMinutes === 'number' && topic.durationMinutes > 0) {
    return `${topic.durationMinutes} min`;
  }
  return null;
}

if (import.meta.env.DEV) {
  validateTopicVisualsOnce();
}

export function TopicCard({
  topic,
  gradeId,
  subjectId,
  chapterId,
  chapterName,
  chapterNumber,
  accent,
  index,
  isCompleted,
  onSelect,
}: {
  topic: Topic;
  gradeId: string;
  subjectId: string;
  chapterId: string;
  chapterName: string;
  chapterNumber?: number;
  accent: string;
  index: number;
  isCompleted: boolean;
  onSelect: () => void;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stream = normalizeStream(searchParams.get(STREAM_PARAM));
  const liked = useCurriculumStore((s) => s.likedTopicIds.includes(topic.id));
  const toggleTopicLike = useCurriculumStore((s) => s.toggleTopicLike);
  const difficulty = parseDifficulty(topic.difficulty);
  const diff = difficulty ? DIFFICULTY_META[difficulty] : null;
  const duration = formatDuration(topic);
  const topicIndex = String(index + 1).padStart(2, '0');

  const visualSpec = useMemo(
    () =>
      resolveTopicVisual({
        gradeId,
        subjectId,
        chapterId,
        chapterName,
        chapterNumber,
        topicId: topic.id,
        topicName: topic.name,
      }),
    [
      gradeId,
      subjectId,
      chapterId,
      chapterName,
      chapterNumber,
      topic.id,
      topic.name,
    ],
  );

  const handleStart = () => {
    analytics.topicSelected({ topicId: topic.id, classId: gradeId, subjectId });
    const params = new URLSearchParams({ grade: gradeId, subject: subjectId });
    if (stream) params.set(STREAM_PARAM, stream);
    navigate(`${studentRoutes.learn(topic.id)}?${params.toString()}`);
    onSelect();
  };

  return (
    <article
      className={`curr-topic-card group${isCompleted ? ' is-done' : ''}`}
      style={
        {
          ['--topic-accent' as string]: accent,
          ['--topic-accent-soft' as string]: `${accent}10`,
          ['--topic-accent-border' as string]: `${accent}2A`,
          ['--topic-accent-muted' as string]: `${accent}18`,
          ['--topic-accent-text' as string]: accent,
        } as CSSProperties
      }
      data-visual-kind={visualSpec.kind}
      data-visual-variant={visualSpec.variant}
      data-visual-source={visualSpec.source}
    >
      <div className="curr-topic-card__visual" aria-hidden>
        <div className="curr-topic-card__visual-wash" />
        <TopicVisual
          spec={visualSpec}
          accent={accent}
          titleHint={topic.name}
        />
        <div className="curr-topic-card__visual-fade" />
        {duration ? (
          <span className="curr-topic-card__duration-chip">
            <Clock className="h-3 w-3 shrink-0" aria-hidden />
            {duration}
          </span>
        ) : null}
      </div>

      <div className="curr-topic-card__body">
        <div className="curr-topic-card__meta">
          <span className="curr-topic-card__index">Topic {topicIndex}</span>
          {diff ? (
            <span
              className="curr-topic-card__diff"
              style={{
                background: diff.bg,
                color: diff.fg,
                borderColor: diff.border,
              }}
            >
              {diff.label}
            </span>
          ) : null}
          <button
            type="button"
            className={`curr-topic-card__like${liked ? ' is-liked' : ''}`}
            aria-label={liked ? 'Unlike lesson' : 'Like lesson'}
            aria-pressed={liked}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleTopicLike(topic.id);
            }}
          >
            <Heart
              className="h-4 w-4"
              fill={liked ? 'currentColor' : 'none'}
              aria-hidden
            />
          </button>
        </div>

        <h4 className="curr-topic-card__title">{topic.name}</h4>

        {topic.description ? (
          <p className="curr-topic-card__desc">{topic.description}</p>
        ) : null}

        {isCompleted ? (
          <p className="curr-topic-card__status">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Completed
          </p>
        ) : null}

        <div className="curr-topic-card__footer">
          <button
            type="button"
            className="curr-topic-card__cta"
            onClick={handleStart}
            aria-label={`${isCompleted ? 'Review' : 'Start lesson'} ${topic.name}`}
          >
            <span>{isCompleted ? 'Review' : 'Start lesson'}</span>
            <ArrowRight
              className="curr-topic-card__cta-arrow h-3.5 w-3.5"
              aria-hidden
            />
          </button>
        </div>
      </div>
    </article>
  );
}
