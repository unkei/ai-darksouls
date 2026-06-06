# Deployment

Hollow Keep is deployed as a static Vite build through GitHub Pages.

## Production Site

The canonical production site is published from `main` by the GitHub Actions workflow in `.github/workflows/pages.yml`.

The workflow:

1. Installs dependencies with `npm ci`.
2. Builds the app with `npm run build`.
3. Sets `VITE_BASE_PATH` to `/ai-darksouls/` so project Pages asset URLs resolve correctly.
4. Uploads `dist/` as a Pages artifact.
5. Deploys the artifact to GitHub Pages.

## Pull Request Previews

This project does not publish automatic per-PR GitHub Pages previews. GitHub Pages is best suited here for the canonical site published from `main`.

When a PR needs browser verification before merge, run a local production build:

```bash
VITE_BASE_PATH=/ai-darksouls/ npm run build
npm run preview
```

For future per-PR previews, use a separate preview host or add a dedicated workflow that publishes PR builds to an isolated preview location. Do not replace the canonical `main` Pages deployment with PR preview output.

## Manual Deployment

Repository maintainers can run the Pages workflow manually from GitHub Actions through `workflow_dispatch`.
