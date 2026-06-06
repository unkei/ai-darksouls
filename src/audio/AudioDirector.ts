export class AudioDirector {
  readonly events: string[] = [];
  isAmbienceActive = false;
  private context: AudioContext | null = null;
  private ambience: OscillatorNode | null = null;
  private ambienceGain: GainNode | null = null;
  private time = 0;

  playAttack(): void {
    this.events.push('attack');
    this.playTone(150, 0.08, 'sawtooth', 0.045);
  }

  playHit(): void {
    this.events.push('hit');
    this.playTone(86, 0.12, 'square', 0.06);
  }

  playDeath(): void {
    this.events.push('death');
    this.playTone(55, 0.45, 'sine', 0.08);
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
    gain.gain.value = 0.018;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    this.ambience = oscillator;
    this.ambienceGain = gain;
  }

  update(delta: number): void {
    this.time += delta;
    if (this.ambienceGain) {
      this.ambienceGain.gain.value = 0.014 + Math.sin(this.time * 1.7) * 0.004;
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

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtor) return null;
    this.context ??= new AudioCtor();
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
