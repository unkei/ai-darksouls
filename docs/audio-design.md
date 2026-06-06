# Audio Design

Audio feedback must make combat state readable without relying on visuals alone.

## Required Cues

- `attack`: player attack startup and swing.
- `weapon-whoosh`: player weapon wind noise during the swing.
- `weapon-hit`: confirmed weapon impact against an enemy.
- `dodge`: player evasive movement.
- `block`: successful guarded impact.
- `enemy-windup`: enemy attack warning before active frames.
- `enemy-attack`: enemy active attack release.
- `boss-cleave-attack`: boss short-range cleave release.
- `boss-lunge-attack`: boss longer-range lunge release.
- `hit`: player damage feedback.
- `death`: enemy defeat or player death emphasis.
- `enemy-defeat-roar`: enemy defeat vocal/roar emphasis.
- `shrine`: checkpoint or shrine interaction.
- `bgm`: continuous tonal music bed that is distinct from ambience.
- `ambience`: low continuous keep bed.

## Cue Taxonomy

Combat cues are grouped by gameplay priority:

- Critical: `hit`, `block`, `enemy-windup`, `enemy-attack`, `boss-cleave-attack`, `boss-lunge-attack`, `death`, `enemy-defeat-roar`.
- Action confirmation: `attack`, `weapon-whoosh`, `weapon-hit`, `dodge`, `shrine`.
- World bed: `bgm`, `ambience`, future area loops, future boss loops.

Critical cues must remain audible over ambience. Action confirmation cues should be short and responsive. World bed cues should support mood without hiding combat timing.

## Timing Requirements

- Player action cues must start in the same update that enters the action state.
- Enemy windup cues must start when the enemy enters `Windup`, not when damage becomes active.
- Enemy attack cues must start when the enemy enters active `Attack` frames.
- Boss attack cues must use the active boss pattern's named cue ID rather than the generic minor-enemy attack cue.
- Hit and block cues must play after combat resolution confirms the result.
- Weapon-hit cues must play only after combat resolution confirms enemy HP changed.
- Death cues must play once per defeated enemy or player death event.
- Repeated cues should avoid stacking into distortion during crowded fights.

## Mixing Requirements

- BGM and ambience must sit below combat cues.
- BGM should be clearly audible after browser audio unlock while remaining lower than hit, block, and enemy attack cues.
- Hit, block, and enemy attack cues must be louder or sharper than movement and ambience cues.
- Boss cues may be louder than minor enemy cues, but must not mask player hit feedback.
- Short UI or shrine cues should be tonal and distinct from damage cues.
- Any future file-based audio should be normalized before import so volume balance is controlled in code, not by inconsistent source files.

## Browser Audio Requirements

- Audio must handle browser autoplay restrictions by resuming or unlocking the audio context after user interaction.
- The game must remain playable if audio context creation fails.
- Audio cue methods should keep deterministic event records for tests.

## Runtime Direction

The current implementation uses Web Audio synthesis so the project has audible feedback without third-party files. BGM files do not need to be supplied for the current prototype. `AudioDirector.requiredCueIds`, `AudioDirector.generatedMusic`, and the cue map define the file-ready cue taxonomy while preserving synthesized fallback layers. Synthesized BGM uses multiple oscillator layers and resumes after browser audio unlock; it should be clearly audible after the first player interaction while staying below combat cues.

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
- BGM and ambience start once and can be disposed cleanly.
- Audio docs and credits are updated in the same task when file-based audio is added.
- No third-party audio is committed without license and source records.
