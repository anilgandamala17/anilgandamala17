import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import {
  BookOpen,
  Layers,
  LineChart,
  Timer,
  Target,
  BarChart3,
} from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import { useSettingsStore } from '../stores/settingsStore';
import ModeSelectionNavbar from '../components/mode-selection/ModeSelectionNavbar';
import ModeSelectionHero from '../components/mode-selection/ModeSelectionHero';
import ModeCard, { type ModeAccent } from '../components/mode-selection/ModeCard';
import ModeSelectionFooter from '../components/mode-selection/ModeSelectionFooter';
import { enterStudentMode, type StudentMode } from '../lib/navigation';
import { analytics } from '../services/analyticsService';
import '../components/mode-selection/mode-selection.css';

const MEDIA = {
  curriculum: '/tutor-media/mode-selection/curriculum-4x3.png',
  competitive: '/tutor-media/mode-selection/competitive-4x3.png',
} as const;

export default function StudentModeSelectionPage() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const reduceAnimations = useSettingsStore(
    (s) => s.settings.accessibility.reduceAnimations,
  );
  const reduceMotion = Boolean(prefersReducedMotion || reduceAnimations);
  const [selecting, setSelecting] = useState<ModeAccent | null>(null);

  useEffect(() => {
    analytics.modeSelectionViewed();
    const idle = window.setTimeout(() => {
      void import('./DashboardPage');
      void import('./CurriculumPage');
    }, 400);
    return () => window.clearTimeout(idle);
  }, []);

  const selectMode = useCallback(
    (mode: ModeAccent, studentMode: StudentMode) => {
      if (selecting) return;
      setSelecting(mode);
      analytics.modeSelected(studentMode);
      if (studentMode === 'curriculum') void import('./CurriculumPage');
      if (studentMode === 'competitive') void import('./StudentCompetitivePage');
      window.setTimeout(() => enterStudentMode(studentMode, navigate), reduceMotion ? 0 : 80);
    },
    [navigate, reduceMotion, selecting],
  );

  return (
    <PageTransition>
      <div className="mode-selection mode-selection__shell">
        <div className="mode-selection__atmosphere" aria-hidden />
        <ModeSelectionNavbar />

        <main className="mode-selection__main">
          <ModeSelectionHero />

          <div className="mode-selection__container">
            <section className="ms-routes" aria-labelledby="ms-routes-title">
              <div className="ms-routes__head">
                <h2 id="ms-routes-title">Available Modes</h2>
                <p>Pick a mode to continue. You can switch anytime.</p>
              </div>

              <div className="ms-routes__grid">
                <ModeCard
                  accent="curriculum"
                  image={MEDIA.curriculum}
                  eager
                  badge="Most chosen"
                  eyebrow="Board mastery"
                  title="Curriculum Mode"
                  description="Grade-aligned lessons, visual teaching, and chapter practice for school excellence."
                  tags={[
                    { label: 'Lessons', icon: BookOpen },
                    { label: 'Practice', icon: Layers },
                    { label: 'Progress', icon: LineChart },
                  ]}
                  ctaLabel="Enter curriculum"
                  onSelect={() => selectMode('curriculum', 'curriculum')}
                  isSelecting={selecting === 'curriculum'}
                  disabled={Boolean(selecting)}
                  markId="card-curr"
                />
                <ModeCard
                  accent="competitive"
                  image={MEDIA.competitive}
                  badge="New cohort"
                  eyebrow="Entrance prep"
                  title="Competitive Mode"
                  description="Timed mocks, weekly tests, and exam analytics for JEE, NEET, and more."
                  tags={[
                    { label: 'Mocks', icon: Timer },
                    { label: 'Targets', icon: Target },
                    { label: 'Analytics', icon: BarChart3 },
                  ]}
                  ctaLabel="Enter competitive"
                  onSelect={() => selectMode('competitive', 'competitive')}
                  isSelecting={selecting === 'competitive'}
                  disabled={Boolean(selecting)}
                  markId="card-comp"
                />
              </div>
            </section>
          </div>
        </main>

        <ModeSelectionFooter />
      </div>
    </PageTransition>
  );
}
