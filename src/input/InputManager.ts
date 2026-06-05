import { InputProvider, InputState, mergeInputStates } from './InputState';

export class InputManager {
  constructor(private readonly providers: InputProvider[]) {}

  update(): InputState {
    return mergeInputStates(this.providers.map((provider) => provider.update()));
  }

  dispose(): void {
    for (const provider of this.providers) {
      provider.dispose?.();
    }
  }
}
