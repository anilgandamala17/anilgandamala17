import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Landing assistant competitive knowledge boundary', () => {
  const knowledge = readFileSync(
    resolve(
      __dirname,
      '../../../../landing/features/assistant/data/assistantKnowledge.ts',
    ),
    'utf8',
  );
  const service = readFileSync(
    resolve(__dirname, '../../../../landing/features/assistant/services/assistantService.ts'),
    'utf8',
  );

  it('covers user-facing competitive exam questions', () => {
    expect(knowledge).toMatch(/Competitive Mode/);
    expect(knowledge).toMatch(/exam-integrity/);
    expect(knowledge).toMatch(/fullscreen/);
    expect(knowledge).toMatch(/AI Explanation/);
  });

  it('does not embed secrets or internal schema dumps in knowledge', () => {
    expect(knowledge).not.toMatch(/API[_-]?KEY/i);
    expect(knowledge).not.toMatch(/sk-[a-zA-Z0-9]{10,}/);
    expect(knowledge).not.toMatch(/CREATE TABLE/i);
  });

  it('answers from knowledge before counselor fallback', () => {
    expect(service).toMatch(/answerFromKnowledge/);
  });
});
