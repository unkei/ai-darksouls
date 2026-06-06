# Audio Design

Audio feedback must make combat state readable without relying on visuals alone.

## Required Cues

- `attack`: player attack startup and swing.
- `dodge`: player evasive movement.
- `block`: successful guarded impact.
- `enemy-windup`: enemy attack warning before active frames.
- `enemy-attack`: enemy active attack release.
- `hit`: player damage feedback.
- `death`: enemy defeat or player death emphasis.
- `shrine`: checkpoint or shrine interaction.
- `ambience`: low continuous keep bed.

## Cue Taxonomy

Combat cues are grouped by gameplay priority:

- Critical: `hit`, `block`, `enemy-windup`, `enemy-attack`, `death`.
- Action confirmation: `attack`, `dodge`, `shrine`.
- World bed: `ambience`, future area loops, future boss loops.

Critical cues must remain audible over ambience. Action confirmation cues should be short and responsive. World bed cues should support mood without hiding combat timing.

## Timing Requirements

- Player action cues must start in the same update that enters the action state.
- Enemy windup cues must start when the enemy enters `Windup`, not when damage becomes active.
- Enemy attack cues must start when the enemy enters active `Attack` frames.
- Hit and block cues must play after combat resolution confirms the result.
- Death cues must play once per defeated enemy or player death event.
- Repeated cues should avoid stacking into distortion during crowded fights.

## Mixing Requirements

- Ambience must sit below combat cues.
- Hit, block, and enemy attack cues must be louder or sharper than movement and ambience cues.
- Boss cues may be louder than minor enemy cues, but must not mask player hit feedback.
- Short UI or shrine cues should be tonal and distinct from damage cues.
- Any future file-based audio should be normalized before import so volume balance is controlled in code, not by inconsistent source files.

## Browser Audio Requirements

- Audio must handle browser autoplay restrictions by resuming or unlocking the audio context after user interaction.
- The game must remain playable if audio context creation fails.
- Audio cue methods should keep deterministic event records for tests.

## Runtime Direction

The current implementation uses Web Audio synthesis so the project has audible feedback without third-party files. Synthesized cues should be louder and more distinct than the previous test tones, but short enough to avoid masking combat timing.

When adding file-based audio:

- Prefer CC0 assets.
- CC-BY assets are allowed only when credits are recorded.
- Avoid non-commercial, share-alike, unclear, extracted, or game-clone assets.
- Store files under `public/assets/audio/`.
- Record every third-party file in `docs/audio-credits.md`.
- Keep the original source URL, author, license, and retrieval date.

OpenAI text-to-speech may be used for original voice lines or narration. It should not be treated as the main source for BGM or combat sound effects unless a future official audio-generation workflow supports that use directly.

## Acceptance Criteria

- Each required cue has a named method or data entry that can be tested.
- Critical combat cues are distinguishable by event name and by sound design intent.
- Ambience starts once and can be disposed cleanly.
- Audio docs and credits are updated in the same task when file-based audio is added.
- No third-party audio is committed without license and source records.
