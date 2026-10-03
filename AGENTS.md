# Valoriia — Agent Rules

## Frontend work (mandatory)

For ANY task involving UI — new pages, landing templates, components,
restyling, admin screens: FIRST load the `frontend-design` skill via the
`skill` tool and follow it (design plan → self-review → build →
critique). Do this automatically, without being asked.

## Project notes

- SvelteKit 2 + Svelte 5 (runes) + Tailwind CSS 4. Build: `npm run build`.
- Content lives in Git (`main` = production, `draft` = staging) and is
  read/written at runtime via the GitHub API (`src/lib/content/`).
- Never commit secrets. `.env.local` is local-only (gitignored).
- Arabic-first, RTL, mobile-first (Moroccan COD market).

## Deployment & Git workflow (mandatory)

Every task MUST end with:
1. `git add .`
2. `git commit -m "..."`
3. `git push origin main`
4. Deploy and verify production on Vercel (`lhamza.shop`).
No task is complete until changes are live in production. Never stop at Localhost.
