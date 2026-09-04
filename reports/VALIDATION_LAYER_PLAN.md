# Validation Layer Plan — Sprint 4

**Version:** 1.0  
**Date:** July 19, 2026  
**Status:** Planning Document — Ready for Implementation  

---

## Table of Contents

1. [Validation Architecture](#1-validation-architecture)
2. [Validation Boundaries](#2-validation-boundaries)
3. [Validation Schemas](#3-validation-schemas)
4. [Validation Rules](#4-validation-rules)
5. [Validation Strategy](#5-validation-strategy)
6. [Error Strategy](#6-error-strategy)
7. [Security Validation](#7-security-validation)
8. [Performance Strategy](#8-performance-strategy)
9. [Extensibility](#9-extensibility)
10. [Risks](#10-risks)
11. [Sprint 4 Implementation Plan](#11-sprint-4-implementation-plan)
12. [Final CTO Recommendation](#12-final-cto-recommendation)

---

## 1. Validation Architecture

### The Problem Today

The current codebase has **zero validation** on all API write endpoints. Every endpoint performs a direct cast:

```typescript
const product: Product = await request.json();
```

This means:
- A client can send any JSON shape and it will be written to the content layer
- There is no protection against malformed data, wrong types, or injection
- The only "validation" is the TypeScript type annotation, which is erased at runtime
- The `validateOrderForm` function exists for customer orders but has no server-side counterpart

### Where Validation Lives

The validation layer must live in a dedicated location, separate from both API routes and content utilities:

```
src/lib/
├── validation/
│   ├── index.ts              # Re-exports all schemas and helpers
│   ├── product.ts            # Product CRUD schemas
│   ├── settings.ts           # Settings schemas
│   ├── common.ts             # Shared field schemas (slug, url, string, etc.)
│   └── helpers.ts            # Validation result types, error formatting
```

### The Validation Pipeline

Every write operation must pass through this pipeline:

```
Admin UI
   │
   │  1. Client-side validation (immediate feedback)
   │     - Required fields
   │     - Format hints (slug regex, URL format)
   │     - Max lengths
   │
   ▼
API Route Handler
   │
   │  2. Parse request body
   │     - JSON.parse() in try/catch
   │     - Reject non-object payloads
   │
   │  3. Server-side validation (authoritative)
   │     - Full Zod schema validation
   │     - Business rules (slug uniqueness, template exists)
   │     - Strip unknown fields
   │
   │  4. Sanitization
   │     - Trim strings
   │     - Normalize slugs
   │     - Remove dangerous HTML/scripts from text fields
   │
   ▼
Content Layer (Git)
   │
   │  5. Write only validated, sanitized data
   │
   ▼
GitHub API
```

### Key Principle

**Client-side validation is UX. Server-side validation is security.** Both must exist, but the server is the source of truth. A malicious client can bypass all client-side checks.

---

## 2. Validation Boundaries

### Create Product (`POST /api/products/[slug]`)

| What | Must Validate |
|---|---|
| Request body | Must be a non-null object |
| `id` | Must be a string, format `prod_*` |
| `slug` | Required, valid format, **unique across all products** |
| `status` | Must be `'draft'` (new products are always draft) |
| `template` | Must be a valid template ID from registry |
| `createdAt` | Must be a valid ISO 8601 datetime |
| `updatedAt` | Must be a valid ISO 8601 datetime |
| `published` | Must match ProductPublishedSchema |
| `draft` | Must be `null` (new products have no draft) |
| `meta` | Must match ProductMetaSchema |
| Slug uniqueness | Must not match any existing product slug (main OR draft branch) |

### Save Draft (`PUT /api/products/[slug]`)

| What | Must Validate |
|---|---|
| Request body | Must be a non-null object |
| `slug` in URL | Must match a product that exists |
| `slug` in body | Must match URL param (or be a valid new slug if renaming) |
| All fields | Same as Create Product, but allows `draft` to be non-null |
| `draft` content | Must match ProductPublishedSchema (same shape as published) |
| `draft` vs `published` | If draft exists, it must be a complete valid product version |

### Publish Product (`POST /api/products/[slug]/status` with `action: 'publish'`)

| What | Must Validate |
|---|---|
| `action` | Must be `'publish'` or `'unpublish'` |
| Product existence | Product must exist on draft or main branch |
| Draft validity | If publishing, draft content must be valid |
| Template validity | Template must exist in registry |

### Update Settings (`PUT /api/settings`)

| What | Must Validate |
|---|---|
| Request body | Must be a non-null object |
| `brand.name` | Required, non-empty string |
| `brand.logo` | Valid URL (Cloudinary or external) |
| `brand.favicon` | Valid URL |
| `brand.whatsappNumber` | Valid Moroccan phone format |
| `brand.supportHours` | Non-empty string |
| `commerce.currency` | Must be from allowed list (MAD, USD, EUR) |
| `commerce.currencySymbol` | Non-empty string |
| `commerce.freeShippingText` | Non-empty string |
| `commerce.paymentMethod` | Non-empty string |
| `tracking.gtmContainerId` | Optional, valid GTM format if provided |
| `tracking.defaultOgImage` | Valid URL |
| `tracking.siteUrl` | Valid URL |

### Delete Product (`DELETE /api/products/[slug]`)

| What | Must Validate |
|---|---|
| Slug in URL | Must be a valid slug format |
| Product existence | Product must exist (graceful handling if not) |

### Future Media Uploads

| What | Must Validate |
|---|---|
| File type | Whitelist: jpg, png, webp, gif |
| File size | Max 5MB |
| Dimensions | Max 4000x4000 |
| Filename | Sanitize, no path traversal |

---

## 3. Validation Schemas

Every schema listed below corresponds to a Zod schema that will be defined in the validation layer.

### 3.1 Common Schemas (shared primitives)

| Schema | Responsibility |
|---|---|
| `SlugSchema` | Validates URL slugs: lowercase alphanumeric + hyphens, 1-100 chars |
| `UrlSchema` | Validates HTTP/HTTPS URLs, optional, allows empty string |
| `NonEmptyStringSchema` | Trims whitespace, requires length >= 1 |
| `PositiveNumberSchema` | Must be a number > 0 |
| `NonNegativeNumberSchema` | Must be a number >= 0 |
| `IsoDateTimeSchema` | Validates ISO 8601 datetime strings |
| `CurrencySchema` | Validates currency code (MAD, USD, EUR, etc.) |
| `GtmContainerIdSchema` | Validates GTM container ID format: `GTM-XXXXXXX` |
| `PhoneNumberSchema` | Validates Moroccan phone number format |
| `ColorHexSchema` | Validates CSS hex color (future use) |

### 3.2 Product Schemas

| Schema | Responsibility |
|---|---|
| `OfferSchema` | Validates a single pricing offer (id, title, price, quantity, badge) |
| `GalleryImageSchema` | Validates a gallery image entry (src, alt) |
| `FaqItemSchema` | Validates a FAQ entry (question, answer) |
| `ProductContentSchema` | Validates content section: title, subtitle, heroImage, rating, reviewCount, gallery[], faq[], footerText |
| `ProductPricingSchema` | Validates pricing section: currency, offers[] |
| `ProductOrderSchema` | Validates order section: sku, googleSheetsUrl, phoneConfirmation, whatsappNumber |
| `ProductSeoSchema` | Validates SEO section: metaTitle, metaDescription, ogImage, noindex |
| `ProductTrackingSchema` | Validates tracking section: gtmContainerId, facebookPixelId, googleAdsConversionId |
| `ProductAdvancedSchema` | Validates advanced section: customCss, headScripts, bodyScripts, footerScripts |
| `ProductChangelogSchema` | Validates changelog entries: action, timestamp |
| `ProductMetaSchema` | Validates meta section: tracking, advanced, changelog |
| `ProductPublishedSchema` | Validates the published content block: content, pricing, order, seo |
| `ProductDraftSchema` | Same as published, but nullable |
| `ProductSchema` | Full product validation: identity + published + draft + meta |
| `ProductCreateSchema` | Stricter variant for creation (id required, status must be 'draft', draft must be null) |
| `ProductUpdateSchema` | Variant for save (allows draft, validates slug matches URL param) |
| `ProductIndexItemSchema` | Validates an entry in `_index.json` |

### 3.3 Settings Schemas

| Schema | Responsibility |
|---|---|
| `BrandSettingsSchema` | Validates brand settings: name, tagline, logo, favicon, whatsappNumber, supportHours |
| `CommerceSettingsSchema` | Validates commerce settings: currency, currencySymbol, freeShippingText, paymentMethod |
| `TrackingSettingsSchema` | Validates tracking settings: gtmContainerId, defaultOgImage, siteUrl |
| `GlobalSettingsSchema` | Combines brand + commerce + tracking |

### 3.4 Template Schemas

| Schema | Responsibility |
|---|---|
| `TemplateRegistryItemSchema` | Validates a template entry: id, name, description, thumbnail, isDefault |
| `TemplateRegistrySchema` | Validates the full template registry array |

### 3.5 Auth Schemas

| Schema | Responsibility |
|---|---|
| `LoginRequestSchema` | Validates login payload: password (non-empty string, max 128 chars) |

---

## 4. Validation Rules

### 4.1 Slug

| Rule | Detail |
|---|---|
| Required | Yes — cannot be empty |
| Type | String |
| Format | Lowercase alphanumeric + hyphens only |
| Regex | `^[a-z0-9]+(-[a-z0-9]+)*$` |
| Min length | 1 character |
| Max length | 100 characters |
| Unique | Yes — must not match any existing product slug (check both branches) |
| Reserved words | `admin`, `api`, `settings`, `login`, `thank-you`, `preview` |
| Editable | Yes — slug can change after creation |
| On rename | Must update URL, validate new slug is unique, old product file must be updated |

### 4.2 Title (Product Name)

| Rule | Detail |
|---|---|
| Required | Yes |
| Type | String |
| Min length | 1 character |
| Max length | 200 characters |
| Trim | Yes — leading/trailing whitespace removed |
| Allowed characters | Any (supports Arabic, English, numbers, emojis) |
| HTML | Must be plain text — no HTML tags allowed |

### 4.3 Subtitle

| Rule | Detail |
|---|---|
| Required | No (can be empty string) |
| Type | String |
| Max length | 500 characters |
| Trim | Yes |
| HTML | Plain text only |

### 4.4 Hero Image

| Rule | Detail |
|---|---|
| Required | No (can be empty string during draft) |
| Type | String |
| Format | Valid HTTP/HTTPS URL if non-empty |
| Allowed domains | Any (Cloudinary preferred, external allowed) |
| Publish-time requirement | Must be non-empty URL when publishing |

### 4.5 Gallery Images

| Rule | Detail |
|---|---|
| Required | No (can be empty array) |
| Type | Array of objects |
| Max items | 20 |
| Each item `src` | Valid HTTP/HTTPS URL |
| Each item `alt` | String, max 200 characters |
| Duplicate URLs | Allowed (but warned) |

### 4.6 Rating

| Rule | Detail |
|---|---|
| Required | Yes |
| Type | Number |
| Min | 1 |
| Max | 5 |
| Step | 0.1 |
| Default | 5 |

### 4.7 Review Count

| Rule | Detail |
|---|---|
| Required | Yes |
| Type | Number |
| Min | 0 |
| Max | 999,999 |
| Integer | Yes |

### 4.8 Offers

| Rule | Detail |
|---|---|
| Required | At least 1 offer required for publish |
| Type | Array of objects |
| Max items | 10 |
| Each `id` | Positive integer, unique within product |
| Each `title` | Required, non-empty string, max 100 chars |
| Each `subtitle` | String, max 200 chars |
| Each `price` | Positive number, > 0 |
| Each `originalPrice` | Positive number, >= price |
| Each `quantity` | Positive integer, >= 1 |
| Each `badge` | String or null, max 50 chars |
| Each `isPopular` | Boolean |

### 4.9 Pricing Currency

| Rule | Detail |
|---|---|
| Required | Yes |
| Allowed values | `'MAD'`, `'USD'`, `'EUR'`, `'GBP'`, `'SAR'`, `'AED'` |
| Default | `'MAD'` |

### 4.10 Order Section

| Rule | Detail |
|---|---|
| `sku` | Required, non-empty, max 50 chars, alphanumeric + hyphens |
| `googleSheetsUrl` | Required for publish, valid HTTPS URL |
| `phoneConfirmation` | Boolean, required |
| `whatsappNumber` | Required for publish, valid Moroccan phone format |

### 4.11 SEO Section

| Rule | Detail |
|---|---|
| `metaTitle` | Required, max 60 characters |
| `metaDescription` | Required, max 160 characters |
| `ogImage` | Optional, valid URL if provided |
| `noindex` | Boolean, required |

### 4.12 Tracking Section

| Rule | Detail |
|---|---|
| `gtmContainerId` | Optional, format `GTM-XXXXXXX` if provided |
| `facebookPixelId` | Optional, numeric string if provided |
| `googleAdsConversionId` | Optional, numeric string if provided |

### 4.13 Scripts / Advanced Section

| Rule | Detail |
|---|---|
| `customCss` | Optional, max 50,000 characters |
| `headScripts` | Optional, max 50,000 characters |
| `bodyScripts` | Optional, max 50,000 characters |
| `footerScripts` | Optional, max 50,000 characters |
| Content | Must not contain `<script>` tags (for safety) |

### 4.14 Template ID

| Rule | Detail |
|---|---|
| Required | Yes |
| Type | String |
| Must exist | Template ID must be found in `content/templates/registry.json` |
| On change | Validate new template exists before allowing switch |

### 4.15 Status

| Rule | Detail |
|---|---|
| Allowed values | `'draft'`, `'published'`, `'archived'` |
| Create | Must be `'draft'` |
| Publish | Sets to `'published'` |
| Unpublish | Sets to `'draft'` |

### 4.16 Dates

| Rule | Detail |
|---|---|
| `createdAt` | ISO 8601 datetime, immutable after creation |
| `updatedAt` | ISO 8601 datetime, updated on every save |
| Format | `YYYY-MM-DDTHH:mm:ss.sssZ` |

### 4.17 Settings Fields

| Field | Rules |
|---|---|
| `brand.name` | Required, non-empty, max 100 chars |
| `brand.tagline` | Required, max 200 chars |
| `brand.logo` | Required, valid URL |
| `brand.favicon` | Required, valid URL |
| `brand.whatsappNumber` | Required, valid Moroccan phone |
| `brand.supportHours` | Required, max 50 chars |
| `commerce.currency` | Required, from allowed list |
| `commerce.currencySymbol` | Required, max 5 chars |
| `commerce.freeShippingText` | Required, max 100 chars |
| `commerce.paymentMethod` | Required, max 100 chars |
| `tracking.gtmContainerId` | Optional, GTM format if provided |
| `tracking.defaultOgImage` | Required, valid URL |
| `tracking.siteUrl` | Required, valid URL |

---

## 5. Validation Strategy

### Client-Side Validation

**Purpose:** Immediate UX feedback. Not security.

| Validation | Where |
|---|---|
| Required fields | All forms — show inline error on blur |
| Slug format | New product form, editor slug field |
| Title max length | Editor title input |
| SEO char counts | SEO tab — live character counters |
| Number ranges | Rating (1-5), review count (0+), prices (0+) |
| URL format | Hero image, gallery images, OG image |
| Offer validation | Pricing tab — inline errors per offer |
| Phone format | WhatsApp number field |

**Implementation:** Lightweight validation functions in `src/lib/utils/validation.ts` that mirror the Zod rules but without importing Zod on the client.

### Server-Side Validation

**Purpose:** Authoritative. Security. Data integrity.

| Validation | Where |
|---|---|
| Full schema validation | Every API write endpoint — Zod parse |
| Slug uniqueness | Create product, rename slug |
| Template existence | Create product, change template |
| Business rules | Publish requires draft validity, minimum offers |
| JSON parsing | Every endpoint — try/catch with 400 response |
| Field stripping | Remove unexpected fields via Zod `.strip()` |

**Implementation:** Zod schemas in `src/lib/validation/` imported by API route handlers.

### Both

Some validations exist at both layers for different reasons:

| Validation | Client reason | Server reason |
|---|---|---|
| Required fields | Instant feedback | Prevent empty writes |
| Slug format | Help user type correctly | Prevent invalid URLs |
| URL format | Show error before save | Prevent broken images |
| Number ranges | Slider/input constraints | Prevent nonsensical values |

---

## 6. Error Strategy

### HTTP Status Codes

| Code | When |
|---|---|
| `400 Bad Request` | Validation failure — malformed or invalid data |
| `401 Unauthorized` | Missing or invalid session cookie |
| `404 Not Found` | Product or resource not found |
| `409 Conflict` | Slug already exists (create) or concurrent edit |
| `422 Unprocessable Entity` | Valid JSON but semantically invalid (e.g., publish without draft) |
| `429 Too Many Requests` | Rate limit exceeded (login, future API abuse) |
| `500 Internal Server Error` | Unexpected server error (GitHub API failure, etc.) |

### Validation Response Format

Every validation error returns a consistent JSON structure:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "published.content.title",
      "code": "REQUIRED",
      "message": "Title is required"
    },
    {
      "field": "slug",
      "code": "INVALID_FORMAT",
      "message": "Slug must contain only lowercase letters, numbers, and hyphens"
    }
  ]
}
```

### Error Object Structure

| Field | Type | Description |
|---|---|---|
| `error` | string | Human-readable summary (English — for developer) |
| `code` | string | Machine-readable error code |
| `details` | array | Array of field-level errors |
| `details[].field` | string | Dot-notation path to the invalid field |
| `details[].code` | string | Error code for this specific field |
| `details[].message` | string | Arabic message for admin UI display |

### Error Codes

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | General validation failure |
| `REQUIRED` | Field is required but missing/empty |
| `INVALID_FORMAT` | Field value doesn't match expected format |
| `TOO_SHORT` | Value below minimum length |
| `TOO_LONG` | Value exceeds maximum length |
| `INVALID_URL` | Not a valid HTTP/HTTPS URL |
| `INVALID_PHONE` | Not a valid Moroccan phone number |
| `INVALID_GTM` | Not a valid GTM container ID |
| `INVALID_SLUG` | Slug format is invalid |
| `SLUG_TAKEN` | Slug already exists on another product |
| `TEMPLATE_NOT_FOUND` | Template ID doesn't exist in registry |
| `PRODUCT_NOT_FOUND` | Product with given slug doesn't exist |
| `ALREADY_PUBLISHED` | Product is already in published state |
| `ALREADY_DRAFT` | Product is already in draft state |
| `NO_DRAFT` | Cannot publish — no draft content exists |
| `MIN_OFFERS` | At least one offer is required for publish |
| `INVALID_JSON` | Request body is not valid JSON |
| `PAYLOAD_TOO_LARGE` | Request body exceeds size limit |
| `UNEXPECTED_FIELD` | Unknown field in request body |

### Arabic Admin Messages

| Code | Arabic Message |
|---|---|
| `REQUIRED` | هذا الحقل مطلوب |
| `INVALID_FORMAT` | التنسيق غير صحيح |
| `TOO_SHORT` | النص قصير جداً |
| `TOO_LONG` | النص طويل جداً |
| `INVALID_URL` | رابط غير صالح |
| `INVALID_PHONE` | رقم الهاتف غير صحيح |
| `INVALID_SLUG` | الرابط غير صالح |
| `SLUG_TAKEN` | هذا الرابط مستخدم بالفعل |
| `TEMPLATE_NOT_FOUND` | القالب غير موجود |
| `PRODUCT_NOT_FOUND` | المنتج غير موجود |
| `NO_DRAFT` | لا توجد تغييرات للنشر |
| `MIN_OFFERS` | يجب إضافة عرض واحد على الأقل |
| `INVALID_JSON` | بيانات غير صالحة |

### Developer Messages

English messages are included in the `error` field for logging and debugging. Arabic messages are in `details[].message` for UI display.

---

## 7. Security Validation

### Malformed JSON

**Risk:** Request body is not valid JSON.  
**Protection:** Wrap `request.json()` in try/catch. Return 400 on parse failure.

### Empty Objects

**Risk:** Client sends `{}` or `{ "slug": "" }`.  
**Protection:** Zod schemas require all mandatory fields. `.strict()` mode rejects empty objects for product creation.

### Unexpected Fields

**Risk:** Client sends extra fields like `{ "isAdmin": true }` or `{ "status": "published" }` to bypass draft workflow.  
**Protection:** Use Zod `.strip()` to remove unknown fields. For creation/update, use `.strict()` mode to reject unexpected fields.

### Wrong Data Types

**Risk:** Client sends `"rating": "five"` instead of `"rating": 5`.  
**Protection:** Zod type checking. Every field has an explicit type. Coercion disabled — reject rather than coerce.

### Extremely Long Strings

**Risk:** Client sends a 10MB title or 100MB custom CSS to cause memory issues or GitHub API failures.  
**Protection:** Every string field has a `.max()` limit. Request body size limit (1MB) at the API level.

### Invalid URLs

**Risk:** Client sends `javascript:alert(1)` or `data:text/html,...` as image URLs.  
**Protection:** URL fields must match `https?://` protocol. Reject `javascript:`, `data:`, `file:`, and other non-HTTP protocols.

### Script Injection

**Risk:** Client injects `<script>alert(1)</script>` into title, subtitle, alt text, or footer text.  
**Protection:**
- Text fields (title, subtitle, alt, etc.): Strip HTML tags using a simple regex or DOMPurify. Reject if HTML detected.
- Code fields (customCss, scripts): These intentionally allow code. The protection here is that these fields are only rendered in the admin preview, not in user-facing HTML without proper CSP headers.
- Gallery alt text: Plain text only, no HTML.

### HTML Injection

**Risk:** Client injects `<img onerror="...">` into image URLs or alt text.  
**Protection:** URL validation (must be http/https). Alt text validation (plain text, no angle brackets).

### Duplicate Slugs

**Risk:** Two products with the same slug — causes routing conflicts.  
**Protection:** On create, check `_index.json` on both main and draft branches. On slug rename, check uniqueness. Return 409 Conflict if taken.

### Invalid Template IDs

**Risk:** Client sets template to a non-existent ID, causing import failure on the public page.  
**Protection:** Read `content/templates/registry.json` and validate the template ID exists. Return 400 if not found.

### Future API Abuse

**Risk:** Automated scripts spamming the API.  
**Protection:** 
- Rate limiting on login (already exists)
- Future: Rate limiting on write endpoints (per-session)
- Request body size limits
- Input length limits prevent resource exhaustion

---

## 8. Performance Strategy

### Validation Order

The validation pipeline must be ordered to minimize wasted computation:

```
1. JSON parse          (fast — reject malformed early)
2. Request size check  (fast — reject oversized payloads)
3. Schema validation   (fast — Zod validates in <1ms)
4. Business rules      (moderate — may require DB/Git reads)
5. Sanitization        (fast — string operations)
6. Write to Git        (slow — GitHub API call)
```

**Key insight:** Schema validation (step 3) is pure computation and takes <1ms. Business rules (step 4) require reading from Git (network call). Always validate schema first.

### Avoid Unnecessary GitHub API Calls

| Current Problem | Solution |
|---|---|
| Slug uniqueness requires reading `_index.json` | Cache the index in memory for the duration of the request |
| Template validation requires reading `registry.json` | Cache registry in a module-level variable, refresh every 5 minutes |
| Every publish reads draft + writes main | Validate draft before the read, fail fast |

### Avoid Duplicate Validation

- The content layer (`products.ts`, `settings.ts`) should NOT re-validate what the API already validated
- The API routes are the single validation boundary
- Content utilities trust their inputs (they receive already-validated data)

### Zod Performance

- Zod v4 is optimized for server-side validation
- Schema compilation is cached automatically
- `.parse()` is synchronous for simple schemas — no async overhead
- `.safeParse()` returns a result object without throwing — faster error handling

---

## 9. Extensibility

### Future Templates

Adding a new template (modern, minimal) requires:
- New template component (Svelte)
- New entry in `registry.json`
- **No changes to validation** — `TemplateIdSchema` already validates against the dynamic registry

### Media Library

When media uploads are added:
- New `MediaItemSchema` for uploaded files
- New validation rules for file type, size, dimensions
- Existing URL validation for heroImage and gallery already supports Cloudinary URLs
- The `GalleryImageSchema` is designed to accept both URL strings and media library references

### Orders

When order management is added:
- New `OrderSchema` for incoming order data
- Server-side phone validation (mirrors `isValidMoroccanPhone`)
- Status validation (pending, confirmed, shipped, delivered)
- No changes to product validation needed

### Analytics

When analytics are added:
- `AnalyticsEventSchema` for tracking events
- No impact on product/settings validation

### A/B Testing

When A/B testing is added:
- New `VariantSchema` for test variants
- `ProductSchema` would gain an optional `variants` field
- The existing `.strip()` behavior allows backward compatibility — old products without variants validate fine

### Multi-Language

When multi-language is added:
- `LocaleSchema` for language codes (ar, fr, en)
- Content schemas would gain optional `translations` fields
- The existing `.optional()` pattern handles missing translations gracefully

**Key design decision:** All schemas use `.strip()` and `.optional()` generously. This means:
- Old data without new fields validates successfully
- New fields are optional until required
- No breaking changes when extending schemas

---

## 10. Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Zod v4 API differences from v3 | Schema syntax may differ | Medium | Check Zod v4 docs, use `.parse()` not `.parseAsync()` for sync schemas |
| Breaking existing data | Current alpha-vital.json might fail new validation | Low | Test all schemas against existing content files before deploying |
| Slug rename complexity | Renaming slug requires file rename + index update + redirect | Medium | Implement slug rename as a separate, well-tested operation |
| Template registry read failure | If registry.json is missing or corrupt, template validation fails | Low | Default to rejecting invalid template IDs, provide clear error |
| Performance regression | Validation adds latency to every write | Low | Zod validation is <1ms; Git calls are the bottleneck (already present) |
| Admin UX degradation | Too many validation errors shown at once | Medium | Show first error per field, provide clear fix suggestions |
| Script field false positives | Legitimate `<script>` in custom scripts flagged as injection | High | Only validate script fields for max length, not content — they're intentionally code |
| Overly strict publish rules | Admin can't publish because of minor issues | Medium | Allow publish with warnings (draft-only fields), block only critical issues |
| Race condition on slug uniqueness | Two creates with same slug simultaneously | Low | Single-owner system, no concurrent editing expected |
| Zod bundle size | Zod adds to client bundle if imported in Svelte components | Medium | Keep Zod server-only; client validation uses plain functions |

---

## 11. Sprint 4 Implementation Plan

### Phase 1: Foundation

**Goal:** Create the validation infrastructure that all other phases build on.

| Step | Detail |
|---|---|
| 1.1 | Create `src/lib/validation/common.ts` — shared field schemas |
| 1.2 | Create `src/lib/validation/helpers.ts` — error formatting, result types |
| 1.3 | Create `src/lib/validation/index.ts` — barrel exports |
| 1.4 | Write tests against existing `alpha-vital.json` content |

**Files affected:**
- `src/lib/validation/common.ts` (new)
- `src/lib/validation/helpers.ts` (new)
- `src/lib/validation/index.ts` (new)

**Dependencies:** None  
**Risk:** Low  
**Verification:** Schemas validate the existing `alpha-vital.json` product successfully

---

### Phase 2: Product Validation

**Goal:** All product schemas defined and tested.

| Step | Detail |
|---|---|
| 2.1 | Create `src/lib/validation/product.ts` |
| 2.2 | Define `OfferSchema`, `GalleryImageSchema`, `FaqItemSchema` |
| 2.3 | Define `ProductContentSchema`, `ProductPricingSchema`, `ProductOrderSchema`, `ProductSeoSchema` |
| 2.4 | Define `ProductTrackingSchema`, `ProductAdvancedSchema` |
| 2.5 | Define `ProductMetaSchema`, `ProductPublishedSchema`, `ProductDraftSchema` |
| 2.6 | Define `ProductSchema` (full), `ProductCreateSchema`, `ProductUpdateSchema` |
| 2.7 | Test against existing content files |

**Files affected:**
- `src/lib/validation/product.ts` (new)

**Dependencies:** Phase 1  
**Risk:** Medium — must match existing TypeScript interfaces exactly  
**Verification:** `ProductSchema.parse(existingAlphaVitalProduct)` succeeds

---

### Phase 3: Settings Validation

**Goal:** Settings schemas defined and tested.

| Step | Detail |
|---|---|
| 3.1 | Create `src/lib/validation/settings.ts` |
| 3.2 | Define `BrandSettingsSchema`, `CommerceSettingsSchema`, `TrackingSettingsSchema` |
| 3.3 | Define `GlobalSettingsSchema` |
| 3.4 | Test against existing settings files |

**Files affected:**
- `src/lib/validation/settings.ts` (new)

**Dependencies:** Phase 1  
**Risk:** Low  
**Verification:** Schemas validate existing brand.json, commerce.json, tracking.json

---

### Phase 4: API Integration

**Goal:** Wire validation into all API write endpoints.

| Step | Detail |
|---|---|
| 4.1 | Update `POST /api/products/[slug]` — validate with `ProductCreateSchema` |
| 4.2 | Update `PUT /api/products/[slug]` — validate with `ProductUpdateSchema` |
| 4.3 | Update `POST /api/products/[slug]/status` — validate action field |
| 4.4 | Update `PUT /api/settings` — validate with `GlobalSettingsSchema` |
| 4.5 | Update `POST /api/auth/login` — validate password format |
| 4.6 | Add JSON parse error handling to all endpoints |
| 4.7 | Add consistent error response format |

**Files affected:**
- `src/routes/api/products/[slug]/+server.ts` (modified)
- `src/routes/api/products/[slug]/status/+server.ts` (modified)
- `src/routes/api/settings/+server.ts` (modified)
- `src/routes/api/auth/login/+server.ts` (modified)

**Dependencies:** Phases 2, 3  
**Risk:** Medium — must not break existing functionality  
**Verification:** All existing API calls still work; invalid data is rejected with proper errors

---

### Phase 5: Client-Side Validation

**Goal:** Immediate feedback in admin forms.

| Step | Detail |
|---|---|
| 5.1 | Add validation utils to `src/lib/utils/validation.ts` (extend existing) |
| 5.2 | Add inline validation to new product form |
| 5.3 | Add inline validation to product editor (General, Pricing, SEO tabs) |
| 5.4 | Add validation to settings page |
| 5.5 | Show server validation errors in UI (parse error response, display inline) |

**Files affected:**
- `src/lib/utils/validation.ts` (modified)
- `src/routes/admin/products/new/+page.svelte` (modified)
- `src/routes/admin/products/[slug]/edit/+page.svelte` (modified)
- `src/routes/admin/settings/+page.svelte` (modified)

**Dependencies:** Phase 4 (for consistent error format)  
**Risk:** Low  
**Verification:** Forms show inline errors on invalid input; server errors display in UI

---

### Phase 6: Business Rules

**Goal:** Implement slug uniqueness and template existence checks.

| Step | Detail |
|---|---|
| 6.1 | Add slug uniqueness check to product create |
| 6.2 | Add slug uniqueness check to slug rename |
| 6.3 | Add template existence check to create and template change |
| 6.4 | Add publish validation (draft must exist, offers required) |
| 6.5 | Cache template registry in module-level variable |

**Files affected:**
- `src/routes/api/products/[slug]/+server.ts` (modified)
- `src/routes/api/products/[slug]/status/+server.ts` (modified)
- `src/lib/content/products.ts` (possibly — for slug check helper)

**Dependencies:** Phase 4  
**Risk:** Medium — requires Git reads for business rules  
**Verification:** Duplicate slug rejected; invalid template rejected; publish without draft rejected

---

### Phase 7: Testing & Verification

**Goal:** Comprehensive verification of the validation layer.

| Step | Detail |
|---|---|
| 7.1 | Test all schemas against existing content (should pass) |
| 7.2 | Test all API endpoints with valid data (should succeed) |
| 7.3 | Test all API endpoints with invalid data (should reject with proper errors) |
| 7.4 | Run `svelte-check` — zero errors |
| 7.5 | Manual test: create product, edit, publish, unpublish, delete |
| 7.6 | Manual test: invalid data in all forms |
| 7.7 | Generate SPRINT_4_REPORT.md |

**Files affected:** None (verification only)  
**Dependencies:** All previous phases  
**Risk:** Low  
**Verification:** All tests pass, zero TypeScript errors, all manual tests pass

---

## 12. Final CTO Recommendation

### Is the project ready to implement the Validation Layer now?

**Yes.**

### Why

1. **Sprint 1-3 are complete.** The content layer, admin panel, product CRUD, dashboard, product list, preview, and navigation are all functional. The system can create, edit, save, publish, unpublish, and delete products.

2. **Zod is already installed** (v4.4.3 in `package.json`). No dependency changes needed.

3. **The existing TypeScript interfaces** (`src/lib/types/product.ts`, `settings.ts`, `templates.ts`) provide the exact shape that Zod schemas must match. The schemas can be derived directly from these interfaces.

4. **The API endpoints are clean and simple.** There are only 5 write endpoints to validate: create product, save draft, publish/unpublish, update settings, and login. Each is a single handler function.

5. **No existing validation to conflict with.** The only validation in the codebase is `validateOrderForm` for customer orders, which is unrelated to admin content validation.

6. **The risk of introducing validation now is low.** Adding validation is additive — it wraps existing handlers without changing their core logic. If validation is too strict, it can be loosened. If too lenient, it can be tightened.

### What to Watch For

1. **Don't over-validate on the client.** Keep client validation lightweight and focused on UX. Server validation is the authority.

2. **Test against existing content first.** Before writing any new validation, verify that `alpha-vital.json` and all settings files pass the new schemas. If they don't, adjust the schemas — not the content.

3. **Keep the error format consistent.** The error response structure defined in Section 6 must be used everywhere. This is what the admin UI will parse.

4. **Don't block publish for minor issues.** A product with an empty subtitle should still be publishable. Only critical issues (no title, no offers, no hero image) should block publishing.

5. **The script fields are special.** `headScripts`, `bodyScripts`, `footerScripts`, and `customCss` intentionally allow code. Don't sanitize these fields — only validate their length.

---

*End of Validation Layer Plan — Version 1.0*
