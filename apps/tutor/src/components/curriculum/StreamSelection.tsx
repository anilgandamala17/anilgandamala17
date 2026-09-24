import type { SchoolGrade } from '../../types';
import { SENIOR_STREAM_LIST, type SeniorStreamId } from '../../data/seniorStreams';
import StreamCard from './StreamCard';

type StreamSelectionProps = {
  grade: SchoolGrade;
  onStreamSelect: (stream: SeniorStreamId) => void;
};

/**
 * Class 11 / Class 12 stream picker — same component for both grades.
 */
export default function StreamSelection({ grade, onStreamSelect }: StreamSelectionProps) {
  return (
    <section className="w-full" aria-labelledby="stream-selection-heading">
      <header className="mb-8 max-w-2xl sm:mb-10">
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
          Senior secondary
        </p>
        <h1
          id="stream-selection-heading"
          className="font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white"
        >
          Choose your stream
        </h1>
        <p className="mt-2 text-base font-medium text-slate-500 dark:text-slate-400">
          {grade.name} — pick MPC or BiPC to see the subjects for your path.
        </p>
      </header>

      <div className="mx-auto grid w-full max-w-[880px] grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
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
