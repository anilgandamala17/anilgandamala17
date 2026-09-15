import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../stores/userStore';
import { studentRoutes } from '../utils/routes';
import type { Profession, Subject, Topic } from '../types';
import { professions } from '../data/professions';
import {
    Stethoscope, Cog, Scale, Briefcase, FlaskConical, Palette,
    Monitor, GraduationCap, TrendingUp, Building2, Brain, MoreHorizontal,
    ChevronRight, ArrowLeft, BookOpen, FileText
} from 'lucide-react';

import AiraLogo from '../components/brand/AiraLogo';


// Icons mapping for dynamic icon rendering

const iconMap: Record<string, React.ReactNode> = {
    stethoscope: <Stethoscope className="w-8 h-8" />,
    cog: <Cog className="w-8 h-8" />,
    scale: <Scale className="w-8 h-8" />,
    briefcase: <Briefcase className="w-8 h-8" />,
    flask: <FlaskConical className="w-8 h-8" />,
    palette: <Palette className="w-8 h-8" />,
    monitor: <Monitor className="w-8 h-8" />,
    graduation: <GraduationCap className="w-8 h-8" />,
    trending: <TrendingUp className="w-8 h-8" />,
    building: <Building2 className="w-8 h-8" />,
    brain: <Brain className="w-8 h-8" />,
    more: <MoreHorizontal className="w-8 h-8" />,
};

export default function OnboardingPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const {
        selectedProfession,
        selectedSubProfession,
        selectProfession,
        selectSubProfession,
        completeOnboarding,
    } = useUserStore();



    const [step, setStep] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    const handleProfessionSelect = (profession: Profession) => {
        selectProfession(profession);
        setStep(1);
    };

    const handleSubProfessionSelect = (subProfession: string) => {
        selectSubProfession(subProfession);
        setStep(2);
    };

    const handleSubjectSelect = (subject: Subject) => {
        setSelectedSubject(subject);
        setStep(3);
    };

    const handleTopicSelect = (topic: Topic) => {
        completeOnboarding();
        navigate(studentRoutes.learn(topic.id));
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
            if (step === 1) selectProfession(null); // Reset if going back to start
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
            {/* Progress indicator */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-2">
                        {step > 0 && (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-1 text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-slate-100 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="text-sm">{t('back')}</span>
                            </button>
                        )}
                        <div className="flex-1 flex justify-center md:justify-start">
                            <AiraLogo height={32} />
                        </div>
                        <span className="text-sm text-gray-500 dark:text-slate-300">Step {step + 1} of 4</span>
                    </div>
                    <div className="flex gap-2">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-4 safe-top safe-bottom">
                <AnimatePresence mode="wait">
                    {/* Step 0: Profession Selection - Responsive */}
                    {step === 0 && (
                        <motion.div
                            key="profession"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-5xl mx-auto"
                        >
                            <div className="text-center mb-6 sm:mb-10">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-slate-100 mb-2 sm:mb-3">
                                    {t('selectProfession')}
                                </h1>
                                <p className="text-gray-600 dark:text-slate-300 text-base sm:text-lg px-2">
                                    {t('selectProfessionDesc')}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                {professions.map((profession, index) => (
                                    <motion.button
                                        key={profession.id}
                                        onClick={() => handleProfessionSelect(profession)}
                                        className={`relative p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300 text-left group overflow-hidden min-h-[140px] sm:min-h-[180px] ${selectedProfession?.id === profession.id ? 'ring-2 ring-purple-500' : ''
                                            }`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.03, y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {/* Glow effect on hover */}
                                        <div
                                            className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl sm:rounded-2xl"
                                            style={{ backgroundColor: profession.color }}
                                        />

                                        <div
                                            className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3 sm:mb-4 transition-transform group-hover:scale-110 shrink-0"
                                            style={{ backgroundColor: `${profession.color}20`, color: profession.color }}
                                        >
                                            {iconMap[profession.icon]}
                                        </div>

                                        <h3 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-slate-100 mb-1 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                                            {profession.name}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 line-clamp-2 sm:line-clamp-3">
                                            {profession.description}
                                        </p>

                                        <ChevronRight className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 1: Sub-Profession Selection */}
                    {step === 1 && selectedProfession && (
                        <motion.div
                            key="subprofession"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-3xl mx-auto"
                        >
                            <div className="text-center mb-6 sm:mb-10">
                                <div
                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4"
                                    style={{ backgroundColor: `${selectedProfession.color}20`, color: selectedProfession.color }}
                                >
                                    {iconMap[selectedProfession.icon]}
                                </div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 sm:mb-3">
                                    {t('selectSpecialization')}
                                </h1>
                                <p className="text-gray-600 text-base sm:text-lg px-2">
                                    Choose your area of focus in {selectedProfession.name}
                                </p>
                            </div>

                            <div className="grid gap-2 sm:gap-3">
                                {selectedProfession.subProfessions.map((sub, index) => (
                                    <motion.button
                                        key={sub.id}
                                        onClick={() => handleSubProfessionSelect(sub.id)}
                                        className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 text-left group min-h-[64px] sm:min-h-[80px] ${selectedSubProfession === sub.id ? 'ring-2 ring-purple-500' : ''
                                            }`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.08 }}
                                        whileHover={{ x: 8 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${selectedProfession.color}15`, color: selectedProfession.color }}
                                        >
                                            <span className="text-xl font-bold">{sub.name?.[0]?.toUpperCase() || '?'}</span>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                                                {sub.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">{sub.description}</p>
                                        </div>

                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Subject Selection */}
                    {step === 2 && selectedProfession && selectedSubProfession && (
                        <motion.div
                            key="subject"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-3xl mx-auto"
                        >
                            <div className="text-center mb-10">
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                                    Select a Subject
                                </h1>
                                <p className="text-gray-600 text-lg">
                                    What would you like to learn in {selectedProfession.subProfessions.find(s => s.id === selectedSubProfession)?.name || 'this specialization'}?
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {selectedProfession.subProfessions.find(s => s.id === selectedSubProfession)?.subjects?.map((subject, index) => {
                                    if (!subject) return null;
                                    return (
                                        <motion.button
                                            key={subject.id}
                                            onClick={() => handleSubjectSelect(subject)}
                                            className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300 text-left group border border-transparent hover:border-purple-200"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-800 text-lg mb-1 group-hover:text-purple-700">
                                                        {subject.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {subject.topics?.length || 0} Topics Available
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 my-auto" />
                                            </div>
                                        </motion.button>
                                    );
                                })}
                                {(!selectedProfession.subProfessions.find(s => s.id === selectedSubProfession)?.subjects?.length) && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="col-span-1 md:col-span-2 text-center py-12 px-6 bg-white/60 backdrop-blur-xl rounded-3xl border border-purple-100/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] mt-4"
                                    >
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                                            <Brain className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Build Your Custom Syllabus</h3>
                                        <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                                            We don't have a rigid syllabus for this specialization yet! However, Aɪra can dynamically construct a personalized masterclass from scratch based on your needs.
                                        </p>
                                        <button
                                            onClick={() => handleTopicSelect({ id: 'introduction', name: 'Custom AI Curriculum', duration: 'Ongoing', difficulty: 'advanced' as const })}
                                            className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:shadow-[0_8px_20px_rgba(124,58,237,0.3)] hover:-translate-y-1 transition-all duration-300"
                                        >
                                            Initialize AI Curriculum Setup 🚀
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Topic Selection */}
                    {step === 3 && selectedSubject && (
                        <motion.div
                            key="topic"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-3xl mx-auto"
                        >
                            <div className="text-center mb-10">
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                                    Choose a Topic
                                </h1>
                                <p className="text-gray-600 text-lg">
                                    Start your session with {selectedSubject.name}
                                </p>
                            </div>

                            <div className="grid gap-3">
                                {selectedSubject?.topics?.map((topic: Topic, index: number) => {
                                    if (!topic) return null;
                                    return (
                                        <motion.button
                                            key={topic.id}
                                            onClick={() => handleTopicSelect(topic)}
                                            className="flex items-center gap-4 p-5 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 text-left group border border-transparent hover:border-purple-200"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ x: 4 }}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-800 group-hover:text-purple-700">
                                                    {topic.name}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                    <span>{topic.duration || '30 min'}</span>
                                                    <span>•</span>
                                                    <span className="capitalize">{topic.difficulty || 'Beginner'}</span>
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                Start
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

