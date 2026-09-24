import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, RefreshCw, Sparkles,
  BarChart3, Users, AlertTriangle, ChevronRight, ArrowLeft, Brain, Zap, GraduationCap
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCurriculumStore } from '@/features/curriculum/stores/curriculumStore';
import { getRoutesForRole, teacherRoutes } from '@/utils/routes';
import { redirectAfterSignOut } from '@/lib/authSession';
import { useSignOut } from '@/hooks/useSignOut';
import { schoolGrades } from '@/features/curriculum/data/schoolCurriculum';
import PageTransition from '@/components/common/PageTransition';
import { UserAvatar } from '@/components/common/UserAvatar';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { MOCK_CLASS_PERFORMANCE, MOCK_STUDENTS, Student } from '@/data/mockAnalytics';
import { analytics } from '@/services/analyticsService';
import { AIRA_BRAND_MARK_SRC } from '@/constants/brand';

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { logout, role, user } = useAuthStore();
  const signOut = useSignOut();
  const routes = getRoutesForRole(role);
  const { selectedGrade, selectedSubject, setSelectedGrade, setSelectedSubject } = useCurriculumStore();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    analytics.dashboardView('teacher_dashboard', 'teacher');
  }, []);

  const handleLogout = () => void signOut();

  const handleSwitchRole = async () => {
    if (import.meta.env.DEV) {
      navigate('/dev/demo-roles');
      return;
    }
    await logout();
    redirectAfterSignOut();
  };

  const weakTopics = MOCK_CLASS_PERFORMANCE.filter(t => t.score < 60);

  return (
    <div className="min-h-screen min-h-[100dvh] relative overflow-hidden transition-colors duration-500">
      {/* Premium Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Ultra-Vibrant Mesh Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 dark:bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-[20%] right-[5%] w-[30%] h-[30%] bg-pink-500/10 dark:bg-pink-600/5 rounded-full blur-[100px]" />

        {/* Floating Atmospheric Decorations */}
        <motion.div
          className="absolute top-[15%] left-[10%] w-16 h-16 text-purple-400/30 dark:text-purple-500/20"
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Brain className="w-full h-full drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
        </motion.div>

        <motion.div
          className="absolute bottom-[20%] left-[15%] w-12 h-12 text-indigo-400/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          <Sparkles className="w-full h-full" />
        </motion.div>

        <motion.div
          className="absolute top-[40%] right-[10%] w-14 h-14 text-pink-400/20"
          animate={{ x: [0, 30, 0], y: [0, 30, 0], rotate: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          <GraduationCap className="w-full h-full" />
        </motion.div>

        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px'
          }}
        />
      </div>

      <div className="relative z-10 w-full h-screen overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Header - High Stacking & Premium Glass */}
        <header className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/50 sticky top-0 z-[100] safe-top w-full shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link
              to={teacherRoutes.dashboard}
              className="flex items-center gap-3 group active:scale-95 transition-transform"
              aria-label="Dashboard"
            >
              <img
                src={AIRA_BRAND_MARK_SRC}
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 bg-transparent object-contain select-none shrink-0"
                draggable={false}
                decoding="async"
              />
              <span className="font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 tracking-tight">Aɪra</span>
            </Link>

            <nav className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={handleSwitchRole}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors relative group"
                title="Switch Role"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Switch Profile</span>
              </motion.button>



              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link
                  to={routes.profile}
                  className="p-1.5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl transition-colors relative group"
                  title="Profile"
                >
                  <UserAvatar
                    user={user}
                    size={30}
                    className="ring-1 ring-black/5 dark:ring-white/10"
                    fallbackClassName="bg-gradient-to-br from-purple-500 to-pink-500"
                  />
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Account</span>
                </Link>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={handleLogout}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors relative group"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Logout</span>
              </motion.button>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full overflow-x-hidden relative" id="main-content" tabIndex={-1}>
          <PageTransition className="max-w-7xl mx-auto px-4 py-6 md:py-10">
            <Breadcrumbs role={role} homePath={teacherRoutes.dashboard} items={selectedStudent ? [{ label: 'Analytics', path: teacherRoutes.dashboard }, { label: selectedStudent.name }] : [{ label: 'Analytics' }]} className="mb-6" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">
                  {selectedStudent ? 'Student Diagnosis' : 'Class Analytics'}
                </h1>
                <p className="text-gray-600 dark:text-slate-300 mt-1">
                  {selectedStudent
                    ? 'Deep dive into individual learning gaps and error patterns.'
                    : 'Overview of class performance, weaknesses, and student trends.'}
                </p>
              </div>

              {!selectedStudent && (
                <div className="flex gap-3">
                  <select
                    value={selectedGrade?.id ?? ''}
                    onChange={(e) => setSelectedGrade(e.target.value || null)}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Select Grade</option>
                    {schoolGrades.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSubject?.id ?? ''}
                    onChange={(e) => setSelectedSubject(e.target.value || null)}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
                    disabled={!selectedGrade}
                  >
                    <option value="">Select Subject</option>
                    {selectedGrade?.subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!selectedStudent ? (
                /* DASHBOARD VIEW */
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  {(!selectedGrade || !selectedSubject) ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700">
                      <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-xl text-gray-500 font-medium">Please select a Grade and Subject to view analytics</p>
                    </div>
                  ) : (
                    <>
                      {/* Top Stats Cards - Premium Glassmorphic */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="group relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/30 dark:border-slate-800/50 shadow-xl hover:shadow-2xl transition-all"
                        >
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                          <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:rotate-6 transition-transform">
                              <Users className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Total Students</p>
                              <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{MOCK_STUDENTS.length}</h3>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="group relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/30 dark:border-slate-800/50 shadow-xl hover:shadow-2xl transition-all"
                        >
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                          <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:rotate-6 transition-transform">
                              <AlertTriangle className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">At-Risk Topics</p>
                              <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{weakTopics.length}</h3>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="group relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/30 dark:border-slate-800/50 shadow-xl hover:shadow-2xl transition-all"
                        >
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                          <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
                              <BarChart3 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Class Average</p>
                              <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">78%</h3>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Class Heatmap - Premium Redesign */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/30 dark:border-slate-800/50 shadow-2xl relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <BarChart3 className="w-24 h-24" />
                          </div>

                          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-indigo-500" />
                            </div>
                            Topic Diagnostic Heatmap
                          </h3>

                          <div className="space-y-6">
                            {MOCK_CLASS_PERFORMANCE.map((topic, idx) => (
                              <motion.div
                                key={topic.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className="space-y-2 group"
                              >
                                <div className="flex justify-between items-end">
                                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-500 transition-colors uppercase tracking-tight">{topic.name}</span>
                                  <div className="text-right">
                                    <span className={`text-lg font-black ${topic.score < 60 ? 'text-rose-500' : topic.score < 80 ? 'text-amber-500' : 'text-emerald-500'}`}>{topic.score}%</span>
                                    {topic.score < 60 && (
                                      <motion.div
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none mt-1"
                                      >
                                        Critical Fix Needed
                                      </motion.div>
                                    )}
                                  </div>
                                </div>
                                <div className="h-3 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden border border-white/20 dark:border-slate-700/30">
                                  <motion.div
                                    className={`h-full rounded-full relative ${topic.score < 60
                                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                                      : topic.score < 80
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                      }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${topic.score}%` }}
                                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                  >
                                    {/* Liquid Shine Effect */}
                                    <div className="absolute inset-0 bg-white/20 w-1/2 blur-lg -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000" />
                                  </motion.div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        {/* Student List - Premium Redesign */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/30 dark:border-slate-800/50 shadow-2xl relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Users className="w-24 h-24" />
                          </div>

                          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-purple-500" />
                            </div>
                            Student Tactical Drilldown
                          </h3>

                          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {MOCK_STUDENTS.map((student, idx) => (
                              <motion.div
                                key={student.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                onClick={() => setSelectedStudent(student)}
                                className="group relative p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] cursor-pointer transition-all flex items-center justify-between overflow-hidden"
                              >
                                {/* Active Selection Border Effect */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-center gap-4">
                                  <div className="relative">
                                    <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-2xl bg-slate-200 p-0.5 object-cover" />
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${student.overallScore > 85 ? 'bg-emerald-500' : student.overallScore > 70 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                  </div>
                                  <div>
                                    <h4 className="font-black text-sm text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{student.name}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                      {student.weakTopics.length > 0 ? (
                                        <span className="text-rose-500/80">{student.weakTopics.length} Focus Points</span>
                                      ) : (
                                        <span className="text-emerald-500/80">Performance Peak</span>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className={`text-xl font-black ${student.overallScore < 70 ? 'text-rose-500' : student.overallScore < 85 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                      {student.overallScore}%
                                    </div>
                                    <div className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Mastery</div>
                                  </div>
                                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                                    <ChevronRight className="w-5 h-5" />
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="drilldown"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="space-y-8"
                >
                  <motion.button
                    whileHover={{ x: -5 }}
                    onClick={() => setSelectedStudent(null)}
                    className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-black uppercase tracking-widest text-xs"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <ArrowLeft className="w-4 h-4" />
                    </div>
                    Back to Command Center
                  </motion.button>

                  <div className="relative group overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/30 dark:border-slate-800/50 shadow-2xl">
                    {/* Student Header - Premium Gradient */}
                    <div className="relative p-8 md:p-12 overflow-hidden border-b border-white/20 dark:border-slate-800/50">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
                      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />

                      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                        <div className="relative">
                          <motion.img
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            src={selectedStudent.avatar}
                            alt={selectedStudent.name}
                            className="w-32 h-32 rounded-[2rem] border-4 border-white dark:border-slate-800 shadow-2xl bg-white"
                          />
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-slate-800">
                            <Zap className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="flex-1 space-y-4">
                          <div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-2">{selectedStudent.name}</h2>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">Grade {schoolGrades.find(g => g.id === selectedGrade?.id)?.name}</span>
                              <span className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">{selectedStudent.strongTopics.length} Mastery Points</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-6 justify-center md:justify-start pt-2">
                            <div className="text-center md:text-left border-r border-slate-200 dark:border-slate-700 pr-6">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Consistency</p>
                              <p className="font-bold text-slate-700 dark:text-slate-300">92% Engagement</p>
                            </div>
                            <div className="text-center md:text-left">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Velocity</p>
                              <p className="font-bold text-slate-700 dark:text-slate-300">8/10 Milestones</p>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-white/50 dark:bg-slate-800/50 rounded-[2rem] border border-white/50 dark:border-slate-700/50 min-w-[160px]">
                          <div className={`text-5xl font-black mb-1 ${selectedStudent.overallScore < 70 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {selectedStudent.overallScore}%
                          </div>
                          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Global Rank</div>
                        </div>
                      </div>
                    </div>

                    {/* Analysis Grid - Deep Diagnostic */}
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Intervention Modules */}
                      <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-slate-200/50 dark:border-slate-800/50">
                        <h3 className="text-xl font-black text-rose-500 mb-8 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          Precision Intervention
                        </h3>

                        {selectedStudent.weakTopics.length === 0 ? (
                          <div className="p-8 text-center bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                            <Sparkles className="w-12 h-12 text-emerald-500/30 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold">Optimal performance detected. No weak areas.</p>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            {selectedStudent.weakTopics.map(topic => (
                              <div key={topic.id} className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight">{topic.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Class Baseline: {topic.classAverage}%</p>
                                  </div>
                                  <span className="text-2xl font-black text-rose-500">{topic.score}%</span>
                                </div>
                                <div className="h-3 w-full bg-rose-500/5 rounded-full overflow-hidden border border-rose-500/10">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${topic.score}%` }}
                                    transition={{ duration: 2, delay: 0.3 }}
                                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Error DNA */}
                      <div className="p-8 md:p-12 bg-slate-50/30 dark:bg-slate-900/20">
                        <h3 className="text-xl font-black text-indigo-500 mb-8 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Brain className="w-6 h-6" />
                          </div>
                          Cognitive Error DNA
                        </h3>

                        <div className="space-y-4">
                          {selectedStudent.recentErrors.map((error, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * idx }}
                              className="group relative bg-white/60 dark:bg-slate-800/60 p-5 rounded-[2rem] border border-white/40 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{error.topicName}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${error.errorType === 'conceptual'
                                  ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  }`}>
                                  {error.errorType} Error
                                </span>
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 font-bold text-sm mb-4 leading-relaxed">{error.description}</p>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 group-hover:bg-indigo-600 transition-colors"
                              >
                                <Zap className="w-3 h-3" /> Assign Target Practice
                              </motion.button>
                            </motion.div>
                          ))}
                          {selectedStudent.recentErrors.length === 0 && (
                            <div className="p-8 text-center text-slate-400 font-bold italic">
                              No cognitive roadblocks identified.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
