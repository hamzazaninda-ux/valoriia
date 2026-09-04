# Production Review

Reviewed: 2026-07-20

## Scores

| Area | Score |
| --- | ---: |
| Architecture | 7/10 |
| Security | 6/10 |
| Maintainability | 6/10 |
| UX | 6/10 |
| Performance | 5/10 |

## Verified flows

The production build was run locally with the real GitHub repository as storage. A disposable product was created, saved as a draft, previewed, published, served publicly, unpublished, and deleted. Settings save/publish, signed login, forged-cookie rejection, and logout were also exercised. The disposable product was removed from both `main` and `draft`.

`npm run check` completed with 0 errors and 68 warnings. `npm run build` completed successfully.

## Critical issues fixed

| Issue | Root cause | Fix |
| --- | --- | --- |
| Any UUID cookie authenticated an administrator | `src/hooks.server.ts` only checked UUID shape; `src/routes/api/auth/login/+server.ts` generated an unsigned UUID and never used `SESSION_SECRET` | HMAC-signed, expiring sessions with constant-time verification in `src/lib/server/auth.ts` |
| Draft create/save could never work | `src/lib/content/products.ts` wrote to a non-existent `draft` branch | `gitEnsureBranch` creates the branch atomically from `main` before writes |
| Arabic content was corrupted on read and subsequent index writes | `src/lib/content/git.ts:gitReadFile` used `atob`, which returns a Latin-1 byte string instead of UTF-8 text | Correct UTF-8 Base64 decode/encode with `Buffer`; repaired product and index content |
| Publishing settings did not publish drafts | `src/lib/content/settings.ts:publishSettings` read `main`, then rewrote it to `main` | Admin settings now read `draft` first, then publish that version |
| Admin list omitted draft-only products | Admin loads called `listProducts`, which reads only `main` | `listProductsForAdmin` merges `main` and `draft` indexes |
| Publishing retained stale drafts; deletion could partially fail | `publishProduct` never cleared a draft; `gitDeleteFile` threw if the draft file was absent | Publish clears the draft and deletion is idempotent per branch |
| Editor could claim to publish unsaved data and could orphan products by changing slug | `handlePublish` published only remote drafts; API saved by body slug | Publishing now requires a saved state; slugs are immutable after creation and validated against the route |

## Remaining technical debt

- GitHub file and index updates are separate commits. Concurrent admins can still race and produce a temporarily stale index. Move content to a transactional datastore or implement optimistic SHA/version checks before supporting multiple writers.
- The Vercel runtime holds a repository write token. Replace the broad personal access token with a least-privilege GitHub App installation token.
- Login rate limiting is process-local. Use Vercel WAF or a shared rate-limit store for reliable abuse resistance.
- `svelte-check` reports 68 warnings, primarily missing label associations and non-interactive clickable offer cards. These do not block the build but should be addressed for accessibility.
- Customer order submissions use `mode: 'no-cors'` in the templates, so the browser cannot confirm that an external Google Apps Script accepted an order. Proxy and validate submissions server-side before treating an order as confirmed.

## Critical issues

No unresolved source-level critical issue was found after the fixes above.

## Medium issues

- Storage writes are not transactional under concurrent administration.
- External order confirmation is not verifiable by the client.
- Production browser smoke testing requires Vercel SSO access.

## Low issues

- Accessibility/reactivity warnings remain.
- Product slugs are intentionally immutable; a future rename must be a deliberate migration rather than an edit-field change.

## Deployment status

GitHub `main` is deployed by Vercel. The final verification commit at the time of review (`ca34ff6`) completed successfully in Vercel. The local checkout matches `origin/main`; the only local-only file is the pre-existing, untracked `BUTTON_AUDIT.md`.

## Production readiness

The code, GitHub storage workflow, and deployment are ready. Direct browser smoke testing of the Vercel URL remains gated by the project's Vercel SSO protection; all application flows were verified through a production build using the real GitHub storage backend. Do not remove the Vercel protection merely to test it; use an authorized SSO session or bypass token for that final edge-level check.
