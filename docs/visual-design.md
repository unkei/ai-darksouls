# Visual Design

## Direction

Hollow Keep uses original low-poly dark fantasy visuals:

- Dark stone ruins.
- Narrow corridors.
- A small courtyard.
- Exposed ruined-castle sections with broken parapets, open sky gaps, weeds, and a larger upper bailey before the boss.
- Low fog.
- Warm cinder shrine lights.
- A heavy shortcut door.
- A rectangular boss arena.

The style targets PS1/PS2-era silhouettes rather than high-fidelity realism.

## Readability

- Player is a muted blue-gray figure with a bright facing marker.
- Enemies use distinct silhouettes and accent colors.
- Active attack hitboxes are implied with brief red flashes.
- Cinder shrines use warm orange light to draw attention.
- Boss arena has a darker floor and boundary pillars.
- The approach to the boss uses outdoor ruin details to separate it from lesser enemy corridors.

Combat readability is a gameplay requirement, not only polish:

- Player `Attack` shows a visible forward arc in addition to weapon motion.
- Player `Attack` emphasizes a readable ready, raise, and swing sequence using shoulder, arm, weapon, and sword-glow nodes.
- Player `Guard` shows a translucent shield plane in front of the character.
- Player `Dodge` shows a trailing cone so the evasive state is visible from the chase camera.
- Player `HitStun` shows a brief red flash around the body.
- Enemy `Windup` shows a ground warning ring before active damage frames.
- Enemy `Attack` shows a visible forward arc during active frames.
- Enemy `HitStun` shows a warm flash distinct from the red attack arc.
- Combat-critical state effects must use named scene nodes so rendering behavior can be tested.

Future asset upgrades should preserve these signals even if primitive geometry is replaced with glTF or authored low-poly models.

## Combat Readability Specification

The player must be able to identify action state, threat direction, and active danger without reading debug text. Visual readability has priority over atmospheric darkness when those goals conflict.

### Player Signals

- `Idle`, `Walk`, and `Run` must keep facing direction visible from the chase camera.
- `Attack` must show startup intent, weapon motion, and a forward arc during the strike.
- The ready and raised poses should be readable before the active swing, without changing the combat timing contract.
- The player attack startup cue and active attack arc are separate named effects so the state is readable without making startup look like active damage.
- `Guard` must show a shield or guard plane in front of the player before incoming damage is resolved.
- `Dodge` must show body compression or trail motion and must remain visually distinct from ordinary movement.
- `HitStun` must use a short body flash or recoil pose that cannot be confused with an attack.
- `Dead` must remove ambiguity by freezing, collapsing, hiding active combat effects, or using another clear non-combat pose.
- Healing and interaction states must show a non-attack pose so players do not mistake them for active strikes.

### Enemy Signals

- Each enemy archetype must have a distinct silhouette feature beyond color alone.
- `Windup` must present a readable warning before active damage frames. The warning can combine pose, ground ring, glow, weapon lift, or sound, but it must be visible from the default camera.
- `Attack` must show the active direction and approximate range with a weapon path, arc, or flash.
- Minor enemies may use shoulder, knee, and weapon-glow nodes to make windup and swing motion read more smoothly without changing combat timings.
- `Recovery` must visibly relax or lower threat so the player can learn punish timing.
- `Recovery` uses a named low-threat cue and lowered weapon pose rather than warning rings or active attack arcs.
- `HitStun` must be distinct from `Windup` and `Attack`.
- `Dead` enemies must stop showing threat effects.

### Boss Signals

- Boss attacks must be grouped into named patterns before implementation.
- The current boss patterns are `boss-cleave` and `boss-lunge`; the lunge pattern increases range and shows a larger pattern marker.
- Each boss pattern needs a unique windup pose, a unique audio cue, or both.
- Longer-range boss attacks must show more spatial information than short melee attacks.
- Phase or pattern changes must have a visible transition instead of silently changing timing.

### Camera, Lighting, And Environment

- Combat VFX must remain visible against floor, fog, and wall materials.
- Fog and darkness must not hide windup rings, attack arcs, or player facing markers inside normal combat range.
- The default camera should keep the player and current melee threat in frame during close combat.
- Background lights may guide navigation, but combat-critical effects must not depend on subtle lighting changes alone.

### Acceptance Criteria

- A player can identify player `Attack`, `Guard`, `Dodge`, and `HitStun` from a still frame.
- A player can identify enemy `Windup`, `Attack`, `Recovery`, and `HitStun` from a short clip.
- Active damage direction is visible before or during the damage window.
- State-specific effects use named scene nodes or equivalent testable contracts.
- Low-poly or authored model upgrades preserve the same gameplay signals.

## Ending Presentation

The `Ending` overlay uses a staff-roll layout that starts below the viewport and scrolls upward like film credits. Credits remain HTML/CSS so they can be tested without WebGL, and the roll must include `unno`. After the roll, a visible `The End` hold remains while the camera slowly orbits the cleared boss arena.

## Copyright Boundary

Do not use protected names, logos, UI layouts, character likenesses, map layouts, boss designs, sound effects, or extracted assets from existing games.
