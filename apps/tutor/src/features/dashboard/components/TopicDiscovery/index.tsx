import { AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import type { TopicCardModel } from '@/features/dashboard/hooks/useDashboardInsights';
import { FilterPills, SearchBar, TopicEmptyState } from './FilterPills';
import TopicCard from './TopicCard';

type TopicDiscoveryProps = {
  searchQuery: string;
  onSearch: (v: string) => void;
  activeCategory: string;
  onCategory: (c: string) => void;
  topics: TopicCardModel[];
  onStart: (topicId: string) => void;
};

/** Denser browse lessons section — neutral surface, compact filters. */
export default function TopicDiscovery({
  searchQuery,
  onSearch,
  activeCategory,
  onCategory,
  topics,
  onStart,
}: TopicDiscoveryProps) {
  return (
    <section
      className="dash-surface-support overflow-hidden"
      style={{ padding: 0 }}
      aria-label="Browse lessons"
    >
      <div
        className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3"
        style={{ borderBottom: '1px solid var(--dash-border)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-5">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <span
              className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center shrink-0"
              style={{
                background: 'var(--dash-brand-soft)',
                color: 'var(--dash-brand)',
              }}
            >
              <Layers className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="dash-eyebrow mb-0.5">Browse lessons</p>
              <h2 className="dash-section-title">Topic discovery</h2>
              <p className="dash-type-caption mt-0.5 max-w-xl">
                Search or filter by subject to find your next lesson.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-[280px] xl:w-[300px] shrink-0">
            <SearchBar value={searchQuery} onChange={onSearch} />
          </div>
        </div>

        <div className="mt-3">
          <FilterPills active={activeCategory} onChange={onCategory} />
        </div>

        <p className="mt-2.5 text-[11px] font-semibold tabular-nums" style={{ color: 'var(--dash-text-3)' }}>
          {activeCategory === 'For You'
            ? 'Recommended'
            : activeCategory === 'Liked'
              ? 'Liked'
              : activeCategory}
          <span className="mx-1.5 opacity-40">·</span>
          {topics.length} {topics.length === 1 ? 'lesson' : 'lessons'}
        </p>
      </div>

      <div className="p-3 sm:p-4">
        {topics.length === 0 ? (
          <TopicEmptyState query={searchQuery.trim() || undefined} kind={activeCategory} />
        ) : (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
            <AnimatePresence mode="popLayout">
              {topics.map((topic, index) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  index={index}
                  onStart={() => onStart(topic.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
