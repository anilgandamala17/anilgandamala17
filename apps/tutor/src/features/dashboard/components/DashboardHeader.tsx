import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import AiraLogo from '@/components/brand/AiraLogo';
import { UserAvatar, displayNameForUser } from '@/components/common/UserAvatar';
import type { User } from '@/types';

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
      className="relative p-2.5 min-w-[44px] min-h-[44px] rounded-[var(--dash-radius-sm)] transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:shadow-[var(--dash-focus-ring)]"
      style={{ color: 'var(--dash-text-2)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? 'var(--dash-error-soft)'
          : 'var(--dash-surface-1)';
        e.currentTarget.style.color = danger ? 'var(--dash-error)' : 'var(--dash-text)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--dash-text-2)';
      }}
    >
      {children}
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
  const name = displayNameForUser(user);

  return (
    <header
      className="sticky top-0 z-50 safe-top backdrop-blur-xl"
      style={{
        background: 'color-mix(in srgb, var(--dash-surface-0) 88%, transparent)',
        borderBottom: '1px solid var(--dash-border)',
      }}
    >
      <div
        className="mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3"
        style={{ maxWidth: 'var(--dash-max-w)' }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            to={homeTo}
            className="flex items-center shrink-0 focus-visible:outline-none focus-visible:shadow-[var(--dash-focus-ring)] rounded-[var(--dash-radius-sm)]"
            aria-label="Aɪra home"
            style={{ color: 'var(--dash-text)' }}
          >
            <AiraLogo
              height={34}
              className="gap-2"
              wordmarkClassName="hidden sm:inline text-lg tracking-tight"
            />
          </Link>
          <nav className="hidden sm:flex items-center text-[13px]" aria-label="Breadcrumb">
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
          <span className="relative flex h-2 w-2" aria-hidden>
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-50 animate-ping"
              style={{
                background: liveNow ? 'var(--dash-success)' : 'var(--dash-brand)',
                animationDuration: '2.4s',
              }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: liveNow ? 'var(--dash-success)' : 'var(--dash-brand)' }}
            />
          </span>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--dash-text-2)' }}>
            {liveNow ? 'Live session active' : 'Ready to learn'}
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <IconBtn label="Refresh data" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </IconBtn>
          <IconBtn label={`Profile — ${name}`} onClick={onProfile}>
            <UserAvatar
              user={user}
              size={28}
              className="ring-1 ring-[var(--dash-border)]"
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
