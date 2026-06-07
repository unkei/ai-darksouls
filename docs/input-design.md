# Input Design

All devices write to the same `InputState`. Raw device events never drive game logic directly. Providers normalize into action flags, movement axes, and camera axes, then `InputManager` merges them once per frame.

Movement axes use one shared convention across devices: negative `move.x` means left, positive `move.x` means right, positive `move.y` means forward, and negative `move.y` means backward. Device-specific browser/API axis quirks must be fixed inside the provider, not in player movement.

Player locomotion converts the shared input convention into camera-relative screen space. With the current chase camera, screen-right movement maps to the camera's right side even though that is negative world X when `cameraYaw` is `0`.

All providers also expose `advance` for non-gameplay flow screens. Any held keyboard key, mouse/pointer button, gamepad button, touch button, or active touch stick/camera pointer may advance opening, clear, and ending presentation states. Retry after game over requires a fresh advance input after all advance inputs have been released, so an attack held through the death transition cannot immediately restart the run.

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

iOS Safari double-tap zoom is disabled for gameplay. The viewport locks maximum scale and root styles use `touch-action: manipulation` while the canvas and touch controls keep direct pointer handling with `touch-action: none`. Touch controls also cancel touch and gesture events so repeated attack taps are not interpreted as browser zoom gestures.

Touch buttons track the pointer id that pressed each action. Release and cancel events clear actions by pointer id instead of event target because captured iOS pointer events may be retargeted to the controls root during multitouch. This keeps virtual stick movement and attack button releases independent.

MVP does not implement remapping, but action names are stable so remapping can be added later.
