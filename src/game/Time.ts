export class Time {
  private last = performance.now();

  tick(now = performance.now()): number {
    const delta = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    return delta;
  }
}
