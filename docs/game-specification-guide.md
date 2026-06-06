# Game Specification Guide

This guide describes a reusable structure for game specifications. It is not specific to Hollow Keep.

## Separate General Systems From Project Identity

General game specifications should describe systems that could apply to many games:

- Input model and supported devices.
- Camera behavior.
- Player state transitions.
- Combat or interaction rules.
- Collision and world navigation.
- Enemy, NPC, or obstacle behavior.
- Resource management.
- Checkpoint, retry, save, or progression loops.
- UI state and accessibility requirements.
- Rendering, audio, and performance expectations.
- Test coverage needed for deterministic behavior.

Project-specific specifications should describe what makes one game distinct:

- Title, setting, tone, and art direction.
- Original characters, enemies, locations, and item names.
- Level layout and encounter placement.
- Exact tuning values.
- Narrative framing.
- Visual assets and sound direction.
- Scope choices for the current milestone.

## Recommended Document Split

Use this split when starting a new game project:

- `docs/game-specification-guide.md`: reusable specification structure and conventions.
- `docs/architecture.md`: project-specific technical stack and module boundaries.
- `docs/game-design.md`: project-specific game rules, content, tuning, and milestone scope.
- `docs/input-design.md`: shared input model plus project-specific bindings.
- `docs/testing.md`: reusable test principles plus project-specific commands and coverage expectations.

## Reuse Rule

If a decision would still apply after replacing the game's title, setting, content, and art direction, keep it in a reusable guide. If the decision depends on this game's identity, balance, map, or implementation, keep it in the project-specific documents.
