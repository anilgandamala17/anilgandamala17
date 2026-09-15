import type { ReactNode } from 'react';
import { ArrowUpRight, Trophy } from 'lucide-react';
import { UserAvatar, displayNameForUser } from '../../common/UserAvatar';
import type { User } from '../../../types';

type ActionCardProps = {
  onClick: () => void;
  icon: ReactNode;
  title: string;
  body: string;
  accent?: string;
  meta?: string;
};

export function ActionCard({
  onClick,
  icon,
  title,
  body,
  accent = '#4f46e5',
  meta = 'Open',
}: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative overflow-hidden rounded-[var(--dash-radius-lg)] border text-left w-full group p-4 sm:p-5 h-full min-h-[140px] flex flex-col transition-all"
      style={{
        background: `linear-gradient(155deg, ${accent}16 0%, #ffffff 42%, #f8fafc 100%)`,
        borderColor: `${accent}2a`,
        boxShadow: 'var(--dash-shadow-1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 16px 36px ${accent}28`;
        e.currentTarget.style.borderColor = `${accent}55`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = 'var(--dash-shadow-1)';
        e.currentTarget.style.borderColor = `${accent}2a`;
      }}
    >
      <div
        className="absolute -top-10 -right-8 w-28 h-28 rounded-full pointer-events-none opacity-70"
        style={{ background: `radial-gradient(circle, ${accent}30, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between gap-3 mb-3">
        <span
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, ${accent}28, ${accent}10)`,
            color: accent,
            boxShadow: `0 8px 20px ${accent}22`,
          }}
        >
          {icon}
        </span>
        <span
          className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg opacity-70 group-hover:opacity-100 transition-opacity"
          style={{ background: `${accent}14`, color: accent }}
        >
          {meta}
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>

      <div className="relative mt-auto">
        <h3
          className="text-[15px] font-bold tracking-tight"
          style={{ fontFamily: 'var(--dash-font-display)', color: 'var(--dash-text)' }}
        >
          {title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--dash-text-2)' }}>
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
      className="w-full h-full min-h-[140px] rounded-[var(--dash-radius-lg)] text-left p-4 sm:p-5 transition-all group relative overflow-hidden flex flex-col"
      style={{
        background: 'var(--dash-grad-ink)',
        boxShadow: 'var(--dash-shadow-3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 18px 40px rgba(79,70,229,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = 'var(--dash-shadow-3)';
      }}
    >
      <div
        className="absolute -top-12 -right-10 w-36 h-36 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.4), transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(14,165,233,0.18), transparent)' }}
      />

      <div className="relative flex items-center gap-3 mb-auto">
        <UserAvatar
          user={user}
          size={44}
          className="ring-2 ring-white/20"
          fallbackClassName="bg-indigo-500 text-sm font-bold"
        />
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-white truncate" style={{ fontFamily: 'var(--dash-font-display)' }}>
            {displayNameForUser(user)}
          </p>
          <p className="text-[11px] text-white/55 uppercase tracking-[0.12em] truncate mt-0.5">
            {profession || 'Learner'}
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/75">
          <Trophy className="w-3.5 h-3.5 text-amber-300" />
          {badgeCount > 0 ? `${badgeCount} badges earned` : 'Badges unlock as you learn'}
        </div>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80 group-hover:text-white">
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
    <section style={{ marginTop: 'var(--dash-section-gap)' }}>
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="dash-section-title">Quick access</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--dash-text-2)' }}>
            Jump to the parts of AIra you use most
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        {children}
      </div>
    </section>
  );
}
