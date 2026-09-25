import { ChevronRight } from 'lucide-react';
import type { SeniorStreamDefinition } from '@/features/curriculum/data/seniorStreams';

const SUBJECT_LABELS: Record<string, string> = {
  mathematics: 'Mathematics',
  biology: 'Biology',
  physics: 'Physics',
  chemistry: 'Chemistry',
  english: 'English',
};

type StreamCardProps = {
  stream: SeniorStreamDefinition;
  classLabel: string;
  onSelect: () => void;
};

/**
 * Premium image-led stream card (MPC / BiPC). Whole card is a button for a11y.
 */
export default function StreamCard({ stream, classLabel, onSelect }: StreamCardProps) {
  const subjectLine = stream.subjectIds
    .map((id) => SUBJECT_LABELS[id] ?? id.replace(/-/g, ' '))
    .join(' · ');

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex w-full flex-col overflow-hidden text-left transition-[transform,box-shadow,border-color] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:shadow-[var(--dash-focus-ring,0_0_0_2px_#fff,0_0_0_4px_#1d4ed8)] active:scale-[0.995] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 mx-auto max-w-[440px]"
      style={{
        borderRadius: 'var(--dash-radius-lg, 1rem)',
        border: '1px solid var(--dash-border-strong, rgba(15,23,42,0.14))',
        background: 'var(--dash-surface-0, #fff)',
        boxShadow: 'var(--dash-shadow-2, 0 4px 16px rgba(15,23,42,0.08))',
      }}
      aria-label={`Explore ${stream.label} for ${classLabel}: ${subjectLine}`}
    >
      {/* Soft brand rail */}
      <span
        className="absolute inset-y-0 left-0 w-1 z-10"
        style={{ background: stream.accent }}
        aria-hidden
      />

      <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[16/8]">
        <img
          src={stream.heroImage}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = 'none';
            const fallback = el.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = 'block';
          }}
        />
        <div
          className="absolute inset-0 hidden"
          style={{
            background: `linear-gradient(145deg, ${stream.accent} 0%, color-mix(in srgb, ${stream.accent} 55%, #0f172a) 100%)`,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.28) 42%, transparent 72%)',
          }}
          aria-hidden
        />
        <div className="absolute bottom-3 left-3.5 right-3.5 sm:bottom-4 sm:left-4 sm:right-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
            {classLabel}
          </p>
          <h3 className="mt-0.5 font-display text-2xl font-extrabold tracking-tight text-white sm:text-[1.75rem]">
            {stream.label}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ color: stream.accent }}
          >
            Subjects
          </p>
          <p
            className="mt-1 text-sm font-semibold leading-snug"
            style={{ color: 'var(--dash-text, #0f172a)' }}
          >
            {subjectLine}
          </p>
          <p
            className="mt-1.5 text-xs leading-relaxed"
            style={{ color: 'var(--dash-text-2, #475569)' }}
          >
            {stream.tagline}
          </p>
        </div>

        <ul className="flex flex-wrap gap-1.5" aria-hidden>
          {stream.subjectIds.map((id) => (
            <li
              key={id}
              className="rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{
                background: `color-mix(in srgb, ${stream.accent} 12%, transparent)`,
                color: stream.accent,
              }}
            >
              {SUBJECT_LABELS[id] ?? id.replace(/-/g, ' ')}
            </li>
          ))}
        </ul>

        <span
          className="mt-auto inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[var(--dash-radius-sm,0.5rem)] px-3 py-2.5 text-sm font-bold text-white transition-opacity group-hover:opacity-95"
          style={{ background: stream.accent }}
        >
          Explore {stream.label}
          <ChevronRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden
          />
        </span>
      </div>
    </button>
  );
}
