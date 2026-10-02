---
name: frontend-design
description: Valoriia design system. ALWAYS load for any frontend/UI task in this project — new landing pages, template edits, admin screens, components, or restyling. Distinctive Arabic-first (RTL) visual design, SVG illustration system, premium Arabic/Latin typography, mobile-first COD conventions. Prevents generic AI-looking output.
---

# Valoriia Frontend Design

> Adapted from Anthropic's official `frontend-design` skill
> (github.com/anthropics/skills, Apache-2.0), customized for Valoriia:
> Moroccan COD landing pages, Arabic-first RTL, SVG illustration system.

**You are the design lead of a studio.** Valoriia already rejected
templated looks. Every interface must have a distinct point of view:
deliberate palette, typography and layout choices specific to the brief.
Take aesthetic risk when justified.

## 0. Mandatory process (every UI task)

1. **Plan first:** write a compact token plan — Color (4–6 named hex),
   Type (faces + roles), Layout (one-sentence concept + alignment),
   Principles (what makes THIS page unique).
2. **Self-review:** if any part reads like the default you'd produce for
   any similar page, revise it and say what changed and why.
3. **Build** following the revised plan (Svelte 5 + Tailwind 4).
4. **Critique:** re-read your output for slop tells (§5) and remove one
   decoration (Chanel's mirror rule).

## 1. Valoriia brand tokens

- **Primary emerald** — natural vitality, deep forest greens:
  `bg-emerald-950` / `text-emerald-950`, gradients `#042f1a → #022c22`.
- **Accent amber/gold** — premium quality:
  `bg-amber-500/10 text-amber-600 border-amber-500/20` for tags/badges.
- **Backgrounds** — warm off-whites, never harsh gray:
  `bg-neutral-50/70`, `bg-[#faf9f6]` (warm cream).
- **Cards** — never default `bg-white rounded-lg shadow-sm border`.
  Use `border-neutral-200/60`,
  `shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]`,
  `hover:shadow-xl hover:border-emerald-500/30`,
  `transition-all duration-300 ease-out`.
- **Buttons/CTAs** — min-height 48px, `font-bold`, tactile states
  (`hover:scale-[1.02] active:scale-[0.98]`), COD green for order actions.

## 2. SVG system (no emojis in UI, ever)

- **Icons:** clean inline SVGs, `currentColor`, `aria-hidden="true"`,
  stroke-based (1.5–2px), consistent 20/24px grid. Never emojis for
  trust badges, buttons, ratings, or navigation.
- **Empty spots:** every empty state, placeholder, or bare section gets
  a decorative inline SVG — soft blobs, dashed patterns, dotted grids,
  arches, or small product-motive line illustrations in brand
  emerald/amber at low opacity. A blank gray box is a failure.
- **Ratings:** star SVGs (full/half via gradient fill), never ★ text.
- Illustrations must feel drawn for Valoriia (organic curves, leaf/
  vitality motives), not stock clip-art.

## 3. Typography (Arabic-first, RTL)

- **Arabic display/headings:** `'El Messiri'`, `'Cairo'`, or
  `'Aref Ruqaa'` (for a distinctive authentic voice).
  Never default system fonts for Arabic headings.
- **Arabic body:** `'Tajawal'`, `'Almarai'`, or
  `'IBM Plex Sans Arabic'` with generous line-height
  (`leading-loose` — Arabic needs more than Latin).
- **Latin/foreign text:** `'Inter'` or `'Manrope'` for body,
  `'Sora'` or `'Space Grotesk'` for display. Clearly distinct from
  the Arabic face when both appear.
- **Loading:** Google Fonts `<link>` in `src/app.html`
  (or `@fontsource` packages). Max two families per page.
- **Scale:** clear display/body roles, intentional weights/widths;
  mobile headings ≥16px, descriptions ≥14px, nothing below 12px.
- **Avoid:** single-word accent coloring in headlines, ALL-CAPS labels,
  eyebrow label above every heading, `WORD — fragment` labels,
  `A · B · C` meta strings, `→` appended to buttons.

## 4. Mobile-first COD (90%+ of traffic is mobile, Morocco)

- Sticky bottom CTA on product pages (order without scrolling up).
- Touch targets ≥48px (min 44px); tactile active states
  (`active:bg-emerald-50/80`, `active:scale-95`).
- Galleries: horizontal swipe (`overflow-x-auto snap-x`), dot
  pagination, no tiny arrows.
- `dir="rtl"` on Arabic layouts; use logical properties
  (`ms-/me-/ps-/pe-/start-/end-`) — never physical left/right for
  directional spacing.

## 5. Anti-slop checklist (reject before finishing)

- No SaaS-card kit: identical rounded cards, one radius everywhere,
  same soft grey shadow under each, gradient washes as decoration.
- No warm-cream + terracotta default, no acid-green-on-black default,
  no hairline broadsheet default — unless the brief demands it.
- One orchestrated motion moment max; motion must answer a user
  action (open/expand/confirm). No fade-slide-up on every section.
- Numbered `01/02/03` markers only for real sequences.
- One memorable element per page; everything else quiet.

## 6. Copy (Arabic, conversational)

- Plain verbs, sentence case, active voice. CTA says what happens
  ("أكّد الطلب الآن", not "Submit").
- Same action name through the whole flow (button "انشر" → toast
  "تم النشر").
- Errors explain what happened + how to fix, never vague, never
  apologizing. Empty screens invite action (with an SVG + CTA).
- Moroccan Darija-friendly MSA, plain and warm.
