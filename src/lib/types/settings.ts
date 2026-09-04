export interface BrandSettings {
  name: string;
  tagline: string;
  logo: string;
  favicon: string;
  whatsappNumber: string;
  supportHours: string;
}

export interface CommerceSettings {
  currency: string;
  currencySymbol: string;
  freeShippingText: string;
  paymentMethod: string;
  googleSheetsUrl: string;
}

export interface TrackingSettings {
  gtmContainerId: string;
  facebookPixelId: string;
  tiktokPixelId: string;
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
