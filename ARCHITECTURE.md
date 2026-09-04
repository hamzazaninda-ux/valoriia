# Alpha Vital CMS — Architecture & Technical Specification

**Version:** 2.0  
**Date:** July 2026  
**Status:** Final — Ready for Implementation  

---

## Table of Contents

1. [Vision](#1-vision)
2. [Overall Architecture](#2-overall-architecture)
3. [Data Strategy: Git as Database](#3-data-strategy-git-as-database)
4. [Folder Structure](#4-folder-structure)
5. [Product Data Structure](#5-product-data-structure)
6. [Global Settings](#6-global-settings)
7. [Admin Panel Structure](#7-admin-panel-structure)
8. [Product Editor](#8-product-editor)
9. [Publishing Workflow](#9-publishing-workflow)
10. [Landing Page Templates](#10-landing-page-templates)
11. [API & Server Routes](#11-api--server-routes)
12. [Public Website](#12-public-website)
13. [Scalability](#13-scalability)
14. [Security](#14-security)
15. [Architectural Decisions & Tradeoffs](#15-architectural-decisions--tradeoffs)
16. [Future Roadmap](#16-future-roadmap)

---

## 1. Vision

### Long-Term Goal

Transform a single-product landing page into a **lightweight Landing Page CMS** dedicated to selling physical products in the Moroccan market (and eventually Arab markets). The system should allow creating unlimited product landing pages without writing code again — everything managed from an Admin Panel.

### Design Principles

| Principle | Meaning |
|---|---|
| **Simplicity** | No unnecessary abstractions. Every file has a clear purpose. |
| **Maintainability** | A single developer should understand the entire system in one sitting. |
| **Zero Infrastructure** | No databases to manage, no servers to maintain, no services to monitor. |
| **Content First** | The admin panel should feel like editing a document, not configuring software. |
| **Performance** | Pages load instantly. No client-side waterfalls. No unnecessary JavaScript. |
| **Low Cost** | Hosting on Vercel free/hobby tier. No paid database. No paid CMS service. |

### What This Is NOT

- It is NOT a full e-commerce platform (no cart, no payment gateway, no inventory management).
- It is NOT a headless CMS with API access (the content lives in the same repo as the code).
- It is NOT a multi-tenant SaaS (one owner, one brand, unlimited products).

---

## 2. Overall Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        PUBLIC WEBSITE                         │
│                                                               │
│  ┌─────────┐   ┌──────────────┐   ┌────────────────────┐    │
│  │  Home    │──▶│ Product Page │──▶│    Thank You       │    │
│  │ (list)   │   │  /[slug]     │   │   /thank-you       │    │
│  └─────────┘   └──────────────┘   └────────────────────┘    │
│                     │                                         │
│                     ├──▶ Google Sheets (orders)               │
│                     ├──▶ GTM (analytics)                      │
│                     └──▶ WhatsApp (support)                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       ADMIN PANEL                             │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Dashboard   │  │   Products   │  │    Settings      │    │
│  │  /admin      │  │  /admin/prod │  │  /admin/settings │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
│                           │                                   │
│                     ┌─────▼──────┐                            │
│                     │  Product   │                            │
│                     │  Editor    │                            │
│                     │ /admin/prod│                            │
│                     │ /:id/edit  │                            │
│                     └────────────┘                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      DATA LAYER                               │
│                                                               │
│  main branch (production)                                     │
│  content/                                                     │
│  ├── products/          (published product JSON files)        │
│  │   ├── _index.json    (lightweight list for home page)      │
│  │   ├── alpha-vital.json                                     │
│  │   └── ...                                                  │
│  ├── settings/          (global settings)                     │
│  │   ├── brand.json                                           │
│  │   ├── commerce.json                                        │
│  │   └── tracking.json                                        │
│  ├── templates/         (landing page template registry)      │
│  └── media.json         (optional: media library index)       │
│                                                               │
│  draft branch (staging)                                       │
│  content/                                                     │
│  ├── products/          (draft product JSON files)            │
│  │   ├── _index.json                                          │
│  │   └── ...                                                  │
│  └── settings/          (draft settings, if any)              │
│                                                               │
│  Vercel config: only deploy from main → draft branch = safe   │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow: Saving a Draft

```
Admin edits product in editor
        │
        ▼
Clicks "Save Draft"
        │
        ▼
Server reads current file from main branch (baseline)
Server writes updated file to draft branch via GitHub API
        │
        ▼
Draft saved. No deployment triggered.
Admin can continue editing freely.
```

### Data Flow: Publishing

```
Admin clicks "Publish"
        │
        ▼
Server validates product data
Server copies draft file → main branch via GitHub API
Server updates _index.json on main branch
        │
        ▼
Vercel detects push to main → triggers deployment
        │
        ▼
Product is now live on the public website
```

### Data Flow: Customer Places an Order

```
Customer visits /{product-slug}
        │
        ▼
SvelteKit loads product JSON from main branch
        │
        ▼
Page renders with product data (hero, offers, form)
        │
        ▼
Customer fills form → submits
        │
        ▼
Client-side fetch to Google Sheets Web App URL
        │
        ▼
Redirect to /thank-you (reads from localStorage)
```

---

## 3. Data Strategy: Git as Database

### Why Git?

The requirement is "no traditional database." The most practical approach that satisfies this is **Git-as-database**: all content is stored as JSON files in the repository.

### The Two-Branch Model

The key architectural innovation is the **two-branch model** that separates drafting from publishing:

| Branch | Purpose | Triggers Deploy? |
|---|---|---|
| `main` | Production content. Source of truth for the public website. | Yes (on push) |
| `draft` | Working content. Admin saves here. Staging area before publish. | No (Vercel configured to ignore) |

**Vercel configuration** (`vercel.json`):

```json
{
  "git": {
    "deploymentEnabled": {
      "**": false,
      "main": true
    }
  }
}
```

This tells Vercel: only deploy from `main`. The `draft` branch can be freely edited without triggering builds.

### How It Works

| Operation | What Happens | Triggers Deploy? |
|---|---|---|
| Save draft | Write to `draft` branch via GitHub API | No |
| Publish | Copy from `draft` to `main` branch via GitHub API | Yes |
| Unpublish | Remove from `main`, content remains in `draft` | Yes |
| Delete product | Remove from both `main` and `draft` via GitHub API | Yes |
| Edit published product | Changes go to `draft` first, then publish when ready | Yes (on publish) |

### Why This Works

1. **No deployment on every save** — the admin can iterate freely without causing rebuilds
2. **Clean Git history on main** — `main` only contains publish events, not every typo fix
3. **Built-in preview** — the `draft` branch content is the "staging" version
4. **Free** — no additional services (Vercel KV, databases) needed
5. **Safe** — even if the draft branch gets corrupted, `main` (production) is unaffected

### Tradeoffs (Acknowledged)

| Limitation | Impact | Mitigation |
|---|---|---|
| Branch management via GitHub API | Slightly more complex than single-branch | Encapsulated in `content/products.ts` utility — never exposed to admin |
| Draft branch accumulates over time | Repository has extra files on `draft` branch | Periodic cleanup (or ignore — Git handles this well) |
| No concurrent editing safety | Two admins could overwrite each other's drafts | Single-owner project — not a real risk |
| Git history grows with publishes | Repository size increases slowly | JSON files are tiny (~2-5KB each). Negligible. |

### Why Not Alternatives?

| Alternative | Why Not |
|---|---|
| **Vercel KV for drafts** | Adds external dependency. The "no database" requirement extends to KV stores. |
| **Single branch with every-save commits** | Clutters Git history. Triggers unnecessary deploys on every edit. |
| **Local filesystem** | Doesn't work on Vercel serverless (ephemeral filesystem). |
| **Vercel Blob Storage** | Designed for large files, not structured data with relationships. |
| **Supabase / Firebase** | Explicitly excluded by requirements. Also adds infrastructure. |

---

## 4. Folder Structure

```
alpha-vital-lb/
├── content/                              # DATA LAYER (Git-managed)
│   ├── products/                         # Product content
│   │   ├── _index.json                   # Lightweight product list for home page
│   │   ├── alpha-vital.json              # Full product data
│   │   └── ...
│   │
│   ├── settings/                         # Global settings (split by domain)
│   │   ├── brand.json                    # Brand name, logo, tagline
│   │   ├── commerce.json                 # Currency, shipping, payment
│   │   └── tracking.json                # GTM, pixels, analytics defaults
│   │
│   ├── templates/                        # Landing page template registry
│   │   └── registry.json                # Available templates + metadata
│   │
│   └── media.json                        # Media library index (optional)
│
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/                       # Shadcn UI primitives (unchanged)
│   │   │   │
│   │   │   ├── landing/                  # PUBLIC landing page components
│   │   │   │   ├── ProductHero.svelte
│   │   │   │   ├── ImageGallery.svelte
│   │   │   │   ├── OfferCards.svelte
│   │   │   │   ├── OrderForm.svelte
│   │   │   │   ├── StickyCTA.svelte
│   │   │   │   ├── SalesSection.svelte
│   │   │   │   └── PageFooter.svelte
│   │   │   │
│   │   │   ├── templates/               # Landing page templates
│   │   │   │   ├── classic/
│   │   │   │   │   └── Template.svelte   # Classic landing layout
│   │   │   │   ├── modern/
│   │   │   │   │   └── Template.svelte   # Modern landing layout
│   │   │   │   └── minimal/
│   │   │   │       └── Template.svelte   # Minimal landing layout
│   │   │   │
│   │   │   └── shared/                   # Shared components across templates
│   │   │       └── StarRating.svelte     # Star rating display (used by all 3 templates)
│   │   │
│   │   ├── validation/                    # Server-side validation layer
│   │   │   ├── index.ts                  # Barrel exports for all validation
│   │   │   ├── helpers.ts                # parseJsonBody, formatZodError, ERROR_CODES
│   │   │   ├── product.ts               # ProductCreateSchema, ProductUpdateSchema
│   │   │   ├── settings.ts              # Settings schemas
│   │   │   └── business.ts              # Business rules (slug uniqueness, template existence)
│   │   │
│   │   ├── content/                      # Content reading utilities
│   │   │   ├── products.ts               # readProduct(), saveDraft(), publishProduct()
│   │   │   ├── settings.ts              # readSettings(), saveSettings()
│   │   │   └── templates.ts             # getTemplate(), listTemplates()
│   │   │
│   │   ├── services/                     # External integrations
│   │   │   ├── sheets.ts                 # Google Sheets API
│   │   │   └── cloudinary.ts            # Image upload helper
│   │   │
│   │   ├── utils/                        # Pure utility functions
│   │   │   ├── phone.ts                  # Moroccan phone validation
│   │   │   ├── validation.ts             # Form validation
│   │   │   └── slug.ts                   # Slug generation & validation
│   │   │
│   │   ├── types/                        # TypeScript interfaces
│   │   │   ├── product.ts                # Product, Offer, ProductIndex types
│   │   │   ├── settings.ts              # GlobalSettings types
│   │   │   ├── templates.ts             # Template types
│   │   │   └── order.ts                  # OrderData type
│   │   │
│   │   └── assets/
│   │       └── favicon.svg
│   │
│   ├── routes/
│   │   ├── +layout.svelte                # Root layout (GTM, fonts)
│   │   ├── +page.svelte                  # Home page (product listing)
│   │   ├── +error.svelte                 # Error boundary (Arabic user-facing)
│   │   ├── layout.css                    # Global styles
│   │   │
│   │   ├── +server.ts                    # API: product CRUD endpoints
│   │   │
│   │   ├── [slug]/
│   │   │   └── +page.svelte              # Dynamic product page
│   │   │
│   │   ├── thank-you/
│   │   │   └── +page.svelte              # Thank you page (unchanged)
│   │   │
│   │   └── admin/
│   │       ├── +layout.svelte            # Admin layout (sidebar, auth)
│   │       ├── +page.svelte              # Dashboard
│   │       ├── login/
│   │       │   └── +page.svelte          # Login page
│   │       ├── products/
│   │       │   ├── +page.svelte          # Product list
│   │       │   ├── new/
│   │       │   │   └── +page.svelte      # Create new product
│   │       │   └── [id]/
│   │       │       ├── +page.svelte      # Edit product
│   │       │       └── preview/
│   │       │           └── +page.svelte  # Preview draft
│   │       └── settings/
│   │           └── +page.svelte          # Global settings editor
│   │
│   ├── app.html
│   ├── app.d.ts
│   └── ambient.d.ts
│
├── static/
├── vercel.json                           # Vercel config (deploy only from main)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── svelte.config.js
```

### Key Structural Decisions

1. **`content/` lives outside `src/`** — Pure data, not application code.

2. **`settings/` is a directory, not a single file** — Split by domain (`brand.json`, `commerce.json`, `tracking.json`). Easier to maintain, less merge conflict risk, clearer ownership.

3. **`templates/` directory** — Template registry and components live here. Adding a new template = adding a new folder + updating the registry.

4. **Separation of `landing/` and `admin/` components** — Public-facing and admin components never mix.

5. **`[slug]` dynamic route** — Each product gets a clean URL: `/alpha-vital`, `/product-b`, etc.

6. **`vercel.json`** — Explicitly configures Vercel to only deploy from `main`. This is what makes the two-branch model work.

---

## 5. Product Data Structure

### Product File: `content/products/{slug}.json`

The product JSON stores both published and draft content. This enables the "save without publishing" workflow while keeping everything in a single file.

```typescript
interface Product {
  // === Identity ===
  id: string;                    // Unique ID (e.g., "prod_abc123")
  slug: string;                  // URL slug (e.g., "alpha-vital")
  status: 'draft' | 'published' | 'archived';
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601

  // === Template ===
  template: string;              // Template ID (e.g., "classic", "modern", "minimal")

  // === Published Content (live on public site) ===
  published: {
    content: ProductContent;
    pricing: ProductPricing;
    order: ProductOrder;
    seo: ProductSeo;
  };

  // === Draft Content (staging, not yet live) ===
  draft: {
    content: ProductContent;
    pricing: ProductPricing;
    order: ProductOrder;
    seo: ProductSeo;
  } | null;                      // null = no pending changes

  // === Metadata (always current, not versioned) ===
  meta: {
    tracking: ProductTracking;
    advanced: ProductAdvanced;
    changelog: Array<{
      action: 'created' | 'published' | 'archived';
      timestamp: string;
    }>;
  };
}

interface ProductContent {
  heroImage: string;
  title: string;
  subtitle: string;
  rating: number;
  reviewCount: number;
  gallery: Array<{
    src: string;
    alt: string;
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
  footerText?: string;
}

interface ProductPricing {
  currency: string;
  offers: Array<{
    id: number;
    title: string;
    subtitle: string;
    price: number;
    originalPrice: number;
    quantity: number;
    badge: string | null;
    isPopular: boolean;
  }>;
}

interface ProductOrder {
  sku: string;
  googleSheetsUrl: string;
  phoneConfirmation: boolean;
  whatsappNumber: string;
}

interface ProductSeo {
  metaTitle: string;
  metaDescription: string;
  ogImage?: string;
  noindex: boolean;
}

interface ProductTracking {
  gtmContainerId?: string;
  facebookPixelId?: string;
  googleAdsConversionId?: string;
}

interface ProductAdvanced {
  customCss?: string;
  headScripts?: string;
  bodyScripts?: string;
  footerScripts?: string;
}
```

### Why Published/Draft Split?

| Approach | Pros | Cons |
|---|---|---|
| **Single `content` field** | Simpler structure | No way to save without publishing |
| **Separate `published` + `draft` fields** | Clean separation. Saves don't affect live site. Publish is an explicit action. | Slightly larger file (stores both versions) |
| **Two separate files per product** | Fully isolated | More files, more complexity, harder to keep in sync |

**Chosen: Published/Draft split in single file.**

This is the best balance. The admin always sees the draft version. Publishing copies `draft` → `published` and sets `draft = null`. The public site always reads from `published`.

### Product Index File: `content/products/_index.json`

Lightweight file for the home page. Contains only what's needed for the product list.

```typescript
interface ProductIndexItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  heroImage: string;
  startingPrice: number;
  status: 'draft' | 'published' | 'archived';
  template: string;
  updatedAt: string;
}

type ProductIndex = ProductIndexItem[];
```

### Example Product File

```json
{
  "id": "prod_alpha01",
  "slug": "alpha-vital",
  "status": "published",
  "createdAt": "2026-07-01T10:00:00Z",
  "updatedAt": "2026-07-15T14:30:00Z",
  "template": "classic",
  "published": {
    "content": {
      "heroImage": "https://res.cloudinary.com/.../hero.png",
      "title": "Alpha Vital",
      "subtitle": "علاج الأرق والتوتر",
      "rating": 4.8,
      "reviewCount": 234,
      "gallery": [
        { "src": "https://res.cloudinary.com/.../img1.png", "alt": "صورة 1" }
      ],
      "faq": [
        {
          "question": "هل العلاج آمن؟",
          "answer": "نعم، جميع مكملات Alpha Vital مرخصة وآمنة."
        }
      ]
    },
    "pricing": {
      "currency": "MAD",
      "offers": [
        {
          "id": 1,
          "title": "باك واحد",
          "subtitle": "يحتوي على 3 عبوات",
          "price": 299,
          "originalPrice": 399,
          "quantity": 1,
          "badge": null,
          "isPopular": false
        }
      ]
    },
    "order": {
      "sku": "alpha-vital-sleep",
      "googleSheetsUrl": "https://script.google.com/macros/s/.../exec",
      "phoneConfirmation": true,
      "whatsappNumber": "212649566468"
    },
    "seo": {
      "metaTitle": "Alpha Vital - اطلب الآن",
      "metaDescription": "احصل على أفضل المنتجات الفعالة.",
      "noindex": false
    }
  },
  "draft": null,
  "meta": {
    "tracking": {
      "gtmContainerId": "GTM-MVSJHW58"
    },
    "advanced": {},
    "changelog": [
      { "action": "created", "timestamp": "2026-07-01T10:00:00Z" },
      { "action": "published", "timestamp": "2026-07-01T10:05:00Z" }
    ]
  }
}
```

---

## 6. Global Settings

### Directory: `content/settings/`

Settings are split by domain into separate files. This avoids a single monolithic settings file and makes each domain independently editable.

#### `content/settings/brand.json`

```typescript
interface BrandSettings {
  name: string;                 // "Alpha Vital"
  tagline: string;              // "صحة أفضل، حياة أفضل"
  logo: string;                 // Cloudinary URL
  favicon: string;              // Cloudinary URL or local path
  whatsappNumber: string;       // Default WhatsApp number
  supportHours: string;         // e.g., "9:00 - 22:00"
}
```

#### `content/settings/commerce.json`

```typescript
interface CommerceSettings {
  currency: string;             // "MAD"
  currencySymbol: string;       // "DH"
  freeShippingText: string;     // "توصيل مجاني لجميع المدن"
  paymentMethod: string;        // "الدفع عند الاستلام"
}
```

#### `content/settings/tracking.json`

```typescript
interface TrackingSettings {
  gtmContainerId: string;       // Default GTM container
  defaultOgImage: string;       // Fallback OG image
  siteUrl: string;              // "https://alphavital.ma"
}
```

### How Global vs. Per-Product Works

| Setting | Global Source | Per-Product Override | Fallback Rule |
|---|---|---|---|
| Brand name/logo | `brand.json` | ❌ | Always global |
| WhatsApp number | `brand.json` | ✅ in `order.whatsappNumber` | Product → global |
| GTM container | `tracking.json` | ✅ in `meta.tracking.gtmContainerId` | Product → global |
| Currency | `commerce.json` | ✅ in `pricing.currency` | Product → global |
| Google Sheets URL | ❌ | ✅ in `order.googleSheetsUrl` | Always per-product |
| Offers/pricing | ❌ | ✅ in `pricing.offers` | Always per-product |
| Images | ❌ | ✅ in `content.*` | Always per-product |
| SEO | `tracking.json` | ✅ in `seo.*` | Product → global defaults |

### Settings Publishing

Settings follow the same draft/publish model as products. The admin saves changes to the `draft` branch, and only "Publish" pushes to `main`.

---

## 7. Admin Panel Structure

### Pages

| Route | Page | Purpose |
|---|---|---|
| `/admin/login` | Login | Password-based authentication |
| `/admin` | Dashboard | Overview: product count, recent activity |
| `/admin/products` | Product List | All products with status, search, filter |
| `/admin/products/new` | Create Product | Blank editor for new product |
| `/admin/products/[id]/edit` | Edit Product | Editor pre-filled with existing data |
| `/admin/products/[id]/preview` | Preview | Live preview of draft changes |
| `/admin/settings` | Global Settings | Brand, commerce, tracking defaults |

### Authentication

Simple password-based auth for a single-owner CMS:

- Password stored as bcrypt hash in `content/settings/brand.json` (admin-specific field)
- Server-side middleware checks `session` cookie on all `/admin/*` routes
- Login form at `/admin/login`
- No OAuth, no user management, no roles — one owner, full access

### Dashboard (`/admin`)

```
┌─────────────────────────────────────────────┐
│  Dashboard                                   │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Products │ │ Published│ │  Drafts  │    │
│  │    12    │ │     8    │ │    4     │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                              │
│  Recent Activity                             │
│  ─────────────────                           │
│  • "Alpha Vital" published 2 hours ago      │
│  • "Product B" draft saved yesterday        │
│  • "Product C" created 3 days ago           │
│                                              │
│  Quick Actions                               │
│  ─────────────────                           │
│  [+ New Product]  [Settings]                 │
└─────────────────────────────────────────────┘
```

### Product List (`/admin/products`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Products                                              [+ New]  │
│                                                                  │
│  Search: [________________]  Filter: [All ▾]  Sort: [Updated ▾]│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Image │ Title          │ Status    │ Price  │ Draft? │ A │   │
│  │───────│────────────────│───────────│────────│────────│───│   │
│  │ 🖼️   │ Alpha Vital    │ Published │ 299 DH │   —    │ ✏️│   │
│  │ 🖼️   │ Product B      │ Draft     │ 199 DH │  ✏️    │ ✏️│   │
│  │ 🖼️   │ Product C      │ Published │ 349 DH │   —    │ ✏️│   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  "Draft?" column shows ✏️ if product has unpublished changes    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Product Editor

The editor is the core of the CMS. Each product has a tabbed editor with 9 sections.

### Editor Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Products          Alpha Vital     [Save] [Publish]  │
│                                                                  │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┐               │
│  │Gen │Pric│Hero│Gall│Off │SEO │Trck│Scrp│Adv │               │
│  └────┴────┴────┴────┴────┴────┴────┴────┴────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              TAB CONTENT AREA                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Status: Draft (unsaved) | Last published: 2 hours ago          │
└─────────────────────────────────────────────────────────────────┘
```

### Section Details

#### 1. General (`GeneralTab`)

| Field | Type | Description |
|---|---|---|
| Product Name | Text input | Display name (e.g., "Alpha Vital") |
| Slug | Text input (auto-generated) | URL identifier. Auto-generated from name, editable. |
| Subtitle | Text input | Short tagline below title |
| Template | Select | Landing page layout (classic, modern, minimal, etc.) |
| Rating | Number input (1-5) | Star rating display |
| Review Count | Number input | Social proof number |
| Order Settings | Group | SKU, Google Sheets URL, Phone Confirmation, WhatsApp |

#### 2. Pricing (`PricingTab`)

| Field | Type | Description |
|---|---|---|
| Currency | Select | MAD, USD, EUR, etc. |
| Offers | Repeatable group | See offer fields below |

**Offer fields (repeatable):**

| Field | Type | Description |
|---|---|---|
| Offer ID | Auto-increment | Internal identifier |
| Title | Text input | e.g., "باك واحد (علاج كامل - 3 عبوات)" |
| Subtitle | Text input | e.g., "يحتوي على: ماغنيزيوم + أشواغندا" |
| Price | Number input | Current selling price |
| Original Price | Number input | Strikethrough price |
| Quantity | Number input | Units in this offer |
| Badge | Text input (optional) | e.g., "الأكثر طلباً 🔥" |
| Is Popular | Checkbox | Highlight this offer card |

#### 3. Hero (`HeroTab`)

| Field | Type | Description |
|---|---|---|
| Hero Image | Image uploader | Main product image (Cloudinary) |
| Image Preview | Preview | Shows uploaded image |

#### 4. Gallery (`GalleryTab`)

| Field | Type | Description |
|---|---|---|
| Gallery Images | Image list (drag-to-reorder) | All mid-page sales images |
| Add Image Button | Button | Opens image uploader |
| Alt Text | Text input per image | Arabic alt text for accessibility |
| Delete | Button per image | Remove image from gallery |

#### 5. Offers Preview (`OffersTab`)

Visual preview of how offers appear in the order form. The actual editing happens in the Pricing tab. This tab shows a live preview.

#### 6. SEO (`SeoTab`)

| Field | Type | Description |
|---|---|---|
| Meta Title | Text input | `<title>` tag. Falls back to product name. |
| Meta Description | Text input | Meta description for search engines |
| OG Image | Image uploader | Social sharing image. Falls back to hero image. |
| Noindex | Checkbox | Hide from search engines |

#### 7. Tracking (`TrackingTab`)

Analytics and advertising platform configuration.

| Field | Type | Description |
|---|---|---|
| GTM Container ID | Text input | Per-product GTM. Falls back to global. |
| Facebook Pixel ID | Text input | Meta Ads tracking pixel |
| Google Ads Conversion ID | Text input | Google Ads conversion tracking |

**Purpose:** These fields store platform IDs. The actual tracking code injection is handled automatically by the system based on these IDs — no manual script editing needed for standard platforms.

#### 8. Scripts (`ScriptsTab`)

Custom code injection for advanced use cases.

| Field | Type | Description |
|---|---|---|
| Head Scripts | Textarea | Custom `<head>` code (runs on every page load) |
| Body Scripts | Textarea | Custom `<body>` code (runs after DOM ready) |
| Footer Scripts | Textarea | Custom footer code (runs at end of page) |

**Purpose:** For custom pixels, third-party widgets, or one-off integrations that aren't covered by the Tracking tab. This is the escape hatch for power users.

**Why separate from Tracking?**  
Tracking = platform configuration (IDs, toggles). Scripts = raw code. Mixing them would mean non-technical users see scary code blocks when they just need to paste a Facebook Pixel ID.

#### 9. Advanced (`AdvancedTab`)

| Field | Type | Description |
|---|---|---|
| Custom CSS | Textarea | Per-product CSS overrides |

**Note:** `headScripts`, `bodyScripts`, and `footerScripts` have been moved to the Scripts tab. The Advanced tab now only contains CSS overrides and any future power-user settings.

---

## 9. Publishing Workflow

### States

```
                    ┌──────────┐
                    │  Draft   │ ◄─── Default state for new products
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          │          ▼
        ┌──────────┐     │    ┌──────────┐
        │ Published│     │    │ Archived │
        └────┬─────┘     │    └──────────┘
             │           │
             ▼           │
      Edit while live    │
      (changes go to     │
       draft first)      │
             │           │
             ▼           │
        ┌──────────┐     │
        │ Unpublish│ ────┘ (returns to Draft)
        └──────────┘
```

### Detailed Workflow

#### Creating a New Product

1. Admin clicks "New Product"
2. System creates a product file on the `draft` branch with `status: "draft"`
3. Editor opens with empty fields
4. Admin fills in General, Pricing, Hero, Gallery, etc.
5. Admin clicks **"Save"** → draft saved to `draft` branch (no deploy)
6. Admin clicks **"Preview"** → preview route renders the draft content
7. Admin clicks **"Publish"** → draft content copied to `published`, file written to `main` branch, Vercel deploys
8. Product is now live at `/{slug}`

#### Editing a Published Product

1. Admin opens product editor for a published product
2. Editor loads `published` content as baseline, `draft` content (if any) as working copy
3. Admin makes changes
4. Admin clicks **"Save"** → changes saved to `draft` branch (no deploy)
5. Public site still shows the old `published` version
6. Admin clicks **"Publish"** → `draft` content copied to `published`, file written to `main` branch, Vercel deploys
7. Public site now shows the updated version

#### Unpublishing

1. Admin clicks "Unpublish" on a published product
2. Product `status` changed to `"draft"` on `main` branch
3. Vercel deploys → product removed from public home page
4. Product data remains in `draft` branch for future editing

### Save vs. Publish

| Action | What Happens | Triggers Deploy? | Affects Live Site? |
|---|---|---|---|
| **Save** | Write to `draft` branch | No | No |
| **Publish** | Copy `draft` → `published`, write to `main` | Yes | Yes |
| **Unpublish** | Set status to `"draft"` on `main` | Yes | Yes (removes from home) |
| **Delete** | Remove from both `main` and `draft` | Yes | Yes |

### Auto-Save vs. Manual Save

**Decision: Manual save only.**

- No auto-save complexity
- Admin explicitly controls when drafts are saved
- Every save is a deliberate action
- Every publish is a deliberate action

**Tradeoff:** Admin could lose unsaved work if they close the browser. Mitigated by browser `beforeunload` warning ("You have unsaved changes. Are you sure you want to leave?").

### Preview Route

Draft products are accessible at `/admin/products/[id]/preview` — a server-side rendered route that loads the `draft` content (or `published` if no draft exists). This lets admins preview changes before publishing.

---

## 10. Landing Page Templates

### Architecture

The template system allows switching landing page layouts without changing product data. Each template is a Svelte component that receives the product data as props.

### Template Registry: `content/templates/registry.json`

```typescript
interface TemplateRegistryItem {
  id: string;                    // Template identifier (e.g., "classic")
  name: string;                  // Display name (e.g., "Classic Landing")
  description: string;           // Short description
  thumbnail: string;             // Preview image URL
  isDefault: boolean;            // Default template for new products
}

type TemplateRegistry = TemplateRegistryItem[];
```

### Example Registry

```json
[
  {
    "id": "classic",
    "name": "Classic Landing",
    "description": "Traditional long-form landing page with hero, gallery, and dual forms",
    "thumbnail": "https://res.cloudinary.com/.../classic-thumb.png",
    "isDefault": true
  },
  {
    "id": "modern",
    "name": "Modern Landing",
    "description": "Clean, minimal layout with large images and streamlined checkout",
    "thumbnail": "https://res.cloudinary.com/.../modern-thumb.png",
    "isDefault": false
  },
  {
    "id": "minimal",
    "name": "Minimal Landing",
    "description": "Ultra-clean single-page layout for simple products",
    "thumbnail": "https://res.cloudinary.com/.../minimal-thumb.png",
    "isDefault": false
  }
]
```

### Template Components: `src/lib/components/templates/`

```
templates/
├── classic/
│   └── Template.svelte          # Current layout (hero → gallery → forms)
├── modern/
│   └── Template.svelte          # New layout to be designed
└── minimal/
    └── Template.svelte          # New layout to be designed
```

Each template is a standalone Svelte component that receives the same props interface:

```typescript
interface TemplateProps {
  product: Product;              // Full published product data
  settings: GlobalSettings;      // Global settings
}
```

### How Templates Work

1. **Product stores template ID:** `{ "template": "classic" }` in product JSON
2. **Admin selects template** from dropdown in General tab
3. **Dynamic page loads template:**

```typescript
// src/routes/[slug]/+page.svelte (conceptual)
const templateId = data.product.template;
const Template = await import(`$lib/components/templates/${templateId}/Template.svelte`);
```

4. **Template renders** with product data as props
5. **Switching templates** = changing the `template` field and publishing. No data migration needed.

### Adding a New Template

1. Create `src/lib/components/templates/{name}/Template.svelte`
2. Add entry to `content/templates/registry.json`
3. Admin can immediately select it for any product
4. No code changes needed beyond the template component itself

### Why This Architecture?

| Alternative | Why Not |
|---|---|
| **Per-product layout config** | Too granular. Every product would need layout settings. |
| **Layout sections as components** | More flexible but much more complex. Overkill for 3-5 layouts. |
| **Theme system** | Over-engineered. We need templates, not themes. |
| **Single template with conditional rendering** | Would become a massive if/else mess. Hard to maintain. |

**Chosen: Component-per-template.** Simple, maintainable, and each template is completely independent.

---

## 11. API & Server Routes

### Server Routes: `/src/routes/api/`

| Method | Endpoint | Action | Auth Required | Guard Location |
|---|---|---|---|---|
| `GET` | `/api/products` | List all products (from `_index.json` on `main`) | No | — |
| `GET` | `/api/products/[slug]` | Get full product data (reads from `draft` if exists, else `main`) | No | — |
| `POST` | `/api/products` | Create new product (writes to `draft` branch) | Yes | `hooks.server.ts` |
| `PUT` | `/api/products/[slug]` | Update product draft (writes to `draft` branch) | Yes | `hooks.server.ts` |
| `DELETE` | `/api/products/[slug]` | Delete product from both branches | Yes | `hooks.server.ts` |
| `POST` | `/api/products/[slug]/status` | Publish/unpublish product | Yes | `hooks.server.ts` |
| `GET` | `/api/settings` | Get global settings (from `main`) | No | — |
| `PUT` | `/api/settings` | Update settings draft (writes to `draft` branch) | Yes | `hooks.server.ts` |
| `POST` | `/api/settings/publish` | Publish settings to `main` | Yes | `hooks.server.ts` |
| `POST` | `/api/auth/login` | Authenticate admin (rate-limited: 5/min) | No | — |
| `POST` | `/api/auth/logout` | Clear session cookie | No | — |

**Auth guard:** All POST/PUT/DELETE operations on `/api/products/*` and `/api/settings/*` are protected by `hooks.server.ts`, which validates the session cookie is a valid UUID format before the request reaches the endpoint handler.

### Content Utilities: `/src/lib/content/products.ts`

```typescript
// === Reading ===

listProducts(): ProductIndexItem[]
  // Reads _index.json from main branch

readProduct(id: string): Product
  // Reads product JSON from main branch

readProductDraft(id: string): Product | null
  // Reads product JSON from draft branch

readProductForAdmin(id: string): Product
  // Reads draft if exists, else reads published. For admin editor.

// === Writing (all write to draft branch) ===

saveProductDraft(product: Product): void
  // Writes product JSON to draft branch
  // Updates _index.json on draft branch

createProduct(product: Product): void
  // Creates new product on draft branch

// === Publishing (writes to main branch) ===

publishProduct(id: string): void
  // Reads draft content
  // Copies draft → published
  // Writes to main branch
  // Updates _index.json on main branch

unpublishProduct(id: string): void
  // Sets status to "draft" on main branch
  // Updates _index.json on main branch

deleteProduct(id: string): void
  // Removes from both main and draft branches

// === Git Operations (via GitHub API) ===

gitReadFile(branch: string, path: string): Promise<string>
  // Read file content from specific branch

gitWriteFile(branch: string, path: string, content: string): Promise<void>
  // Write file to specific branch (creates commit)

gitDeleteFile(branch: string, path: string): Promise<void>
  // Delete file from specific branch (creates commit)
```

### Git Commit Strategy

All writes go through the GitHub API via `octokit`:

1. **Read current file** from the target branch (for SHA hash)
2. **Create/update file** via GitHub Contents API
3. **Create commit** with descriptive message (e.g., "Update alpha-vital draft")
4. **Push to branch**

**Required environment variable:** `GITHUB_TOKEN` (personal access token with `repo` scope).

---

## 12. Public Website

### Home Page (`/`)

Reads `_index.json` from `main` branch. Displays published products as cards.

```
┌─────────────────────────────────────┐
│  Top Bar (from brand.json)          │
├─────────────────────────────────────┤
│                                      │
│  Alpha Vital                         │
│  [hero image]                        │
│  ★★★★★  299 DH                      │
│  [View Product →]                    │
│                                      │
│  ─────────────────────────────────  │
│                                      │
│  Product B                           │
│  [hero image]                        │
│  ★★★★☆  199 DH                      │
│  [View Product →]                    │
│                                      │
├─────────────────────────────────────┤
│  Footer                              │
└─────────────────────────────────────┘
```

### Product Page (`/[slug]`)

Loads product JSON by slug. Reads `published` content. Renders using the product's assigned template.

**Route: `src/routes/[slug]/+page.server.ts`**

```typescript
export function load({ params }) {
  const product = readProductBySlug(params.slug);
  if (!product || product.status !== 'published') {
    throw redirect(302, '/');
  }
  return { product, settings: readSettings() };
}
```

**Route: `src/routes/[slug]/+page.svelte`**

Dynamically loads the template component based on `product.template`:

```typescript
let { data } = $props();
const Template = await import(
  `$lib/components/templates/${data.product.template}/Template.svelte`
);
```

All templates receive the same props: `{ product, settings }`. No hardcoded content.

### Thank You Page (`/thank-you`)

**Unchanged.** Reads from `localStorage`. No product-specific logic.

---

## 13. Scalability

### Performance Targets

| Metric | Target | How |
|---|---|---|
| Home page load | < 1s | Lightweight `_index.json` |
| Product page load | < 1.5s | Single JSON file read, SSR |
| Vercel build time | < 60s | Up to 100 products |
| Admin save | < 5s | GitHub API commit to draft branch |
| Admin publish | < 10s | GitHub API merge draft → main |

### Scaling Tiers

#### 1-10 Products ✅ (Current)

- `_index.json` is tiny (~2KB)
- Each product JSON is ~3-5KB
- Build time: ~15s
- No optimization needed

#### 10-50 Products ✅

- `_index.json` ~10KB — still fast
- Build time: ~20-30s
- Home page may need pagination (show 6 at a time)
- Admin product list needs search/filter
- **Recommended: Add search to admin product list**

#### 50-200 Products ⚠️ (Requires optimization)

- `_index.json` ~40KB — still manageable
- Build time: ~40-60s — acceptable
- Admin product list needs pagination (not just search)
- **Recommended optimizations:**
  - Paginated `_index.json` (50 items per page)
  - Admin product list with server-side pagination
  - Debounced saves in admin editor (250ms)

#### 200-500+ Products ⚠️ (Architecture review needed)

- `_index.json` ~100KB — needs sharding
- Build time: ~60-90s — acceptable for Vercel
- GitHub API rate limits become relevant (5000 req/hour)
- **Recommended optimizations:**
  - Sharded `_index.json` by status:
    ```
    _index_published.json   (only published, for home page)
    _index_draft.json       (only drafts, for admin)
    ```
  - Pre-render popular product pages at build time
  - Virtual scrolling in admin product list
  - Batch GitHub API operations where possible

### Critical Bottleneck: GitHub API Rate Limits

| Operation | GitHub API Calls | Limit (per hour) |
|---|---|---|
| Read file | 1 | 5000 |
| Write file (save draft) | 2 (read SHA + write) | 2500 saves/hour |
| Publish | 3-4 (read draft + read main + write main + update index) | 1250 publishes/hour |

**Impact:** For a single-owner CMS with infrequent edits (a few per day), this is irrelevant. For batch operations (importing 100 products), this requires batching with delays.

**Mitigation:** The content utilities should batch operations where possible and implement exponential backoff for rate limit errors.

### When to Reconsider the Architecture

Re-evaluate if:
- GitHub API commits take > 5s consistently
- Vercel build time exceeds 2 minutes
- You need real-time collaboration on content
- You need complex queries (e.g., "products with price > 300 AND status = published")
- You exceed 500 products

In that case, consider adding **Vercel KV** as a read cache while keeping Git as the source of truth.

---

## 14. Security

### Admin Authentication

| Measure | Implementation |
|---|---|
| Password storage | bcrypt hash in `content/settings/brand.json` |
| Session management | HTTP-only cookie, signed with `SESSION_SECRET` env variable |
| Route protection | Server-side hook checks session on all `/admin/*` routes |
| Rate limiting | 5 login attempts per minute per IP |

### API Security

| Measure | Implementation |
|---|---|
| Admin endpoints | Require authenticated session cookie |
| API write guard | `hooks.server.ts` intercepts POST/PUT/DELETE on `/api/products/*` and `/api/settings/*`, validates session cookie is valid UUID |
| Public endpoints | None needed (read-only, public data) |
| GitHub token | Stored as Vercel env variable, never exposed to client |
| Content validation | Zod schemas validate all writes before GitHub API call |
| Session format | UUID (`crypto.randomUUID()`), validated with UUID regex in hooks |
| Error boundary | `+error.svelte` provides user-friendly error page (Arabic) |

### Content Security

| Measure | Implementation |
|---|---|
| Input sanitization | Server-side validation on all admin inputs |
| Image URLs | Must be valid URLs (Cloudinary or external) |
| Slug validation | Alphanumeric + hyphens only, uniqueness check |
| No user-generated content | All content is admin-authored, no XSS risk from public |

### Important: Admin Password Security

**Risk:** The admin password hash is stored in `content/settings/brand.json`, which is in a Git repository. If the repository is public, the hash is exposed.

**Mitigation:**
1. Keep the repository **private** on GitHub
2. Store the password hash in a **Vercel environment variable** instead of in the JSON file (preferred)
3. The JSON file contains only the public settings, not the password

**Updated approach:** The `brand.json` file should NOT contain the admin password. Instead:

```env
# Vercel environment variable (not in Git)
ADMIN_PASSWORD_HASH=$2b$10$...
SESSION_SECRET=random-32-char-string
```

This keeps the password hash out of Git entirely.

---

## 15. Architectural Decisions & Tradeoffs

### Decision 1: Git as Database with Two-Branch Model

**Chosen:** Store all content as JSON files in Git. Use `main` for production, `draft` for staging. Only `main` triggers Vercel deploys.

**Alternatives considered:**
- **Vercel KV for drafts:** Adds external dependency. Violates the "no database" principle.
- **Single branch with every-save commits:** Clutters Git history. Triggers unnecessary deploys.
- **Local filesystem:** Doesn't work on Vercel serverless.

**Tradeoff:** Branch management via GitHub API adds ~20 lines of utility code. But it provides clean separation between drafting and publishing, which is worth the complexity.

### Decision 2: Published/Draft Split in Product JSON

**Chosen:** Each product stores both `published` and `draft` content in a single file.

**Alternatives considered:**
- **Separate files per product per state:** More files, harder to manage.
- **Vercel KV for drafts:** External dependency.
- **Git branch only (no draft field):** Would require reading from two branches on every admin load, which is slower.

**Tradeoff:** Product files are ~2x larger (storing both versions). At 5KB per product, this is negligible.

### Decision 3: Template System

**Chosen:** Component-per-template. Each template is a standalone Svelte component.

**Alternatives considered:**
- **Config-driven layouts:** More flexible but much more complex.
- **Single template with sections:** Would become a monolithic component.
- **Theme system:** Over-engineered for 3-5 layouts.

**Tradeoff:** Each template must be built as a Svelte component. But templates are independent and can be developed in parallel.

### Decision 4: Splitting Tracking and Scripts

**Chosen:** Separate tabs for Tracking (platform IDs) and Scripts (raw code injection).

**Why:** Tracking is for non-technical users who just need to paste a Facebook Pixel ID. Scripts is for power users who need custom code. Mixing them would confuse both audiences.

### Decision 5: Splitting Settings into Multiple Files

**Chosen:** `settings/brand.json`, `settings/commerce.json`, `settings/tracking.json`.

**Why:** Avoids a monolithic settings file. Each domain is independently editable. Less merge conflict risk if settings are changed frequently.

**Tradeoff:** More files to manage. But the content utilities abstract this away — the admin never sees individual files.

### Decision 6: No Auto-Save

**Chosen:** Manual save only.

**Why:** Auto-save would mean every keystroke triggers a GitHub API call. This would be noisy, hit rate limits, and provide no real benefit for a CMS with infrequent edits.

**Tradeoff:** Admin could lose unsaved work. Mitigated by browser `beforeunload` warning.

---

## 16. Future Roadmap

### Version 1.0 — MVP CMS

**Goal:** Create and manage product landing pages from admin panel.

| Feature | Status |
|---|---|
| Admin panel with auth | ✅ Built |
| Product CRUD (create, edit, delete) | ✅ Built |
| Draft/Publish workflow | ✅ Built |
| Product editor (9 tabs) | ✅ Built |
| Home page (product listing) | ✅ Built |
| Dynamic product pages with template system | ✅ Built |
| Classic template | ✅ Built |
| Modern template | ✅ Built |
| Minimal template | ✅ Built |
| Global settings editor (split files) | ✅ Built |
| Image upload (Cloudinary) | ✅ Built |
| Git-based content persistence (two-branch) | ✅ Built |
| Google Sheets integration (per-product) | ✅ Exists |
| Order form + validation | ✅ Exists |
| Thank You page | ✅ Exists |
| GTM integration | ✅ Exists |
| Responsive design | ✅ Exists |
| API auth guard (hooks.server.ts) | ✅ Built |
| Validation layer (Zod schemas) | ✅ Built |
| Shared StarRating component | ✅ Built |
| Error boundary (+error.svelte) | ✅ Built |
| Production security hardening | ✅ Built |

### Version 2.0 — Analytics & Insights

**Goal:** Understand what's working and optimize.

| Feature | Description |
|---|---|
| Order dashboard | View orders from all products in one place |
| Conversion tracking | Track views → orders per product |
| A/B test offers | Test different pricing/layouts |
| Facebook Pixel integration | Per-product Meta Ads tracking |
| Google Ads integration | Per-product conversion tracking |
| UTM parameter support | Track traffic sources per product |

### Version 3.0 — Growth & Automation

**Goal:** Scale to more products and automate repetitive tasks.

| Feature | Description |
|---|---|
| Product templates | Clone an existing product as a starting point |
| Modern & Minimal templates | Additional landing page layouts |
| Bulk image upload | Upload multiple images at once |
| Order email notifications | Get notified when an order is placed |
| Multi-language support | Arabic + French + English |
| Custom domains | Per-product custom domains |
| API webhooks | Notify external systems on order |

### Version 4.0 — Platform Evolution

**Goal:** If the project grows significantly.

| Feature | Description |
|---|---|
| Multi-vendor support | Allow other sellers to create products |
| Payment gateway integration | CMI, Stripe, or local payment |
| Shipping integration | Automated shipping label generation |
| Customer accounts | Repeat customer recognition |
| Discount codes | Promo codes and coupons |
| Abandoned cart recovery | Automated WhatsApp reminders |

---

## Appendix A: Environment Variables

```env
# Required (Vercel environment variables, NOT in Git)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=abdelghafour1223/alpha-vital-lb
ADMIN_PASSWORD_HASH=$2b$10$...
SESSION_SECRET=random-32-char-string

# Optional (per-product or global fallback)
GOOGLE_SHEETS_URL=https://script.google.com/macros/s/.../exec
GTM_CONTAINER_ID=GTM-MVSJHW58
```

## Appendix B: Content File Validation Schema

```typescript
import { z } from 'zod';

const OfferSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  subtitle: z.string(),
  price: z.number().positive(),
  originalPrice: z.number().positive(),
  quantity: z.number().positive(),
  badge: z.string().nullable(),
  isPopular: z.boolean()
});

const ProductContentSchema = z.object({
  heroImage: z.string().url(),
  title: z.string().min(1),
  subtitle: z.string(),
  rating: z.number().min(1).max(5),
  reviewCount: z.number().min(0),
  gallery: z.array(z.object({
    src: z.string().url(),
    alt: z.string()
  })),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string()
  }))
});

const ProductSchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  template: z.string(),
  published: z.object({
    content: ProductContentSchema,
    pricing: z.object({
      currency: z.string(),
      offers: z.array(OfferSchema).min(1)
    }),
    order: z.object({
      sku: z.string(),
      googleSheetsUrl: z.string().url(),
      phoneConfirmation: z.boolean(),
      whatsappNumber: z.string()
    }),
    seo: z.object({
      metaTitle: z.string(),
      metaDescription: z.string(),
      ogImage: z.string().url().optional(),
      noindex: z.boolean()
    })
  }),
  draft: z.object({
    content: ProductContentSchema,
    pricing: z.object({
      currency: z.string(),
      offers: z.array(OfferSchema).min(1)
    }),
    order: z.object({
      sku: z.string(),
      googleSheetsUrl: z.string().url(),
      phoneConfirmation: z.boolean(),
      whatsappNumber: z.string()
    }),
    seo: z.object({
      metaTitle: z.string(),
      metaDescription: z.string(),
      ogImage: z.string().url().optional(),
      noindex: z.boolean()
    })
  }).nullable(),
  meta: z.object({
    tracking: z.object({
      gtmContainerId: z.string().optional(),
      facebookPixelId: z.string().optional(),
      googleAdsConversionId: z.string().optional()
    }),
    advanced: z.object({
      customCss: z.string().optional()
    }),
    changelog: z.array(z.object({
      action: z.enum(['created', 'published', 'archived']),
      timestamp: z.string().datetime()
    }))
  })
});
```

## Appendix C: Migration Plan from Current State

Current state: hardcoded `alpha-vital` product in code.

Migration steps:

1. Create `content/products/alpha-vital.json` by extracting current hardcoded values into the `published` field, set `draft: null`
2. Create `content/settings/brand.json`, `commerce.json`, `tracking.json` with current global values
3. Create `content/products/_index.json` with the single product
4. Create `content/templates/registry.json` with the "classic" template
5. Refactor `+page.svelte` to read from content layer instead of hardcoded data
6. Remove hardcoded offers from `src/lib/data/offers.ts`
7. Configure `vercel.json` to only deploy from `main`
8. Verify all functionality works identically
9. Deploy and test

**Zero-downtime migration:** The old and new systems produce identical output. No customer-facing changes.

---

*End of Architecture Document — Version 2.0*
