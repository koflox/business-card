# koflox.com

Personal business card website with a cyberpunk aesthetic.

## Quick Start

```bash
npm install
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at localhost:5173 |
| `npm run build` | Build for production → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## Photos

Drop `.webp` files into `public/photos/` — they're auto-discovered at build time. No config needed. See [Photo Guide](docs/PHOTO_GUIDE.md) for conversion instructions.

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via GitHub Actions. Custom domain: koflox.com.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
