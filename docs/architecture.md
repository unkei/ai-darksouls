# Architecture

This is the Hollow Keep project architecture. Reusable development-process guidance belongs in [Development Process](development-process.md), and reusable game-specification structure belongs in [Game Specification Guide](game-specification-guide.md).

## Project Stack

- Vite for local development and build.
- TypeScript for strict game logic.
- Three.js for rendering.
- HTML/CSS overlay for HUD and touch controls.
- Vitest for unit tests.
- Playwright for browser tests.

Rapier or another physics engine is intentionally deferred. The MVP uses simple circles, boxes, and distance checks because the map and combat are compact.

## Module Boundaries

- `game/`: loop, renderer ownership, orchestration.
- `core/`: small engine primitives such as vectors and state machines.
- `input/`: keyboard, mouse, gamepad, and touch normalized into one `InputState`.
- `player/`: player stats, state machine, action rules, and visual actor.
- `enemies/`: AI state, archetypes, boss behavior.
- `combat/`: damage, hitbox checks, combat resolution.
- `world/`: dungeon geometry, checkpoints, shortcut, item/drop entities.
- `ui/`: HUD and touch controls.

Three.js objects are created by scene/world classes, while combat and state transitions stay in TypeScript logic classes that are unit-testable.

Gameplay constants are grouped in module-level data objects rather than scattered through update loops. Third-party assets must be CC0, permissively licensed, generated for this project, or replaced with primitive geometry.

Visual and audio presentation must preserve the project-specific readability specs in [Visual Design](visual-design.md) and [Audio Design](audio-design.md). Rendering and audio layers may expose named nodes, cue methods, or data entries for tests, but gameplay state transitions remain owned by logic classes.

## Runtime Flow

1. `main.ts` mounts the app and creates `Game`.
2. `Game` wires scene, input, player, enemies, world, combat, and HUD.
3. `Loop` calls update with delta time.
4. Input providers merge into a normalized action vector.
5. Game logic updates first, then Three.js transforms are synchronized.
6. HUD reads a small view model, not raw Three.js state.
