import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { studentRoutes } from '../utils/routes';
import PageTransition from '../components/common/PageTransition';
import CompetitiveDashboard from '../components/competitive/CompetitiveDashboard';
import AiraLogo from '../components/brand/AiraLogo';
import SignOutButton from '../components/common/SignOutButton';

export default function StudentCompetitivePage() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="competitive-mode relative flex h-[100dvh] flex-col overflow-hidden transition-colors duration-500">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[var(--comp-surface)]" />
          <div className="absolute inset-0 opacity-70 dark:opacity-50">
            <div className="absolute -left-[12%] -top-[18%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle,rgba(194,65,12,0.22)_0%,transparent_70%)]" />
            <div className="absolute -right-[10%] top-[-8%] h-[48%] w-[48%] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.18)_0%,transparent_70%)]" />
            <div className="absolute bottom-[-18%] left-[18%] h-[42%] w-[42%] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.12)_0%,transparent_70%)]" />
            <div className="absolute bottom-[-12%] right-[-8%] h-[46%] w-[46%] rounded-full bg-[radial-gradient(circle,rgba(219,39,119,0.1)_0%,transparent_70%)]" />
          </div>
          <div
            className="absolute inset-0 opacity-[0.035] mix-blend-overlay dark:opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '160px 160px',
            }}
          />
        </div>

        <div className="relative z-10 flex h-full flex-col overflow-hidden">
          <header className="sticky top-0 z-50 border-b border-[var(--comp-border)] bg-[var(--comp-elevated)] max-lg:shadow-sm lg:bg-[var(--comp-elevated)]/90 lg:backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => navigate(studentRoutes.modeSelection)}
                className="group flex items-center gap-2 rounded-2xl border border-[var(--comp-border)] bg-white px-3 py-2 shadow-sm transition active:scale-95 dark:bg-slate-900"
              >
                <ArrowLeft className="h-4 w-4 text-slate-600 transition group-hover:-translate-x-0.5 dark:text-slate-300" />
                <span className="hidden text-sm font-bold text-slate-600 sm:inline dark:text-slate-300">
                  Modes
                </span>
              </button>

              <div className="flex items-center gap-2.5">
                <AiraLogo height={32} />
                <span className="hidden items-center gap-1.5 rounded-full border border-orange-200/70 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-700 sm:inline-flex dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300">
                  <Trophy className="h-3 w-3" />
                  Competitive
                </span>
              </div>

              <SignOutButton />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-hidden">
            <CompetitiveDashboard />
          </main>
        </div>
      </div>
    </PageTransition>
  );
}
