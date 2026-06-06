import { describe, expect, it } from 'vitest';
import { GameFlow } from '../../src/game/GameFlow';

describe('GameFlow', () => {
  it('starts at the opening and enters gameplay on any advance input', () => {
    const flow = new GameFlow();

    expect(flow.state).toBe('Opening');
    flow.update({ advance: true, interact: false, playerDead: false, bossDead: false });

    expect(flow.state).toBe('Playing');
  });

  it('routes death, retry, boss clear, and ending credits', () => {
    const flow = new GameFlow();
    flow.update({ advance: true, interact: false, playerDead: false, bossDead: false });

    flow.update({ advance: false, interact: false, playerDead: true, bossDead: false });
    expect(flow.state).toBe('GameOver');

    flow.update({ advance: true, interact: false, playerDead: true, bossDead: false });
    expect(flow.state).toBe('Playing');

    flow.update({ advance: false, interact: false, playerDead: false, bossDead: true });
    expect(flow.state).toBe('Clear');

    flow.update({ advance: true, interact: false, playerDead: false, bossDead: true });
    expect(flow.state).toBe('Ending');
    expect(flow.message).toContain('Created by unno');
  });

  it('presents rich multi-line messages for every non-playing screen', () => {
    const flow = new GameFlow();

    expect(flow.message.split('\n').length).toBeGreaterThanOrEqual(4);
    expect(flow.message).toContain('Any button');

    flow.update({ advance: true, interact: false, playerDead: false, bossDead: false });
    flow.update({ advance: false, interact: false, playerDead: true, bossDead: false });
    expect(flow.message).toContain('YOU DIED');

    flow.update({ advance: true, interact: false, playerDead: true, bossDead: false });
    flow.update({ advance: false, interact: false, playerDead: false, bossDead: true });
    expect(flow.message).toContain('WARDEN VANQUISHED');
  });
});
