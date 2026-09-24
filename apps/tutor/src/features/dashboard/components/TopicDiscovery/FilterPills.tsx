import { Search, Sparkles, BookOpen, X, Heart } from 'lucide-react';
import { subjectHex, subjectIcon } from '../theme/subjectColors';

const CATEGORIES = [
  'For You',
  'Liked',
  'Mathematics',
  'Science',
  'English',
  'Social Science',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Hindi',
] as const;

type FilterPillsProps = {
  active: string;
  onChange: (cat: string) => void;
};

export function FilterPills({ active, onChange }: FilterPillsProps) {
  return (
    <div className="topic-filter-rail">
      <div className="topic-filter-rail__track" role="tablist" aria-label="Topic subjects">
        {CATEGORIES.map((cat) => {
          const Icon = cat === 'For You' ? Sparkles : cat === 'Liked' ? Heart : subjectIcon(cat);
          const isActive = active === cat;
          const accent = cat === 'For You' ? '#4f46e5' : cat === 'Liked' ? '#e11d48' : subjectHex(cat);
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(cat)}
              className="topic-filter-chip"
              style={
                isActive
                  ? {
                      ['--chip-accent' as string]: accent,
                      background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 72%, #0ea5e9) 100%)`,
                    }
                  : undefined
              }
            >
              <Icon className="w-3.5 h-3.5 opacity-90" />
              <span>{cat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type SearchBarProps = {
  value: string;
  onChange: (v: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: 'var(--dash-text-3)' }}
      />
      <input
        type="search"
        placeholder="Search lessons by name or subject…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 pl-10 pr-10 rounded-xl border text-sm outline-none transition-shadow"
        style={{
          background: 'var(--dash-surface-0)',
          borderColor: 'var(--dash-border)',
          color: 'var(--dash-text)',
          boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.03)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--dash-brand)';
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--dash-brand-soft)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--dash-border)';
          e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(15,23,42,0.03)';
        }}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg inline-flex items-center justify-center"
          style={{ color: 'var(--dash-text-3)', background: 'var(--dash-surface-2)' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function TopicEmptyState({ query, kind }: { query?: string; kind?: string }) {
  return (
    <div
      className="rounded-2xl border border-dashed py-14 px-6 text-center"
      style={{
        borderColor: 'var(--dash-border-strong)',
        background: 'linear-gradient(165deg, rgba(14,165,233,0.04), rgba(79,70,229,0.05))',
      }}
    >
      <span
        className="mx-auto mb-3 w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--dash-brand-soft)', color: 'var(--dash-brand)' }}
      >
        <BookOpen className="w-5 h-5" />
      </span>
      <p
        className="text-[15px] font-bold"
        style={{ fontFamily: 'var(--dash-font-display)', color: 'var(--dash-text)' }}
      >
        {query
          ? 'No lessons match your search'
          : kind === 'Liked'
            ? 'No liked lessons yet'
            : 'No lessons in this subject yet'}
      </p>
      <p className="mt-1.5 text-sm max-w-sm mx-auto" style={{ color: 'var(--dash-text-2)' }}>
        {query
          ? 'Try another keyword, or clear search to browse all recommended topics.'
          : kind === 'Liked'
            ? 'Tap the heart on a lesson to save it here.'
            : 'Pick another subject above to explore available lessons.'}
      </p>
    </div>
  );
}

export { CATEGORIES };
