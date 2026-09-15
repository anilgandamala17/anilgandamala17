import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Building2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useCurriculumStore } from '../stores/curriculumStore';
import { studentRoutes, teacherRoutes, adminRoutes } from '../utils/routes';
import { toast } from '../stores/toastStore';
import type { AppRole } from '../types';

const ROLES: {
  role: AppRole;
  label: string;
  description: string;
  icon: typeof GraduationCap;
  enter: () => void;
  home: string;
  accent: string;
}[] = [
  {
    role: 'student',
    label: 'Student demo',
    description: 'Local demo session (not a Firebase login)',
    icon: GraduationCap,
    enter: () => useAuthStore.getState().enterStudentDemo(),
    home: studentRoutes.modeSelection,
    accent: 'from-amber-400 to-orange-500',
  },
  {
    role: 'teacher',
    label: 'Teacher demo',
    description: 'Local demo session (not a Firebase login)',
    icon: BookOpen,
    enter: () => useAuthStore.getState().enterTeacherDemo(),
    home: teacherRoutes.dashboard,
    accent: 'from-indigo-500 to-violet-600',
  },
  {
    role: 'admin',
    label: 'Admin demo',
    description: 'Local demo session (not a Firebase login)',
    icon: Building2,
    enter: () => useAuthStore.getState().enterAdminDemo(),
    home: adminRoutes.dashboard,
    accent: 'from-pink-500 to-rose-600',
  },
];

/** Dev / admin-only demo role switcher. Not a public login entry. */
export default function DemoRolesPage() {
  const navigate = useNavigate();
  const clearSelection = useCurriculumStore((s) => s.clearSelection);

  const handleSelect = (entry: (typeof ROLES)[number]) => {
    clearSelection();
    entry.enter();
    toast.success(`Demo: ${entry.label}`);
    navigate(entry.home);
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden flex flex-col items-center justify-center px-4 safe-top safe-bottom safe-x font-sans text-slate-800">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-indigo-100 pointer-events-none" />

      <motion.div
        className="relative z-10 flex flex-col items-center max-w-sm w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Dev / Admin</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Demo roles</h1>
        <p className="text-slate-600 text-sm mb-8 text-center">
          Bypass Firebase with a local demo session. Production users sign in via the landing /login page.
        </p>

        <div className="w-full space-y-3">
          {ROLES.map((entry, i) => {
            const Icon = entry.icon;
            return (
              <motion.button
                key={entry.role}
                type="button"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(entry)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-md hover:bg-white transition-colors text-left"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${entry.accent} flex items-center justify-center shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg leading-tight">{entry.label}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{entry.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
