# Targeted Multi-Layer Frontend/Data Audit — 2026-07-21

## A. Diagnosis table

| Symptom | Root cause (file:line) | Layer | Evidence | Confidence |
|---------|----------------------|-------|----------|------------|
| **S1** DataCloneError | `src/routes/admin/products/[slug]/edit/+page.svelte:14` — `structuredClone(product.draft)` where `product` is a `$state` Proxy (line 9). `structuredClone` throws on Svelte 5 reactive Proxies per HTML spec. | L4 (UI rendering) → L2 fallout | `product = $state(data.product)` at L9 creates a deep Proxy; `structuredClone(product.draft)` at L14 receives that Proxy → `DataCloneError: #<Object> could not be cloned`. Stack trace ends in Svelte 5 runtime (`_i.ensure`). | **Confirmed** |
| **S2** Blank pages | Edit: direct crash from S1. Preview/public product: same root cause — `data` prop arrives as plain object, but `$props()` in Svelte 5 can deep-proxy complex objects for reactivity; combined with the explicit `structuredClone` also at `edit/+page.svelte:14`, the uncaught exception kills ALL client JS → any SPA navigation fails; even direct navigation may crash. | L4 → L5 cascade | Edit page hydration throws → client JS dead → preview/product-page content zone stays empty because component initialization aborted. The layout (navbar/banner) renders from server HTML. | **Confirmed for edit; inferred for preview/public** |
| **S3** Dead buttons/nav | Consequence of S1. `onclick` handlers never register because client JS dies during hydration. `<a>` links fall back to native browser navigation. | L5 (Navigation) | All `onclick={...}` in `edit/+page.svelte` (Preview, Save, Publish, Unpublish, tab switches) and admin-layout logout button stop working. `goto()` never runs. | **Confirmed** (consequence of S1) |
| **S4** Mojibake | **Data at rest in GitHub is already corrupted.** `content/products/alpha-vital.json:12` — `"subtitle": "Ø¹ÙØ§Ø¬ Ø§ÙØ£Ø±Ù ÙØ§ÙØªÙØªØ±"` (Arabic UTF-8 bytes misread as Latin-1). ALL Arabic text fields in that file are similarly corrupted (lines 12, 18, 51-52, 55-56, 59, 66-67, 77, 81, 87, 91, 103-104). `git.ts` decode (`Buffer.from(x,'base64').toString('utf8')`) is correct; the file source is already wrong. | L6 (Stored data) | `checkBrandForSensitiveFields` in `settings.ts` only warns. The `_index.json` mirrors the same mojibake (line 6). `commerce.json` (line 4-5) has CORRECT Arabic → confirms decode path works. Corruption predates the Svelte app. | **Confirmed** |

## B. The meeting point

**TOP-DOWN trace:**
1. `DataCloneError` in console → Svelte 5 runtime (`_i.ensure`) → component render/hydration → `data` prop arrives from SvelteKit
2. `edit/+page.svelte:9` `let product = $state(data.product)` wraps the product in a Svelte 5 reactive Proxy
3. `edit/+page.svelte:14` `structuredClone(product.draft)` passes the Proxy to `structuredClone` → **throws DataCloneError**

**BOTTOM-UP trace:**
1. `git.ts:89` `Buffer.from(data.content, 'base64').toString('utf8')` returns clean UTF-8 string → `JSON.parse` at `products.ts:80` produces a plain object → **no non-serializable values** in the load return
2. `readProduct` / `readProductDraft` / `listTemplates` / `readSettings` all return plain JSON objects
3. The `+page.server.ts` load functions return `{ product, templates, settings }` — all plain, all cloneable
4. The non-cloneable value does NOT originate in the content builders (L2); it is **created on the client** by `$state()` at `edit/+page.svelte:9`

**Verdict:** The traces do NOT converge on a field in the load-return object. The non-cloneable value is a **runtime Proxy artifact created on the client** by Svelte 5's `$state()` rune, not a value injected by the content builders. The working hypothesis ("a non-serializable value inside the full `product` object returned by the server `load`") is partially incorrect — the data itself is clean; the Proxy is applied by `$state()` on the client.

## C. Fixes as ready-to-apply diffs

---

### Fix 1 (Root fix — S1+S2+S3): Stop calling `structuredClone` on `$state` proxies

**File:** `src/routes/admin/products/[slug]/edit/+page.svelte`

**Root fix:** Clone the raw data BEFORE wrapping in `$state`, not after:

```diff
 	let { data } = $props();
 
-	let product = $state(data.product);
+	// Clone before $state to avoid structuredClone on a reactive Proxy
+	const initialProduct = structuredClone(data.product);
+	let product = $state(initialProduct);
 	let templates = $state(data.templates);
 
 	// Initialize edit state from draft if it exists, otherwise from published
 	let editState = $state({
-		...(structuredClone(product.draft || product.published)),
-		tracking: structuredClone(product.meta.tracking),
-		advanced: structuredClone(product.meta.advanced)
+		...(initialProduct.draft || initialProduct.published),
+		tracking: initialProduct.meta.tracking,
+		advanced: initialProduct.meta.advanced
 	});
```

---

### Fix 2 (Root fix — S4): Re-encode stored product data with correct Arabic

**File:** `content/products/alpha-vital.json`

Every Arabic string in the file must be re-encoded from the mojibake form back to proper UTF-8 Arabic. The correct values are:

```
Line 12:   "subtitle": "علاج الأرق والتوتر"
Line 18:   "alt": "Alpha Vital - صورة 1" (and lines 20, 22, 24, 26...)
Line 51:   "question": "هل العلاج آمن؟"
Line 52:   "answer": "نعم، جميع مكملات Alpha Vital مرخصة وآمنة."
Line 55:   "question": "كم يستغرق للحصول على النتائج؟"
Line 56:   "answer": "عادةً خلال 2-3 أسابيع ستشعر بتحسن ملحوظ."
Line 59:   "footerText": "جميع الحقوق محفوظة © Alpha Vital 2026"
Line 66-67: offer titles and subtitles
Line 77, 81, 87, 91, 103-104: all remaining Arabic strings
```

Also fix `content/products/_index.json` line 6.

**Prevent recurrence:** Add a soft warning when saving:

**File:** `src/lib/content/products.ts` (add before `gitWriteFile` in `saveProductDraft`):

```typescript
function containsMojibake(text: string): boolean {
  // Matches common Latin-1 characters that result from reading UTF-8 Arabic bytes as Latin-1
  return /[ÃÂ¡Ã¢Ã¤Ã¥Ã¦Ã§Ã¨Ã©ÃªÃ«Ã¬Ã®Ã¯Ã±Ã²Ã³Ã´Ã¶Ã¹ÃºÃ»Ã¼Ã¿]/u.test(text);
}
```

Or simply re-save through the admin UI after Fix 1 — the GitHub API write path uses `Buffer.from(content, 'utf8').toString('base64')` which is correct.

## D. Verification steps

- **S1:** Open `/admin/products/alpha-vital/edit` → Console shows **no** `DataCloneError` → form renders with all tabs populated.
- **S2:** Edit page full render, preview page shows template, product card click navigates to `/[slug]` with template — none blank.
- **S3:** "معاينة" opens new tab, "حفظ" triggers PUT API, "نشر" triggers status API, "← Back to Editor" does SPA `goto()`.
- **S4:** Home page subtitle shows `"علاج الأرق والتوتر"` not `"Ø¹ÙØ§Ø¬..."`. Product page FAQ shows correct Arabic.

## E. Side effects / risks

- **Fix 1:** `initialProduct` is a static snapshot; negligible risk since load data is immutable per render. Behavior is identical for all bindings.
- **Fix 2:** No functional data (URLs, slugs, IDs) is corrupted — only display strings. Re-saving overwrites file history but content is functionally correct.

## F. What was NOT inspected and why

1. **`+layout.server.ts` at root level** — None exists.
2. **Universal `+page.ts` loads** — None exist.
3. **`svelte.config.js` / `vite.config.ts`** — DataCloneError is a runtime JS error, not build config.
4. **`src/lib/validation/`** — Zod schemas validate shape, not encoding.
5. **`src/lib/server/auth.ts`** — Session validation, unrelated.
6. **Content on the `draft` branch** — No credentials for GitHub access; expected same mojibake.
7. **Svelte 5 internal `_i.ensure` stack trace** — Minified, cannot map to source without unminified runtime.
8. **SvelteKit's `page.data` store implementation** — Whether `$app/state` wraps data in `$state()` is an internal kit detail.

**Key admission:** I could not definitively prove the preview/public pages throw the identical `DataCloneError` from `structuredClone`-on-proxy. The explicit `structuredClone` call exists ONLY in `edit/+page.svelte:14`. If these pages are also blank on **full-page direct navigation** (not SPA after edit-page crash), there may be a separate cause. Verify after applying Fix 1.
