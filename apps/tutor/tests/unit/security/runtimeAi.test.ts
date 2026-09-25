import { describe, expect, it, vi } from 'vitest';

describe('runtime AI opt-in', () => {
  it('is denied unless VITE_ALLOW_RUNTIME_AI is exactly true', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_ALLOW_RUNTIME_AI', 'false');
    const mod = await import('@/data/courseRegistry');
    expect(mod.isRuntimeAiAllowed()).toBe(false);

    vi.resetModules();
    vi.stubEnv('VITE_ALLOW_RUNTIME_AI', '');
    const mod2 = await import('@/data/courseRegistry');
    expect(mod2.isRuntimeAiAllowed()).toBe(false);

    vi.resetModules();
    vi.stubEnv('VITE_ALLOW_RUNTIME_AI', 'true');
    const mod3 = await import('@/data/courseRegistry');
    expect(mod3.isRuntimeAiAllowed()).toBe(true);

    vi.unstubAllEnvs();
  }, 15_000);
});
