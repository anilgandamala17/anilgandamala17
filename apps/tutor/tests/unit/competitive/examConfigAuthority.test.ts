import { describe, expect, it } from 'vitest';
import { COMPETITIVE_EXAMS } from '@/data/mockData';
import { getExamConfig } from '@/features/competitive/exam/examConfig';
import { areValidTeachingSteps } from '@/features/competitive/utils/competitiveTeaching';

describe('ExamConfig authority', () => {
  it('maps catalog duration and marking from a single config source', () => {
    for (const exam of COMPETITIVE_EXAMS.slice(0, 5)) {
      const config = getExamConfig(exam);
      expect(config.durationMinutes).toBe(exam.timeMinutes);
      expect(config.markingScheme.correctMarks).toBe(4);
      expect(config.security.cameraRequired).toBe(false);
      expect(config.security.fullscreenRequired).toBe(true);
      expect(config.security.maxSecurityViolations).toBe(2);
    }
  });
});

describe('Explain AI step contract', () => {
  it('rejects teaching payloads that are not exactly 3 cards', () => {
    const stub = {
      id: 1,
      title: 'Concept Introduction',
      subtitle: 'x',
      content: 'A'.repeat(80),
      speech: 'B'.repeat(80),
      visualType: 'concept' as const,
      icon: '🧠',
      highlights: ['topic'],
    };
    expect(areValidTeachingSteps([stub, stub])).toBe(false);
    expect(areValidTeachingSteps([stub, stub, stub, stub])).toBe(false);
  });
});
