# Sprint 1 Report — Critical Functional Fixes

**Date:** July 19, 2026  
**Status:** Complete  
**Scope:** Sprint 1 only — no other milestones implemented

---

## Files Modified

### `src/routes/admin/products/[slug]/edit/+page.svelte`

| Change | Detail |
|---|---|
| **Template selector fix** | Added `template` state variable initialized from `product.template`. Changed `<select bind:value={product.template}>` to `<select bind:value={template}>`. Template changes now flow through draft workflow. |
| **Save handler** | Added `template` to `updatedProduct` spread: `{ ...product, template, draft: editState, ... }`. Template is included in saved draft. |
| **Publish handler** | Added `template` to published product: `{ ...product, template, published: editState, ... }`. Template is included on publish. |
| **beforeunload protection** | Added `dirty` state variable, `$effect` that watches `editState` and `template` changes, `onMount` with `beforeunload` event listener. Warning shows when form has unsaved changes. `dirty` resets after successful save and publish. |
| **Import** | Added `import { onMount } from 'svelte'` |

**Note on Tracking/Scripts/Advanced bindings:** These fields correctly bind to `product.meta.*` (not `editState.meta.*`). Per ARCHITECTURE.md §5, `meta` is "always current, not versioned" — it lives at the top level of `Product`, not inside `published` or `draft`. The `editState` type (`{ content, pricing, order, seo }`) does not include `meta`. Since the save handler spreads `...product`, `meta` changes are preserved on the product object.

---

## Files Created

### `src/routes/admin/products/new/+page.server.ts`

Server load function that fetches template registry via `listTemplates()`. Passes templates to the page component.

### `src/routes/admin/products/new/+page.svelte`

New product creation page with:
- Product name input
- Slug field (auto-generated from name, editable, slugified)
- Template selector (populated from registry, defaults to the registry's default template)
- Create button

On creation:
- Generates unique product ID (`prod_{timestamp}_{random}`)
- Creates full product structure with empty content, default pricing offer, empty order/seo/tracking
- Sets status to `draft`
- Adds `created` changelog entry
- POSTs to `/api/products/{slug}` (uses existing `createProduct` API)
- Redirects to `/admin/products/{slug}/edit` on success

---

## Verification Performed

| Check | Result |
|---|---|
| `svelte-check --tsconfig ./tsconfig.json` | **0 errors**, 51 warnings (all pre-existing a11y warnings) |
| TypeScript compilation | Clean — no type errors in modified or created files |
| Import verification | No broken imports — `onMount` from `svelte` is valid |
| Route generation | SvelteKit generated types for `/admin/products/new` route |
| Editor bindings | All form fields verified: content/pricing/seo fields → `editState.*`, template → `template` state, meta fields → `product.meta.*` |
| Save flow | `handleSave` spreads `product` (includes `meta`), adds `template`, sets `draft: editState` |
| Publish flow | `handlePublish` spreads `product`, adds `template`, sets `published: editState`, clears draft |
| beforeunload | `dirty` flag set by `$effect` watching `editState` + `template`, reset after save/publish |
| Dead link fix | `/admin/products/new` route now exists and is accessible |

---

## Remaining Issues

| Issue | Severity | Notes |
|---|---|---|
| `$types` import requires dev server to be run at least once | Low | SvelteKit generates `$types` at dev server startup. First run after adding the route requires `vite dev`. Subsequent `svelte-check` runs work. |
| a11y warnings on form labels | Low | Pre-existing. Labels not associated with controls via `for`/`id`. Not blocking. |
| `state_referenced_locally` warnings | Low | Pre-existing. Svelte 5 warnings about initial value capture. Not blocking. |

---

## Confirmation

**Only Sprint 1 was implemented.** The following were NOT touched:
- No new components extracted (Milestone 3 deferred)
- No new templates built (Milestone 4 deferred)
- No content validation added (Milestone 5 deferred)
- No public website changes (Milestone 6 deferred)
- No admin dashboard improvements (Milestone 7 deferred)
- No security hardening (Milestone 8 deferred)

All changes are limited to:
1. Editor binding fixes (template selector)
2. New product creation route
3. Unsaved changes protection
