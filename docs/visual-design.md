# Visual Design

## Direction

Hollow Keep uses original low-poly dark fantasy visuals:

- Dark stone ruins.
- Narrow corridors.
- A small courtyard.
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

Combat readability is a gameplay requirement, not only polish:

- Player `Attack` shows a visible forward arc in addition to weapon motion.
- Player `Guard` shows a translucent shield plane in front of the character.
- Player `Dodge` shows a trailing cone so the evasive state is visible from the chase camera.
- Player `HitStun` shows a brief red flash around the body.
- Enemy `Windup` shows a ground warning ring before active damage frames.
- Enemy `Attack` shows a visible forward arc during active frames.
- Enemy `HitStun` shows a warm flash distinct from the red attack arc.
- Combat-critical state effects must use named scene nodes so rendering behavior can be tested.

Future asset upgrades should preserve these signals even if primitive geometry is replaced with glTF or authored low-poly models.

## Copyright Boundary

Do not use protected names, logos, UI layouts, character likenesses, map layouts, boss designs, sound effects, or extracted assets from existing games.
