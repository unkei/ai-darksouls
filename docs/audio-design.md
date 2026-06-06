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
