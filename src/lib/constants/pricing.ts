// =============================================================================
// NOVAVITA Global Pricing Tiers & Bundle Constants
// Single Source of Truth for CRO Offers
// =============================================================================

export interface PricingTier {
  id: 'tier_1' | 'tier_2' | 'tier_3';
  units: number;
  months: number;
  price: number;
  originalPrice: number;
  savings: number;
  title: string;
  subtitle: string;
  shipping: number; // 0 = Free delivery
  isFreeShipping: boolean;
  isPopular: boolean;
  badge: string;
}

export const PRICING_TIERS: Record<'tier_1' | 'tier_2' | 'tier_3', PricingTier> = {
  tier_1: {
    id: 'tier_1',
    units: 1,
    months: 1,
    price: 199,
    originalPrice: 299,
    savings: 100,
    title: 'باقة التجربة (علبة واحدة)',
    subtitle: 'كورس شهر واحد لتجربة النكهة والنتائج الأولية',
    shipping: 29,
    isFreeShipping: false,
    isPopular: false,
    badge: 'سعر التجربة'
  },
  tier_2: {
    id: 'tier_2',
    units: 2,
    months: 2,
    price: 279,
    originalPrice: 398,
    savings: 119,
    title: 'باقة الثنائي (علبتان)',
    subtitle: 'كورس شهرين لوقف التساقط ونضارة البشرة + توصيل مجاني',
    shipping: 0,
    isFreeShipping: true,
    isPopular: true,
    badge: '⭐ الأكثر طلباً - توفير 119 درهم'
  },
  tier_3: {
    id: 'tier_3',
    units: 3,
    months: 3,
    price: 349,
    originalPrice: 597,
    savings: 248,
    title: 'باقة التحول الشامل (3 علب)',
    subtitle: 'الروتين المتكامل لنتائج دائمة للشعر، البشرة والأظافر + هدايا مجانية',
    shipping: 0,
    isFreeShipping: true,
    isPopular: false,
    badge: '🏆 التحول الشامل - توفير 248 درهم'
  }
};

export const DEFAULT_TIER_ID: 'tier_1' | 'tier_2' | 'tier_3' = 'tier_2';

export const FLASH_UPSELL_PRICE = 99; // MAD
export const FREE_SHIPPING_THRESHOLD = 250; // MAD
export const STANDARD_SHIPPING_FEE = 29; // MAD
export const CURRENCY = 'MAD';
export const CURRENCY_SYMBOL = 'درهم';
