import type { ReactNode } from 'react';
import { ArrowUpRight, Trophy } from 'lucide-react';
import { UserAvatar, displayNameForUser } from '@/components/common/UserAvatar';
import type { User } from '@/types';

type ActionCardProps = {
  onClick: () => void;
  icon: ReactNode;
  title: string;
  body: string;
  accent?: string;
  meta?: string;
};

/** Compact quick-access tile. */
export function ActionCard({
  onClick,
  icon,
  title,
  body,
  accent = '#2563eb',
  meta = 'Open',
}: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="dash-card dash-card--action dash-card--interactive text-left w-full group p-3.5 sm:p-4 min-h-[96px] flex flex-col"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 22%, var(--dash-border))`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: `color-mix(in srgb, ${accent} 16%, transparent)`,
            color: accent,
          }}
        >
          {icon}
        </span>
        <span
          className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100"
          style={{ color: accent }}
        >
          {meta}
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>

      <div className="mt-auto">
        <h3 className="dash-type-h3 text-sm">{title}</h3>
        <p className="mt-0.5 text-[11px] leading-snug line-clamp-2" style={{ color: 'var(--dash-text-2)' }}>
          {body}
        </p>
      </div>
    </button>
  );
}

type ProfileCardProps = {
  user: User | null | undefined;
  profession?: string;
  badgeCount: number;
  onClick: () => void;
};

export function ProfileCard({ user, profession, badgeCount, onClick }: ProfileCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full min-h-[96px] rounded-[var(--dash-radius-lg)] text-left p-3.5 sm:p-4 transition-all group relative overflow-hidden flex flex-col"
      style={{
        background: 'var(--dash-grad-ink)',
        boxShadow: 'var(--dash-shadow-2)',
      }}
    >
      <div className="relative flex items-center gap-2.5 mb-auto">
        <UserAvatar
          user={user}
          size={36}
          className="ring-2 ring-white/20"
          fallbackClassName="bg-sky-600 text-sm font-bold"
        />
        <div className="min-w-0">
          <p
            className="text-sm font-bold text-white truncate"
            style={{ fontFamily: 'var(--dash-font-display)' }}
          >
            {displayNameForUser(user)}
          </p>
          <p className="text-[10px] text-white/55 uppercase tracking-[0.1em] truncate mt-0.5">
            {profession || 'Learner'}
          </p>
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/75">
          <Trophy className="w-3 h-3 text-amber-300" />
          {badgeCount > 0 ? `${badgeCount} badges` : 'Earn badges as you learn'}
        </div>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
          Profile
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

type QuickAccessProps = {
  children: ReactNode;
};

export default function QuickAccess({ children }: QuickAccessProps) {
  return (
    <section aria-label="Quick access">
      <div className="mb-2.5 sm:mb-3">
        <h2 className="dash-section-title">Quick access</h2>
        <p className="dash-type-caption mt-0.5">Jump to the parts of AIra you use most</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3 items-stretch">{children}</div>
    </section>
  );
}
