# CMS Interactive Elements Audit Report

**Date:** 2026-07-20
**Scope:** All clickable elements across Login, Dashboard, Products, Create Product, Edit Product, Settings pages
**Auditor:** Automated code review + manual trace analysis

---

## Executive Summary

**Total interactive elements audited:** 62
**Issues found:** 4
**Issues fixed:** 4
**Remaining issues:** 0

| Severity | Found | Fixed |
|----------|-------|-------|
| High     | 2     | 2     |
| Low      | 2     | 2     |

---

## Page-by-Page Audit

### Login (`/admin/login`)

| Element | Type | Handler | Status |
|---------|------|---------|--------|
| Password input | `<input>` | `bind:value={password}` | OK |
| Submit button | `<button type="submit">` | `handleLogin()` via form `onsubmit` | OK |
| Loading state | Button text | Toggles "جاري تسجيل الدخول..." / "تسجيل الدخول" | OK |
| Error display | `<p>` | Conditional `{#if error}` | OK |

**API Flow:** `POST /api/auth/login` → bcrypt compare → session cookie → `goto('/admin')`
**Auth Guard:** `hooks.server.ts` redirects unauthenticated users to `/admin/login`

**Result:** All elements functional. No issues.

---

### Dashboard (`/admin`)

| Element | Type | Handler | Status |
|---------|------|---------|--------|
| "+ منتج جديد" link | `<a>` | `href="/admin/products/new"` | OK |
| "إدارة المنتجات" link | `<a>` | `href="/admin/products"` | OK |
| "الإعدادات" link | `<a>` | `href="/admin/settings"` | OK |

**Server Load:** `listProducts()` → computes total/published/drafts/archived stats

**Result:** All links navigate correctly. No issues.

---

### Admin Layout (`/admin/*`)

| Element | Type | Handler | Status |
|---------|------|---------|--------|
| "Alpha Vital CMS" brand link | `<a>` | `href="/admin"` | OK |
| "الموقع" link | `<a>` | `href="/"` | OK |
| "تسجيل الخروج" button | `<button>` | `handleLogout()` | OK |

**API Flow:** `POST /api/auth/logout` → clears session cookie → `goto('/admin/login')`

**Issues Found:**

#### Issue #1: Unused Import (Low)
- **Page:** Admin Layout (`+layout.svelte`)
- **Element:** Script import
- **Expected:** Only necessary imports present
- **Actual:** `import { page } from '$app/stores'` imported but never used
- **Root cause:** Dead code from removed feature
- **Fix applied:** Removed unused `page` import from `$app/stores`

---

### Products List (`/admin/products`)

| Element | Type | Handler | Status |
|---------|------|---------|--------|
| Search input | `<input>` | `bind:value={searchQuery}` | OK |
| Status filter select | `<select>` | `bind:value={statusFilter}` | OK |
| Sort select | `<select>` | `bind:value={sortBy}` | OK |
| "+ منتج جديد" link | `<a>` | `href="/admin/products/new"` | OK |
| "تعديل" link (per product) | `<a>` | `href="/admin/products/{slug}/edit"` | OK |
| "معاينة" link (per product) | `<a>` | `href="/admin/products/{slug}/preview"` | OK |
| "نشر" button (per product) | `<button>` | `handlePublish(slug)` | OK |
| "إلغاء النشر" button (per product) | `<button>` | `handleUnpublish(slug, title)` | OK |
| "حذف" button (per product) | `<button>` | `handleDelete(slug, title)` | OK |

**API Flows:**
- Publish: `POST /api/products/{slug}/status` with `{ action: 'publish' }` → reload
- Unpublish: `POST /api/products/{slug}/status` with `{ action: 'unpublish' }` → reload
- Delete: `DELETE /api/products/{slug}` → filter from local state

**Issues Found:**

#### Issue #2: Unused Import (Low)
- **Page:** Products list (`+page.server.ts`)
- **Element:** Script import
- **Expected:** Only necessary imports present
- **Actual:** `import { json } from '@sveltejs/kit'` imported but never used
- **Root cause:** Dead code from refactored endpoint
- **Fix applied:** Removed unused `json` import from `@sveltejs/kit`

---

### Create Product (`/admin/products/new`)

| Element | Type | Handler | Status |
|---------|------|---------|--------|
| Name input | `<input>` | `bind:value={name}` + `oninput={handleNameInput}` | OK |
| Slug input | `<input>` | `bind:value={slug}` + `oninput={handleSlugInput}` | OK |
| Template select | `<select>` | `bind:value={templateId}` | OK |
| Create button | `<button>` | `onclick={handleCreate}` | OK |
| Back link | `<a>` | `href="/admin/products"` | OK |

**Validation:** Client-side `validateRequired()`, `validateSlug()` + server-side Zod + business rules
**API Flow:** `POST /api/products/{slug}` → creates on draft branch → `goto(/admin/products/{slug}/edit)`

**Result:** All elements functional. No issues.

---

### Edit Product (`/admin/products/[slug]/edit`)

| Element | Type | Handler | Status |
|---------|------|---------|--------|
| Back link | `<a>` | `href="/admin/products"` | OK |
| Title input | `<input>` | `bind:value={editState.content.title}` + `oninput={handleTitleInput}` | OK |
| **Slug input** | `<input>` | `bind:value={slugValue}` + `oninput={handleSlugInput}` | **FIXED** |
| Subtitle input | `<input>` | `bind:value={editState.content.subtitle}` | OK |
| Rating input | `<input>` | `bind:value={editState.content.rating}` | OK |
| Review count input | `<input>` | `bind:value={editState.content.reviewCount}` | OK |
| Template select | `<select>` | `bind:value={template}` | OK |
| SKU input | `<input>` | `bind:value={editState.order.sku}` | OK |
| Google Sheets URL input | `<input>` | `bind:value={editState.order.googleSheetsUrl}` | OK |
| Phone confirmation checkbox | `<input type="checkbox">` | `bind:checked={editState.order.phoneConfirmation}` | OK |
| WhatsApp number input | `<input>` | `bind:value={editState.order.whatsappNumber}` | OK |
| Preview button | `<button>` | `handlePreview()` → `window.open()` | OK |
| Unpublish button | `<button>` | `handleUnpublish()` | OK |
| Save button | `<button>` | `handleSave()` | OK |
| Publish button | `<button>` | `handlePublish()` | OK |
| 9 tab buttons | `<button>` | `onclick={() => (activeTab = tab.id)}` | OK |
| "+ إضافة عرض" button | `<button>` | `addOffer()` | OK |
| Offer delete buttons | `<button>` | `removeOffer(i)` | OK |
| Offer field inputs (×6) | `<input>` | `bind:value` per field | OK |
| Popular checkbox | `<input type="checkbox">` | `bind:checked={offer.isPopular}` | OK |
| "+ إضافة صورة" button | `<button>` | `addGalleryImage()` | OK |
| Move up/down buttons | `<button>` | `moveGalleryImage(i, 'up'/'down')` | OK |
| Gallery delete buttons | `<button>` | `removeGalleryImage(i)` | OK |
| Gallery image URL inputs | `<input>` | `bind:value={image.src}` | OK |
| Gallery alt text inputs | `<input>` | `bind:value={image.alt}` | OK |
| SEO meta title input | `<input>` | `bind:value={editState.seo.metaTitle}` | OK |
| SEO meta description textarea | `<textarea>` | `bind:value={editState.seo.metaDescription}` | OK |
| SEO OG image input | `<input>` | `bind:value={editState.seo.ogImage}` | OK |
| Noindex checkbox | `<input type="checkbox">` | `bind:checked={editState.seo.noindex}` | OK |
| **GTM Container ID input** | `<input>` | `bind:value={editState.tracking.gtmContainerId}` | **FIXED** |
| **Facebook Pixel ID input** | `<input>` | `bind:value={editState.tracking.facebookPixelId}` | **FIXED** |
| **Google Ads Conversion ID input** | `<input>` | `bind:value={editState.tracking.googleAdsConversionId}` | **FIXED** |
| **Head scripts textarea** | `<textarea>` | `bind:value={editState.advanced.headScripts}` | **FIXED** |
| **Body scripts textarea** | `<textarea>` | `bind:value={editState.advanced.bodyScripts}` | **FIXED** |
| **Footer scripts textarea** | `<textarea>` | `bind:value={editState.advanced.footerScripts}` | **FIXED** |
| **Custom CSS textarea** | `<textarea>` | `bind:value={editState.advanced.customCss}` | **FIXED** |

**Issues Found:**

#### Issue #3: Slug Validation Error Never Displayed (High)
- **Page:** Edit Product (`edit/+page.svelte`)
- **Element:** Slug input error message (line ~398)
- **Expected:** Red border and error text shown when slug is invalid
- **Actual:** `slugError` state variable declared but never updated; template checked `slugError` while validation wrote to `validationErrors.slug`
- **Root cause:** State variable mismatch — `slugError` was a standalone `$state('')` that was never written to; the `validateField()` function writes to `validationErrors.slug`
- **Fix applied:**
  - Removed unused `slugError` state variable
  - Changed template to check `validationErrors.slug` for both red border class and error text display

#### Issue #4: Tracking/Scripts/Advanced Tab Changes Not Tracked as Dirty (High)
- **Page:** Edit Product (`edit/+page.svelte`)
- **Element:** Tracking tab (GTM, Facebook Pixel, Google Ads), Scripts tab (Head, Body, Footer), Advanced tab (Custom CSS)
- **Expected:** Changes to these fields should set `dirty = true`, triggering beforeunload warning and save button state
- **Actual:** Fields bound to `product.meta.tracking.*` and `product.meta.advanced.*` which are outside `editState`. The `$effect()` dirty tracker only watches `editState`, `template`, and `slugValue` — so changes to these fields did not set `dirty = true`
- **Root cause:** Meta fields (tracking/advanced) were bound directly to `product.meta` instead of being part of `editState`. The dirty tracking effect only monitors `editState` changes.
- **Fix applied:**
  - Added `tracking` and `advanced` fields to `editState` initialization (cloned from `product.meta`)
  - Changed all Tracking tab bindings from `product.meta.tracking.*` to `editState.tracking.*`
  - Changed all Scripts tab bindings from `product.meta.advanced.*` to `editState.advanced.*`
  - Changed Advanced tab binding from `product.meta.advanced.customCss` to `editState.advanced.customCss`
  - Updated `handleSave()` to merge `editState.tracking` and `editState.advanced` into `product.meta` before PUT
  - Updated `handlePublish()` to merge tracking/advanced into product.meta on publish
  - Updated post-publish `editState` reset to include tracking/advanced from the updated product

---

### Settings (`/admin/settings`)

| Element | Type | Handler | Status |
|---------|------|---------|--------|
| Save button | `<button>` | `handleSave()` | OK |
| Publish button | `<button>` | `handlePublish()` | OK |
| Brand name input | `<input>` | `bind:value={settings.brand.name}` + `onblur={validateField}` | OK |
| Tagline input | `<input>` | `bind:value={settings.brand.tagline}` + `onblur={validateField}` | OK |
| WhatsApp number input | `<input>` | `bind:value={settings.brand.whatsappNumber}` + `onblur={validateField}` | OK |
| Support hours input | `<input>` | `bind:value={settings.brand.supportHours}` + `onblur={validateField}` | OK |
| Currency input | `<input>` | `bind:value={settings.commerce.currency}` + `onblur={validateField}` | OK |
| Currency symbol input | `<input>` | `bind:value={settings.commerce.currencySymbol}` + `onblur={validateField}` | OK |
| Free shipping text input | `<input>` | `bind:value={settings.commerce.freeShippingText}` + `onblur={validateField}` | OK |
| Payment method input | `<input>` | `bind:value={settings.commerce.paymentMethod}` + `onblur={validateField}` | OK |
| GTM Container ID input | `<input>` | `bind:value={settings.tracking.gtmContainerId}` | OK |
| Site URL input | `<input>` | `bind:value={settings.tracking.siteUrl}` | OK |

**API Flows:**
- Save: `PUT /api/settings` → saves to draft branch
- Publish: `PUT /api/settings` (save) → `POST /api/settings/publish` (promotes draft to main)

**Result:** All elements functional. No issues.

---

### Preview (`/admin/products/[slug]/preview`)

| Element | Type | Handler | Status |
|---------|------|---------|--------|
| "Back to Editor" link | `<a>` | `href="/admin/products/{slug}/edit"` | OK |
| Template rendering | `<Template>` | Dynamic component via `loadTemplateComponentSync()` | OK |

**Server Load:** Reads draft (if exists) or published product + settings
**Result:** All elements functional. No issues.

---

## API Endpoints Verified

| Endpoint | Method | Auth | Validation | Status |
|----------|--------|------|------------|--------|
| `/api/auth/login` | POST | Rate limit (5/min/IP) | bcrypt compare | OK |
| `/api/auth/logout` | POST | None | Clears cookie | OK |
| `/api/products/{slug}` | GET | None (public) | None | OK |
| `/api/products/{slug}` | POST | Session cookie | Zod + business rules | OK |
| `/api/products/{slug}` | PUT | Session cookie | Zod + business rules | OK |
| `/api/products/{slug}` | DELETE | Session cookie | None | OK |
| `/api/products/{slug}/status` | POST | Session cookie | StatusActionSchema + validatePublish | OK |
| `/api/settings` | GET | None (public) | None | OK |
| `/api/settings` | PUT | Session cookie | GlobalSettingsSchema | OK |
| `/api/settings/publish` | POST | Session cookie | None | OK |

---

## Auth Flow Verified

1. **Login:** Password → `POST /api/auth/login` → bcrypt → session cookie (UUID, 7-day) → redirect to `/admin`
2. **Session check:** `hooks.server.ts` checks cookie on all `/admin/*` page routes and `/api/*` write operations
3. **Logout:** `POST /api/auth/logout` → delete cookie → redirect to `/admin/login`
4. **Rate limiting:** 5 attempts per minute per IP on login endpoint

---

## Files Modified

| File | Changes |
|------|---------|
| `src/routes/admin/products/[slug]/edit/+page.svelte` | Fixed slugError display bug; added tracking/advanced to editState; updated bindings; updated save/publish handlers |
| `src/routes/admin/products/+page.server.ts` | Removed unused `json` import |
| `src/routes/admin/+layout.svelte` | Removed unused `page` import |

---

## Verification

- `npm run check` passes with **0 errors** (68 pre-existing a11y warnings, not related to this audit)
- All fixes are minimal — only restoring missing functionality, no UI redesign or new features
