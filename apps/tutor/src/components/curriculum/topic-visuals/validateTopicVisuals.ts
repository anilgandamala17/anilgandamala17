/**
 * DEV-only uniqueness / coverage validation across Class 6–12 curriculum.
 * Never throws in production.
 */
import { schoolGrades } from '../../../data/schoolCurriculum';
import { resolveTopicVisual } from './resolveTopicVisual';

let ran = false;

export function validateTopicVisualsOnce(): void {
  if (!import.meta.env.DEV || ran) return;
  ran = true;

  try {
    const byFingerprint = new Map<
      string,
      { conceptId: string; label: string }[]
    >();
    let total = 0;
    let subjectFallback = 0;

    for (const grade of schoolGrades) {
      for (const subject of grade.subjects) {
        for (const chapter of subject.chapters) {
          for (const topic of chapter.topics) {
            total += 1;
            const spec = resolveTopicVisual({
              gradeId: grade.id,
              subjectId: subject.id,
              chapterId: chapter.id,
              chapterName: chapter.name,
              chapterNumber: chapter.chapterNumber,
              topicId: topic.id,
              topicName: topic.name,
            });
            if (spec.source === 'subject') subjectFallback += 1;

            const fp = `${spec.kind}:${spec.variant}`;
            const label = `${grade.name}/${subject.id}/${chapter.name}/${topic.name}`;
            const list = byFingerprint.get(fp) ?? [];
            list.push({ conceptId: spec.conceptId, label });
            byFingerprint.set(fp, list);
          }
        }
      }
    }

    const collisions: string[] = [];
    for (const [fp, entries] of byFingerprint) {
      const concepts = new Set(entries.map((e) => e.conceptId));
      if (concepts.size > 1 && entries.length > 1) {
        // Same artwork fingerprint used by different concepts → warn
        collisions.push(
          `${fp} ← ${[...concepts].join(', ')} (${entries.length} topics)`,
        );
      }
    }

    console.info(
      `[topic-visual] validated ${total} topics; subject-fallback=${subjectFallback}; concept-collisions=${collisions.length}`,
    );
    if (collisions.length) {
      console.warn(
        '[topic-visual] unrelated concepts share kind:variant',
        collisions.slice(0, 40),
      );
    }
  } catch (err) {
    console.warn('[topic-visual] validation failed', err);
  }
}
