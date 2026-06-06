# Feedback Implementation Decisions

This task addresses tester feedback for combat readability, movement facing, collision, visual richness, and audio.

## Development Rules

- Gameplay, input, combat, collision, and rendering behavior changes use TDD: add or update a failing test before implementing the behavior.
- At task start, sync the task branch with `origin/main` before implementation edits: run `git fetch origin`, merge `origin/main`, resolve conflicts, then run relevant tests.
- Each PR must include a task checklist in the body.
- Checklist items are updated as implementation steps complete, not only at merge time.
- If a fix was delivered in another PR, verify its commit is reachable from the current branch before assuming the behavior is present.

## Design Decisions

- Player and enemy characters use small articulated Three.js groups instead of single primitive bodies.
- Attack states must expose visible weapon or limb poses, with mesh names stable enough for tests.
- Movement direction drives character yaw for both player and enemies.
- Dungeon collision is resolved against explicit wall rectangles, not only outer bounds.
- Visual assets must be original and must not copy protected names, characters, logos, maps, or enemy designs.
- Texture richness is supplied by an original generated atlas plus procedural material variation.
- Audio is generated in-browser with Web Audio oscillators/noise so no licensed external asset is required for MVP.
