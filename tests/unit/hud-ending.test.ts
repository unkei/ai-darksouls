import { describe, expect, it } from 'vitest';
import { Boss } from '../../src/enemies/Boss';
import { Hud } from '../../src/ui/Hud';
import { Player } from '../../src/player/Player';

describe('Hud ending presentation', () => {
  it('renders ending credits as a scrolling film-style roll', () => {
    const root = document.createElement('div');
    const hud = new Hud(root);
    const player = new Player();
    const boss = new Boss({ x: 0, y: 0, z: -22 });

    hud.update(player, boss, 'ENDING\nAsh settles over Hollow Keep.\nCreated by unno\nThank you for playing.', 'Ending');

    const overlay = root.querySelector<HTMLElement>('[data-value="flow-overlay"]');
    const credits = root.querySelector<HTMLElement>('.credits-roll');
    const hold = root.querySelector<HTMLElement>('.ending-hold');

    expect(overlay?.dataset.flowState).toBe('Ending');
    expect(credits).toBeTruthy();
    expect(credits?.textContent).toContain('Created by unno');
    expect(hold?.textContent).toContain('The End');
  });

  it('does not recreate the ending roll on every HUD update', () => {
    const root = document.createElement('div');
    const hud = new Hud(root);
    const player = new Player();
    const boss = new Boss({ x: 0, y: 0, z: -22 });
    const message = 'ENDING\nAsh settles over Hollow Keep.\nCreated by unno\nThank you for playing.';

    hud.update(player, boss, message, 'Ending');
    const firstRoll = root.querySelector<HTMLElement>('.credits-roll');
    hud.update(player, boss, message, 'Ending');

    expect(root.querySelector<HTMLElement>('.credits-roll')).toBe(firstRoll);
  });
});
