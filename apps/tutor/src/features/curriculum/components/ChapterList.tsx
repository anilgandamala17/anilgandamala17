import { BookOpen, Layers } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useCurriculumStore } from '@/features/curriculum/stores/curriculumStore';
import { getGradeById, getSubjectById } from '@/features/curriculum/data/schoolCurriculum';
import { ChapterCard } from './ChapterCard';
import { resolveSubjectPattern } from './SubjectCardPattern';
import EmptyState from '@/components/common/EmptyState';
import './curriculum.css';

interface ChapterListProps {
  onTopicSelect?: (topicId: string) => void;
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
          {clamped > 0 ? (
            <>
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
            </>
          ) : (
            <div className="curr-subject__progress-copy">
              <p className="curr-subject__progress-label">Not started yet — pick a chapter below</p>
            </div>
          )}
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
      <EmptyState
        icon={<BookOpen className="h-6 w-6" />}
        title="Subject not found"
        description="This curriculum link is invalid or out of date. Pick a grade and subject to continue."
        actionLabel={gradeId ? 'Back to subjects' : 'Back to classes'}
        onAction={() => setSearchParams(gradeId ? { grade: gradeId } : {})}
      />
    );
  }

  const progress = progressMap[`${grade.id}-${subject.id}`] || null;
  const completedTopics = progress?.completedTopics || [];
  const totalTopics = subject.chapters.reduce((sum, ch) => sum + (ch.topics?.length || 0), 0);
  const accent = subject.color || '#0ea5e9';
  const patternKind = resolveSubjectPattern(subject.id, subject.name);

  if (subject.chapters.length === 0 || totalTopics === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="h-6 w-6" />}
        title="Topics coming soon"
        description={`We're preparing the curriculum for ${subject.name}. Check back shortly.`}
        actionLabel="Back to subjects"
        onAction={() => {
          const next: Record<string, string> = { grade: grade.id };
          const stream = searchParams.get('stream');
          if (stream) next.stream = stream;
          setSearchParams(next);
        }}
      />
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
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            gradeId={grade.id}
            subjectId={subject.id}
            accent={accent}
            completedTopics={completedTopics}
            defaultOpen={idx === 0}
            onTopicSelect={(topicId) => onTopicSelect?.(topicId)}
            patternKind={patternKind}
          />
        ))}
      </div>
    </div>
  );
}
