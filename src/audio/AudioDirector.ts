export class AudioDirector {
  static readonly requiredCueIds = [
    'attack',
    'weapon-whoosh',
    'weapon-hit',
    'dodge',
    'block',
    'enemy-windup',
    'enemy-attack',
    'boss-cleave-attack',
    'boss-lunge-attack',
    'hit',
    'death',
    'enemy-defeat-roar',
    'shrine',
    'bgm',
    'ambience',
  ] as const;
  static readonly generatedMusic = {
    requiresExternalFile: false,
    baseGain: 0.24,
    layers: ['bass-drone', 'low-fifth', 'lead-pulse'] as const,
  };

  readonly events: string[] = [];
  isAmbienceActive = false;
  isBgmActive = false;
  private context: AudioContext | null = null;
  private ambience: OscillatorNode | null = null;
  private ambienceGain: GainNode | null = null;
  private bgmBass: OscillatorNode | null = null;
  private bgmFifth: OscillatorNode | null = null;
  private bgmLead: OscillatorNode | null = null;
  private bgmGain: GainNode | null = null;
  private time = 0;

  play(cueId: AudioCueId): void {
    if (cueId === 'ambience') {
      this.startAmbience();
      return;
    }
    if (cueId === 'bgm') {
      this.startBgm();
      return;
    }
    this.events.push(cueId);
    this.playCue(AUDIO_CUES[cueId].layers);
  }

  playAttack(): void {
    this.play('attack');
  }

  playWeaponWhoosh(): void {
    this.play('weapon-whoosh');
  }

  playWeaponHit(): void {
    this.play('weapon-hit');
  }

  playDodge(): void {
    this.play('dodge');
  }

  playBlock(): void {
    this.play('block');
  }

  playEnemyWindup(): void {
    this.play('enemy-windup');
  }

  playEnemyAttack(): void {
    this.play('enemy-attack');
  }

  playBossAttack(cueId: BossAudioCueId): void {
    this.play(cueId);
  }

  playHit(): void {
    this.play('hit');
  }

  playDeath(): void {
    this.play('death');
  }

  playEnemyDefeatRoar(): void {
    this.play('enemy-defeat-roar');
  }

  playShrine(): void {
    this.play('shrine');
  }

  startAmbience(): void {
    if (this.isAmbienceActive) return;
    this.events.push('ambience');
    this.isAmbienceActive = true;
    const context = this.getContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 58;
    gain.gain.value = 0.075;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    this.ambience = oscillator;
    this.ambienceGain = gain;
  }

  startBgm(): void {
    if (this.isBgmActive) return;
    this.events.push('bgm');
    this.isBgmActive = true;
    const context = this.getContext();
    if (!context) return;
    const bass = context.createOscillator();
    const fifth = context.createOscillator();
    const lead = context.createOscillator();
    const gain = context.createGain();
    bass.type = 'triangle';
    fifth.type = 'sine';
    lead.type = 'sine';
    bass.frequency.value = 73.42;
    fifth.frequency.value = 110;
    lead.frequency.value = 146.83;
    gain.gain.value = AudioDirector.generatedMusic.baseGain;
    bass.connect(gain);
    fifth.connect(gain);
    lead.connect(gain);
    gain.connect(context.destination);
    bass.start();
    fifth.start();
    lead.start();
    this.bgmBass = bass;
    this.bgmFifth = fifth;
    this.bgmLead = lead;
    this.bgmGain = gain;
  }

  unlock(): void {
    const context = this.getContext();
    void context?.resume();
    if (!this.isBgmActive) this.startBgm();
    if (!this.isAmbienceActive) this.startAmbience();
  }

  update(delta: number): void {
    this.time += delta;
    if (this.ambienceGain) {
      this.ambienceGain.gain.value = 0.065 + Math.sin(this.time * 1.7) * 0.012;
    }
    if (this.bgmGain) {
      this.bgmGain.gain.value = AudioDirector.generatedMusic.baseGain + Math.sin(this.time * 0.7) * 0.035;
    }
    if (this.bgmLead) {
      this.bgmLead.frequency.value = this.time % 8 < 4 ? 146.83 : 164.81;
    }
    if (this.bgmFifth) {
      this.bgmFifth.frequency.value = this.time % 12 < 6 ? 110 : 98;
    }
  }

  dispose(): void {
    this.ambience?.stop();
    this.ambience?.disconnect();
    this.ambienceGain?.disconnect();
    this.bgmBass?.stop();
    this.bgmBass?.disconnect();
    this.bgmFifth?.stop();
    this.bgmFifth?.disconnect();
    this.bgmLead?.stop();
    this.bgmLead?.disconnect();
    this.bgmGain?.disconnect();
    this.ambience = null;
    this.ambienceGain = null;
    this.bgmBass = null;
    this.bgmFifth = null;
    this.bgmLead = null;
    this.bgmGain = null;
    this.isAmbienceActive = false;
    this.isBgmActive = false;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType, volume: number): void {
    const context = this.getContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, frequency * 0.55), context.currentTime + duration);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  private playCue(layers: AudioCueLayer[]): void {
    for (const layer of layers) {
      this.playTone(layer.frequency, layer.duration, layer.type, layer.volume);
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtor) return null;
    try {
      this.context ??= new AudioCtor();
      if (this.context.state === 'suspended') void this.context.resume();
      return this.context;
    } catch {
      return null;
    }
  }
}

type AudioCueLayer = {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
};

type SynthCue = {
  layers: AudioCueLayer[];
};

export type AudioCueId = (typeof AudioDirector.requiredCueIds)[number];
export type BossAudioCueId = 'boss-cleave-attack' | 'boss-lunge-attack';

const AUDIO_CUES = {
  attack: {
    layers: [
      { frequency: 170, duration: 0.07, type: 'sawtooth', volume: 0.18 },
      { frequency: 92, duration: 0.11, type: 'triangle', volume: 0.08 },
    ],
  },
  'weapon-whoosh': {
    layers: [
      { frequency: 360, duration: 0.09, type: 'triangle', volume: 0.12 },
      { frequency: 190, duration: 0.13, type: 'sawtooth', volume: 0.08 },
    ],
  },
  'weapon-hit': {
    layers: [
      { frequency: 72, duration: 0.1, type: 'square', volume: 0.18 },
      { frequency: 520, duration: 0.045, type: 'triangle', volume: 0.09 },
    ],
  },
  dodge: {
    layers: [{ frequency: 240, duration: 0.16, type: 'triangle', volume: 0.12 }],
  },
  block: {
    layers: [
      { frequency: 120, duration: 0.08, type: 'square', volume: 0.1 },
      { frequency: 420, duration: 0.05, type: 'triangle', volume: 0.045 },
    ],
  },
  'enemy-windup': {
    layers: [{ frequency: 280, duration: 0.18, type: 'sawtooth', volume: 0.055 }],
  },
  'enemy-attack': {
    layers: [{ frequency: 118, duration: 0.12, type: 'sawtooth', volume: 0.15 }],
  },
  'boss-cleave-attack': {
    layers: [
      { frequency: 96, duration: 0.16, type: 'sawtooth', volume: 0.13 },
      { frequency: 144, duration: 0.1, type: 'square', volume: 0.055 },
    ],
  },
  'boss-lunge-attack': {
    layers: [
      { frequency: 74, duration: 0.22, type: 'sawtooth', volume: 0.14 },
      { frequency: 310, duration: 0.08, type: 'triangle', volume: 0.05 },
    ],
  },
  hit: {
    layers: [
      { frequency: 86, duration: 0.13, type: 'square', volume: 0.12 },
      { frequency: 58, duration: 0.18, type: 'sawtooth', volume: 0.07 },
    ],
  },
  death: {
    layers: [{ frequency: 55, duration: 0.45, type: 'sine', volume: 0.14 }],
  },
  'enemy-defeat-roar': {
    layers: [
      { frequency: 88, duration: 0.35, type: 'sawtooth', volume: 0.14 },
      { frequency: 44, duration: 0.55, type: 'triangle', volume: 0.11 },
    ],
  },
  shrine: {
    layers: [
      { frequency: 330, duration: 0.22, type: 'sine', volume: 0.06 },
      { frequency: 495, duration: 0.28, type: 'triangle', volume: 0.035 },
    ],
  },
} satisfies Record<Exclude<AudioCueId, 'ambience' | 'bgm'>, SynthCue>;

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
