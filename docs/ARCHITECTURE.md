# Architecture

## Tech Stack

- **Vite + React + TypeScript** — fast dev server, optimized builds, type safety
- **CSS Modules + CSS Custom Properties** — scoped styles, zero runtime
- **Google Fonts** — Orbitron (headings), JetBrains Mono (body)
- **GitHub Pages + GitHub Actions** — auto-deploy on push to `main`

## Project Structure

```
src/
├── components/
│   ├── Hero/           — Nickname + subtitle
│   ├── SocialLinks/    — GitHub, LeetCode, LinkedIn neon buttons
│   ├── PhotoSlider/    — 4-column sliding photo gallery
│   ├── InterestTags/   — Tag pills
│   └── effects/        — Scanlines CRT overlay
├── data/               — links.ts, photos.ts, interests.ts
├── styles/             — theme.css, reset.css, global.css, animations.css
├── App.tsx             — Page layout (15% sidebar + 85% photo grid)
└── main.tsx            — Entry point
```

## Layout

Single viewport, no scroll (on 16:9 screens). CSS Grid splits the screen:
- **Left 15%** — sidebar with name, social links (top-center), interest tags + copyright (bottom)
- **Right 85%** — 4 full-height photo columns with sliding transitions

## Photo Handling

Photos are auto-discovered at build time via `import.meta.glob('/public/photos/*.webp')`. No hardcoded list — just drop `.webp` files in `public/photos/`. Numbering gaps are fine (e.g. `01.webp`, `03.webp`, `07.webp`). Files are sorted numerically.

The slider shows 4 columns, each cycling through all available photos at random intervals (3–7s). Even columns slide down, odd columns slide up. Hover pauses the slide. Falls back to placeholder blocks if fewer than 4 photos or on load errors.

## Design Decisions

### CSS Modules over CSS-in-JS
Scoped class names at build time with zero runtime cost. CSS custom properties in `theme.css` provide theming without a JS provider.

### Data Layer
Content is separated into `src/data/` files. Photos are scanned automatically. Links and interests are editable in simple TypeScript arrays.

### Converting Photos
`sharp` is included as a dev dependency. Convert JPGs to WebP:
```bash
node -e "const s=require('sharp'),fs=require('fs'); ..."
```
See [PHOTO_GUIDE.md](PHOTO_GUIDE.md) for details.
