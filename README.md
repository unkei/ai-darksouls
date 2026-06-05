# ai-darksouls

Hollow Keep is a small Three.js + TypeScript + Vite soulslike action prototype.

## Run Locally

Install dependencies once:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Open the local URL printed by Vite. It is usually:

```text
http://localhost:5173/
```

If port `5173` is already in use, Vite will print a different port. Open that printed URL instead.

## Controls

- `WASD`: move
- Mouse move after clicking the canvas: camera
- Left click: attack
- Right click: guard / lock assist
- `Space`: dodge roll
- `E`: interact / retry after death
- `R`: heal
- Gamepad and mobile touch controls are also wired through the shared input layer.

The player now starts in a safe entrance area. You should see the HUD, the player, and a controls hint before enemies engage.
