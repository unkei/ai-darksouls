export class AudioDirector {
  readonly events: string[] = [];
  isAmbienceActive = false;
  private context: AudioContext | null = null;
  private ambience: OscillatorNode | null = null;
  private ambienceGain: GainNode | null = null;
  private time = 0;

  playAttack(): void {
    this.events.push('attack');
    this.playCue([
      { frequency: 170, duration: 0.07, type: 'sawtooth', volume: 0.12 },
      { frequency: 92, duration: 0.11, type: 'triangle', volume: 0.05 },
    ]);
  }

  playDodge(): void {
    this.events.push('dodge');
    this.playCue([{ frequency: 240, duration: 0.16, type: 'triangle', volume: 0.07 }]);
  }

  playBlock(): void {
    this.events.push('block');
    this.playCue([
      { frequency: 120, duration: 0.08, type: 'square', volume: 0.1 },
      { frequency: 420, duration: 0.05, type: 'triangle', volume: 0.045 },
    ]);
  }

  playEnemyWindup(): void {
    this.events.push('enemy-windup');
    this.playCue([{ frequency: 280, duration: 0.18, type: 'sawtooth', volume: 0.055 }]);
  }

  playEnemyAttack(): void {
    this.events.push('enemy-attack');
    this.playCue([{ frequency: 118, duration: 0.12, type: 'sawtooth', volume: 0.105 }]);
  }

  playHit(): void {
    this.events.push('hit');
    this.playCue([
      { frequency: 86, duration: 0.13, type: 'square', volume: 0.12 },
      { frequency: 58, duration: 0.18, type: 'sawtooth', volume: 0.07 },
    ]);
  }

  playDeath(): void {
    this.events.push('death');
    this.playCue([{ frequency: 55, duration: 0.45, type: 'sine', volume: 0.1 }]);
  }

  playShrine(): void {
    this.events.push('shrine');
    this.playCue([
      { frequency: 330, duration: 0.22, type: 'sine', volume: 0.06 },
      { frequency: 495, duration: 0.28, type: 'triangle', volume: 0.035 },
    ]);
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
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    this.ambience = oscillator;
    this.ambienceGain = gain;
  }

  update(delta: number): void {
    this.time += delta;
    if (this.ambienceGain) {
      this.ambienceGain.gain.value = 0.034 + Math.sin(this.time * 1.7) * 0.006;
    }
  }

  dispose(): void {
    this.ambience?.stop();
    this.ambience?.disconnect();
    this.ambienceGain?.disconnect();
    this.ambience = null;
    this.ambienceGain = null;
    this.isAmbienceActive = false;
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
    this.context ??= new AudioCtor();
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }
}

type AudioCueLayer = {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
