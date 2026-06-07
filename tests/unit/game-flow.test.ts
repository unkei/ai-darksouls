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

    flow.update({ advance: false, interact: false, playerDead: true, bossDead: false });
    expect(flow.state).toBe('GameOver');

    flow.update({ advance: true, interact: false, playerDead: true, bossDead: false });
    expect(flow.state).toBe('Playing');

    flow.update({ advance: false, interact: false, playerDead: false, bossDead: true });
    expect(flow.state).toBe('BossDefeat');
    expect(flow.message).toContain('ASHEN WARDEN FALLS');

    flow.update({ advance: true, interact: false, playerDead: false, bossDead: true });
    expect(flow.state).toBe('BossDefeat');

    flow.update({ advance: false, interact: false, playerDead: false, bossDead: true, bossDefeatComplete: true });
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
    expect(flow.message).toContain('ASHEN WARDEN FALLS');

    flow.update({ advance: false, interact: false, playerDead: false, bossDead: true, bossDefeatComplete: true });
    expect(flow.message).toContain('WARDEN VANQUISHED');
  });

  it('requires a fresh advance input after entering game over', () => {
    const flow = new GameFlow();
    flow.update({ advance: true, interact: false, playerDead: false, bossDead: false });

    flow.update({ advance: true, interact: false, playerDead: true, bossDead: false });
    expect(flow.state).toBe('GameOver');

    flow.update({ advance: true, interact: false, playerDead: true, bossDead: false });
    expect(flow.state).toBe('GameOver');

    flow.update({ advance: false, interact: false, playerDead: true, bossDead: false });
    expect(flow.state).toBe('GameOver');

    flow.update({ advance: true, interact: false, playerDead: true, bossDead: false });
    expect(flow.state).toBe('Playing');
  });

  it('returns from game over to the opening after the retry timeout', () => {
    const flow = new GameFlow();
    flow.update({ advance: true, interact: false, playerDead: false, bossDead: false });
    flow.update({ advance: false, interact: false, playerDead: true, bossDead: false });

    flow.update({ advance: false, interact: false, playerDead: true, bossDead: false, delta: 7.9 });
    expect(flow.state).toBe('GameOver');

    flow.update({ advance: false, interact: false, playerDead: true, bossDead: false, delta: 0.2 });
    expect(flow.state).toBe('Opening');
  });

  it('requires release before starting after an automatic game-over title return', () => {
    const flow = new GameFlow();
    flow.update({ advance: true, interact: false, playerDead: false, bossDead: false });
    flow.update({ advance: true, interact: false, playerDead: true, bossDead: false });
    flow.update({ advance: true, interact: false, playerDead: true, bossDead: false, delta: 8.1 });
    expect(flow.state).toBe('Opening');

    flow.update({ advance: true, interact: false, playerDead: false, bossDead: false });
    expect(flow.state).toBe('Opening');

    flow.update({ advance: false, interact: false, playerDead: false, bossDead: false });
    flow.update({ advance: true, interact: false, playerDead: false, bossDead: false });
    expect(flow.state).toBe('Playing');
  });

  it('returns from ending to the opening after the ending hold', () => {
    const flow = new GameFlow();
    flow.forceStateForTest('Ending');

    flow.update({ advance: false, interact: false, playerDead: false, bossDead: true, delta: 35.9 });
    expect(flow.state).toBe('Ending');

    flow.update({ advance: false, interact: false, playerDead: false, bossDead: true, delta: 0.2 });
    expect(flow.state).toBe('Opening');
  });
});
