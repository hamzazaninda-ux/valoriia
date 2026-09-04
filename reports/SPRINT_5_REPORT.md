# Sprint 5 Report: Dynamic Template Loader

**Date:** 2026-07-19  
**Status:** ✅ COMPLETE  
**svelte-check:** 0 errors, 60 warnings (unchanged from baseline)

---

## Summary

Implemented the dynamic template loader foundation, replacing hardcoded `ClassicTemplate` imports with a registry-driven, `import.meta.glob`-based system. Adding a new template now requires only: create folder + register in `registry.json` — no routing, rendering, editor, or validation changes.

---

## What Was Done

### 1. Extended Template Registry (`content/templates/registry.json`)
Added new metadata fields to `TemplateRegistryItem`:
- `version` — Schema version for future migrations
- `author` — Who created the template
- `category` — Template type (`landing` | `product` | `promo`)
- `supportedFeatures` — Array of features the template supports

Updated classic template entry with:
```json
{
  "id": "classic",
  "name": "Classic Landing",
  "description": "Traditional long-form landing page with hero, gallery, and dual forms",
  "thumbnail": "https://placehold.co/400x300/f0fdf4/166534?text=Classic",
  "isDefault": true,
  "version": 1,
  "author": "alpha-vital",
  "category": "landing",
  "supportedFeatures": ["hero", "gallery", "offers", "orderForm", "faq", "whatsapp"]
}
```

### 2. Created Dynamic Template Loader (`src/lib/content/templateLoader.ts`)
New module using Vite's `import.meta.glob` for build-time template resolution:
- `loadTemplateComponentSync(templateId)` — Synchronous resolution for SSR-compatible pages
- `loadTemplateComponent(templateId)` — Returns loader or null
- `getAvailableTemplateIds()` — Lists all discovered template component IDs
- `resolveTemplate(templateId, registry)` — Resolves template with fallback logic

**Fallback chain:**
1. Requested template → 2. Default in registry → 3. Classic → 4. First available → 5. Throw error

### 3. Updated Public Product Page (`src/routes/[slug]/+page.svelte`)
**Before:**
```svelte
<script lang="ts">
  import ClassicTemplate from '$lib/components/templates/classic/Template.svelte';
  let { data } = $props();
</script>
<ClassicTemplate product={data.product} settings={data.settings} />
```

**After:**
```svelte
<script lang="ts">
  import { loadTemplateComponentSync } from '$lib/content/templateLoader';
  let { data } = $props();
  const Template = $derived(loadTemplateComponentSync(data.product.template));
</script>
<Template product={data.product} settings={data.settings} />
```

### 4. Updated Admin Preview Page (`src/routes/admin/products/[slug]/preview/+page.svelte`)
Same pattern as public page — uses `$derived` + `loadTemplateComponentSync` instead of hardcoded import.

### 5. Enhanced Template Validation (`src/lib/validation/business.ts`)
`checkTemplateExists()` now validates **both**:
1. Template exists in registry (`getTemplate()`)
2. Template component exists on disk (`getAvailableTemplateIds()`)

If a template is registered but the component is missing, the API returns a clear error: "القالب X مسجل لكن مكون العرض غير موجود"

### 6. Updated Type Definitions (`src/lib/types/templates.ts`)
Extended `TemplateRegistryItem` with optional fields:
```typescript
export interface TemplateRegistryItem {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  isDefault: boolean;
  version?: number;
  author?: string;
  category?: 'landing' | 'product' | 'promo';
  supportedFeatures?: string[];
}
```

---

## Files Changed

| File | Change Type | Description |
|------|------------|-------------|
| `content/templates/registry.json` | Modified | Added version, author, category, supportedFeatures |
| `src/lib/types/templates.ts` | Modified | Extended TemplateRegistryItem interface |
| `src/lib/content/templateLoader.ts` | **Created** | Dynamic template resolution via import.meta.glob |
| `src/routes/[slug]/+page.svelte` | Modified | Dynamic template loading |
| `src/routes/admin/products/[slug]/preview/+page.svelte` | Modified | Dynamic template loading |
| `src/lib/validation/business.ts` | Modified | Enhanced template existence check |

---

## Developer Experience

### Adding a New Template

**Step 1:** Create component at `src/lib/components/templates/{new-id}/Template.svelte`
```svelte
<script lang="ts">
  import type { TemplateProps } from '$lib/types/templates';
  let { product, settings }: TemplateProps = $props();
</script>
<!-- Template markup here -->
```

**Step 2:** Register in `content/templates/registry.json`
```json
{
  "id": "new-id",
  "name": "New Template",
  "description": "Description here",
  "thumbnail": "https://...",
  "isDefault": false,
  "version": 1,
  "author": "developer-name",
  "category": "landing",
  "supportedFeatures": ["hero", "gallery"]
}
```

**Done.** No other files need modification:
- ✅ Public pages auto-discover via `import.meta.glob`
- ✅ Admin template selector reads from registry
- ✅ API validation checks both registry and component
- ✅ Fallback to classic if template fails

---

## Verification

### Existing Products
- `alpha-vital.json` has `template: "classic"` → works unchanged
- No content modifications required

### Fallback Behavior
- Invalid template ID → falls back to classic
- Missing component → falls back to classic
- Missing registry entry → falls back to default
- Classic missing → throws clear error

### Admin Template Selector
- Reads from `listTemplates()` → registry is source of truth
- Extended metadata (version, author, etc.)不影响 selector display
- Template dropdown shows all registered templates

---

## Technical Decisions

1. **`import.meta.glob` over dynamic `import()`** — Resolves at build time, works with SSR, type-safe, no `@vite-ignore` needed
2. **`$derived` over `const`** — Svelte 5 reactive pattern, eliminates "captures initial value" warnings
3. **Component validation in API** — Fail-fast approach: reject at save time rather than render time
4. **Fallback to classic** — Safe default for existing products, graceful degradation

---

## What Was NOT Changed

- No new templates created (foundation only)
- No changes to content structure or validation schemas
- No changes to API contracts or routing
- No changes to the editor UI (template selector already works)
- No changes to settings or product data models

---

## Next Steps (Sprint 6+)

- Modern Template implementation
- Minimal Template implementation
- Component extraction from classic template
- Production hardening and performance optimization
