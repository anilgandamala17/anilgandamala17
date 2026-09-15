import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, LogOut, RefreshCw, Sparkles,
  Building2, AlertCircle, TrendingUp, Users, ArrowLeft, GraduationCap, Star,
  ChevronRight, Brain, Zap, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useCurriculumStore } from '../stores/curriculumStore';
import { getRoutesForRole, adminRoutes } from '../utils/routes';
import { redirectAfterSignOut } from '../lib/authSession';
import { useSignOut } from '../hooks/useSignOut';
import { schoolGrades } from '../data/schoolCurriculum';
import PageTransition from '../components/common/PageTransition';
import { UserAvatar } from '../components/common/UserAvatar';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { MOCK_TEACHERS, SYSTEMIC_ISSUES, MOCK_STUDENTS, TeacherStats, Student } from '../data/mockAnalytics';
import { analytics } from '../services/analyticsService';
import { AIRA_BRAND_MARK_SRC } from '../constants/brand';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logout, role, user } = useAuthStore();
  const signOut = useSignOut();
  const routes = getRoutesForRole(role);
  const { selectedGrade, selectedSubject, setSelectedGrade, setSelectedSubject } = useCurriculumStore();
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherStats | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    analytics.dashboardView('admin_dashboard', 'admin');
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

  // Filter teachers based on selection (Mock logic)
  const relevantTeachers = selectedSubject
    ? MOCK_TEACHERS.filter(t => t.subject === selectedGrade?.subjects.find(s => s.id === selectedSubject?.id)?.name || t.subject === 'Mathematics')
    : MOCK_TEACHERS;

  // Filter systemic issues
  const relevantIssues = selectedSubject
    ? SYSTEMIC_ISSUES.filter(i => i.subject === selectedGrade?.subjects.find(s => s.id === selectedSubject?.id)?.name || i.subject === 'Mathematics')
    : SYSTEMIC_ISSUES;

  // Mock students for selected teacher (Just picking a subset for demo)
  const teacherStudents = selectedTeacher ? MOCK_STUDENTS.slice(0, 5) : [];

  return (
    <div className="min-h-screen min-h-[100dvh] relative overflow-hidden transition-colors duration-500">
      {/* Premium Background Atmosphere - Level 2 Governance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Ultra-Vibrant Mesh Gradients */}
        <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-purple-500/20 dark:bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-[30%] left-[5%] w-[25%] h-[25%] bg-emerald-500/15 dark:bg-emerald-600/5 rounded-full blur-[100px]" />

        {/* Floating Atmospheric Governance Icons */}
        <motion.div
          className="absolute top-[20%] right-[15%] w-16 h-16 text-indigo-400/30 dark:text-indigo-500/20"
          animate={{ y: [0, -20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <Building2 className="w-full h-full drop-shadow-[0_0_15px_rgba(79,70,229,0.4)]" />
        </motion.div>

        <motion.div
          className="absolute bottom-[25%] right-[20%] w-12 h-12 text-emerald-400/20"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 9, repeat: Infinity }}
        >
          <TrendingUp className="w-full h-full" />
        </motion.div>

        <motion.div
          className="absolute top-[45%] left-[8%] w-14 h-14 text-purple-400/20"
          animate={{ x: [0, -25, 0], y: [0, 25, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
        >
          <Zap className="w-full h-full" />
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
        {/* Header - Governance Glass */}
        <header className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/50 sticky top-0 z-[100] safe-top w-full shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link
              to={adminRoutes.dashboard}
              onClick={() => {
                setSelectedStudent(null);
                setSelectedTeacher(null);
              }}
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
              <span className="font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 tracking-tight">Aɪra</span>
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                to={adminRoutes.analytics}
                className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-xl border border-indigo-200/80 bg-indigo-50 px-3 text-xs font-bold text-indigo-800 hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-200"
              >
                Product analytics
              </Link>
              <Link
                to={adminRoutes.weeklyExams}
                className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 px-3 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
              >
                Weekly exams
              </Link>
              <Link
                to={adminRoutes.curriculumContent}
                className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
              >
                Curriculum content
              </Link>
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
                  to={routes.settings}
                  className="p-2 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors relative group"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">System Config</span>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link
                  to={routes.profile}
                  className="p-1.5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors relative group"
                  title="Profile"
                >
                  <UserAvatar
                    user={user}
                    size={30}
                    className="ring-1 ring-black/5 dark:ring-white/10"
                    fallbackClassName="bg-gradient-to-br from-emerald-500 to-teal-500"
                  />
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Admin Profile</span>
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
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Terminate Session</span>
              </motion.button>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full overflow-x-hidden relative" id="main-content" tabIndex={-1}>
          <PageTransition className="max-w-7xl mx-auto px-4 py-6 md:py-10">
            <Breadcrumbs
              role={role}
              homePath={adminRoutes.dashboard}
              items={
                selectedStudent
                  ? [{ label: 'Governance', path: adminRoutes.dashboard, onClick: () => { setSelectedTeacher(null); setSelectedStudent(null); } }, { label: selectedTeacher?.name || 'Teacher', onClick: () => setSelectedStudent(null) }, { label: selectedStudent.name }]
                  : selectedTeacher
                    ? [{ label: 'Governance', path: adminRoutes.dashboard, onClick: () => setSelectedTeacher(null) }, { label: selectedTeacher.name }]
                    : [{ label: 'Governance' }]
              }
              className="mb-6"
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">
                  {selectedStudent ? 'Student Diagnosis' : selectedTeacher ? 'Teacher Overview' : 'Governance Dashboard'}
                </h1>
                <p className="text-gray-600 dark:text-slate-300 mt-1">
                  {selectedStudent
                    ? `Deep dive into learning gaps for ${selectedStudent.name}`
                    : selectedTeacher
                      ? `Detailed performance metrics for ${selectedTeacher.name}`
                      : 'System-wide performance tracking, teacher allocation, and systemic insight analysis.'}
                </p>
              </div>

              {!selectedTeacher && !selectedStudent && (
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
              {selectedStudent ? (
                /* --- STUDENT DRILLDOWN VIEW --- */
                <motion.div
                  key="student-diagnosis"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <motion.button
                    whileHover={{ x: -4 }}
                    onClick={() => setSelectedStudent(null)}
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[10px] mb-2 hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Lead Analytics
                  </motion.button>

                  <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/30 dark:border-slate-800/50 shadow-2xl overflow-hidden">
                    {/* Student Header - Premium Glass */}
                    <div className="p-8 md:p-12 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border-b border-white/20 dark:border-slate-800/50 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-200/[0.05] [mask-image:linear-gradient(to_bottom,white,transparent)]" />

                      <motion.div
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                        <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-32 h-32 rounded-full border-4 border-white/50 dark:border-slate-700/50 shadow-2xl bg-white relative z-10" />
                      </motion.div>

                      <div className="flex-1 text-center md:text-left relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{selectedStudent.name}</h2>
                          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 w-fit mx-auto md:mx-0">
                            Grade {schoolGrades.find(g => g.id === selectedGrade?.id)?.name}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">{selectedStudent.strongTopics.length} Mastery Topics</p>
                        <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                          <div className="px-4 py-2 bg-white/40 dark:bg-slate-800/40 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20 dark:border-slate-700/30 text-slate-500">Attendance: 92%</div>
                          <div className="px-4 py-2 bg-white/40 dark:bg-slate-800/40 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20 dark:border-slate-700/30 text-slate-500">Quotas: 8/10</div>
                        </div>
                      </div>

                      <div className="text-center relative z-10 p-6 rounded-[2rem] bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm border border-white/20 dark:border-slate-700/30">
                        <motion.div
                          initial={{ scale: 0.5 }}
                          animate={{ scale: 1 }}
                          className={`text-6xl font-black ${selectedStudent.overallScore < 70 ? 'text-amber-500' : 'text-emerald-500'} tracking-tighter`}
                        >
                          {selectedStudent.overallScore}%
                        </motion.div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Overall Score</div>
                      </div>
                    </div>

                    {/* Analysis Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                      {/* Weak Areas - Tactical Intervention */}
                      <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-white/20 dark:border-slate-800/50">
                        <h3 className="text-sm font-black text-rose-500 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          Topics Needing Focus
                        </h3>

                        {selectedStudent.weakTopics.length === 0 ? (
                          <p className="text-slate-400 font-bold italic uppercase tracking-widest text-xs">Zero critical vulnerabilities detected.</p>
                        ) : (
                          <div className="space-y-8">
                            {selectedStudent.weakTopics.map(topic => (
                              <div key={topic.id} className="group">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="font-black text-sm text-slate-800 dark:text-slate-200 uppercase tracking-tight">{topic.name}</span>
                                  <span className="text-rose-600 font-black text-sm">{topic.score}%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-white/10 dark:border-slate-700/30">
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-rose-600 to-pink-500 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${topic.score}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                  />
                                </div>
                                <div className="flex justify-between items-center mt-2 px-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bench Velocity: {topic.classAverage}%</p>
                                  <div className="h-1 w-1 rounded-full bg-rose-500 animate-pulse" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Error Diagnosis - DNA Patterns */}
                      <div className="p-8 md:p-12 bg-slate-50/30 dark:bg-slate-900/10">
                        <h3 className="text-sm font-black text-indigo-500 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <Brain className="w-4 h-4" />
                          </div>
                          Learning Insights
                        </h3>

                        <div className="space-y-5">
                          {selectedStudent.recentErrors.map((error, idx) => (
                            <motion.div
                              key={idx}
                              whileHover={{ x: 5 }}
                              className="bg-white/60 dark:bg-slate-800/60 p-6 rounded-[2rem] shadow-xl border border-white dark:border-slate-700/30 group relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 opacity-5 blur-xl group-hover:opacity-20 transition-opacity" />
                              <div className="flex items-start justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">{error.topicName}</span>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${error.errorType === 'conceptual'
                                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                  }`}>
                                  {error.errorType}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 font-bold text-sm leading-relaxed">{error.description}</p>
                              <div className="mt-6 flex gap-4">
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  className="text-[10px] flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest hover:underline"
                                >
                                  <Zap className="w-3 h-3" /> Assign Practice
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                          {selectedStudent.recentErrors.length === 0 && (
                            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
                              <p className="text-slate-400 font-bold italic uppercase tracking-widest text-xs">No aberrant patterns recorded.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : selectedTeacher ? (
                /* --- TEACHER DRILLDOWN VIEW --- */
                <motion.div
                  key="teacher-overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <motion.button
                    whileHover={{ x: -4 }}
                    onClick={() => setSelectedTeacher(null)}
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[10px] mb-2 hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Governance
                  </motion.button>

                  {/* Teacher Stats Cards - Premium Glassmorphic */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="group relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/30 dark:border-slate-800/50 shadow-xl hover:shadow-2xl transition-all"
                    >
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-transform">
                          <Users className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Total Students</p>
                          <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{selectedTeacher.studentCount}</h3>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="group relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/30 dark:border-slate-800/50 shadow-xl hover:shadow-2xl transition-all"
                    >
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
                          <TrendingUp className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Avg. Performance</p>
                          <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{selectedTeacher.averagePerformance}%</h3>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="group relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/30 dark:border-slate-800/50 shadow-xl hover:shadow-2xl transition-all"
                    >
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:rotate-6 transition-transform">
                          <Star className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Teacher Rating</p>
                          <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">4.8/5.0</h3>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Linked Students Table - Premium Redesign */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/30 dark:border-slate-800/50 shadow-2xl overflow-hidden"
                  >
                    <div className="p-2 mb-8 flex justify-between items-center">
                      <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-indigo-500" />
                        </div>
                        Enrolled Students ({teacherStudents.length})
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-6 py-4">Student Name</th>
                            <th className="px-6 py-4">Learning Progress</th>
                            <th className="px-6 py-4 text-right">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                          {teacherStudents.map((student, idx) => (
                            <motion.tr
                              key={student.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 * idx }}
                              className="hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <td className="px-6 py-5 flex items-center gap-4">
                                <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-xl bg-slate-100 shadow-sm border border-white dark:border-slate-700/50" />
                                <span className="font-black text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-500 transition-colors uppercase tracking-tight">{student.name}</span>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-col items-center gap-1 w-24">
                                  <div className="h-1.5 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden border border-white/20 dark:border-slate-700/30">
                                    <motion.div
                                      className={`h-full rounded-full ${student.overallScore > 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${student.overallScore}%` }}
                                      transition={{ duration: 1, delay: 0.2 }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-400">{student.overallScore}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  className="inline-flex w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </motion.div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (!selectedGrade || !selectedSubject) ? (
                <motion.div
                  key="selection-prompt"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center p-20 bg-white/20 dark:bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-300 dark:border-slate-800 backdrop-blur-xl"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] flex items-center justify-center shadow-inner mb-6">
                    <Building2 className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-xl font-black text-slate-400 uppercase tracking-widest text-center max-w-sm">Selection Required</p>
                  <p className="text-slate-500 text-sm font-bold mt-2">Select Grade & Subject to view analytics</p>
                </motion.div>
              ) : (
                <motion.div
                  key="governance-dashboard"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  {/* Teacher Mapping Table - Premium Glassmorphic */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/30 dark:border-slate-800/50 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Users className="w-24 h-24" />
                    </div>

                    <div className="flex justify-between items-center mb-8 relative z-10">
                      <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-indigo-500" />
                        </div>
                        Teacher Overview
                      </h3>
                      <span className="text-[10px] font-black px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-500/20 uppercase tracking-widest">
                        {relevantTeachers.length} Active Teachers
                      </span>
                    </div>

                    <div className="overflow-x-auto relative z-10">
                      <table className="w-full text-left">
                        <thead className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-6 py-4">Teacher</th>
                            <th className="px-6 py-4">Subject</th>
                            <th className="px-6 py-4 text-center">Performance</th>
                            <th className="px-6 py-4 text-right">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                          {relevantTeachers.map((teacher, idx) => (
                            <motion.tr
                              key={teacher.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 * idx }}
                              className="hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
                              onClick={() => setSelectedTeacher(teacher)}
                            >
                              <td className="px-6 py-5">
                                <span className="font-black text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-500 transition-colors uppercase tracking-tight">{teacher.name}</span>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{teacher.subject}</span>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="h-2 w-24 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden border border-white/20 dark:border-slate-700/30">
                                    <motion.div
                                      className={`h-full rounded-full ${teacher.averagePerformance > 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${teacher.averagePerformance}%` }}
                                      transition={{ duration: 1, delay: 0.2 }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-400">{teacher.averagePerformance}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  className="inline-flex w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </motion.div>
                              </td>
                            </motion.tr>
                          ))}
                          {relevantTeachers.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-black italic uppercase tracking-widest">No Tactical Leads Assigned</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>

                  {/* Systemic Insights & Trends - Premium Redesign */}
                  <div className="space-y-8">
                    {/* Systemic Issues Card */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/30 dark:border-slate-800/50 shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertCircle className="w-24 h-24" />
                      </div>

                      <h3 className="text-xl font-black text-rose-500 mb-8 flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        Systemic Weakness Correlation
                      </h3>

                      <div className="space-y-4 relative z-10">
                        {relevantIssues.map((issue, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            className="p-5 bg-rose-500/5 dark:bg-rose-900/10 rounded-[2rem] border border-rose-500/10 dark:border-rose-900/30 group"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-black text-sm text-rose-600 dark:text-rose-400 uppercase tracking-tight">{issue.topic}</h4>
                              <span className="text-[10px] font-black bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-rose-500/20 text-rose-500 uppercase tracking-widest">
                                {issue.affectedGrades.join(', ')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed">{issue.description}</p>
                          </motion.div>
                        ))}
                        {relevantIssues.length === 0 && (
                          <div className="p-8 text-center bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10">
                            <Sparkles className="w-10 h-10 text-emerald-500/30 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[10px]">Optimal System Balance Detected</p>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Performance Trend Chart */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/30 dark:border-slate-800/50 shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="w-24 h-24" />
                      </div>

                      <h3 className="text-xl font-black text-emerald-500 mb-8 flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                        Global Performance Trend
                      </h3>

                      <div className="flex items-end justify-between h-36 gap-3 mt-4 relative z-10">
                        {[65, 68, 72, 70, 75, 78, 82].map((val, i) => (
                          <div key={i} className="w-full flex flex-col justify-end items-center gap-3 group relative">
                            <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              <span className="text-[10px] font-black text-emerald-500 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-emerald-500/20 shadow-lg">{val}%</span>
                            </div>
                            <motion.div
                              className="w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-[1rem] relative overflow-hidden border border-white/20 dark:border-slate-700/30"
                              style={{ height: `${val}%` }}
                            >
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: '100%' }}
                                transition={{ duration: 1.5, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                              />
                              {/* Pulsing Glint */}
                              <motion.div
                                animate={{ opacity: [0, 0.5, 0] }}
                                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                                className="absolute inset-0 bg-white/20 blur-sm"
                              />
                            </motion.div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">W{i + 1}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-6 text-center uppercase tracking-[0.2em]">7-Week Master-Velocity Analysis</p>
                    </motion.div>
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
