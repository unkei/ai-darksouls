# Input Design

All devices write to the same `InputState`. Raw device events never drive game logic directly. Providers normalize into action flags, movement axes, and camera axes, then `InputManager` merges them once per frame.

Movement axes use one shared convention across devices: negative `move.x` means left, positive `move.x` means right, positive `move.y` means forward, and negative `move.y` means backward. Device-specific browser/API axis quirks must be fixed inside the provider, not in player movement.

Player locomotion converts the shared input convention into camera-relative screen space. With the current chase camera, screen-right movement maps to the camera's right side even though that is negative world X when `cameraYaw` is `0`.

All providers also expose `advance` for non-gameplay flow screens. Any held keyboard key, mouse/pointer button, gamepad button, touch button, or active touch stick/camera pointer may advance opening, retry, clear, and ending presentation states.

## Keyboard and Mouse

- `WASD`: movement.
- Mouse move: camera orbit.
- Left click: attack.
- Right click: guard and lock-on assist.
- `Space`: dodge.
- `E`: interact.
- `R`: heal.
- `Shift`: run.

## Gamepad

The Gamepad API is polled by `GamepadInput`.

- Left stick: movement.
- Right stick: camera.
- A / Cross: dodge.
- X / Square: attack.
- B / Circle: interact.
- Y / Triangle: heal.
- LB / L1: guard.
- RB / R1: lock-on toggle.

The input layer exposes a mockable `GamepadLike` shape for tests.

## Touch

Mobile controls use transparent fixed-position HTML:

- Left virtual stick for movement.
- Right drag zone for camera.
- Buttons for attack, dodge, guard, heal, lock-on, and interact.

Touch controls are visible on small/coarse-pointer viewports and hidden on desktop pointer devices.

MVP does not implement remapping, but action names are stable so remapping can be added later.
