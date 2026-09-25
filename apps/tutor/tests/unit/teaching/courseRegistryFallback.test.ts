import { describe, expect, it, vi } from 'vitest';

describe('courseRegistry teachable fallback', () => {
  it('builds local steps for ordinary curriculum topics without runtime AI', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_ALLOW_RUNTIME_AI', 'false');
    const { getCourseContent, isRuntimeAiAllowed } = await import('@/data/courseRegistry');
    expect(isRuntimeAiAllowed()).toBe(false);

    const result = await getCourseContent(
      'math-8-3-angle-sum',
      'Angle Sum',
      undefined,
      'Mathematics',
      'Understanding Quadrilaterals',
      'Class 8',
      'en-IN',
      'friendly',
    );

    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.source).toBe('default');
    expect(result.steps[0]?.title).toMatch(/Angle Sum/i);
    vi.unstubAllEnvs();
  }, 20_000);
});
