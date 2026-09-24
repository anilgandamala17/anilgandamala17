import { ChevronRight } from 'lucide-react';
import type { SeniorStreamDefinition } from '../../data/seniorStreams';

type StreamCardProps = {
  stream: SeniorStreamDefinition;
  classLabel: string;
  onSelect: () => void;
};

/**
 * Premium image-led stream card (MPC / BiPC). Whole card is a button for a11y.
 */
export default function StreamCard({ stream, classLabel, onSelect }: StreamCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-lg mx-auto"
      style={{
        borderColor: 'var(--dash-border, rgba(15,23,42,0.08))',
        background: 'var(--dash-surface-0, #fff)',
        boxShadow: '0 4px 18px rgba(15,23,42,0.07)',
        outlineColor: stream.accent,
      }}
      aria-label={`Explore ${stream.label} for ${classLabel}`}
    >
      <div className="relative aspect-[16/8] w-full overflow-hidden sm:aspect-[16/7.5]">
        <img
          src={stream.heroImage}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
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
            background: `linear-gradient(135deg, ${stream.accent}33, ${stream.accent}88)`,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.15) 45%, transparent 70%)',
          }}
        />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/80">
            {classLabel}
          </p>
          <h3 className="mt-0.5 font-display text-2xl font-black tracking-tight text-white sm:text-[1.65rem]">
            {stream.label}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:p-4">
        <p className="text-xs font-medium leading-snug text-slate-600 dark:text-slate-300 sm:text-[13px]">
          {stream.tagline}
        </p>
        <ul className="flex flex-wrap gap-1.5" aria-label={`${stream.label} subjects`}>
          {stream.subjectIds.map((id) => (
            <li
              key={id}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize"
              style={{
                background: `${stream.accent}14`,
                color: stream.accent,
              }}
            >
              {id.replace(/-/g, ' ')}
            </li>
          ))}
        </ul>
        <span
          className="mt-1 inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-white transition-opacity group-hover:opacity-95"
          style={{ background: stream.accent }}
        >
          Explore {stream.label}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
