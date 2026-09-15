import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import AiraLogo from '../brand/AiraLogo';
import { UserAvatar, displayNameForUser } from '../common/UserAvatar';
import type { User } from '../../types';

type DashboardHeaderProps = {
  homeTo: string;
  liveNow: boolean;
  user: User | null | undefined;
  onRefresh: () => void;
  onProfile: () => void;
  onLogout: () => void;
};

function IconBtn({
  children,
  onClick,
  label,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative group p-2 rounded-xl transition-colors"
      style={{ color: 'var(--dash-text-2)', transitionDuration: 'var(--dash-hover-ms)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? 'rgba(244,63,94,0.1)'
          : 'var(--dash-surface-1)';
        e.currentTarget.style.color = danger ? '#e11d48' : 'var(--dash-text)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--dash-text-2)';
      }}
    >
      {children}
      <span
        className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-semibold opacity-0 group-hover:opacity-100 whitespace-nowrap z-50"
        style={{ background: 'var(--dash-surface-ink)', color: 'var(--dash-text-inv)' }}
      >
        {label}
      </span>
    </button>
  );
}

export default function DashboardHeader({
  homeTo,
  liveNow,
  user,
  onRefresh,
  onProfile,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 safe-top backdrop-blur-xl"
      style={{
        background: 'color-mix(in srgb, var(--dash-surface-0) 82%, transparent)',
        borderBottom: '1px solid transparent',
        borderImage: 'linear-gradient(90deg, var(--dash-brand), transparent 70%) 1',
      }}
    >
      <div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3"
        style={{ borderBottom: '1px solid var(--dash-border)' }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            to={homeTo}
            className="flex items-center shrink-0 group active:scale-95 transition-transform"
            aria-label="Aɪra home"
            style={{ color: 'var(--dash-text)' }}
          >
            <AiraLogo
              height={36}
              className="gap-2.5"
              wordmarkClassName="hidden sm:inline text-lg tracking-tight"
            />
          </Link>
          <nav className="hidden sm:flex items-center text-[13px]">
            <span style={{ color: 'var(--dash-text-3)', fontSize: 11, marginInline: 4 }}>/</span>
            <span className="font-semibold" style={{ color: 'var(--dash-text)' }}>
              Dashboard
            </span>
          </nav>
        </div>

        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{
            background: 'var(--dash-surface-1)',
            borderColor: 'var(--dash-border)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
              style={{
                background: liveNow ? '#10b981' : 'var(--dash-brand-2)',
                animationDuration: '2s',
              }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: liveNow ? '#10b981' : 'var(--dash-brand-2)' }}
            />
          </span>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--dash-text-2)' }}>
            {liveNow ? 'Live session active' : 'AIra learning online'}
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <IconBtn label="Refresh data" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </IconBtn>
          <IconBtn label={`Profile — ${displayNameForUser(user)}`} onClick={onProfile}>
            <UserAvatar
              user={user}
              size={28}
              className="ring-1"
              fallbackClassName="text-[10px]"
            />
          </IconBtn>
          <IconBtn label="Sign out" onClick={onLogout} danger>
            <LogOut className="w-4 h-4" />
          </IconBtn>
        </div>
      </div>
    </header>
  );
}
