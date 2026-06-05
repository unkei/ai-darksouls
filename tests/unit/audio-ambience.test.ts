import { describe, expect, it, vi } from 'vitest';
import { AudioDirector } from '../../src/audio/AudioDirector';
import { createAmbiencePulse } from '../../src/game/Scene';

describe('ambience and audio hooks', () => {
  it('produces deterministic torch flicker values inside a subtle range', () => {
    const pulse = createAmbiencePulse();

    expect(pulse(0)).toBeGreaterThanOrEqual(1.1);
    expect(pulse(1.2)).toBeLessThanOrEqual(1.6);
    expect(pulse(0)).not.toBe(pulse(1.2));
  });

  it('queues combat and ambience events without requiring external audio files', () => {
    const audio = new AudioDirector();

    audio.playAttack();
    audio.playHit();
    audio.startAmbience();
    audio.update(0.5);

    expect(audio.events).toEqual(['attack', 'hit', 'ambience']);
    expect(audio.isAmbienceActive).toBe(true);
    vi.restoreAllMocks();
  });
});
