import { describe, expect, it } from 'vitest';
import { createEndingCameraRig } from '../../src/game/Game';

describe('ending camera presentation', () => {
  it('orbits above the cleared arena instead of using the frozen gameplay camera', () => {
    const early = createEndingCameraRig(0);
    const later = createEndingCameraRig(5);

    expect(early.target.z).toBeLessThan(-25);
    expect(early.position.y).toBeGreaterThan(5);
    expect(later.position.x).not.toBeCloseTo(early.position.x);
    expect(later.position.z).not.toBeCloseTo(early.position.z);
  });
});
