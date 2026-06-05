import { Time } from './Time';

export class Loop {
  private frame = 0;
  private readonly time = new Time();

  constructor(private readonly update: (delta: number) => void) {}

  start(): void {
    const step = (now: number): void => {
      this.update(this.time.tick(now));
      this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
  }
}
