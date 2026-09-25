import type { SchoolGrade } from '@/types';
import { SENIOR_STREAM_LIST, type SeniorStreamId } from '@/features/curriculum/data/seniorStreams';
import StreamCard from '@/features/curriculum/streams/StreamCard';

type StreamSelectionProps = {
  grade: SchoolGrade;
  onStreamSelect: (stream: SeniorStreamId) => void;
  /** Pending subject from deep-link / search awaiting stream choice */
  pendingSubjectName?: string | null;
};

/**
 * Class 11 / Class 12 stream picker — same component for both grades.
 */
export default function StreamSelection({
  grade,
  onStreamSelect,
  pendingSubjectName,
}: StreamSelectionProps) {
  return (
    <section className="w-full" aria-labelledby="stream-selection-heading">
      <header className="mb-6 max-w-2xl sm:mb-8">
        <p
          className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ color: 'var(--dash-brand, #1d4ed8)' }}
        >
          {grade.name} · Senior secondary
        </p>
        <h1
          id="stream-selection-heading"
          className="font-display text-[1.75rem] font-extrabold tracking-tight sm:text-3xl md:text-4xl"
          style={{ color: 'var(--dash-text, #0f172a)' }}
        >
          Choose your stream
        </h1>
        <p
          className="mt-2 text-sm font-medium leading-relaxed sm:text-base"
          style={{ color: 'var(--dash-text-2, #475569)' }}
        >
          Pick MPC or BiPC to see the subjects for your path. Physics, Chemistry, and English are
          shared; Mathematics is MPC-only and Biology is BiPC-only.
        </p>
        {pendingSubjectName ? (
          <p
            className="mt-3 rounded-[var(--dash-radius-sm,0.5rem)] border px-3 py-2 text-sm"
            style={{
              borderColor: 'var(--dash-border, #e2e8f0)',
              background: 'var(--dash-surface-1, #f8fafc)',
              color: 'var(--dash-text-2, #475569)',
            }}
            role="status"
          >
            Continue with <strong style={{ color: 'var(--dash-text)' }}>{pendingSubjectName}</strong>{' '}
            — select the stream that includes this subject.
          </p>
        ) : null}
      </header>

      <div className="mx-auto grid w-full max-w-[920px] grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        {SENIOR_STREAM_LIST.map((stream) => (
          <StreamCard
            key={stream.id}
            stream={stream}
            classLabel={grade.name}
            onSelect={() => onStreamSelect(stream.id)}
          />
        ))}
      </div>
    </section>
  );
}
