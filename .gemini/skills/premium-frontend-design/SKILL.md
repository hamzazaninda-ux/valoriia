---
name: premium-frontend-design
description: Guidelines and instructions for creating state-of-the-art, custom mobile-first front-end designs for the Alpha Vital project, avoiding generic 'vibe-coded' AI templates.
---

# Premium Frontend Design Skill (Alpha Vital)

Use these guidelines to create state-of-the-art, mobile-first, and highly polished front-end designs for the Alpha Vital project. These instructions ensure the application does not look like a generic "vibe-coded" AI template.

## 1. Core Visual Principles (Anti "Vibe Coding")

* **Custom Card Design**: Never use standard Tailwind cards like `bg-white rounded-lg shadow-sm border overflow-hidden`. Instead, use:
  - Custom border styles: `border border-neutral-200/60`
  - Subtle shadows: `shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-emerald-500/30`
  - Soft transitions: `transition-all duration-300 ease-out`
* **SVG Icons Instead of Emojis**: Never use emojis for core UI/UX elements (like trust badges or buttons). Always write clean, inline, accessible SVGs.
* **Premium Typography Scale**:
  - Main headers: Use `font-serif` with `'El Messiri'` or `'Cairo'`.
  - Body: Use `'Tajawal'` or `'Cairo'` with generous line height (`leading-relaxed`).
* **Micro-interactions**: 
  - Add smooth scale transitions on buttons and cards (`hover:scale-[1.02] active:scale-[0.98]`).
  - Active states on mobile should feel tactile (use `active:bg-emerald-50/80` or `active:scale-95`).

## 2. Mobile-First Optimization (90%+ of Traffic)

* **Sticky Bottom CTA (Product Pages)**: Mobile product screens must always have a sticky bottom container with a prominent "Order Now" button so the user can purchase without scrolling up.
* **Large Touch Targets**: Every button or clickable link on mobile must have a height of at least `48px` (min `44px`) to be easily tapable.
* **Touch-Friendly Galleries**: Galleries and carousels should support horizontal swiping (`overflow-x-auto snap-x scrollbar-none`) with clean pagination indicator dots.
* **Readable Sizes**: Ensure no font size on mobile drops below `12px` (prefer `14px` for descriptions and `16px` for headings) to prevent users from needing to pinch-to-zoom.

## 3. Brand Identity & Colors

* **Primary Emerald**: Deep forest greens representing natural vitality. Use `bg-emerald-950` / `text-emerald-950` or custom gradients combining `#042f1a` and `#022c22`.
* **Accent Amber**: Premium gold/amber color representing high-quality organic honey, pollen, and premium ingredients. Use `bg-amber-500/10 text-amber-600 border-amber-500/20` for premium tags.
* **Neutral Backgrounds**: Avoid harsh gray backgrounds. Use warm, off-white neutral tones like `bg-neutral-50/70` or `bg-[#faf9f6]` (warm cream).
