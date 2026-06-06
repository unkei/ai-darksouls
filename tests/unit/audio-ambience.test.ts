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
    audio.playDodge();
    audio.playBlock();
    audio.playEnemyWindup();
    audio.playEnemyAttack();
    audio.playHit();
    audio.playShrine();
    audio.startAmbience();
    audio.update(0.5);

    expect(audio.events).toEqual(['attack', 'dodge', 'block', 'enemy-windup', 'enemy-attack', 'hit', 'shrine', 'ambience']);
    expect(audio.isAmbienceActive).toBe(true);
    vi.restoreAllMocks();
  });

  it('represents every required cue as deterministic data', () => {
    const audio = new AudioDirector();

    expect(AudioDirector.requiredCueIds).toEqual([
      'attack',
      'dodge',
      'block',
      'enemy-windup',
      'enemy-attack',
      'boss-cleave-attack',
      'boss-lunge-attack',
      'hit',
      'death',
      'shrine',
      'ambience',
    ]);

    for (const cueId of AudioDirector.requiredCueIds) audio.play(cueId);

    expect(audio.events).toEqual(AudioDirector.requiredCueIds);
  });

  it('does not duplicate ambience events across repeated starts', () => {
    const audio = new AudioDirector();

    audio.startAmbience();
    audio.startAmbience();
    audio.dispose();

    expect(audio.events).toEqual(['ambience']);
    expect(audio.isAmbienceActive).toBe(false);
  });
});
