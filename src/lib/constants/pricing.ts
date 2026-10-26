// =============================================================================
// NOVAVITA Global Pricing Tiers & Bundle Constants
// Single Source of Truth for CRO Offers
// =============================================================================

export type PricingTierId = 'tier_1' | 'tier_2' | 'tier_3';

export interface PricingTier {
  id: PricingTierId;
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

export const tiers = [
  {
    id: 'tier-2-tubs',
    title: 'علبتان • ثبّتي النتيجة',
    subtitle: 'شهرين متواصلين + توصيل فابور 🚚',
    price: 279,
    oldPrice: 398,
    savings: 'وفّري 119 درهم',
    qty: 2,
    badge: 'الأكثر طلباً ⭐',
    isPopular: true
  },
  {
    id: 'tier-3-tubs',
    title: '3 علب • كورس علاجي كامل',
    subtitle: 'كورس 3 أشهر متواصلة + توصيل فابور 🚚',
    price: 349,
    oldPrice: 597,
    savings: 'توفير 248 درهم',
    qty: 3,
    badge: 'توفير 248 درهم',
    isPopular: false
  },
  {
    id: 'tier-4-tubs',
    title: '4 علب • كورس مكثف VIP (الباقة العائلية)',
    subtitle: 'كورس 4 أشهر متواصلة + توصيل فابور 🚚',
    price: 419,
    oldPrice: 599,
    savings: 'أكبر توفير 377 درهم 🔥',
    qty: 4,
    badge: 'أكبر توفير 377 درهم 🔥',
    isPopular: false
  }
];

export const PRICING_TIERS: Record<PricingTierId, PricingTier> = {
  tier_1: {
    id: 'tier_1',
    units: 2,
    months: 2,
    price: 279,
    originalPrice: 398,
    savings: 119,
    title: 'علبتان • ثبّتي النتيجة',
    subtitle: 'شهرين متواصلين + توصيل فابور 🚚',
    shipping: 0,
    isFreeShipping: true,
    isPopular: true,
    badge: 'الأكثر طلباً ⭐'
  },
  tier_2: {
    id: 'tier_2',
    units: 3,
    months: 3,
    price: 349,
    originalPrice: 597,
    savings: 248,
    title: '3 علب • كورس علاجي كامل',
    subtitle: 'كورس 3 أشهر متواصلة + توصيل فابور 🚚',
    shipping: 0,
    isFreeShipping: true,
    isPopular: false,
    badge: 'توفير 248 درهم'
  },
  tier_3: {
    id: 'tier_3',
    units: 4,
    months: 4,
    price: 419,
    originalPrice: 599,
    savings: 377,
    title: '4 علب • كورس مكثف VIP (الباقة العائلية)',
    subtitle: 'كورس 4 أشهر متواصلة + توصيل فابور 🚚',
    shipping: 0,
    isFreeShipping: true,
    isPopular: false,
    badge: 'أكبر توفير 377 درهم 🔥'
  }
};

export const DEFAULT_TIER_ID: PricingTierId = 'tier_1';

export const FLASH_UPSELL_PRICE = 99; // MAD
export const FREE_SHIPPING_THRESHOLD = 250; // MAD
export const STANDARD_SHIPPING_FEE = 29; // MAD
export const CURRENCY = 'MAD';
export const CURRENCY_SYMBOL = 'درهم';
