import { z } from 'zod';
import {
  NonEmptyPlainTextSchema,
  PlainTextSchema,
  HttpUrlSchema,
  UrlOrPathSchema,
  PhoneNumberSchema,
  GtmContainerIdSchema,
  CurrencySchema
} from './common';

// =============================================================================
// Brand Settings Schema
// =============================================================================
export const BrandSettingsSchema = z.object({
  name: NonEmptyPlainTextSchema.max(100, 'Brand name must be 100 characters or less'),
  tagline: PlainTextSchema.max(200, 'Tagline must be 200 characters or less'),
  logo: HttpUrlSchema,
  favicon: UrlOrPathSchema,
  heroImage: UrlOrPathSchema.optional().default(''),
  whatsappNumber: PhoneNumberSchema,
  supportHours: NonEmptyPlainTextSchema.max(50, 'Support hours must be 50 characters or less')
}).strict();

export type BrandSettings = z.infer<typeof BrandSettingsSchema>;

// =============================================================================
// Commerce Settings Schema
// =============================================================================
export const CommerceSettingsSchema = z.object({
  currency: CurrencySchema,
  currencySymbol: NonEmptyPlainTextSchema.max(5, 'Currency symbol must be 5 characters or less'),
  freeShippingText: NonEmptyPlainTextSchema.max(100, 'Free shipping text must be 100 characters or less'),
  paymentMethod: NonEmptyPlainTextSchema.max(100, 'Payment method must be 100 characters or less'),
  googleSheetsUrl: HttpUrlSchema
});

export type CommerceSettings = z.infer<typeof CommerceSettingsSchema>;

// =============================================================================
// Tracking Settings Schema
// =============================================================================
export const TrackingSettingsSchema = z.object({
  gtmContainerId: GtmContainerIdSchema,
  facebookPixelId: z.string().optional().default(''),
  tiktokPixelId: z.string().optional().default(''),
  googleAnalyticsId: z.string().optional().default(''),
  googleAdsId: z.string().optional().default(''),
  defaultOgImage: z.string().optional().default(''),
  siteUrl: HttpUrlSchema,
  customHeadScripts: z.string().optional().default(''),
  customBodyScripts: z.string().optional().default('')
});

export type TrackingSettings = z.infer<typeof TrackingSettingsSchema>;

// =============================================================================
// Global Settings Schema
// =============================================================================
export const GlobalSettingsSchema = z.object({
  brand: BrandSettingsSchema,
  commerce: CommerceSettingsSchema,
  tracking: TrackingSettingsSchema
});

export type GlobalSettings = z.infer<typeof GlobalSettingsSchema>;
