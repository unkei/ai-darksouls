import { InputState } from '../input/InputState';

export type GameFlowState = 'Opening' | 'Playing' | 'GameOver' | 'Clear' | 'Ending';

export type GameFlowUpdate = Pick<InputState, 'interact'> & {
  playerDead: boolean;
  bossDead: boolean;
};

export class GameFlow {
  state: GameFlowState = 'Opening';

  get message(): string {
    switch (this.state) {
      case 'Opening':
        return 'Hollow Keep\nPress Interact to enter the keep.';
      case 'GameOver':
        return 'Game Over\nPress Interact to rise at the cinder shrine.';
      case 'Clear':
        return 'Ashen Warden defeated\nPress Interact to walk beyond the keep.';
      case 'Ending':
        return 'Ending\nStaff Roll\nunno';
      case 'Playing':
      default:
        return '';
    }
  }

  update(update: GameFlowUpdate): void {
    if (this.state === 'Opening') {
      if (update.interact) this.state = 'Playing';
      return;
    }
    if (this.state === 'Playing') {
      if (update.playerDead) this.state = 'GameOver';
      else if (update.bossDead) this.state = 'Clear';
      return;
    }
    if (this.state === 'GameOver') {
      if (update.interact) this.state = 'Playing';
      return;
    }
    if (this.state === 'Clear' && update.interact) {
      this.state = 'Ending';
    }
  }
}
