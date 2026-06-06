import { InputState } from '../input/InputState';

export type GameFlowState = 'Opening' | 'Playing' | 'GameOver' | 'Clear' | 'Ending';

export type GameFlowUpdate = Pick<InputState, 'interact'> & {
  advance?: boolean;
  playerDead: boolean;
  bossDead: boolean;
};

export class GameFlow {
  state: GameFlowState = 'Opening';

  get message(): string {
    switch (this.state) {
      case 'Opening':
        return 'HOLLOW KEEP\nThe last ember answers your oath.\nFind the shortcut. Break the warden. Leave with your echoes.\nAny button to enter the keep.';
      case 'GameOver':
        return 'YOU DIED\nYour echoes stain the stone where you fell.\nRise at the cinder shrine and reclaim them.\nAny button to stand again.';
      case 'Clear':
        return 'WARDEN VANQUISHED\nThe locked gate exhales cold daylight.\nThe keep remembers your path through ash and iron.\nAny button to walk beyond the keep.';
      case 'Ending':
        return 'ENDING\nAsh settles over Hollow Keep.\nCreated by unno\nThank you for playing.';
      case 'Playing':
      default:
        return '';
    }
  }

  update(update: GameFlowUpdate): void {
    const advance = update.advance || update.interact;
    if (this.state === 'Opening') {
      if (advance) this.state = 'Playing';
      return;
    }
    if (this.state === 'Playing') {
      if (update.playerDead) this.state = 'GameOver';
      else if (update.bossDead) this.state = 'Clear';
      return;
    }
    if (this.state === 'GameOver') {
      if (advance) this.state = 'Playing';
      return;
    }
    if (this.state === 'Clear' && advance) {
      this.state = 'Ending';
    }
  }
}
