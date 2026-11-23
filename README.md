# Novavita

Moroccan COD landing-page store: SvelteKit 2 + Svelte 5 (runes) + Tailwind CSS 4, deployed on Vercel (`novavita.store`).
Arabic-first, RTL, mobile-first.

## Content
Products, settings, templates and orders live in `content/` (Git as database) and are read/written at runtime
through the GitHub API (`src/lib/content/`). See `ARCHITECTURE.md`.

## Develop
```sh
npm install
npm run dev      # local dev server
npm run check    # svelte-check
npm run build    # production build (runs scripts/verify-store-identity.js first)
```

## Notes
- Secrets go in `.env.local` (gitignored). See `.env.example`.
- Auto-deploy from Git is disabled in `vercel.json` on purpose; deploy manually with the Vercel CLI.
- Legacy product URLs (`/products/gummies-biotine`, `gummies_biotine`, ...) are kept as aliases to avoid 404s.
