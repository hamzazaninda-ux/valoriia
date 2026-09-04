# Alpha Vital LB — Comprehensive Audit Plan

**Date:** July 20, 2026
**Purpose:** Systematic review of the live Vercel-deployed SvelteKit CMS for bugs, security issues, performance problems, and code quality concerns.

---

## Project Overview

- **Stack:** SvelteKit 2 + Svelte 5 (runes) + TypeScript + TailwindCSS 4 + Vercel
- **Architecture:** Git-as-database CMS with two-branch model (main = production, draft = staging)
- **Data:** JSON files in `content/` directory, managed via GitHub API (Octokit)
- **Auth:** HMAC-signed session cookies, bcrypt password hash
- **Validation:** Zod schemas with Arabic error messages
- **Templates:** Component-per-template system (classic, modern, minimal)

---

## Audit Stages

### Stage 1: Build & Type Safety Check
**Goal:** Identify TypeScript errors, build warnings, and compilation issues.
**Files to check:** All `.ts` and `.svelte` files
**Commands to run:** `svelte-check`, `vite build`

| # | Check Item | What to Look For |
|---|-----------|-----------------|
| 1.1 | TypeScript strict mode compliance | Any `any` types, missing type annotations, type mismatches |
| 1.2 | Svelte 5 runes compatibility | Proper `$props()`, `$state()`, `$derived()`, `$effect()` usage |
| 1.3 | Import path correctness | Missing imports, circular dependencies, dead imports |
| 1.4 | Build output warnings | Vite/Svelte compilation warnings |
| 1.5 | Unused variables/functions | Dead code that could indicate logic gaps |
| 1.6 | Zod schema ↔ type alignment | Ensure validation schemas match TypeScript interfaces |

**Estimated findings:** Medium — likely some type issues in complex components

---

### Stage 2: Security Audit
**Goal:** Identify vulnerabilities in authentication, authorization, data handling, and injection risks.
**Key files:** `hooks.server.ts`, `auth.ts`, `login/+server.ts`, all API routes, validation layer

| # | Check Item | What to Look For |
|---|-----------|-----------------|
| 2.1 | Session management | Cookie security, session fixation, timing attacks, expiration |
| 2.2 | Authentication bypass | Routes accessible without auth, hook coverage gaps |
| 2.3 | Rate limiting effectiveness | Login brute force, API abuse, in-memory rate limit issues |
| 2.4 | Input validation gaps | Unsanitized inputs, Zod schema bypass, payload size limits |
| 2.5 | XSS vulnerabilities | User content rendered without escaping, script injection |
| 2.6 | CSRF protection | State-changing requests without CSRF tokens |
| 2.7 | Environment variable exposure | Secrets in client bundle, `.env.local` handling |
| 2.8 | GitHub API token security | Token scope, rotation, error exposure |
| 2.9 | SQL/NoSQL injection | N/A (no database), but check JSON injection in content |
| 2.10 | Open redirect | Check redirect URLs in hooks and routes |
| 2.11 | Header injection | Check `x-forwarded-for` handling in login |
| 2.12 | Content Security Policy | Missing or weak CSP headers |

**Estimated findings:** High priority — security is critical for a live admin panel

---

### Stage 3: API & Server Route Audit
**Goal:** Review all server-side endpoints for correctness, error handling, and edge cases.
**Key files:** `src/routes/api/**/*.ts`, `src/lib/content/*.ts`, `src/lib/server/auth.ts`

| # | Check Item | What to Look For |
|---|-----------|-----------------|
| 3.1 | API response consistency | All endpoints return consistent JSON structure |
| 3.2 | Error handling completeness | Unhandled promise rejections, missing try/catch |
| 3.3 | HTTP method correctness | Proper status codes (201 for create, 204 for delete, etc.) |
| 3.4 | Race conditions | Concurrent writes to same product, index update races |
| 3.5 | GitHub API error handling | Rate limit errors, network failures, branch not found |
| 3.6 | Request body parsing | Malformed JSON, missing fields, extra fields |
| 3.7 | Parameter validation | Slug format, action values, URL parameter sanitization |
| 3.8 | Content-Type enforcement | Ensuring JSON content type on write endpoints |
| 3.9 | Timeout handling | Long-running GitHub API calls without timeout |
| 3.10 | Idempotency | Safe retry of create/update/publish operations |
| 3.11 | Settings publish race | Multiple settings files written in parallel — atomicity |

**Estimated findings:** Medium — robust validation layer exists, but edge cases possible

---

### Stage 4: Data Layer & Git Operations Audit
**Goal:** Review the Git-as-database implementation for data integrity issues.
**Key files:** `src/lib/content/git.ts`, `src/lib/content/products.ts`, `src/lib/content/settings.ts`

| # | Check Item | What to Look For |
|---|-----------|-----------------|
| 4.1 | Git read/write atomicity | Partial writes, corrupted JSON on failure |
| 4.2 | Index file consistency | `_index.json` stale after operations, missing entries |
| 4.3 | Branch existence handling | `draft` branch missing, creation failures |
| 4.4 | File not found handling | Graceful handling when product/settings files don't exist |
| 4.5 | JSON parsing safety | Malformed JSON in content files crashing the app |
| 4.6 | Large file handling | Performance with many products, large content files |
| 4.7 | Concurrent branch operations | Two admins editing simultaneously |
| 4.8 | Publish/unpublish state consistency | Product status vs. actual file state on branches |
| 4.9 | Delete cleanup | Products removed from both branches but index not updated |
| 4.10 | Settings draft/publish split | Draft settings not reflecting published state correctly |

**Estimated findings:** Medium — the two-branch model is well-designed but has edge cases

---

### Stage 5: Frontend Component Audit
**Goal:** Review Svelte components for bugs, UX issues, and performance problems.
**Key files:** All `.svelte` files in `src/routes/` and `src/lib/components/`

| # | Check Item | What to Look For |
|---|-----------|-----------------|
| 5.1 | Reactivity correctness | Missing `$derived`, stale `$state`, unintended re-renders |
| 5.2 | Event handler bugs | Form submission, navigation, error states |
| 5.3 | Conditional rendering | Missing null checks, undefined access crashes |
| 5.4 | Template component duplication | Classic template has two identical forms (top + bottom) |
| 5.5 | Form validation consistency | Client vs. server validation mismatch |
| 5.6 | Loading/error states | Missing spinners, unhandled fetch errors |
| 5.7 | Accessibility (a11y) | Missing labels, alt text, keyboard navigation |
| 5.8 | Mobile responsiveness | Layout breaks on small screens |
| 5.9 | Image loading | Missing lazy loading, broken image fallbacks |
| 5.10 | Memory leaks | Unclosed observers, timers, event listeners |
| 5.11 | localStorage handling | Missing error handling for quota exceeded |
| 5.12 | SEO meta tags | Dynamic meta title/description/OG images |

**Estimated findings:** Medium — the classic template has duplicated form code that could cause bugs

---

### Stage 6: Validation Layer Audit
**Goal:** Ensure Zod schemas cover all edge cases and match actual data flow.
**Key files:** `src/lib/validation/*.ts`, `src/lib/utils/validation.ts`, `src/lib/utils/clientValidation.ts`

| # | Check Item | What to Look For |
|---|-----------|-----------------|
| 6.1 | Schema completeness | All fields validated, no gaps between schema and type |
| 6.2 | Error message accuracy | Arabic messages match the actual error condition |
| 6.3 | Phone validation regex | Moroccan phone format edge cases |
| 6.4 | URL validation strictness | `HttpUrlSchema` allows empty string but field is required |
| 6.5 | Slug validation | Max length, special characters, reserved words |
| 6.6 | Business rule logic | Slug uniqueness check race condition |
| 6.7 | Client-server validation parity | Client allows what server rejects (or vice versa) |
| 6.8 | Payload size limits | 1MB limit — sufficient for product data? |
| 6.9 | Zod version compatibility | Zod v4 API changes vs. v3 patterns |
| 6.10 | Optional field handling | `undefined` vs. `null` vs. empty string confusion |

**Estimated findings:** Low-Medium — validation layer is comprehensive but may have subtle gaps

---

### Stage 7: Performance Audit
**Goal:** Identify performance bottlenecks in loading, rendering, and data fetching.
**Key files:** All route files, template components, content loading utilities

| # | Check Item | What to Look For |
|---|-----------|-----------------|
| 7.1 | Page load performance | Time to first byte, Largest Contentful Paint |
| 7.2 | SSR vs. CSR balance | Unnecessary client-side rendering, hydration costs |
| 7.3 | Image optimization | Missing width/height, no WebP/AVIF, oversized images |
| 7.4 | JavaScript bundle size | Unnecessary imports, large dependencies |
| 7.5 | GitHub API latency | Repeated reads of same data, no caching |
| 7.6 | Concurrent requests | Settings loaded 3x in parallel — could be single request |
| 7.7 | Template rendering | Dynamic import performance, code splitting |
| 7.8 | CSS efficiency | Unused Tailwind classes, duplicate styles |
| 7.9 | Font loading | Web font flash (FOUT), render-blocking fonts |
| 7.10 | Vercel edge functions | Cold start times, function size limits |

**Estimated findings:** Medium — GitHub API calls on every request could be cached

---

### Stage 8: Configuration & Deployment Audit
**Goal:** Review build configuration, environment setup, and deployment settings.
**Key files:** `vercel.json`, `vite.config.ts`, `tsconfig.json`, `package.json`, `.env.example`

| # | Check Item | What to Look For |
|---|-----------|-----------------|
| 8.1 | Vercel deployment config | Branch protection, build settings, function config |
| 8.2 | Environment variables | Required vars documented, secret handling |
| 8.3 | Adapter configuration | `nodejs22.x` runtime — is it supported on Vercel? |
| 8.4 | TypeScript config | `strict: true`, `skipLibCheck: true` implications |
| 8.5 | Dependency audit | Outdated packages, known vulnerabilities |
| 8.6 | Build script correctness | `prepare` script, sync commands |
| 8.7 | .gitignore completeness | Sensitive files excluded, build artifacts ignored |
| 8.8 | CORS configuration | API endpoints CORS headers if needed |
| 8.9 | robots.txt / sitemap | SEO configuration for public pages |
| 8.10 | Error pages | Custom error handling for 404, 500 |

**Estimated findings:** Low — configuration looks clean, but Node.js runtime version needs verification

---

### Stage 9: Architecture & Code Quality Review
**Goal:** Evaluate overall code organization, patterns, and maintainability.
**Key files:** All source files, folder structure

| # | Check Item | What to Look For |
|---|-----------|-----------------|
| 9.1 | Code duplication | Template form code duplicated (top + bottom forms) |
| 9.2 | Separation of concerns | Content logic mixed with presentation |
| 9.3 | Error boundary coverage | Missing `+error.svelte` for admin routes |
| 9.4 | Type safety boundaries | Runtime data cast with `as` without validation |
| 9.5 | Dead code / unused exports | Functions/types defined but never used |
| 9.6 | Naming consistency | File naming, function naming conventions |
| 9.7 | Comment quality | Outdated comments, missing critical comments |
| 9.8 | Dependency direction | lib/ depending on routes, circular deps |
| 9.9 | Test coverage | No test files found — gaps in testability |
| 9.10 | Documentation accuracy | ARCHITECTURE.md matches actual implementation |

**Estimated findings:** Medium — the duplicated form in classic template is a significant code smell

---

### Stage 10: Content & Data Integrity Audit
**Goal:** Verify content files are valid and the data model is consistent.
**Key files:** `content/**/*.json`, `src/lib/types/*.ts`

| # | Check Item | What to Look For |
|---|-----------|-----------------|
| 10.1 | Content file validity | All JSON files parse correctly |
| 10.2 | Schema compliance | Content files match Zod schemas |
| 10.3 | Required fields | No missing required fields in product data |
| 10.4 | URL validity | All image/asset URLs are accessible |
| 10.5 | Cross-reference integrity | Template IDs match registered templates |
| 10.6 | Currency consistency | Product currency matches global settings |
| 10.7 | Index file accuracy | `_index.json` reflects actual product state |
| 10.8 | Draft/published consistency | No orphaned drafts, no stale published data |
| 10.9 | Settings completeness | All three settings files exist and valid |
| 10.10 | Template registry | Registry matches available components |

**Estimated findings:** Low — data model is well-structured

---

## Execution Instructions

Each stage can be assigned independently. To run a specific stage:

```
"Audit Stage X: [stage name]"
```

For example:
- "Audit Stage 2: Security Audit"
- "Audit Stage 5: Frontend Component Audit"

After all stages are complete, a final summary report will be generated with all findings categorized by severity:
- **Critical:** Security vulnerabilities, data loss risks, production crashes
- **High:** Bugs affecting user experience, incorrect behavior
- **Medium:** Code quality issues, potential edge cases, performance concerns
- **Low:** Minor improvements, best practices, documentation

---

## Preliminary Observations (Quick Scan)

Before running formal audit stages, I noticed these items during the initial review:

1. **Duplicated form code** in `classic/Template.svelte` — the order form appears twice (top and bottom of page) with identical logic. This is a maintenance risk.

2. **No `+layout.svelte` for admin sub-routes** — the admin layout handles auth, but individual admin pages may need additional guards.

3. **In-memory rate limiting** in `login/+server.ts` — the `loginAttempts` Map is per-function-invocation, so it resets on each serverless cold start. Rate limiting is ineffective on Vercel.

4. **No CSRF protection** on state-changing API endpoints — relies only on session cookie.

5. **`x-forwarded-for` header** used for rate limiting without validation — can be spoofed if Vercel doesn't strip it.

6. **Settings published via parallel writes** — three separate files written concurrently; partial failure leaves settings in inconsistent state.

7. **No error boundary for admin routes** — only root `+error.svelte` exists.

8. **`skipLibCheck: true`** in tsconfig — hides type errors in dependencies.

9. **No test files** — zero test coverage across the project.

10. **Dynamic template import** uses string interpolation — potential for path traversal if template ID is not sanitized (currently mitigated by slug validation).

---

*This plan covers 10 stages with 100 individual check items. Each stage is designed to be self-contained and can be executed independently.*
