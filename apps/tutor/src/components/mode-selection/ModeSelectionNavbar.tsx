import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, LifeBuoy } from 'lucide-react';
import { studentRoutes } from '../../utils/routes';
import { getLandingOrigin } from '../../lib/navigation';
import Logo from './Logo';
import SignOutButton from '../common/SignOutButton';

function prefetchDashboard() {
  void import('../../pages/DashboardPage');
}

export default function ModeSelectionNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const guidesHref = `${getLandingOrigin()}/blog`;

  return (
    <header className={`ms-nav ${scrolled ? 'ms-nav--scrolled' : ''}`}>
      <div className="ms-nav__inner">
        <div className="ms-nav__left">
          <Link
            to={studentRoutes.modeSelection}
            className="ms-nav__back"
            aria-label="Mode selection home"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>

          <Link
            to={studentRoutes.modeSelection}
            className="ms-nav__logo"
            aria-label="Aɪra — mode selection"
          >
            <Logo size="md" markId="nav-mark" />
          </Link>

          <nav className="ms-nav__crumbs" aria-label="Breadcrumb">
            <span className="ms-nav__crumb ms-nav__crumb--current" aria-current="page">
              Select mode
            </span>
          </nav>

          <span className="ms-nav__mobile-step" aria-current="page">
            Select mode
          </span>
        </div>

        <div className="ms-nav__actions">
          <Link
            to={studentRoutes.dashboard}
            className="ms-btn ms-btn--dashboard"
            aria-label="Open dashboard"
            onPointerEnter={prefetchDashboard}
            onFocus={prefetchDashboard}
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            <span className="ms-btn__label">Dashboard</span>
          </Link>
          <SignOutButton className="ms-nav__signout" />
          <a href={guidesHref} className="ms-btn ms-btn--ghost ms-nav__guides">
            <LifeBuoy className="h-4 w-4" aria-hidden />
            <span className="ms-btn__label">Explore guides</span>
          </a>
        </div>
      </div>
    </header>
  );
}
