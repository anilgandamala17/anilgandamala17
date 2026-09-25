import React from 'react';
import { Brain, Target, Sparkles, Trophy, BookOpen } from 'lucide-react';

export interface ExamTheme {
    color: string;
    bgColor: string;
    gradient: string;
    icon: React.ReactNode;
    bgImage: string;
}

export const EXAM_THEMES: Record<string, ExamTheme> = {
    'jee-main': {
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        gradient: 'from-blue-500 via-indigo-600 to-blue-500',
        icon: <Brain className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 40%)',
    },
    'neet': {
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        gradient: 'from-emerald-500 via-teal-600 to-emerald-500',
        icon: <Target className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.2), transparent 40%)',
    },
    'eamcet': {
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.15)',
        gradient: 'from-purple-500 via-violet-600 to-purple-500',
        icon: <Sparkles className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.2), transparent 40%)',
    },
    'jee-advanced': {
        color: '#f43f5e',
        bgColor: 'rgba(244, 63, 94, 0.15)',
        gradient: 'from-rose-500 via-red-600 to-rose-500',
        icon: <Trophy className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(244, 63, 94, 0.2), transparent 40%)',
    },
    'polycet': {
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.15)',
        gradient: 'from-amber-500 via-orange-600 to-amber-500',
        icon: <BookOpen className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.2), transparent 40%)',
    },
    'ntse': {
        color: '#0ea5e9',
        bgColor: 'rgba(14, 165, 233, 0.15)',
        gradient: 'from-sky-500 via-cyan-600 to-sky-500',
        icon: <Brain className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(14, 165, 233, 0.2), transparent 40%)',
    },
    'rjc-cet': {
        color: '#ec4899',
        bgColor: 'rgba(236, 72, 153, 0.15)',
        gradient: 'from-pink-500 via-fuchsia-600 to-pink-500',
        icon: <Sparkles className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(236, 72, 153, 0.2), transparent 40%)',
    },
    'gate': {
        color: '#6366f1',
        bgColor: 'rgba(99, 102, 241, 0.15)',
        gradient: 'from-indigo-500 via-purple-600 to-indigo-500',
        icon: <Trophy className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.2), transparent 40%)',
    },
    'sainik': {
        color: '#14b8a6',
        bgColor: 'rgba(20, 184, 166, 0.15)',
        gradient: 'from-teal-500 via-emerald-600 to-teal-500',
        icon: <Target className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(20, 184, 166, 0.2), transparent 40%)',
    },
    'navodaya': {
        color: '#f97316',
        bgColor: 'rgba(249, 115, 22, 0.15)',
        gradient: 'from-orange-500 via-red-500 to-orange-500',
        icon: <BookOpen className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(249, 115, 22, 0.2), transparent 40%)',
    },
    'kv': {
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        gradient: 'from-blue-500 via-indigo-600 to-blue-500',
        icon: <Brain className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 40%)',
    },
    'emrs': {
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.15)',
        gradient: 'from-purple-500 via-violet-600 to-purple-500',
        icon: <Sparkles className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.2), transparent 40%)',
    },
    'nmms': {
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.15)',
        gradient: 'from-amber-500 via-orange-600 to-amber-500',
        icon: <BookOpen className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.2), transparent 40%)',
    },
    'olympiad': {
        color: '#f43f5e',
        bgColor: 'rgba(244, 63, 94, 0.15)',
        gradient: 'from-rose-500 via-red-600 to-rose-500',
        icon: <Trophy className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(244, 63, 94, 0.2), transparent 40%)',
    },
    'rgukt-iiit': {
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        gradient: 'from-emerald-500 via-teal-600 to-emerald-500',
        icon: <Target className="w-8 h-8" />,
        bgImage: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.2), transparent 40%)',
    }
};

export const EXAM_IMAGES: Record<string, string> = {
    'jee-main': '/tutor-media/images/exams/jee-main.png',
    'jee-advanced': '/tutor-media/images/exams/jee-main.png',
    'neet': '/tutor-media/images/subjects/biology.png',
    'eamcet': '/tutor-media/images/exams/jee-main.png',
    'polycet': '/tutor-media/images/subjects/science.png',
    'ntse': '/tutor-media/images/grades/grade_secondary_school.png',
    'gate': '/tutor-media/images/subjects/mathematics.png',
    'rjc-cet': '/tutor-media/images/grades/grade_senior_secondary_school.png',
    'sainik': '/tutor-media/images/exams/sainik.png',
    'navodaya': '/tutor-media/images/exams/navodaya.png',
    'kv': '/tutor-media/images/exams/kv.png',
    'emrs': '/tutor-media/images/exams/emrs.png',
    'nmms': '/tutor-media/images/grades/grade_middle_school.png',
    'olympiad': '/tutor-media/images/subjects/mathematics.png',
    'rgukt-iiit': '/tutor-media/images/subjects/computer-science.png',
};
