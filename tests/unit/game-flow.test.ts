import { describe, expect, it } from 'vitest';
import { GameFlow } from '../../src/game/GameFlow';

describe('GameFlow', () => {
  it('starts at the opening and enters gameplay on interact', () => {
    const flow = new GameFlow();

    expect(flow.state).toBe('Opening');
    flow.update({ interact: true, playerDead: false, bossDead: false });

    expect(flow.state).toBe('Playing');
  });

  it('routes death, retry, boss clear, and ending credits', () => {
    const flow = new GameFlow();
    flow.update({ interact: true, playerDead: false, bossDead: false });

    flow.update({ interact: false, playerDead: true, bossDead: false });
    expect(flow.state).toBe('GameOver');

    flow.update({ interact: true, playerDead: true, bossDead: false });
    expect(flow.state).toBe('Playing');

    flow.update({ interact: false, playerDead: false, bossDead: true });
    expect(flow.state).toBe('Clear');

    flow.update({ interact: true, playerDead: false, bossDead: true });
    expect(flow.state).toBe('Ending');
    expect(flow.message).toContain('unno');
  });
});
