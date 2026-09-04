// src/lib/types/theme.ts
// Complete type definitions for the template theme system

export interface ThemeColors {
  primary: string;       // Main brand color (hex) — used for accents, borders, radio buttons
  cta: string;           // CTA button background color
  ctaHover: string;      // CTA button hover color
  accent: string;        // Badge/highlight color (e.g. sale badge)
  background: string;    // Page background color
  surface: string;       // Card/section background color
  text: string;          // Primary text color
  textMuted: string;     // Secondary / muted text color
}

export interface ThemeHeroSection {
  showBadge: boolean;
  badgeText: string;
  showRating: boolean;
  showSalesCount: boolean;
  salesCountText: string;
}

export interface ThemePricingSection {
  ctaText: string;
  stickyCtaText: string;
  showOriginalPrice: boolean;
  showPopularBadge: boolean;
  showGuarantee: boolean;
  guaranteeText: string;
  freeShippingBadgeText: string;
}

export interface ThemeOrderFormSection {
  title: string;
  namePlaceholder: string;
  cityPlaceholder: string;
  phonePlaceholder: string;
  submitText: string;
  processingText: string;
}

export interface ThemeTrustBadges {
  showCOD: boolean;
  codText: string;
  showFreeShipping: boolean;
  freeShippingText: string;
  showWarranty: boolean;
  warrantyText: string;
  showFAQ: boolean;
  faqTitle: string;
}

export interface ThemeAdvanced {
  showStickyButton: boolean;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ThemeSections {
  hero: ThemeHeroSection;
  pricing: ThemePricingSection;
  orderForm: ThemeOrderFormSection;
  trustBadges: ThemeTrustBadges;
  advanced: ThemeAdvanced;
}

export interface TemplateTheme {
  id: string;
  name: string;
  baseTemplate: string;
  colors: ThemeColors;
  sections: ThemeSections;
  updatedAt?: string;
}

// =============================================================================
// Default Themes per base template
// =============================================================================

const BASE_DEFAULTS: ThemeSections = {
  hero: {
    showBadge: true,
    badgeText: '🔥 الأكثر مبيعاً في المغرب',
    showRating: true,
    showSalesCount: true,
    salesCountText: '+1000 عميل راضٍ',
  },
  pricing: {
    ctaText: 'اطلب الآن 🚀',
    stickyCtaText: 'اطلب الآن',
    showOriginalPrice: true,
    showPopularBadge: true,
    showGuarantee: true,
    guaranteeText: '✅ ضمان 7 أيام أو استرجاع المبلغ',
    freeShippingBadgeText: '+ توصيل مجاني سريع',
  },
  orderForm: {
    title: '📦 أكمل طلبك الآن',
    namePlaceholder: 'الاسم الكامل',
    cityPlaceholder: 'المدينة (مثال: الدار البيضاء)',
    phonePlaceholder: '06/07 xxxxxxxx',
    submitText: '✅ تأكيد الطلب',
    processingText: 'جاري معالجة طلبك...',
  },
  trustBadges: {
    showCOD: true,
    codText: 'الدفع عند الاستلام',
    showFreeShipping: true,
    freeShippingText: 'توصيل مجاني لجميع المدن',
    showWarranty: true,
    warrantyText: 'ضمان 7 أيام',
    showFAQ: true,
    faqTitle: 'الأسئلة الشائعة',
  },
  advanced: {
    showStickyButton: true,
    borderRadius: 'xl',
  },
};

export function getDefaultTheme(templateId: string = 'classic'): TemplateTheme {
  const colorsByTemplate: Record<string, ThemeColors> = {
    classic: {
      primary: '#10b981',
      cta: '#f97316',
      ctaHover: '#ea580c',
      accent: '#f59e0b',
      background: '#f9fafb',
      surface: '#ffffff',
      text: '#111827',
      textMuted: '#6b7280',
    },
    modern: {
      primary: '#6366f1',
      cta: '#f97316',
      ctaHover: '#ea580c',
      accent: '#ec4899',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
    },
    minimal: {
      primary: '#111827',
      cta: '#111827',
      ctaHover: '#1f2937',
      accent: '#6b7280',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textMuted: '#6b7280',
    },
    killers: {
      primary: '#c8a96e',
      cta: '#c8a96e',
      ctaHover: '#b8985e',
      accent: '#8b7355',
      background: '#1a1a1a',
      surface: '#2a2a2a',
      text: '#f5f0e8',
      textMuted: '#a09880',
    },
  };

  const namesByTemplate: Record<string, string> = {
    classic: 'Classic Landing',
    modern: 'Modern Landing',
    minimal: 'Minimal Landing',
    killers: 'Killers Landing',
  };

  return {
    id: templateId,
    name: namesByTemplate[templateId] || templateId,
    baseTemplate: templateId,
    colors: colorsByTemplate[templateId] || colorsByTemplate.classic,
    sections: structuredClone(BASE_DEFAULTS),
  };
}

// Helper: build CSS variable string from theme colors
export function buildThemeCssVars(theme: TemplateTheme): string {
  const c = theme.colors;
  return [
    `--t-primary: ${c.primary}`,
    `--t-cta: ${c.cta}`,
    `--t-cta-hover: ${c.ctaHover}`,
    `--t-accent: ${c.accent}`,
    `--t-bg: ${c.background}`,
    `--t-surface: ${c.surface}`,
    `--t-text: ${c.text}`,
    `--t-text-muted: ${c.textMuted}`,
  ].join('; ');
}

// Border radius mapping
export const RADIUS_MAP: Record<string, string> = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};
