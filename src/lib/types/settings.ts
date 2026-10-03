export interface BrandSettings {
  name: string;
  tagline: string;
  logo: string;
  favicon: string;
  heroImage: string;
  whatsappNumber: string;
  supportHours: string;
}

export interface CommerceSettings {
  currency: string;
  currencySymbol: string;
  freeShippingText: string;
  paymentMethod: string;
  googleSheetsUrl: string;
  postOrderUpsellImage?: string;
}

export interface TrackingSettings {
  gtmContainerId: string;
  facebookPixelId: string;
  tiktokPixelId: string;
  snapchatPixelId: string;
  googleAnalyticsId: string;
  googleAdsId: string;
  defaultOgImage: string;
  siteUrl: string;
  customHeadScripts: string;
  customBodyScripts: string;
}

export interface GlobalSettings {
  brand: BrandSettings;
  commerce: CommerceSettings;
  tracking: TrackingSettings;
}
