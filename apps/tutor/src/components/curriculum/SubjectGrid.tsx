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
import { useCurriculumStore } from '../../stores/curriculumStore';
import type { SchoolSubject } from '../../types';
import { useSearchParams } from 'react-router-dom';
import { getGradeById } from '../../data/schoolCurriculum';

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
//   Senior (11-12): physics, chemistry, mathematics, biology, english, computer-science
// ============================================================
const SUBJECT_IMAGES: Record<string, string> = {

    // ─── GRADE 6 ──────────────────────────────────────────────────────────────
    'g6_english':         'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=90&w=800', // books on a table
    'g6_hindi':           '/tutor-media/images/subjects/hindi-g6.png',
    'g6_mathematics':     'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&q=90&w=800', // calculator and numbers
    'g6_science':         'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=90&w=800', // beakers/chemicals
    'g6_social-science':  '/tutor-media/images/subjects/social-science-g6.png',
    'g6_computer':        'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=90&w=800', // laptop screen code

    // ─── GRADE 7 ──────────────────────────────────────────────────────────────
    'g7_english':         'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=90&w=800', // open book
    'g7_hindi':           '/tutor-media/images/subjects/hindi-g7.png',
    'g7_mathematics':     'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=90&w=800', // geometry / graphs
    'g7_science':         'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=90&w=800', // test tubes
    'g7_social-science':  '/tutor-media/images/subjects/social-science-g7.png',
    'g7_computer':        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=90&w=800', // programming setup

    // ─── GRADE 8 ──────────────────────────────────────────────────────────────
    'g8_english':         'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=90&w=800', // literature / glasses
    'g8_hindi':           '/tutor-media/images/subjects/hindi-g8.png',
    'g8_mathematics':     'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=90&w=800', // abacus / numbers
    'g8_science':         'https://images.unsplash.com/photo-1554475900-0a0350e3fc7b?auto=format&fit=crop&q=90&w=800', // lab setting
    'g8_social-science':  '/tutor-media/images/subjects/social-science-g8.png',
    'g8_computer':        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=90&w=800', // code on screen

    // ─── GRADE 9 ──────────────────────────────────────────────────────────────
    'g9_english':         'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=90&w=800', // elegant vintage books
    'g9_hindi':           '/tutor-media/images/subjects/hindi-g9.png',
    'g9_mathematics':     '/tutor-media/images/subjects/math-g9.png',
    'g9_science':         'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=90&w=800', // atomic structure looking
    'g9_social-science':  '/tutor-media/images/subjects/social-science-g9.png',
    'g9_it':              'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=90&w=800',

    // ─── GRADE 10 ─────────────────────────────────────────────────────────────
    'g10_english':        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=90&w=800', // book stack
    'g10_hindi':          '/tutor-media/images/subjects/hindi-g10.png',
    'g10_mathematics':    'https://images.unsplash.com/photo-1453733190371-0a9bedd82893?auto=format&fit=crop&q=90&w=800', // math puzzle
    'g10_science':        'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=90&w=800', // biology/microbes
    'g10_social-science': '/tutor-media/images/subjects/social-science-g10.png',
    'g10_it':             'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=90&w=800',

    // ─── GRADE 11 ─────────────────────────────────────────────────────────────
    'g11_english':        'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=90&w=800',
    'g11_mathematics':    'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=90&w=800', // chalkboard equations
    'g11_physics':        'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&q=90&w=800', // Newton's cradle / physics
    'g11_chemistry':      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&q=90&w=800', // chemistry apparatus
    'g11_biology':        '/tutor-media/images/subjects/biology-g11.png',
    'g11_computer-science':'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=90&w=800',

    // ─── GRADE 12 ─────────────────────────────────────────────────────────────
    'g12_english':        'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=90&w=800', // reading book
    'g12_mathematics':    '/tutor-media/images/subjects/math-g12.png',
    'g12_physics':        'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=90&w=800', // electronics / electromagnetism
    'g12_chemistry':      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=90&w=800', // chemical glassware
    'g12_biology':        'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=90&w=800', // biology microscope
    'g12_computer-science':'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&q=90&w=800',
};

// Fallback images per subject ID (no grade prefix)
const SUBJECT_FALLBACK: Record<string, string> = {
    'english':         'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=90&w=800', // open book
    'hindi':           '/tutor-media/images/subjects/hindi-g11.png',
    'mathematics':     'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=90&w=800', // geometry / graphs
    'science':         'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=90&w=800', // test tubes
    'social-science':  'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=90&w=800', // globe / society
    'computer':        'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=90&w=800', // computer code
    'it':              'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=90&w=800', // IT desk setup
    'physics':         'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&q=90&w=800', // Newton's cradle
    'chemistry':       'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&q=90&w=800', // chemistry apparatus
    'biology':         'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=90&w=800', // biology microscope
    'computer-science':'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=90&w=800', // coding
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&q=90&w=800';

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
        <div
            onClick={onClick}
            className="w-full bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden
                       shadow-[0_4px_20px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]
                       border border-slate-100/80 dark:border-slate-800
                       transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
                       hover:shadow-[0_16px_44px_rgba(0,0,0,0.13)] dark:hover:shadow-[0_16px_44px_rgba(0,0,0,0.6)]
                       hover:-translate-y-2 group cursor-pointer flex flex-col h-full min-h-[280px] sm:min-h-[310px]"
        >
            {/* Image Section */}
            <div className="relative w-full h-[130px] sm:h-[155px] overflow-hidden shrink-0">
                <img
                    src={imageUrl}
                    alt={subject.name}
                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    style={{ filter: 'saturate(1.2) contrast(1.05)' }}
                />

                {/* Subject Icon Badge — top left */}
                <div
                    className="absolute top-3 left-3 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/30"
                    style={{ backgroundColor: `${subject.color}ee`, color: '#fff' }}
                >
                    {icon}
                </div>

                {/* Status Badge — top right */}
                {isComplete ? (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-sm bg-green-500/90 border border-white/20 shadow-md">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span className="text-[9px] font-black text-white uppercase tracking-wider">Mastered</span>
                    </div>
                ) : progress > 0 ? (
                    <div
                        className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/20 shadow-md"
                        style={{ backgroundColor: `${subject.color}dd` }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[9px] font-black text-white uppercase tracking-wider">{progress}% Done</span>
                    </div>
                ) : null}
            </div>

            {/* Vivid Accent Bar */}
            <div
                className="h-[3px] w-full shrink-0"
                style={{ background: `linear-gradient(90deg, ${subject.color}, ${subject.color}44)` }}
            />

            {/* Content Section */}
            <div className="flex-1 flex flex-col p-4 sm:p-5 relative">
                {/* Soft background glow */}
                <div
                    className="absolute -top-6 -left-6 w-28 h-28 rounded-full opacity-[0.05] pointer-events-none blur-2xl"
                    style={{ backgroundColor: subject.color }}
                />

                {/* Subject Name */}
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white tracking-tight group-hover:translate-x-1 transition-transform duration-300 leading-tight mb-1">
                    {subject.name}
                </h3>

                {/* Description */}
                <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed line-clamp-2 mb-auto">
                    {subject.description}
                </p>

                {/* Bottom Row */}
                <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <span
                            className="px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider"
                            style={{
                                backgroundColor: `${subject.color}14`,
                                color: subject.color,
                                border: `1.5px solid ${subject.color}25`
                            }}
                        >
                            {subject.chapters.length} Ch
                        </span>
                        <span className="px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {totalTopics} Topics
                        </span>
                    </div>

                    {/* Arrow Button */}
                    <div className="relative w-8 h-8 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:-rotate-45 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-full transition-opacity duration-300 group-hover:opacity-0" />
                        <div
                            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ backgroundColor: subject.color }}
                        />
                        <ChevronRight className="relative w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-white transition-colors duration-300 z-10" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function SubjectGrid({ onSubjectSelect }: SubjectGridProps) {
    const progressMap = useCurriculumStore((s) => s.progressMap);
    const [searchParams] = useSearchParams();
    const gradeId = searchParams.get('grade');

    const grade = gradeId ? getGradeById(gradeId) : null;

    if (!grade) return null;

    const handleSubjectClick = (subjectId: string) => {
        if (onSubjectSelect) {
            onSubjectSelect(subjectId);
        }
    };

    const getProgress = (subjectId: string) => progressMap[`${grade.id}-${subjectId}`] || null;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    {grade.name} Subjects
                </h2>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <div className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-bold uppercase tracking-wider">
                        {grade.level.replace('-', ' ')}
                    </div>
                    <span className="text-sm font-medium">
                        {grade.description} • {grade.ageGroup}
                    </span>
                </div>
            </div>

            {/* Subject grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
                {grade.subjects.map((subject) => {
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
        </div>
    );
}
