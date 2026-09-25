import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Explain with AI lecture contract', () => {
  const teachingSrc = readFileSync(
    resolve(__dirname, '../../../src/features/competitive/utils/competitiveTeaching.ts'),
    'utf8',
  );
  const teachingPageSrc = readFileSync(
    resolve(__dirname, '../../../src/pages/student/CompetitiveTeachingPage.tsx'),
    'utf8',
  );
  const questionarySrc = readFileSync(
    resolve(
      __dirname,
      '../../../src/features/competitive/ai-explanation/QuestionaryExplanationFlow.tsx',
    ),
    'utf8',
  );

  it('requires exactly 3 lecture steps in prompts', () => {
    expect(teachingSrc).toMatch(/MIN_LECTURE_STEPS\s*=\s*3/);
    expect(teachingSrc).toMatch(/exactly 3 steps/i);
  });

  it('forbids Answer Announcement, Summary, and Next Practice cards', () => {
    expect(teachingSrc).toMatch(/Do NOT create an "Answer Announcement"/i);
    expect(teachingSrc).toMatch(/Summary/i);
    expect(teachingSrc).toMatch(/Next Practice/i);
  });

  it('Explain UI has no TTS listen controls on teaching page', () => {
    expect(teachingPageSrc).not.toMatch(/Listen to explanation/i);
    expect(teachingPageSrc).not.toMatch(/aria-label=["']Listen/i);
    expect(questionarySrc).not.toMatch(/Answer Announcement/i);
    expect(questionarySrc).not.toMatch(/Next Practice/i);
  });
});
