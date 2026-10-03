import type { TemplateTheme } from './theme';
export type { TemplateTheme };

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

export type TemplateRegistry = TemplateRegistryItem[];

export interface ProductOffer {
  id: number;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  quantity: number;
  badge: string | null;
  image?: string;
  isPopular: boolean;
}

export interface ProductVersion {
  content: {
    heroImage: string;
    title: string;
    subtitle: string;
    rating: number;
    reviewCount: number;
    gallery: Array<{ src: string; alt: string; showInHero?: boolean }>;
    faq: Array<{ question: string; answer: string }>;
    footerText?: string;
    carousel?: Array<{
      image: string;
      alt?: string;
      title?: string;
      bgGradient?: string;
      badge?: {
        text: string;
        position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
      } | null;
    }>;
    killers?: import('./product').KillersContent;
  };
  pricing: {
    currency: string;
    offers: Array<ProductOffer>;
  };
  order: {
    googleSheetsUrl: string;
    phoneConfirmation: boolean;
    whatsappNumber: string;
  };
}

export interface TemplateProps {
  product: {
    published: ProductVersion;
    draft?: ProductVersion | null;
  };
  settings: {
    brand: {
      name: string;
      tagline: string;
      whatsappNumber: string;
    };
    commerce: {
      currencySymbol: string;
      freeShippingText: string;
      paymentMethod: string;
      googleSheetsUrl?: string;
      postOrderUpsellImage?: string;
    };
  };
  theme?: TemplateTheme | null;
  /** Other published products (cross-sell / post-purchase upsell). */
  others?: Array<{
    slug: string;
    title: string;
    subtitle?: string;
    heroImage?: string;
    startingPrice?: number;
  }>;
}
