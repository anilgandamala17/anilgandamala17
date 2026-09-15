import { professions } from '../data/professions';
import { schoolGrades } from '../data/schoolCurriculum';
import type { Topic } from '../types';

export interface TopicContext {
    topic: Topic | { id: string; name: string } | null;
    subjectName: string | null;
    streamName: string | null;
    /** Curriculum: chapter title containing this topic */
    chapterName?: string;
    /** Curriculum: subject blurb from curriculum data */
    subjectDescription?: string;
    /** Curriculum only: grade id for navigation state */
    gradeId?: string;
    /** Curriculum only: subject id for navigation state */
    subjectId?: string;
    type: 'curriculum' | 'competitive' | 'professional' | 'unknown';
}

/**
 * Finds topic information from all available data structures
 */
export function findTopicInfo(topicId: string | undefined): TopicContext {
    if (!topicId) {
        return { topic: null, subjectName: null, streamName: null, type: 'unknown' };
    }

    // 1. Search in Professions (Professional Mode)
    for (const profession of professions) {
        for (const subProfession of profession.subProfessions) {
            for (const subject of subProfession.subjects) {
                const topic = subject.topics.find(t => t.id === topicId);
                if (topic) {
                    return {
                        topic,
                        subjectName: subject.name,
                        streamName: profession.name,
                        type: 'professional'
                    };
                }
            }
        }
    }

    // 2. Search in School Curriculum (Curriculum Mode)
    for (const grade of schoolGrades) {
        for (const subject of grade.subjects) {
            for (const chapter of subject.chapters) {
                const topic = chapter.topics.find(t => t.id === topicId);
                if (topic) {
                    return {
                        topic,
                        subjectName: subject.name,
                        streamName: grade.name,
                        chapterName: chapter.name,
                        subjectDescription: subject.description,
                        gradeId: grade.id,
                        subjectId: subject.id,
                        type: 'curriculum'
                    };
                }
            }
        }
    }

    // 3. Search in Competitive Exams (Competitive Mode)
    // Deprecated: Competitive Mode no longer uses a 'Topic' based hierarchy.
    // Full mock exams generate question banks directly without Topic containers.

    return { topic: null, subjectName: null, streamName: null, type: 'unknown' };
}

/**
 * Formats topic ID to a readable name
 */
export function formatTopicName(topicId: string): string {
    return topicId
        .split('-')
        .map(word => word && word.length > 0
            ? word.charAt(0).toUpperCase() + word.slice(1)
            : word)
        .join(' ');
}
