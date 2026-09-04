# Comprehensive Code Audit Report
**Date:** 2026-07-21
**Project:** Alpha Vital CMS
**Auditor:** opencode (AI Agent)

## Executive Summary
- Total Issues Found: 28
- Critical: 2
- High: 5
- Medium: 12
- Low: 9

## Priority Matrix

### 🔴 CRITICAL (Fix Immediately)

1. **Missing `GET /api/products` endpoint** — `src/routes/api/products/` — The architecture specifies a `GET /api/products` endpoint for listing all products from `_index.json`, but only `[slug]/+server.ts` exists. No `+server.ts` at the products level. Impact: Public API consumers cannot list products programmatically. The home page works via SSR `+page.server.ts`, but the REST API contract is broken.

2. **Race condition in publish workflow (partial state corruption)** — `src/lib/content/products.ts:119-128` — `publishProduct()` writes to main, updates index on main, deletes draft file, then updates draft index. If any step fails (e.g., GitHub API timeout on step 3), the state becomes inconsistent: product exists on main but draft file is stale, or draft index is out of sync. No rollback mechanism.

### 🟠 HIGH (Fix This Week)

3. **In-memory rate limiting is ineffective on Vercel serverless** — `src/routes/api/auth/login/+server.ts:9` — The `loginAttempts` Map lives in module memory. On Vercel, each cold start resets the counter, and concurrent invocations don't share state. An attacker can bypass the 5-attempt limit by timing requests across cold starts.

4. **Race condition in settings save/publish** — `src/lib/content/settings.ts:46-50` and `src/lib/content/settings.ts:56-60` — `saveSettings` and `publishSettings` write 3 files in parallel via `Promise.all`. If one write fails, the others succeed, leaving settings in a partially-updated state on the target branch.

5. **Draft branch never cleaned up after publish** — `src/lib/content/products.ts:127` — While `publishProduct` does delete the draft JSON file, there's no cleanup for stale draft files that may remain from failed publishes or manual Git operations. Over time the draft branch accumulates orphaned files.

6. **No GitHub API rate limit handling** — `src/lib/content/git.ts` — None of the GitHub API calls implement retry logic or exponential backoff for 429/403 rate limit responses. If rate-limited, operations fail silently or throw unhandled errors.

7. **Admin password hash still potentially in brand.json** — `src/lib/types/settings.ts:1-8` — The `BrandSettings` interface doesn't include a password field, and the login endpoint reads from `process.env.ADMIN_PASSWORD_HASH`. However, the ARCHITECTURE.md warns this was previously stored in brand.json. Confirming the actual `content/settings/brand.json` on GitHub doesn't contain a password hash is required.

### 🟡 MEDIUM (Fix Soon)

8. **68 Svelte-check warnings** — Across 7 component files — 21 `state_referenced_locally` warnings (Svelte 5 anti-pattern: copying props into `$state` instead of using `$derived`) and 47 accessibility warnings (`a11y_label_has_associated_control`, `a11y_click_events_have_key_events`). Won't break functionality but indicate code quality issues.

9. **No payload size enforcement on actual body** — `src/lib/validation/helpers.ts:96` — The `parseJsonBody` function checks the `content-length` header (which can be spoofed) but doesn't limit the actual parsed body. A client could send a small header but a large body.

10. **Session cookie not marked `secure` in preview deployments** — `src/lib/server/auth.ts:42` — The `secure` flag depends on `NODE_ENV === 'production'`. Vercel preview deployments (`NODE_ENV=production` but non-HTTPS domains) might have issues. Vercel enforces HTTPS for all deployments, so this is low-risk but worth confirming.

11. **No page-level `load` function for admin login** — No explicit server load function means the page is fully client-rendered. The auth check is handled by `hooks.server.ts` redirect, so this works, but the login page doesn't participate in SSR data loading.

12. **Hardcoded GitHub defaults in source** — `src/lib/content/git.ts:3-4` — `GITHUB_OWNER` and `GITHUB_REPO` default to hardcoded values. If the repository is forked or renamed, these must be overridden via env vars. Acceptable for a single-owner project, but worth documenting.

13. **Template data loaded from `main` branch only** — `src/lib/content/templates.ts:7` — Templates are always read from `main`, never from `draft`. If a new template is added and saved to draft, it won't be visible in the admin editor until published. This is the correct behavior per the architecture, but could surprise admins.

14. **`gitEnsureBranch` creates draft from latest main commit** — `src/lib/content/git.ts:66` — When the draft branch doesn't exist, it's created from the latest `main` ref. This is correct for initial setup, but the function is called on every save, adding an unnecessary API call when the branch already exists.

15. **`updateIndex` in products.ts has O(n) GitHub API calls** — `src/lib/content/products.ts:170-208` — For every product file on a branch, it makes a separate `gitReadFile` call. With 50 products, that's 50+ API calls per publish. At scale (200+ products), this will hit rate limits.

16. **Error message mismatch in PUT endpoint** — `src/routes/api/products/[slug]/+server.ts:62` — When slug doesn't match, returns "Product slug cannot be changed after creation" but the check is actually a mismatch between body slug and URL param slug. If the URL slug and body slug don't match, the message is misleading (someone might be trying to update product A via product B's URL).

17. **No `no-cache` headers on API responses** — API responses don't set `Cache-Control` headers. Vercel/CDN might cache GET responses for dynamic content.

18. **No TypeScript strict mode in tsconfig** — TypeScript strict mode is not enabled. Several implicit `any` types exist (e.g., `src/routes/admin/products/new/+page.svelte:10` casts `t.isDefault` with `as any`).

19. **`+server.ts` at `/api/products/[slug]` has redundant slug check** — `src/routes/api/products/[slug]/+server.ts:9` — The `if (slug)` condition is always true because `[slug]` guarantees a non-empty param. Dead code.

### 🟢 LOW (Nice to Have)

20. **Missing lint script** — `package.json` has no `lint` script. Consider adding eslint or prettier for consistent code style.

21. **Octokit singleton never re-initialized** — `src/lib/content/git.ts:6` — The Octokit instance is cached in module scope. If env vars change during runtime (unlikely on Vercel), the old instance persists.

22. **Admin layout uses `page.url.pathname === '/admin/login'` for nav visibility** — This is a client-side check. The server hook already protects these routes, so the nav check is cosmetic but safe.

23. **No preview deployment branch protection** — `vercel.json` only restricts deployments from non-main branches. Preview deployments for draft content are not configured. If someone pushes draft to a feature branch, Vercel would deploy it.

24. **Template components have duplicated offer card markup** — `classic/Template.svelte` has offer card selection markup duplicated in two places (sticky CTA and main form). This is 100+ lines of near-identical code.

25. **No automated tests** — No test files found in the project. No test scripts in `package.json`.

26. **`robots.txt` and SEO headers not configured** — No `robots.txt` endpoint. The `noindex` field in product SEO only controls the meta tag, not server-side headers.

27. **Hardcoded currency symbol in home page** — `src/routes/+page.svelte:36` — Uses `DH` directly instead of `data.settings.commerce.currencySymbol`. Should use dynamic setting.

28. **`formatPrice` not imported in template check** — The classic Template.svelte uses a `formatPrice` function that should be verified to handle all currency formatting correctly.

---

## Detailed Findings

### Section 1: Type Safety & Syntax

**Command: `npm run check`**
- 0 errors, 68 warnings

**Command: `npm run build`**
- Successful build (36.36s)
- Warnings during build same as svelte-check

**Command: `npm run lint`**
- No lint script configured in package.json

**Warning Categories:**

| Category | Count | Severity |
|---|---|---|
| `state_referenced_locally` (Svelte 5) | 21 | Warning |
| `a11y_label_has_associated_control` | ~40 | Warning |
| `a11y_click_events_have_key_events` | 4 | Warning |
| `a11y_no_noninteractive_element_interactions` | 4 | Warning |

**Affected Files:**
- `src/lib/components/templates/classic/Template.svelte` (12 warnings)
- `src/lib/components/templates/minimal/Template.svelte` (3 warnings)
- `src/lib/components/templates/modern/Template.svelte` (3 warnings)
- `src/routes/admin/products/+page.svelte` (1 warning)
- `src/routes/admin/products/[slug]/edit/+page.svelte` (47+ warnings)
- `src/routes/admin/products/new/+page.svelte` (4 warnings)
- `src/routes/admin/settings/+page.svelte` (12+ warnings)

### Section 2: Architecture & Logic

#### 2.1 Git-as-DB Layer

**Strengths:**
- `isSafeSlug()` guard prevents path traversal in all product file operations
- `gitEnsureBranch()` creates draft from main with proper 422 race handling
- SHA read-before-write pattern correctly implemented
- Error handling returns empty/null instead of crashing on missing files
- `readProductForAdmin` correctly reads draft first, falls back to published

**Weaknesses:**
- No transactional guarantees in publish/unpublish/delete workflows
- `updateIndex()` makes O(n) API calls per product file
- No GitHub API rate limit retry/backoff
- Draft branch accumulates if `publishProduct` fails mid-flow

#### 2.2 Security & Auth

**Strengths:**
- Session HMAC signing with `timingSafeEqual` comparison
- HTTP-only, SameSite=Strict cookie flags
- `hooks.server.ts` properly guards admin pages AND API write operations
- Password hash stored in env var (not in Git)
- Login rate limiting (5/min) albeit in-memory

**Weaknesses:**
- In-memory rate limiter ineffective on serverless
- No CSRF token (mitigated by SameSite=Strict)
- GitHub token cached in singleton (acceptable for serverless warm starts)

#### 2.3 Validation Layer

**Strengths:**
- Comprehensive Zod schemas covering all product and settings fields
- Arabic error messages for admin UI
- Proper separation of concerns (common, product, settings, business, status)
- Slug uniqueness check with self-exclusion for updates
- Template existence validation with component file check
- Payload size check via content-length

**Weaknesses:**
- Content-length check can be spoofed (no actual body size enforcement)
- `PlainTextSchema` rejects HTML — acceptable for admin-authored content per design

#### 2.4 API Routes

**Strengths:**
- Consistent error response format (400, 401, 404, 500)
- PUT/DELETE check product existence before operations
- Publish validates readiness via `validatePublish()`
- Zod validation before any GitHub API calls

**Weaknesses:**
- `GET /api/products` missing entirely
- Misleading error message in PUT slug mismatch
- No Cache-Control headers on GET responses

#### 2.5 Public Routes

**Strengths:**
- Home page filters to published products only
- Product page redirects to home if unpublished or not found
- Template loading has fallback chain
- SEO meta tags correctly injected from product data

**Weaknesses:**
- Hardcoded `DH` currency symbol instead of using dynamic setting
- Template data read from main branch only (correct by design but worth noting)

### Section 3: Security

1. **CRITICAL: Missing API endpoint** — `GET /api/products` doesn't exist. While the home page works via SSR, the public API surface is incomplete.

2. **HIGH: In-memory rate limit** — Bypassable on Vercel serverless. The rate limiter should use Vercel KV or a similar persistent store.

3. **HIGH: Partial state corruption risk** — Publish/unpublish workflows not atomic. A failed GitHub API call mid-workflow leaves inconsistent state across branches.

4. **MEDIUM: Spoofable content-length** — The payload size check trusts the `content-length` header. Should enforce actual size after parsing.

5. **LOW: Cookie secure flag** — Only set in production. Vercel preview deployments use HTTPS, so this is acceptable.

6. **Input sanitization:** Admin-authored content (scripts, custom CSS) intentionally allows raw HTML/JS. This is by design — the admin is a trusted user. No user-generated content exists in the system.

7. **XSS vectors:** The `headScripts`, `bodyScripts`, `footerScripts`, and `customCss` fields are rendered unsanitized. Properly scoped to admin-only access.

### Section 4: Performance

| Metric | Current State | Target | Status |
|---|---|---|---|
| Build time | 36.36s | < 60s | ✅ |
| Client JS (gzip) | ~112 KB total | < 150 KB | ✅ |
| Largest chunk | `node 11` 47.91 KB (16.45 KB gzip) | — | ✅ |
| Server bundle | index.js 125.81 KB | — | Acceptable |
| GitHub API calls per publish | 4 (read draft + write main + update main index + update draft index) | — | Acceptable for current scale |

**Note:** `updateIndex()` makes N+1 API calls where N = number of product files on the branch. At current scale (<10 products) this is fine. At 50+ products, this becomes a concern.

### Section 5: Code Quality

1. **Svelte 5 anti-patterns:** 21 cases of copying `$props()` data into `$state()` instead of using `$derived()`. This captures initial values and doesn't react to prop changes.

2. **Duplicated offer card markup:** ~100 lines of near-identical `<label>` markup in `classic/Template.svelte` at lines 185 and 372.

3. **Hardcoded values:** `DH` currency symbol on home page should use `settings.commerce.currencySymbol`.

4. **No tests:** Zero test infrastructure. No jest, vitest, or Playwright dependencies.

5. **No linting:** No eslint or prettier configuration.

---

## Action Plan

### Phase 1: Critical Fixes (1-2 days)
- [ ] **CRIT-1:** Add `src/routes/api/products/+server.ts` with `GET` handler that reads `_index.json` from main branch
- [ ] **CRIT-2:** Add rollback/retry logic to `publishProduct()` — if draft deletion fails after main write, attempt to undo the main write

### Phase 2: High Priority (1 week)
- [ ] **HIGH-3:** Replace in-memory rate limiter with Vercel KV or implement IP-based rate limiting using Vercel Edge Config
- [ ] **HIGH-4:** Make settings save/publish atomic — wrap writes in a single commit approach or add rollback
- [ ] **HIGH-5:** Implement GitHub API 429/403 retry with exponential backoff in `git.ts`
- [ ] **HIGH-6:** Add clean-up mechanism for stale draft files
- [ ] **HIGH-7:** Verify `content/settings/brand.json` on GitHub doesn't contain admin password hash

### Phase 3: Medium Priority (2 weeks)
- [ ] **MED-8:** Fix Svelte 5 `state_referenced_locally` warnings by using `$derived` instead of `$state` for prop-derived values
- [ ] **MED-9:** Enforce actual payload size after JSON parsing (not just content-length header)
- [ ] **MED-10:** Add `Cache-Control: no-cache` headers to API GET responses
- [ ] **MED-11:** Fix misleading slug error message in PUT handler
- [ ] **MED-12:** Add `nodash` lint script to package.json
- [ ] **MED-13:** Remove redundant `if (slug)` check in `[slug]/+server.ts`

### Phase 4: Low Priority (Backlog)
- [ ] **LOW-14:** Fix hardcoded `DH` to use dynamic `currencySymbol`
- [ ] **LOW-15:** Extract duplicated offer card markup into shared component
- [ ] **LOW-16:** Add automated test suite (vitest for unit, Playwright for e2e)
- [ ] **LOW-17:** Enable TypeScript strict mode
- [ ] **LOW-18:** Fix remaining accessibility warnings for screen reader support
- [ ] **LOW-19:** Add robots.txt endpoint

---

## Appendix

### Files Audited (28 total)

| File | Lines | Role |
|---|---|---|
| `ARCHITECTURE.md` | 1558 | System documentation |
| `package.json` | 38 | Dependencies & scripts |
| `vercel.json` | 9 | Vercel configuration |
| `.env.example` | 12 | Environment variables |
| `src/hooks.server.ts` | 34 | Auth guard hook |
| `src/lib/server/auth.ts` | 44 | Session management |
| `src/lib/content/git.ts` | 140 | GitHub API operations |
| `src/lib/content/products.ts` | 213 | Product CRUD |
| `src/lib/content/settings.ts` | 61 | Settings CRUD |
| `src/lib/content/templates.ts` | 19 | Template registry access |
| `src/lib/content/templateLoader.ts` | 94 | Dynamic template loading |
| `src/lib/validation/common.ts` | 154 | Base Zod schemas |
| `src/lib/validation/product.ts` | 275 | Product Zod schemas |
| `src/lib/validation/settings.ts` | 63 | Settings Zod schemas |
| `src/lib/validation/business.ts` | 234 | Business rule validation |
| `src/lib/validation/status.ts` | 11 | Status action schema |
| `src/lib/validation/helpers.ts` | 182 | Validation utilities |
| `src/lib/validation/index.ts` | 117 | Barrel exports |
| `src/lib/types/product.ts` | 100 | Product TypeScript types |
| `src/lib/types/settings.ts` | 27 | Settings TypeScript types |
| `src/routes/+page.server.ts` | 13 | Home page data load |
| `src/routes/+page.svelte` | 48 | Home page component |
| `src/routes/[slug]/+page.server.ts` | 19 | Product page data load |
| `src/routes/[slug]/+page.svelte` | 17 | Product page component |
| `src/routes/api/products/[slug]/+server.ts` | 95 | Product API endpoints |
| `src/routes/api/products/[slug]/status/+server.ts` | 62 | Publish/unpublish API |
| `src/routes/api/settings/+server.ts` | 28 | Settings API |
| `src/routes/api/settings/publish/+server.ts` | 12 | Settings publish API |
| `src/routes/api/auth/login/+server.ts` | 78 | Login API |
| `src/routes/api/auth/logout/+server.ts` | 8 | Logout API |
| `src/routes/admin/+layout.svelte` | 53 | Admin layout |
| `src/routes/admin/login/+page.svelte` | 71 | Login page |
| `src/routes/admin/products/+page.server.ts` | 9 | Admin product list data |
| `src/routes/admin/products/[slug]/edit/+page.server.ts` | 19 | Edit product data |
| `src/routes/admin/settings/+page.server.ts` | 9 | Settings page data |
| `3 template components` | ~500 each | Classic, Modern, Minimal |

### Commands Run

```bash
npm run check       # svelte-check type checking → 0 errors, 68 warnings
npm run build       # production build → success (36.36s)
```

### Tools Used

- svelte-check (TypeScript & Svelte diagnostics)
- Vite build (production bundle analysis)
- Manual code review of 36 source files
- Cross-reference with ARCHITECTURE.md specification
