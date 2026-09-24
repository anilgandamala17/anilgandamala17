import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SchoolGrade, SchoolSubject, Chapter, CurriculumProgress } from '@/types';
import { schoolGrades, getGradeById, getSubjectById, getTotalTopicsInSubject } from '@/features/curriculum/data/schoolCurriculum';
import { notifyStudentLearningChanged } from '@/services/studentLearningNotify';
import { findTopicInfo } from '@/utils/topicUtils';

interface CurriculumState {
    // Selected items
    selectedGrade: SchoolGrade | null;
    selectedSubject: SchoolSubject | null;
    selectedChapter: Chapter | null;

    // Progress tracking
    progressMap: Record<string, CurriculumProgress>; // key: "gradeId-subjectId"
    likedTopicIds: string[];

    // Last accessed
    lastAccessedGrade: string | null;
    lastAccessedSubject: string | null;

    // Actions
    setSelectedGrade: (gradeId: string | null) => void;
    setSelectedSubject: (subjectId: string | null) => void;
    setSelectedChapter: (chapterId: string | null) => void;

    markTopicComplete: (gradeId: string, subjectId: string, topicId: string) => void;
    recordTopicCompleteById: (topicId: string) => void;
    toggleTopicLike: (topicId: string) => void;
    isTopicLiked: (topicId: string) => boolean;
    applyLearningProgress: (progressMap: Record<string, CurriculumProgress>, likedTopicIds: string[]) => void;
    resetLearningData: () => void;
    getProgress: (gradeId: string, subjectId: string) => CurriculumProgress | null;
    getGradeProgress: (gradeId: string) => number;

    clearSelection: () => void;
}

function buildProgress(
    gradeId: string,
    subjectId: string,
    completedTopics: string[],
): CurriculumProgress {
    const unique = [...new Set(completedTopics.filter(Boolean))];
    const totalTopics = getTotalTopicsInSubject(gradeId, subjectId);
    return {
        gradeId,
        subjectId,
        completedTopics: unique,
        totalTopics,
        progressPercent: totalTopics > 0 ? Math.round((unique.length / totalTopics) * 100) : 0,
        lastAccessedAt: new Date().toISOString(),
    };
}

export const useCurriculumStore = create<CurriculumState>()(
    persist(
        (set, get) => ({
            selectedGrade: null,
            selectedSubject: null,
            selectedChapter: null,
            progressMap: {},
            likedTopicIds: [],
            lastAccessedGrade: null,
            lastAccessedSubject: null,

            setSelectedGrade: (gradeId: string | null) => {
                if (!gradeId) {
                    set({ selectedGrade: null, selectedSubject: null, selectedChapter: null });
                    return;
                }
                const grade = getGradeById(gradeId);
                set({
                    selectedGrade: grade || null,
                    selectedSubject: null,
                    selectedChapter: null,
                    lastAccessedGrade: gradeId
                });
            },

            setSelectedSubject: (subjectId: string | null) => {
                const { selectedGrade } = get();
                if (!subjectId || !selectedGrade) {
                    set({ selectedSubject: null, selectedChapter: null });
                    return;
                }
                const subject = getSubjectById(selectedGrade.id, subjectId);
                set({
                    selectedSubject: subject || null,
                    selectedChapter: null,
                    lastAccessedSubject: subjectId
                });
            },

            setSelectedChapter: (chapterId: string | null) => {
                const { selectedSubject } = get();
                if (!chapterId || !selectedSubject) {
                    set({ selectedChapter: null });
                    return;
                }
                const chapter = selectedSubject.chapters.find(c => c.id === chapterId);
                set({ selectedChapter: chapter || null });
            },

            markTopicComplete: (gradeId: string, subjectId: string, topicId: string) => {
                if (!gradeId || !subjectId || !topicId) return;
                const key = `${gradeId}-${subjectId}`;
                const { progressMap } = get();
                const existing = progressMap[key];
                if (existing?.completedTopics.includes(topicId)) return;
                const completedTopics = [...(existing?.completedTopics || []), topicId];
                set({
                    progressMap: {
                        ...progressMap,
                        [key]: buildProgress(gradeId, subjectId, completedTopics),
                    }
                });
                notifyStudentLearningChanged();
            },

            recordTopicCompleteById: (topicId: string) => {
                if (!topicId || topicId === 'unknown') return;
                const info = findTopicInfo(topicId);
                if (!info.gradeId || !info.subjectId) return;
                get().markTopicComplete(info.gradeId, info.subjectId, topicId);
            },

            toggleTopicLike: (topicId: string) => {
                if (!topicId) return;
                const { likedTopicIds } = get();
                const liked = likedTopicIds.includes(topicId);
                set({
                    likedTopicIds: liked
                        ? likedTopicIds.filter((id) => id !== topicId)
                        : [...likedTopicIds, topicId],
                });
                notifyStudentLearningChanged();
            },

            isTopicLiked: (topicId: string) => get().likedTopicIds.includes(topicId),

            applyLearningProgress: (progressMap, likedTopicIds) => {
                set({
                    progressMap: progressMap ?? {},
                    likedTopicIds: Array.isArray(likedTopicIds) ? likedTopicIds : [],
                });
            },

            resetLearningData: () => {
                set({ progressMap: {}, likedTopicIds: [] });
            },

            getProgress: (gradeId: string, subjectId: string) => {
                const key = `${gradeId}-${subjectId}`;
                return get().progressMap[key] || null;
            },

            getGradeProgress: (gradeId: string) => {
                const grade = getGradeById(gradeId);
                if (!grade) return 0;

                const { progressMap } = get();
                let totalCompleted = 0;
                let totalTopics = 0;

                grade.subjects.forEach(subject => {
                    const key = `${gradeId}-${subject.id}`;
                    const progress = progressMap[key];
                    if (progress) {
                        totalCompleted += progress.completedTopics.length;
                    }
                    totalTopics += getTotalTopicsInSubject(gradeId, subject.id);
                });

                return totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;
            },

            clearSelection: () => {
                // Keep lastAccessed* so dashboard recommendations survive curriculum navigation
                set({
                    selectedGrade: null,
                    selectedSubject: null,
                    selectedChapter: null,
                });
            }
        }),
        {
            name: 'curriculum-storage',
            partialize: (state) => ({
                lastAccessedGrade: state.lastAccessedGrade,
                lastAccessedSubject: state.lastAccessedSubject
            }),
            merge: (persistedState, currentState) => {
                const persisted = (persistedState ?? {}) as Partial<CurriculumState>;
                const merged = { ...currentState, ...persisted } as CurriculumState;
                // Never hydrate another student's progress from the old global persist key.
                merged.progressMap = currentState.progressMap;
                merged.likedTopicIds = currentState.likedTopicIds;
                if (persisted.lastAccessedGrade) {
                    merged.selectedGrade = getGradeById(persisted.lastAccessedGrade) || null;
                    merged.selectedSubject = persisted.lastAccessedSubject
                        ? getSubjectById(persisted.lastAccessedGrade, persisted.lastAccessedSubject) || null
                        : null;
                    merged.selectedChapter = null;
                }
                return merged;
            }
        }
    )
);

export const useSelectedGrade = () => useCurriculumStore(state => state.selectedGrade);
export const useSelectedSubject = () => useCurriculumStore(state => state.selectedSubject);
export const useSelectedChapter = () => useCurriculumStore(state => state.selectedChapter);
export const useAllGrades = () => schoolGrades;
