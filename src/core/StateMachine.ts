export class StateMachine<TState extends string> {
  private currentState: TState;
  private elapsed = 0;

  constructor(initialState: TState) {
    this.currentState = initialState;
  }

  get state(): TState {
    return this.currentState;
  }

  get timeInState(): number {
    return this.elapsed;
  }

  set(state: TState): void {
    if (this.currentState === state) return;
    this.currentState = state;
    this.elapsed = 0;
  }

  tick(delta: number): void {
    this.elapsed += delta;
  }
}
