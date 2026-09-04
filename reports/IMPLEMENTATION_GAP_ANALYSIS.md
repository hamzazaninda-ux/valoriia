# Implementation Gap Analysis

**Project:** Alpha Vital CMS  
**Date:** July 19, 2026  
**Compared Against:** ARCHITECTURE.md (Version 2.0)  
**Status:** Read-Only Analysis — No Code Changes

---

## Executive Summary

- **Overall Completion:** ~55%
- **Current Project Maturity:** Functional MVP with core data flow working, but significant UI, componentization, and feature gaps remain.
- **Architecture Adherence:** The data layer (Git-as-database, two-branch model, GitHub API) is correctly implemented. The content types, API routes, and admin auth follow the spec. However, the UI layer deviates from the architecture by inlining everything into route files instead of using the specified reusable component structure. Template system is partially built (only Classic exists).

---

## Fully Implemented ✅

| Feature | Evidence |
|---|---|
| **Git-as-Database (two-branch model)** | `src/lib/content/git.ts` — Octokit wrapper with `gitReadFile`, `gitWriteFile`, `gitDeleteFile`, `gitListFiles` targeting `main`/`draft` branches |
| **Product CRUD (content layer)** | `src/lib/content/products.ts` — `listProducts`, `readProduct`, `readProductDraft`, `readProductForAdmin`, `saveProductDraft`, `createProduct`, `publishProduct`, `unpublishProduct`, `deleteProduct`, `updateIndex` |
| **Settings CRUD (content layer)** | `src/lib/content/settings.ts` — `readBrandSettings`, `readCommerceSettings`, `readTrackingSettings`, `readSettings`, `saveSettings`, `publishSettings` |
| **Template registry (content layer)** | `src/lib/content/templates.ts` — `listTemplates`, `getTemplate`, `getDefaultTemplate` |
| **Product data structure** | `src/lib/types/product.ts` — Full `Product`, `ProductContent`, `ProductPricing`, `ProductOrder`, `ProductSeo`, `ProductTracking`, `ProductAdvanced` interfaces matching ARCHITECTURE.md §5 |
| **Settings data structure** | `src/lib/types/settings.ts` — `BrandSettings`, `CommerceSettings`, `TrackingSettings`, `GlobalSettings` |
| **Template types** | `src/lib/types/templates.ts` — `TemplateRegistryItem`, `TemplateRegistry`, `TemplateProps` |
| **Order/Lead types** | `src/lib/types/order.ts` — `OrderData`, `LeadData` |
| **Admin authentication** | `src/hooks.server.ts` — Session cookie check on all `/admin/*` routes; `src/routes/api/auth/login/+server.ts` — bcrypt comparison, rate limiting (5/min/IP), httpOnly session cookie; `src/routes/api/auth/logout/+server.ts` — cookie deletion |
| **Admin login page** | `src/routes/admin/login/+page.svelte` — Password form, Arabic error messages, loading state |
| **Admin layout** | `src/routes/admin/+layout.svelte` — Top nav bar with brand, site link, logout |
| **Admin dashboard** | `src/routes/admin/+page.svelte` — Quick actions (stats are hardcoded) |
| **Admin product list** | `src/routes/admin/products/+page.svelte` — Table with image, title, slug, status badge, price, actions (edit, publish, delete) |
| **Admin product editor (core)** | `src/routes/admin/products/[slug]/edit/+page.svelte` — Tabbed editor with save/publish workflow, `editState` initialized from `draft || published` |
| **Admin settings editor** | `src/routes/admin/settings/+page.svelte` — Brand, commerce, tracking sections with save/publish |
| **Product API (CRUD)** | `src/routes/api/products/[slug]/+server.ts` — GET, POST, PUT, DELETE |
| **Product status API** | `src/routes/api/products/[slug]/status/+server.ts` — Publish/unpublish |
| **Settings API** | `src/routes/api/settings/+server.ts` — GET, PUT, POST |
| **Settings publish API** | `src/routes/api/settings/publish/+server.ts` — Dedicated publish endpoint |
| **Home page (product listing)** | `src/routes/+page.svelte` — Reads `_index.json`, filters published, displays cards |
| **Home page server load** | `src/routes/+page.server.ts` — Loads products + settings from main branch |
| **Dynamic product page** | `src/routes/[slug]/+page.svelte` — Loads product, sets SEO meta, renders template |
| **Product page server load** | `src/routes/[slug]/+page.server.ts` — Reads product by slug, redirects if not published |
| **Classic template** | `src/lib/components/templates/classic/Template.svelte` — 515-line complete landing page with hero, offers, dual forms, gallery, sticky CTA, footer |
| **Thank you page** | `src/routes/thank-you/+page.svelte` — localStorage order data, animated confirmation, WhatsApp link |
| **Order form + validation** | `src/lib/utils/validation.ts` — Arabic error messages, shake animation trigger; `src/lib/utils/phone.ts` — Moroccan phone validation |
| **Google Sheets integration** | Classic Template submits to per-product `googleSheetsUrl` via client-side fetch |
| **GTM integration** | `src/app.html` — GTM script in head + noscript fallback |
| **Vercel deployment config** | `vercel.json` — Only deploys from `main` branch |
| **Content data files** | `content/products/alpha-vital.json`, `_index.json`, `content/settings/*.json`, `content/templates/registry.json` |
| **shadcn-svelte UI primitives** | Button (6 variants, 8 sizes), Card (7 sub-components) |
| **Global CSS + fonts** | `src/routes/layout.css` — Tailwind CSS 4, shadcn theme, Arabic fonts (Cairo, El Messiri, Tajawal, Amiri) |

---

## Partially Implemented ⚠

### 1. Product Editor Tabs (General, Pricing, Hero, SEO, Tracking, Scripts, Advanced)

**What exists:** All 8 tabs render content in the editor. General tab has name, subtitle, rating, review count. Pricing tab has offer editing. Hero tab has URL input with preview. SEO, Tracking, Scripts, Advanced all have their respective fields.

**What is missing:**
- **General tab:** No slug field (auto-generated from name, editable per spec). No template dropdown populated from registry (hardcoded to classic/modern/minimal). No Order Settings group (SKU, Google Sheets URL, Phone Confirmation, WhatsApp) — these are in the product data but not editable in the General tab.
- **Pricing tab:** No "Add Offer" or "Remove Offer" buttons. No `isPopular` checkbox. No auto-incrementing offer IDs. No offer preview.
- **Gallery tab:** Tab exists in the tab bar but has **zero content** — no image list, no add/remove, no reordering, no alt text editing.
- **Offers tab (preview):** Tab exists in the tab bar but has **zero content** — no visual preview of how offers render in the order form.
- **SEO tab:** Missing OG Image uploader (only text input exists, no image preview).
- **Tracking tab:** Fields bind to `product.meta.tracking` directly instead of `editState`, meaning changes don't go through the draft workflow properly.
- **Scripts tab:** Fields bind to `product.meta.advanced` directly instead of `editState` — same draft workflow bug.
- **Advanced tab:** Only has custom CSS. Missing head/body/footer scripts (moved to Scripts tab but not all documented).

### 2. Dashboard Stats

**What exists:** Hardcoded display of "1 product, 1 published, 0 drafts".

**What is missing:** Dynamic stats computed from actual product data. Recent activity feed. Quick actions should reflect real counts.

### 3. Product List Search/Filter

**What exists:** Table displays all products with status badges.

**What is missing:** Search input, status filter dropdown, sort controls. The architecture specifies "Search: [____] Filter: [All ▾] Sort: [Updated ▾]".

### 4. Template System

**What exists:** Classic template fully built. Template registry with one entry. Product stores template ID.

**What is missing:**
- Only 1 of 3 templates exists (Classic). Modern and Minimal templates not built.
- Product page hardcodes `ClassicTemplate` import instead of dynamically loading based on `product.template`.
- Template select in editor binds to `product.template` instead of `editState`, so template change doesn't go through draft workflow.

### 5. Content Validation (Zod)

**What exists:** Zod is listed as a dependency in `package.json` but is not imported or used anywhere in the codebase.

**What is missing:** The architecture specifies Zod schemas for all content validation (Appendix B). No server-side validation exists before GitHub API writes. No input sanitization on admin writes.

### 6. Home Page Layout

**What exists:** Basic product cards in a grid.

**What is missing:**
- No top bar with brand info (brand name, tagline from `brand.json`).
- No product card component (everything is inline in `+page.svelte`).
- No footer component.

---

## Missing Features ❌

### Admin Dashboard

| Feature | Status |
|---|---|
| Dynamic product count stats | ❌ Hardcoded |
| Published/Draft count breakdown | ❌ Hardcoded |
| Recent activity feed | ❌ Not implemented |
| Quick actions (New Product, Settings) | ✅ Links exist, but no "New Product" page |

### Product Management

| Feature | Status |
|---|---|
| Create new product route (`/admin/products/new`) | ❌ Dead link — route does not exist |
| Product preview route (`/admin/products/[id]/preview`) | ❌ Not implemented |
| Slug auto-generation from product name | ❌ No slug utility exists |
| Slug uniqueness validation | ❌ Not implemented |
| Unpublish from product list | ❌ Only publish action exists |
| Delete confirmation dialog | ✅ Exists |
| Draft indicator in product list | ✅ Status badge shows draft/published |
| Product count in list header | ❌ Not implemented |

### Product Editor — Gallery Tab

| Feature | Status |
|---|---|
| Image list display | ❌ Tab is empty |
| Add image button | ❌ Not implemented |
| Remove image button | ❌ Not implemented |
| Drag-to-reorder | ❌ Not implemented |
| Alt text editing per image | ❌ Not implemented |
| Image preview | ❌ Not implemented |

### Product Editor — Offers Tab (Preview)

| Feature | Status |
|---|---|
| Visual preview of offer cards | ❌ Tab is empty |
| Shows how offers render in order form | ❌ Not implemented |

### Product Editor — General Tab

| Feature | Status |
|---|---|
| Slug field (auto-generated, editable) | ❌ Not implemented |
| Template dropdown (from registry) | ⚠ Hardcoded options |
| Order Settings group (SKU, Sheets URL, Phone, WhatsApp) | ❌ Not in General tab |

### Product Editor — Pricing Tab

| Feature | Status |
|---|---|
| Add offer button | ❌ Not implemented |
| Remove offer button | ❌ Not implemented |
| `isPopular` checkbox | ❌ Not implemented |
| Auto-increment offer ID | ❌ Not implemented |

### Product Editor — SEO Tab

| Feature | Status |
|---|---|
| OG Image uploader with preview | ❌ Text input only, no image preview |

### Product Editor — Tracking / Scripts / Advanced

| Feature | Status |
|---|---|
| Fields bind through `editState` (draft workflow) | ❌ Bind to `product` directly — changes bypass draft save |

### Templates

| Feature | Status |
|---|---|
| Modern template (`modern/Template.svelte`) | ❌ Not built |
| Minimal template (`minimal/Template.svelte`) | ❌ Not built |
| Dynamic template loading in product page | ❌ Hardcoded to Classic |
| Template selection from registry in editor | ⚠ Hardcoded options |

### Public Website

| Feature | Status |
|---|---|
| FAQ section in Classic template | ❌ Not rendered (data exists in product JSON) |
| Brand top bar on home page | ❌ Not implemented |
| Brand footer on home page | ❌ Not implemented |
| Product card component (reusable) | ❌ Inline in home page |
| Home page footer | ❌ Not implemented |

### Media

| Feature | Status |
|---|---|
| Cloudinary upload helper (`src/lib/services/cloudinary.ts`) | ❌ Not created |
| ImageUploader component | ❌ Not created |
| Media library index (`content/media.json`) | ❌ Not created |

### Authentication

| Feature | Status |
|---|---|
| Rate limiting persistence across cold starts | ❌ In-memory Map resets |
| Session HMAC signing with `SESSION_SECRET` | ❌ Cookie stored but not signed |
| `beforeunload` warning for unsaved changes | ❌ Not implemented |

### Git Content Layer

| Feature | Status |
|---|---|
| `readProductBySlug()` utility | ❌ Product page reads by slug but uses `readProduct` which takes `slug` param — works, but no dedicated function |
| GitHub API error handling with exponential backoff | ❌ Not implemented |
| Batch operations for multiple writes | ❌ Not implemented |
| Commit messages with descriptive text | ✅ Basic messages exist |

---

## Missing Routes

| Route | Purpose |
|---|---|
| `/admin/products/new` | Create new product — link exists in product list but route does not exist |
| `/admin/products/[slug]/preview` | Preview draft content — specified in ARCHITECTURE.md §9 |

---

## Missing Components

### Admin Components (from ARCHITECTURE.md §4)

| Component | Location Specified | Status |
|---|---|---|
| `Sidebar.svelte` | `src/lib/components/admin/` | ❌ Navigation is inlined in admin layout |
| `ProductCard.svelte` | `src/lib/components/admin/` | ❌ Product list inlines card rendering |
| `ProductEditor.svelte` | `src/lib/components/admin/` | ❌ Editor is inlined in route |
| `editor/GeneralTab.svelte` | `src/lib/components/admin/editor/` | ❌ Inlined in editor route |
| `editor/PricingTab.svelte` | `src/lib/components/admin/editor/` | ❌ Inlined |
| `editor/HeroTab.svelte` | `src/lib/components/admin/editor/` | ❌ Inlined |
| `editor/GalleryTab.svelte` | `src/lib/components/admin/editor/` | ❌ Inlined (empty) |
| `editor/OffersTab.svelte` | `src/lib/components/admin/editor/` | ❌ Inlined (empty) |
| `editor/SeoTab.svelte` | `src/lib/components/admin/editor/` | ❌ Inlined |
| `editor/TrackingTab.svelte` | `src/lib/components/admin/editor/` | ❌ Inlined |
| `editor/ScriptsTab.svelte` | `src/lib/components/admin/editor/` | ❌ Inlined |
| `editor/AdvancedTab.svelte` | `src/lib/components/admin/editor/` | ❌ Inlined |
| `ImageUploader.svelte` | `src/lib/components/admin/` | ❌ Not created |

### Public Landing Components (from ARCHITECTURE.md §4)

| Component | Location Specified | Status |
|---|---|---|
| `ProductHero.svelte` | `src/lib/components/landing/` | ❌ Inlined in Classic template |
| `ImageGallery.svelte` | `src/lib/components/landing/` | ❌ Inlined |
| `OfferCards.svelte` | `src/lib/components/landing/` | ❌ Inlined |
| `OrderForm.svelte` | `src/lib/components/landing/` | ❌ Inlined |
| `StickyCTA.svelte` | `src/lib/components/landing/` | ❌ Inlined |
| `SalesSection.svelte` | `src/lib/components/landing/` | ❌ Inlined |
| `PageFooter.svelte` | `src/lib/components/landing/` | ❌ Inlined |

### Template Components

| Component | Location Specified | Status |
|---|---|---|
| `modern/Template.svelte` | `src/lib/components/templates/modern/` | ❌ Not created |
| `minimal/Template.svelte` | `src/lib/components/templates/minimal/` | ❌ Not created |

---

## Missing APIs

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/products` | `GET` | List all products — currently reads from `_index.json` via server load, no dedicated API endpoint |
| `/api/products/[slug]/preview` | `GET` | Render draft preview — not implemented |
| `/api/products` | `POST` | Create product — route exists at `/api/products/[slug]` but not at `/api/products` for creation |
| Zod validation on all write endpoints | — | No server-side content validation exists |

---

## Missing Content Layer Features

| Feature | Status |
|---|---|
| Zod schemas for content validation (Appendix B) | ❌ Not implemented — Zod is a dependency but unused |
| `readProductBySlug(slug)` — find product by slug from index | ❌ Server routes read product by slug directly via `gitReadFile`, works but no index-based lookup |
| `listProducts()` filter by status | ❌ Returns all products, no filter parameter |
| `updateIndex()` called after every write | ⚠ Exists but not called from all write operations |
| `gitDeleteFile` on draft branch for unpublish | ⚠ `unpublishProduct` only modifies main, doesn't clean up draft |
| Error handling with retry/backoff for GitHub API | ❌ Not implemented |
| `content/media.json` media library index | ❌ Not created |
| Slug generation utility (`src/lib/utils/slug.ts`) | ❌ Not created |
| Content file validation before write | ❌ No validation layer |

---

## Technical Debt

| Item | Impact | Notes |
|---|---|---|
| **Editor tabs inlined in 376-line route file** | Medium | ARCHITECTURE.md specifies separate component files per tab. All 8 tabs are in a single `+page.svelte`. Makes maintenance harder as editor grows. |
| **Tracking/Scripts fields bypass draft workflow** | High | `bind:value={product.meta.tracking.gtmContainerId}` binds to `product` instead of `editState`. Changes save to published directly, not through draft. |
| **Template select bypasses draft workflow** | Medium | `bind:value={product.template}` on the template dropdown binds to `product`, not `editState`. Template changes aren't saved to draft. |
| **Landing components not extracted** | Low | Classic template is 515 lines with all components inlined. Works fine for one template, but will duplicate massively when Modern and Minimal are built. |
| **No `beforeunload` warning** | Low | ARCHITECTURE.md specifies browser warning for unsaved changes. Not implemented. Admin could lose work. |
| **Rate limiter resets on cold start** | Low | In-memory `Map` for login attempts resets on Vercel serverless cold starts. Rate limiting is bypassable. |
| **Session cookie not signed** | Low | `SESSION_SECRET` env var is checked for existence but not used for HMAC signing. |
| **No slug utility** | Low | No `src/lib/utils/slug.ts` for slug generation/validation. |
| **GTM hardcoded in `app.html`** | Low | GTM container `GTM-MVSJHW58` is hardcoded in HTML shell instead of being dynamically injected from product or settings tracking config. |
| **FAQ section not rendered** | Low | Product JSON contains FAQ data. Classic template does not render it. ARCHITECTURE.md implies FAQ should be visible on product pages. |
| **Home page has no brand bar or footer** | Low | ARCHITECTURE.md shows a top bar (from `brand.json`) and footer on the home page. Current implementation is bare. |
| **No `content/media.json`** | Low | ARCHITECTURE.md lists this as optional. Not needed until image upload is implemented. |

---

## Recommended Development Order

### Milestone 1 — Fix Critical Bugs (1-2 days)

Fix issues that break the draft/publish workflow and create dead links.

- [ ] Fix Tracking tab: bind fields to `editState.meta.tracking` instead of `product.meta.tracking`
- [ ] Fix Scripts tab: bind fields to `editState.meta.advanced` instead of `product.meta.advanced`
- [ ] Fix Template select: bind to `editState.template` instead of `product.template` (or handle separately)
- [ ] Create `/admin/products/new` route (product creation page)
- [ ] Add `beforeunload` warning when editor has unsaved changes

### Milestone 2 — Complete Product Editor (3-5 days)

Fill in the empty editor tabs and add missing fields.

- [ ] Build Gallery tab: image list, add/remove, alt text editing, preview
- [ ] Build Offers tab: visual preview of how offers render
- [ ] Add `isPopular` checkbox to Pricing tab
- [ ] Add offer add/remove buttons to Pricing tab
- [ ] Add Order Settings group to General tab (SKU, Google Sheets URL, Phone Confirmation, WhatsApp)
- [ ] Add slug field to General tab (auto-generated, editable)
- [ ] Add OG Image preview to SEO tab
- [ ] Populate template dropdown from registry instead of hardcoding

### Milestone 3 — Extract Components (2-3 days)

Refactor inlined code into reusable components per ARCHITECTURE.md §4.

- [ ] Extract admin editor tabs into `src/lib/components/admin/editor/*.svelte` (8 components)
- [ ] Extract `ProductEditor.svelte` wrapper component
- [ ] Extract `ProductCard.svelte` for admin product list
- [ ] Extract `Sidebar.svelte` from admin layout
- [ ] Extract `ImageUploader.svelte` component
- [ ] Extract landing page components: `ProductHero`, `ImageGallery`, `OfferCards`, `OrderForm`, `StickyCTA`, `PageFooter` from Classic template

### Milestone 4 — Dynamic Templates (2-3 days)

Implement the template system as specified.

- [ ] Implement dynamic template loading in `src/routes/[slug]/+page.svelte` (replace hardcoded ClassicTemplate import)
- [ ] Build Modern template (`src/lib/components/templates/modern/Template.svelte`)
- [ ] Build Minimal template (`src/lib/components/templates/minimal/Template.svelte`)
- [ ] Add FAQ section rendering to Classic template
- [ ] Ensure all templates receive `{ product, settings }` props

### Milestone 5 — Content Validation & Utilities (1-2 days)

Add the validation layer and missing utilities.

- [ ] Implement Zod schemas from ARCHITECTURE.md Appendix B
- [ ] Add server-side validation to all write API endpoints
- [ ] Create `src/lib/utils/slug.ts` (slug generation & validation)
- [ ] Add slug uniqueness check on product create/update
- [ ] Create `src/lib/services/cloudinary.ts` (image upload helper)
- [ ] Create `ImageUploader.svelte` component using Cloudinary

### Milestone 6 — Public Website Polish (1-2 days)

Improve the public-facing pages.

- [ ] Add brand top bar to home page (from `brand.json`)
- [ ] Add footer to home page
- [ ] Create reusable product card component
- [ ] Add FAQ section to Classic template (accordion)
- [ ] Render FAQ data from product JSON
- [ ] Inject per-product tracking scripts dynamically (not just GTM in `app.html`)

### Milestone 7 — Admin Dashboard & UX (1-2 days)

Complete the admin experience.

- [ ] Compute dynamic dashboard stats from `_index.json`
- [ ] Add recent activity feed to dashboard
- [ ] Add search input to product list
- [ ] Add status filter dropdown to product list
- [ ] Add sort controls to product list
- [ ] Implement product preview route (`/admin/products/[slug]/preview`)

### Milestone 8 — Security & Production Hardening (1 day)

Address security and reliability.

- [ ] Implement session cookie HMAC signing with `SESSION_SECRET`
- [ ] Persist rate limiter state (or accept cold-start limitation)
- [ ] Add GitHub API error handling with exponential backoff
- [ ] Add `SESSION_SECRET` env var to Vercel config documentation
- [ ] Ensure `ADMIN_PASSWORD_HASH` is in Vercel env vars, not in `brand.json`

---

## Final Assessment

| Metric | Estimate |
|---|---|
| **Completion Percentage** | ~55% |
| **Estimated Remaining Work** | 12-19 days for a single developer |
| **Biggest Risks** | (1) Tracking/Scripts fields bypassing draft workflow could cause data corruption if a save overwrites published data. (2) Missing product creation route is a dead link. (3) No content validation means bad data can be written to Git. |
| **Should Priorities Change?** | Yes. **Milestone 1 (bug fixes) should be done immediately** — the draft workflow bypass in Tracking/Scripts/Template is a data integrity risk. The dead `/admin/products/new` link blocks core functionality. After that, Milestone 2 (completing the editor) provides the most value. Component extraction (Milestone 3) can be deferred — it's architectural cleanliness, not functionality. |
