import {
    BookOpen,
    Calculator,
    FlaskConical,
    Globe,
    Languages,
    Palette,
    Monitor,
    Code,
    Atom,
    Dna,
    Leaf,
    CheckCircle2,
    ChevronRight,
    BookMarked,
    Microscope,
    TrendingUp,
    Landmark,
} from 'lucide-react';
import { useCurriculumStore } from '@/features/curriculum/stores/curriculumStore';
import type { SchoolSubject } from '@/types';
import { useSearchParams } from 'react-router-dom';
import { getGradeById, getSubjectsForGradeStream } from '@/features/curriculum/data/schoolCurriculum';
import {
    isSeniorGrade,
    normalizeStream,
    streamDisplayName,
} from '@/features/curriculum/data/seniorStreams';
import EmptyState from '@/components/common/EmptyState';

interface SubjectGridProps {
    onSubjectSelect?: (subjectId: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
    'book-open':  <BookOpen className="w-5 h-5" />,
    'calculator': <Calculator className="w-5 h-5" />,
    'flask':      <FlaskConical className="w-5 h-5" />,
    'globe':      <Globe className="w-5 h-5" />,
    'languages':  <Languages className="w-5 h-5" />,
    'palette':    <Palette className="w-5 h-5" />,
    'monitor':    <Monitor className="w-5 h-5" />,
    'code':       <Code className="w-5 h-5" />,
    'atom':       <Atom className="w-5 h-5" />,
    'dna':        <Dna className="w-5 h-5" />,
    'leaf':       <Leaf className="w-5 h-5" />,
    'book-marked':<BookMarked className="w-5 h-5" />,
    'microscope': <Microscope className="w-5 h-5" />,
    'trending-up':<TrendingUp className="w-5 h-5" />,
    'landmark':   <Landmark className="w-5 h-5" />,
};

// ============================================================
// SUBJECT IMAGE MAP — keyed by `g{grade}_{subjectId}`
// Subject IDs from schoolCurriculum.ts:
//   Middle (6-8):   english, hindi, mathematics, science, social-science, computer
//   Secondary (9-10): english, hindi, mathematics, science, social-science, it
//   Senior (11-12): english, mathematics, physics, chemistry, biology (stream-filtered; no CS)
// ============================================================
const SUBJECT_IMAGES: Record<string, string> = {

    // ─── GRADE 6 ──────────────────────────────────────────────────────────────
    'g6_english':         '/tutor-media/images/subjects/english.png',
    'g6_hindi':           '/tutor-media/images/subjects/hindi-g6.png',
    'g6_mathematics':     '/tutor-media/images/subjects/mathematics.png',
    'g6_science':         '/tutor-media/images/subjects/science.png',
    'g6_social-science':  '/tutor-media/images/subjects/social-science-g6.png',
    'g6_computer':        '/tutor-media/images/subjects/computer-science.png',

    // ─── GRADE 7 ──────────────────────────────────────────────────────────────
    'g7_english':         '/tutor-media/images/subjects/english.png',
    'g7_hindi':           '/tutor-media/images/subjects/hindi-g7.png',
    'g7_mathematics':     '/tutor-media/images/subjects/mathematics.png',
    'g7_science':         '/tutor-media/images/subjects/science.png',
    'g7_social-science':  '/tutor-media/images/subjects/social-science-g7.png',
    'g7_computer':        '/tutor-media/images/subjects/computer-science.png',

    // ─── GRADE 8 ──────────────────────────────────────────────────────────────
    'g8_english':         '/tutor-media/images/subjects/english.png',
    'g8_hindi':           '/tutor-media/images/subjects/hindi-g8.png',
    'g8_mathematics':     '/tutor-media/images/subjects/mathematics.png',
    'g8_science':         '/tutor-media/images/subjects/science.png',
    'g8_social-science':  '/tutor-media/images/subjects/social-science-g8.png',
    'g8_computer':        '/tutor-media/images/subjects/computer-science.png',

    // ─── GRADE 9 ──────────────────────────────────────────────────────────────
    'g9_english':         '/tutor-media/images/subjects/english.png',
    'g9_hindi':           '/tutor-media/images/subjects/hindi-g9.png',
    'g9_mathematics':     '/tutor-media/images/subjects/math-g9.png',
    'g9_science':         '/tutor-media/images/subjects/science.png',
    'g9_social-science':  '/tutor-media/images/subjects/social-science-g9.png',
    'g9_it':              '/tutor-media/images/subjects/computer-science.png',

    // ─── GRADE 10 ─────────────────────────────────────────────────────────────
    'g10_english':        '/tutor-media/images/subjects/english.png',
    'g10_hindi':          '/tutor-media/images/subjects/hindi-g10.png',
    'g10_mathematics':    '/tutor-media/images/subjects/mathematics.png',
    'g10_science':        '/tutor-media/images/subjects/science.png',
    'g10_social-science': '/tutor-media/images/subjects/social-science-g10.png',
    'g10_it':             '/tutor-media/images/subjects/computer-science.png',

    // ─── GRADE 11 ─────────────────────────────────────────────────────────────
    'g11_english':        '/tutor-media/images/subjects/english.png',
    'g11_mathematics':    '/tutor-media/images/subjects/mathematics.png',
    'g11_physics':        '/tutor-media/images/subjects/physics.png',
    'g11_chemistry':      '/tutor-media/images/subjects/chemistry.png',
    'g11_biology':        '/tutor-media/images/subjects/biology-g11.png',

    // ─── GRADE 12 ─────────────────────────────────────────────────────────────
    'g12_english':        '/tutor-media/images/subjects/english.png',
    'g12_mathematics':    '/tutor-media/images/subjects/math-g12.png',
    'g12_physics':        '/tutor-media/images/subjects/physics.png',
    'g12_chemistry':      '/tutor-media/images/subjects/chemistry.png',
    'g12_biology':        '/tutor-media/images/subjects/biology.png',
};

// Fallback images per subject ID (no grade prefix) — local first
const SUBJECT_FALLBACK: Record<string, string> = {
    'english':         '/tutor-media/images/subjects/english.png',
    'hindi':           '/tutor-media/images/subjects/hindi.png',
    'mathematics':     '/tutor-media/images/subjects/mathematics.png',
    'science':         '/tutor-media/images/subjects/science.png',
    'social-science':  '/tutor-media/images/subjects/social-science.png',
    'computer':        '/tutor-media/images/subjects/computer-science.png',
    'it':              '/tutor-media/images/subjects/computer-science.png',
    'physics':         '/tutor-media/images/subjects/physics.png',
    'chemistry':       '/tutor-media/images/subjects/chemistry.png',
    'biology':         '/tutor-media/images/subjects/biology.png',
};

const DEFAULT_IMAGE = '/tutor-media/images/subjects/science.png';

/** Looks up the correct image using subject ID + grade number. No fuzzy matching. */
function getSubjectImage(subject: SchoolSubject, gradeNumber: number): string {
    const gradeKey = `g${gradeNumber}_${subject.id}`;
    if (SUBJECT_IMAGES[gradeKey]) return SUBJECT_IMAGES[gradeKey];
    if (SUBJECT_FALLBACK[subject.id]) return SUBJECT_FALLBACK[subject.id];
    return DEFAULT_IMAGE;
}

const SubjectCard = ({
    subject,
    gradeNumber,
    onClick,
    progress
}: {
    subject: SchoolSubject;
    gradeNumber: number;
    onClick: () => void;
    progress: number;
}) => {
    const icon = iconMap[subject.icon] || <BookOpen className="w-5 h-5" />;
    const totalTopics = subject.chapters.reduce((sum, ch) => sum + ch.topics.length, 0);
    const isComplete = progress >= 100;
    const imageUrl = getSubjectImage(subject, gradeNumber);

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left overflow-hidden
                       border transition-all duration-200 motion-reduce:transition-none
                       hover:-translate-y-0.5 motion-reduce:hover:translate-y-0
                       focus-visible:outline-none focus-visible:shadow-[var(--dash-focus-ring)]
                       group cursor-pointer flex flex-col h-full min-h-[260px] sm:min-h-[290px]"
            style={{
                borderRadius: 'var(--dash-radius-lg, 1rem)',
                borderColor: 'var(--dash-border, #e2e8f0)',
                background: 'var(--dash-surface-0, #fff)',
                boxShadow: 'var(--dash-shadow-1)',
            }}
            aria-label={`Open ${subject.name}${progress > 0 ? `, ${progress}% complete` : ''}`}
        >
            {/* Image Section */}
            <div className="relative w-full h-[120px] sm:h-[140px] overflow-hidden shrink-0">
                <img
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover object-center transform group-hover:scale-[1.03] transition-transform duration-500 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    loading="lazy"
                    decoding="async"
                />

                <div
                    className="absolute top-3 left-3 w-9 h-9 rounded-[var(--dash-radius-sm)] flex items-center justify-center shadow-md border border-white/30"
                    style={{ backgroundColor: `${subject.color}ee`, color: '#fff' }}
                >
                    {icon}
                </div>

                {isComplete ? (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-sm bg-emerald-600/90 border border-white/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" aria-hidden />
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">Completed</span>
                    </div>
                ) : progress > 0 ? (
                    <div
                        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/20"
                        style={{ backgroundColor: `${subject.color}dd` }}
                    >
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">{progress}% done</span>
                    </div>
                ) : null}
            </div>

            <div
                className="h-[3px] w-full shrink-0"
                style={{ background: subject.color }}
                aria-hidden
            />

            <div className="flex-1 flex flex-col p-4 sm:p-5">
                <h3
                    className="text-lg sm:text-xl font-extrabold tracking-tight leading-tight mb-1"
                    style={{ color: 'var(--dash-text, #0f172a)' }}
                >
                    {subject.name}
                </h3>

                <p
                    className="text-[12px] font-medium leading-relaxed line-clamp-2 mb-auto"
                    style={{ color: 'var(--dash-text-muted, #64748b)' }}
                >
                    {subject.description}
                </p>

                <div
                    className="flex items-center justify-between mt-4 pt-3.5 border-t"
                    style={{ borderColor: 'var(--dash-border, #e2e8f0)' }}
                >
                    <div className="flex items-center gap-2">
                        <span
                            className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider"
                            style={{
                                backgroundColor: `${subject.color}14`,
                                color: subject.color,
                            }}
                        >
                            {subject.chapters.length} chapters
                        </span>
                        <span
                            className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider"
                            style={{
                                background: 'var(--dash-surface-1, #f1f5f9)',
                                color: 'var(--dash-text-2, #475569)',
                            }}
                        >
                            {totalTopics} topics
                        </span>
                    </div>

                    <span
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: 'var(--dash-surface-1, #f1f5f9)' }}
                        aria-hidden
                    >
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--dash-text-2)' }} />
                    </span>
                </div>
            </div>
        </button>
    );
};

export default function SubjectGrid({ onSubjectSelect }: SubjectGridProps) {
    const progressMap = useCurriculumStore((s) => s.progressMap);
    const [searchParams, setSearchParams] = useSearchParams();
    const gradeId = searchParams.get('grade');
    const stream = normalizeStream(searchParams.get('stream'));

    const grade = gradeId ? getGradeById(gradeId) : null;

    if (!grade) return null;

    const subjects =
        isSeniorGrade(grade.id) && stream
            ? getSubjectsForGradeStream(grade.id, stream)
            : grade.subjects;

    const handleSubjectClick = (subjectId: string) => {
        if (onSubjectSelect) {
            onSubjectSelect(subjectId);
        }
    };

    const getProgress = (subjectId: string) => progressMap[`${grade.id}-${subjectId}`] || null;

    const titleSuffix =
        isSeniorGrade(grade.id) && stream ? ` · ${streamDisplayName(stream)}` : '';

    return (
        <div className="space-y-6 sm:space-y-8">
            <header>
                <p
                    className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'var(--dash-brand, #1d4ed8)' }}
                >
                    Choose a subject
                </p>
                <h2
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                    style={{ color: 'var(--dash-text, #0f172a)' }}
                >
                    {grade.name}
                    {titleSuffix}
                </h2>
                <p
                    className="mt-1.5 text-sm font-medium"
                    style={{ color: 'var(--dash-text-2, #475569)' }}
                >
                    {isSeniorGrade(grade.id) && stream
                        ? `Subjects for your ${streamDisplayName(stream)} stream · ${subjects.length} available`
                        : `${grade.description} · Ages ${grade.ageGroup}`}
                </p>
            </header>

            {subjects.length === 0 ? (
                <EmptyState
                    title="No subjects available"
                    description="Try another stream or class to continue discovering lessons."
                    actionLabel={isSeniorGrade(grade.id) ? 'Change stream' : 'Back to classes'}
                    onAction={() =>
                        setSearchParams(isSeniorGrade(grade.id) ? { grade: grade.id } : {})
                    }
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {subjects.map((subject) => {
                        const progress = getProgress(subject.id);
                        return (
                            <div key={subject.id} className="h-full w-full">
                                <SubjectCard
                                    subject={subject}
                                    gradeNumber={grade.gradeNumber}
                                    onClick={() => handleSubjectClick(subject.id)}
                                    progress={progress?.progressPercent || 0}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
