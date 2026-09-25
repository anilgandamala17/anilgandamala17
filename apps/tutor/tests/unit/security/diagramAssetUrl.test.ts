import { describe, expect, it } from 'vitest';
import { diagramAssetUrl } from '@/utils/diagramAssetUrl';

describe('diagramAssetUrl', () => {
  it('builds encoded paths under /tutor-media/diagrams/', () => {
    expect(diagramAssetUrl('physics/wave.svg')).toBe(
      '/tutor-media/diagrams/physics/wave.svg',
    );
    expect(diagramAssetUrl('computer science_6/cpu.svg')).toBe(
      '/tutor-media/diagrams/computer%20science_6/cpu.svg',
    );
  });

  it('neutralizes path traversal segments inside the diagrams root', () => {
    // `..` is stripped — never resolves outside /tutor-media/diagrams/
    expect(diagramAssetUrl('../secret.svg')).toBe('/tutor-media/diagrams/secret.svg');
    expect(() => diagramAssetUrl('..')).toThrow(/Invalid diagram asset path/);
    expect(diagramAssetUrl('physics/../wave.svg')).toBe('/tutor-media/diagrams/physics/wave.svg');
  });

  it('requires svg leaf', () => {
    expect(() => diagramAssetUrl('physics/wave.png')).toThrow(/must be SVG/);
    expect(() => diagramAssetUrl('')).toThrow(/Invalid diagram asset path/);
  });
});
