export interface KillersContent {
  bullets?: string[];
  featuredReview?: { text: string; image: string; author: string };
  stories?: Array<{ name: string; text: string }>;
  gridReviews?: Array<{ name: string; text: string; image: string }>;
  benefits?: Array<{ title: string; text: string }>;
  usageSteps?: string[];
  footerCta?: { text: string; image: string };
  guarantees?: Array<{ title: string; text: string; image: string }>;
}

export interface ProductContent {
  heroImage: string;
  title: string;
  subtitle: string;
  rating: number;
  reviewCount: number;
  gallery: Array<{
    src: string;
    alt: string;
  }>;
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
  faq: Array<{
    question: string;
    answer: string;
  }>;
  footerText?: string;
  killers?: KillersContent;
}

export interface ProductPricing {
  currency: string;
  offers: Array<{
    id: number;
    title: string;
    subtitle: string;
    price: number;
    originalPrice: number;
    quantity: number;
    badge: string | null;
    image?: string;
    isPopular: boolean;
  }>;
}

export interface ProductOrder {
  sku: string;
  googleSheetsUrl: string;
  phoneConfirmation: boolean;
  whatsappNumber: string;
}

export interface ProductSeo {
  metaTitle: string;
  metaDescription: string;
  ogImage?: string;
  noindex: boolean;
}

export interface ProductTracking {
  gtmContainerId?: string;
  facebookPixelId?: string;
  googleAdsConversionId?: string;
}

export interface ProductAdvanced {
  customCss?: string;
  headScripts?: string;
  bodyScripts?: string;
  footerScripts?: string;
}

export interface Product {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  template: string;
  published: {
    content: ProductContent;
    pricing: ProductPricing;
    order: ProductOrder;
    seo: ProductSeo;
  };
  draft: {
    content: ProductContent;
    pricing: ProductPricing;
    order: ProductOrder;
    seo: ProductSeo;
  } | null;
  meta: {
    tracking: ProductTracking;
    advanced: ProductAdvanced;
    changelog: Array<{
      action: 'created' | 'published' | 'archived' | 'updated' | 'unpublished';
      timestamp: string;
    }>;
  };
}

export interface ProductIndexItem {
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

export type ProductIndex = ProductIndexItem[];
