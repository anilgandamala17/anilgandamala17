import { Link } from 'react-router-dom';
import { studentRoutes } from '../../utils/routes';
import Logo from './Logo';

export default function ModeSelectionFooter() {
  const landing = import.meta.env.VITE_LANDING_ORIGIN || '';
  const year = new Date().getFullYear();

  return (
    <footer className="ms-footer">
      <div className="ms-footer__inner">
        <div className="ms-footer__brand">
          <Logo size="md" markId="footer-mark" />
          <p className="ms-footer__tagline">Premium learning ecosystem for Indian students</p>
        </div>

        <div className="ms-footer__cols">
          <div className="ms-footer__col">
            <p className="ms-footer__heading">Product</p>
            <nav aria-label="Product">
              <Link to={studentRoutes.curriculum}>Curriculum</Link>
              <Link to={studentRoutes.competitive}>Competitive</Link>
            </nav>
          </div>
          <div className="ms-footer__col">
            <p className="ms-footer__heading">Company</p>
            <nav aria-label="Company">
              <a href={`${landing}/privacy`}>Privacy</a>
              <a href={`${landing}/terms`}>Terms</a>
              <a href={`${landing}/about`}>Support</a>
            </nav>
          </div>
        </div>

        <p className="ms-footer__copy">© {year} Aɪra. All rights reserved.</p>
      </div>
    </footer>
  );
}
