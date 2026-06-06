# Testing

## Unit Tests

Vitest covers deterministic logic:

- Player state transitions.
- Stamina gates for attack, dodge, and guard.
- Damage and recovery behavior.
- Gamepad input normalization.

## E2E Tests

Playwright covers browser behavior:

- App starts.
- Canvas renders.
- HUD shows HP and stamina.
- Movement changes the debug position.
- Attack input changes player state.
- Mobile viewport shows touch controls.

## Manual QA

Manual checks before Ready For Review:

- Keyboard and mouse movement, camera, attack, dodge, guard, heal, lock-on, interact.
- Touch controls in mobile viewport.
- Death, respawn, dropped echoes, and recovery.
- Shortcut door opens and remains open after interaction.
- Boss telegraphs before active damage.
- Combat readability matches [Visual Design](visual-design.md): player and enemy action states are identifiable without debug text.
- Audio feedback matches [Audio Design](audio-design.md): combat-critical cues are audible over ambience and mapped to the correct events.

## PR Review Checklist

- Specification coverage matches the MVP.
- State machines cannot get stuck in action states.
- Input is shared across keyboard, gamepad, and touch.
- Three.js rendering does not own combat rules.
- Files stay focused and avoid one large game script.
- Tests cover important behavior, not only DOM presence.
- Render loop avoids repeated geometry/material creation.
- No protected names, assets, layouts, or character designs are copied.
- Audio assets, when present, have license records in `docs/audio-credits.md`.
