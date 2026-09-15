import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, BookOpen, Compass, GraduationCap } from 'lucide-react';
import { useCurriculumStore } from '../../stores/curriculumStore';
import { schoolGrades } from '../../data/schoolCurriculum';
import type { SchoolGrade, GradeLevel } from '../../types';
import './curriculum.css';

interface GradeSelectorProps {
  onGradeSelect?: (gradeId: string) => void;
}

const LEVEL_ORDER: GradeLevel[] = ['middle', 'secondary', 'senior-secondary'];

const LEVEL_META: Record<
  GradeLevel,
  {
    label: string;
    accent: string;
    blurb: string;
    grid: '2' | '3';
    step: string;
    Icon: typeof BookOpen;
  }
> = {
  middle: {
    label: 'Middle School',
    accent: '#0284c7',
    blurb: 'Build strong foundations',
    grid: '3',
    step: '01',
    Icon: BookOpen,
  },
  secondary: {
    label: 'Secondary',
    accent: '#0d9488',
    blurb: 'Board-ready depth',
    grid: '2',
    step: '02',
    Icon: Compass,
  },
  'senior-secondary': {
    label: 'Senior Secondary',
    accent: '#d97706',
    blurb: 'Stream specialization',
    grid: '2',
    step: '03',
    Icon: GraduationCap,
  },
};

const PATH_STEPS = [
  { label: 'Middle', tone: '#0284c7' },
  { label: 'Secondary', tone: '#0d9488' },
  { label: 'Senior', tone: '#d97706' },
];

function GradeCard({
  grade,
  accent,
  progress,
  index,
  onSelect,
}: {
  grade: SchoolGrade;
  accent: string;
  progress: number;
  index: number;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.05, 0.3),
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      onClick={onSelect}
      className="grade-card"
      style={{ ['--level-accent' as string]: accent }}
      aria-label={`Select ${grade.name}`}
    >
      <div className="grade-card__media" aria-hidden>
        {grade.image ? (
          <img src={grade.image} alt="" loading="lazy" decoding="async" />
        ) : null}
        <span className="grade-card__media-fade" />
        <span className="grade-card__watermark">{grade.gradeNumber}</span>
      </div>

      <div className="grade-card__rail" aria-hidden />

      <div className="grade-card__body">
        <div className="grade-card__topline">
          <div className="min-w-0">
            <div className="grade-card__num">Class {grade.gradeNumber}</div>
            <h3 className="grade-card__name">{grade.name}</h3>
          </div>
        </div>

        <p className="grade-card__desc">{grade.description}</p>

        <div className="grade-card__meta">
          <span>
            <strong>{grade.subjects.length}</strong> subjects
          </span>
          <span className="grade-card__meta-dot" aria-hidden />
          <span>Ages {grade.ageGroup}</span>
        </div>

        {progress > 0 ? (
          <div className="grade-card__progress" aria-label={`${progress}% complete`}>
            <div className="grade-card__progress-row">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="grade-card__track">
              <i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
            </div>
          </div>
        ) : null}

        <div className="grade-card__footer">
          <span className="grade-card__cta">Open pathway</span>
          <span className="grade-card__go" aria-hidden>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function GradeSelector({ onGradeSelect }: GradeSelectorProps) {
  const setSelectedGrade = useCurriculumStore((s) => s.setSelectedGrade);
  const getGradeProgress = useCurriculumStore((s) => s.getGradeProgress);

  const gradesByLevel = useMemo(() => {
    return schoolGrades.reduce(
      (acc, grade) => {
        if (!acc[grade.level]) acc[grade.level] = [];
        acc[grade.level].push(grade);
        return acc;
      },
      {} as Record<GradeLevel, SchoolGrade[]>,
    );
  }, []);

  const handleGradeClick = (gradeId: string) => {
    if (onGradeSelect) onGradeSelect(gradeId);
    else setSelectedGrade(gradeId);
  };

  let stagger = 0;

  return (
    <div className="grade-select">
      <motion.header
        className="grade-select__hero"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="grade-select__hero-copy">
          <p className="grade-select__eyebrow">
            <Compass className="h-3.5 w-3.5" strokeWidth={2.4} />
            Learning atlas
          </p>
          <h1 className="grade-select__title">
            Select your
            <span className="grade-select__title-accent"> class</span>
          </h1>
          <p className="grade-select__lede">
            A structured path from middle school to senior secondary — pick your grade and step into
            subjects built for how you learn.
          </p>

          <div className="grade-select__path" aria-hidden>
            {PATH_STEPS.map((step, i) => (
              <div key={step.label} className="grade-select__path-item">
                <span className="grade-select__path-dot" style={{ background: step.tone }} />
                <span className="grade-select__path-label">{step.label}</span>
                {i < PATH_STEPS.length - 1 ? <span className="grade-select__path-line" /> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="grade-select__hero-panel" aria-hidden>
          <div className="grade-select__hero-orb grade-select__hero-orb--a" />
          <div className="grade-select__hero-orb grade-select__hero-orb--b" />
          <div className="grade-select__hero-grid" />
          <p className="grade-select__hero-kicker">Classes</p>
          <p className="grade-select__hero-range">6 – 12</p>
          <p className="grade-select__hero-note">Seven pathways · CBSE-aligned depth</p>
        </div>
      </motion.header>

      {LEVEL_ORDER.map((level) => {
        const grades = gradesByLevel[level];
        if (!grades?.length) return null;
        const meta = LEVEL_META[level];
        const Icon = meta.Icon;

        return (
          <section
            key={level}
            className="grade-select__band"
            style={{ ['--level-accent' as string]: meta.accent }}
            aria-labelledby={`grade-band-${level}`}
          >
            <div className="grade-select__band-head">
              <div className="grade-select__band-label">
                <span className="grade-select__band-step">{meta.step}</span>
                <span className="grade-select__band-icon" aria-hidden>
                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div>
                  <h2 id={`grade-band-${level}`} className="grade-select__band-title">
                    {meta.label}
                  </h2>
                  <p className="grade-select__band-sub">{meta.blurb}</p>
                </div>
              </div>
              <span className="grade-select__band-count">
                {grades.length} {grades.length === 1 ? 'class' : 'classes'}
              </span>
            </div>

            <div className={`grade-select__grid grade-select__grid--${meta.grid}`}>
              {grades.map((grade) => {
                const index = stagger++;
                return (
                  <GradeCard
                    key={grade.id}
                    grade={grade}
                    accent={meta.accent}
                    progress={getGradeProgress(grade.id)}
                    index={index}
                    onSelect={() => handleGradeClick(grade.id)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
