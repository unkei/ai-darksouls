import { InputState } from '../input/InputState';

export type GameFlowState = 'Opening' | 'Playing' | 'GameOver' | 'BossDefeat' | 'Clear' | 'Ending';

export type GameFlowUpdate = Pick<InputState, 'interact'> & {
  advance?: boolean;
  delta?: number;
  playerDead: boolean;
  bossDead: boolean;
  bossDefeatComplete?: boolean;
};

export const GAME_OVER_TITLE_RETURN_SECONDS = 8;
export const ENDING_TITLE_RETURN_SECONDS = 36;

export class GameFlow {
  state: GameFlowState = 'Opening';
  private gameOverRequiresAdvanceRelease = false;
  private openingRequiresAdvanceRelease = false;
  private stateElapsed = 0;

  forceStateForTest(state: GameFlowState): void {
    this.state = state;
    this.gameOverRequiresAdvanceRelease = false;
    this.openingRequiresAdvanceRelease = false;
    this.stateElapsed = 0;
  }

  get message(): string {
    switch (this.state) {
      case 'Opening':
        return 'HOLLOW KEEP\nThe last ember answers your oath.\nFind the shortcut. Break the warden. Leave with your echoes.\nAny button to enter the keep.';
      case 'GameOver':
        return 'YOU DIED\nYour echoes stain the stone where you fell.\nRise at the cinder shrine and reclaim them.\nAny button to stand again.';
      case 'Clear':
        return 'WARDEN VANQUISHED\nThe locked gate exhales cold daylight.\nThe keep remembers your path through ash and iron.\nAny button to walk beyond the keep.';
      case 'BossDefeat':
        return 'ASHEN WARDEN FALLS\nThe giant armor breaks under its own ash.\nThe keep is quiet for one breath.\nWatch the final ember fade.';
      case 'Ending':
        return 'ENDING\nAsh settles over Hollow Keep.\nCreated by unno\nThank you for playing.';
      case 'Playing':
      default:
        return '';
    }
  }

  update(update: GameFlowUpdate): void {
    this.stateElapsed += update.delta ?? 0;
    const advance = update.advance || update.interact;
    if (this.state === 'Opening') {
      if (!advance) {
        this.openingRequiresAdvanceRelease = false;
        return;
      }
      if (!this.openingRequiresAdvanceRelease) this.transitionTo('Playing');
      return;
    }
    if (this.state === 'Playing') {
      if (update.playerDead) {
        this.transitionTo('GameOver');
        this.gameOverRequiresAdvanceRelease = Boolean(advance);
      } else if (update.bossDead) this.transitionTo('BossDefeat');
      return;
    }
    if (this.state === 'BossDefeat') {
      if (update.bossDefeatComplete) this.transitionTo('Clear');
      return;
    }
    if (this.state === 'GameOver') {
      if (this.stateElapsed >= GAME_OVER_TITLE_RETURN_SECONDS) {
        this.returnToOpeningAfterTimeout(advance);
        return;
      }
      if (!advance) {
        this.gameOverRequiresAdvanceRelease = false;
        return;
      }
      if (!this.gameOverRequiresAdvanceRelease) this.transitionTo('Playing');
      return;
    }
    if (this.state === 'Clear' && advance) {
      this.transitionTo('Ending');
      return;
    }
    if (this.state === 'Ending' && this.stateElapsed >= ENDING_TITLE_RETURN_SECONDS) {
      this.returnToOpeningAfterTimeout(advance);
    }
  }

  private transitionTo(state: GameFlowState): void {
    this.state = state;
    this.stateElapsed = 0;
    if (state !== 'GameOver') this.gameOverRequiresAdvanceRelease = false;
    if (state !== 'Opening') this.openingRequiresAdvanceRelease = false;
  }

  private returnToOpeningAfterTimeout(advanceHeld: boolean): void {
    this.transitionTo('Opening');
    this.openingRequiresAdvanceRelease = advanceHeld;
  }
}
