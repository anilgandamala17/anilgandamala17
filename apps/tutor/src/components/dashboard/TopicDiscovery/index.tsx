import { AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import type { TopicCardModel } from '../../../hooks/useDashboardInsights';
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

export default function TopicDiscovery({
  searchQuery,
  onSearch,
  activeCategory,
  onCategory,
  topics,
  onStart,
}: TopicDiscoveryProps) {
  return (
    <section style={{ marginTop: 'var(--dash-section-gap)' }}>
      <div
        className="rounded-[var(--dash-radius-lg)] border overflow-hidden"
        style={{
          background:
            'linear-gradient(165deg, #ffffff 0%, #f8fafc 42%, color-mix(in srgb, #e0f2fe 55%, #eef2ff) 100%)',
          borderColor: 'var(--dash-border)',
          boxShadow: 'var(--dash-shadow-2)',
        }}
      >
        <div
          className="relative px-4 sm:px-5 md:px-6 pt-5 sm:pt-6 pb-4"
          style={{
            borderBottom: '1px solid var(--dash-border)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.55) 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(79,70,229,0.35), rgba(14,165,233,0.35), transparent)',
            }}
          />

          <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span
                className="hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center shrink-0"
                style={{
                  background: 'var(--dash-grad-brand)',
                  boxShadow: '0 10px 24px rgba(79,70,229,0.28)',
                }}
              >
                <Layers className="w-5 h-5 text-white" />
              </span>
              <div className="min-w-0">
                <p className="dash-eyebrow mb-1">Topic selection</p>
                <h2 className="dash-section-title">Browse topics</h2>
                <p className="text-xs sm:text-sm mt-1 max-w-xl" style={{ color: 'var(--dash-text-2)' }}>
                  Pick a lesson matched to your progress — search or filter by subject.
                </p>
              </div>
            </div>

            <div className="w-full lg:w-[300px] xl:w-[340px] shrink-0">
              <SearchBar value={searchQuery} onChange={onSearch} />
            </div>
          </div>

          <div className="mt-4 sm:mt-5">
            <FilterPills active={activeCategory} onChange={onCategory} />
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-3">
            <p className="text-[11px] sm:text-xs font-semibold tabular-nums" style={{ color: 'var(--dash-text-3)' }}>
              {activeCategory === 'For You'
                ? 'Recommended for you'
                : activeCategory === 'Liked'
                  ? 'Liked lessons'
                  : activeCategory}
              <span className="mx-1.5 opacity-40">·</span>
              {topics.length} {topics.length === 1 ? 'lesson' : 'lessons'}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 md:p-6">
          {topics.length === 0 ? (
            <TopicEmptyState query={searchQuery.trim() || undefined} kind={activeCategory} />
          ) : (
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
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
      </div>
    </section>
  );
}
