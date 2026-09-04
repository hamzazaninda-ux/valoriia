# Architecture Audit Report — Alpha Vital CMS

**Date:** July 19, 2026  
**Auditor:** MiMoCode Architecture Auditor  
**Scope:** Full project architecture review  
**Confidence:** High — all source files, config, content, and documentation reviewed  

---

## Executive Summary

Alpha Vital CMS is a SvelteKit-based landing page CMS designed for the Moroccan market, using a "Git-as-database" model with GitHub API for content persistence. The architectural vision in `ARCHITECTURE.md` is well-thought-out with a clean two-branch draft/publish workflow, but the actual implementation diverges significantly from the spec in several critical areas. The data layer abstraction is solid, but duplicated Git/Octokit logic across files creates maintenance risk. Dead legacy code remains in the codebase, and several planned admin features are either missing or hardcoded. The architecture is fundamentally sound for its intended scale (1-10 products), but the gap between spec and implementation must be addressed before adding new features.

---

## Decision

**Approved with concerns**

The core architecture (Git-as-database, two-branch model, template system, content layer) is solid and well-designed. However, there are 4 high-severity issues that should be fixed before building new features, particularly the duplicated Git logic and the hardcoded authentication bypass.

---

## Architecture Findings

### HIGH: Duplicated Git Octokit Logic Across Three Files

- **Area:** `src/lib/content/` — `products.ts`, `settings.ts`, `templates.ts`
- **Evidence:** All three files contain nearly identical `getOctokit()`, `gitReadFile()`, and `gitWriteFile()` functions. `templates.ts` additionally uses `require('octokit')` (CommonJS) in an ESM project.
- **Impact:** Any bug fix, token change, or error handling improvement must be applied in 3 places independently. The CommonJS `require` in `templates.ts` creates an inconsistent module system that may cause runtime issues.
- **Recommendation:** Extract a shared `src/lib/content/git.ts` module with the Octokit singleton and Git read/write/delete primitives. All content modules should import from this shared layer.

---

### HIGH: Hardcoded Authentication Bypass

- **Area:** `src/routes/api/auth/login/+server.ts:13`
- **Evidence:** `if (password === 'admin123')` — the login endpoint accepts a hardcoded plaintext password instead of comparing against `ADMIN_PASSWORD_HASH` env var via bcrypt as specified in `ARCHITECTURE.md` Section 14.
- **Impact:** Critical security gap. Anyone with the password "admin123" can access the admin panel and publish/delete content via GitHub API. The `ADMIN_PASSWORD_HASH` env var is read but never used for comparison.
- **Recommendation:** Implement bcrypt comparison against `process.env.ADMIN_PASSWORD_HASH` as the architecture spec requires.

---

### HIGH: Dead Legacy Code Not Removed

- **Area:** `src/lib/components/features/`, `src/lib/data/`, `src/lib/services/`
- **Evidence:** 7 components in `features/` (CheckoutForm, ProductHero, ImageGallery, PageFooter, StickyCTA, FAQ, ProductImages) are not imported by any file. `data/offers.ts` is only imported by the dead CheckoutForm. `services/sheets.ts` (with hardcoded Google Sheets URL) is not imported anywhere.
- **Impact:** Confuses developers navigating the codebase. The `features/` directory name suggests these are active components but none are used. The hardcoded `GOOGLE_SHEETS_URL` in `sheets.ts` is unreachable code. Future developers will waste time trying to understand which code is live.
- **Recommendation:** Remove all unused components in `features/`, `data/offers.ts`, and `services/sheets.ts`. The new architecture reads these values from content JSON instead.

---

### HIGH: Product Editor Edits Published Content, Not Drafts

- **Area:** `src/routes/admin/products/[slug]/edit/+page.svelte`
- **Evidence:** The editor binds to `product.published.*` (e.g., `bind:value={product.published.content.title}`), meaning edits go directly to the published version. The draft workflow described in `ARCHITECTURE.md` (Section 9) requires editing draft content separately.
- **Impact:** The entire two-branch draft/publish workflow is bypassed. Any edit to a published product is saved to the draft branch but applied to `published.*`, not `draft.*`. Publishing then copies `draft` to `published`, but since `draft` was never populated with the editor changes (the editor wrote to `published`), the publish action effectively overwrites with the same data.
- **Recommendation:** The editor should load and edit `product.draft` (or `product.published` if no draft exists), and saving should write to the `draft` field only.

---

### MEDIUM: Template System Not Dynamically Loaded

- **Area:** `src/routes/[slug]/+page.svelte`
- **Evidence:** Template is hardcoded as `import ClassicTemplate from '$lib/components/templates/classic/Template.svelte'` and rendered as `<ClassicTemplate ...>`. `ARCHITECTURE.md` Section 10 specifies dynamic import via `await import(\`$lib/components/templates/${templateId}/Template.svelte\`)`.
- **Impact:** Switching templates in the admin panel has no effect on the public site. Adding new templates requires editing route code. The template registry becomes useless without dynamic loading.
- **Recommendation:** Implement the dynamic template loading as specified in `ARCHITECTURE.md`. Use SvelteKit's dynamic import to load templates based on `product.template`.

---

### MEDIUM: Missing Admin Routes

- **Area:** `src/routes/admin/products/`
- **Evidence:** `ARCHITECTURE.md` Section 7 specifies routes for `/admin/products/new` (create product) and `/admin/products/[id]/preview` (preview draft). Neither exists. The product list page links to `/admin/products/new` but there is no corresponding route.
- **Impact:** Admin cannot create new products from the UI. The create product flow is incomplete.
- **Recommendation:** Implement the `/admin/products/new` route and the preview route as specified.

---

### MEDIUM: Admin Panel Not Using Planned Component Structure

- **Area:** `src/lib/components/admin/` (missing) vs. route-level code
- **Evidence:** `ARCHITECTURE.md` specifies `src/lib/components/admin/` with Sidebar, ProductCard, ProductEditor, and 9 editor tab components. None of these exist as reusable components. All admin UI is inlined directly in route files.
- **Impact:** No reusable admin components. Each admin page reimplements UI patterns (forms, buttons, layouts). Adding new admin pages or features requires copying code.
- **Recommendation:** Extract shared admin UI into `src/lib/components/admin/` as specified. At minimum, create ProductEditor, ProductCard, and Sidebar components.

---

### MEDIUM: Dashboard Shows Hardcoded Data

- **Area:** `src/routes/admin/+page.svelte`
- **Evidence:** Dashboard shows "1" product, "1" published, "0" drafts — all hardcoded values. No server-side data loading. `ARCHITECTURE.md` Section 7 shows a dynamic dashboard with counts and activity.
- **Impact:** Dashboard is a non-functional placeholder. Provides no useful information to the admin.
- **Recommendation:** Add `+page.server.ts` to load product counts from `_index.json`. Display dynamic stats and recent activity.

---

### LOW: Templates Content Layer Reads from GitHub But Only One Branch

- **Area:** `src/lib/content/templates.ts`
- **Evidence:** `listTemplates()` always reads from `main` branch. There is no draft/publish workflow for templates. `content/templates/registry.json` only contains the classic template.
- **Impact:** Templates cannot be managed through the admin panel. No admin UI for template management exists.
- **Recommendation:** For now this is acceptable — templates are code, not content. If template management becomes a need, add it to the admin panel.

---

### LOW: Missing `svelte.config.js`

- **Area:** Project root
- **Evidence:** `ARCHITECTURE.md` references `svelte.config.js` in the folder structure but the file doesn't exist. SvelteKit config appears to be inline in `vite.config.ts` via the `sveltekit()` plugin.
- **Impact:** Minor. The config works but deviates from SvelteKit convention.
- **Recommendation:** Not urgent. If config complexity grows, extract to a proper `svelte.config.js`.

---

### LOW: Inconsistent `src/lib/index.ts` Barrel

- **Area:** `src/lib/index.ts`
- **Evidence:** File contains only a comment `// place files you want to import through the '$lib' alias in this folder.` while `src/lib/content/index.ts` and `src/lib/types/index.ts` have proper barrel exports.
- **Impact:** Minor inconsistency. Does not affect functionality.
- **Recommendation:** Either add a proper barrel export or remove the placeholder comment.

---

## Principle Review

- **SOLID:** **Concern.** The Single Responsibility principle is mostly followed in the content layer, but the Git/Octokit logic is duplicated across 3 files. The Open/Closed principle is partially implemented (templates are extensible but not dynamically loaded). Dependency Inversion is violated by the hardcoded auth logic.

- **DRY:** **Fail.** The Git operations (`getOctokit`, `gitReadFile`, `gitWriteFile`) are copy-pasted across `products.ts`, `settings.ts`, and `templates.ts`. The offer data exists in both `data/offers.ts` (dead code) and `content/products/alpha-vital.json` (live data). The `OrderData` interface is defined in both `types/order.ts` and `services/sheets.ts`.

- **KISS:** **Pass.** The overall architecture is simple and understandable. The two-branch model, content layer, and route structure are straightforward. No unnecessary abstractions.

- **Extensibility:** **Concern.** The template system is designed for extensibility but the implementation doesn't support dynamic loading. Adding new templates requires code changes in routes. The content layer is extensible, but the admin panel is not componentized for reuse.

---

## Technical Debt Register

| Priority | Item | Cost if Ignored |
|----------|------|-----------------|
| P1 | Duplicated Git/Octokit logic across 3 files | Bug fixes applied inconsistently; runtime issues from CommonJS/ESM mismatch |
| P1 | Hardcoded auth password ("admin123") | Security vulnerability; admin panel accessible to anyone |
| P1 | Dead code in `features/`, `data/`, `services/` | Developer confusion; wasted onboarding time |
| P1 | Editor binds to `published.*` instead of `draft.*` | Draft/publish workflow is non-functional |
| P2 | Missing `/admin/products/new` route | Cannot create new products from admin UI |
| P2 | Template not dynamically loaded | Template switching has no effect; adding templates requires code changes |
| P2 | Admin components not extracted | Every admin page reimplements UI patterns |
| P2 | Dashboard shows hardcoded data | Dashboard provides no useful information |
| P3 | No template management in admin | Templates can only be managed by editing JSON files |
| P3 | Inconsistent barrel exports | Minor DX annoyance |

---

## Recommended Next Steps

1. **Extract shared Git utilities** — Create `src/lib/content/git.ts` with `getOctokit()`, `gitReadFile()`, `gitWriteFile()`, `gitDeleteFile()`. Refactor `products.ts`, `settings.ts`, and `templates.ts` to import from it. Fix the CommonJS `require` in `templates.ts`.

2. **Fix authentication** — Replace the hardcoded `password === 'admin123'` check with bcrypt comparison against `ADMIN_PASSWORD_HASH` env var.

3. **Remove dead code** — Delete `src/lib/components/features/` (7 unused components), `src/lib/data/offers.ts`, and `src/lib/services/sheets.ts`.

4. **Fix the product editor draft workflow** — Editor should edit `product.draft` (falling back to `product.published` when no draft exists). Saving writes only to `draft` field. Publishing copies `draft` to `published`.

5. **Implement dynamic template loading** — Replace hardcoded `ClassicTemplate` import with dynamic `await import()` based on `product.template`.

6. **Create missing admin routes** — Add `/admin/products/new` for product creation and `/admin/products/[slug]/preview` for draft preview.

7. **Add dynamic dashboard data** — Create `+page.server.ts` for the admin dashboard that loads real product counts from `_index.json`.

---

## Assumptions

- The project is in early development — the `ARCHITECTURE.md` describes the intended final state, and the codebase is an implementation in progress.
- The `GITHUB_TOKEN` and `ADMIN_PASSWORD_HASH` environment variables are expected to be set in Vercel but were not available for testing.
- The duplicate `OrderData` interface in `services/sheets.ts` and `types/order.ts` is a remnant of the pre-CMS architecture.
- The hardcoded Google Sheets URL in `services/sheets.ts` is dead code since the new architecture stores this per-product in `content/products/{slug}.json`.
- The `admin/+page.svelte` hardcoded stats are placeholders that will be replaced with dynamic data.
