import { z } from 'zod';
import {
  SlugSchema,
  HttpUrlSchema,
  UrlOrPathSchema,
  NonEmptyStringSchema,
  OptionalStringSchema,
  PositiveNumberSchema,
  NonNegativeNumberSchema,
  IsoDateTimeSchema,
  CurrencySchema,
  GtmContainerIdSchema,
  PhoneNumberSchema,
  ProductStatusSchema,
  ChangelogActionSchema,
  PlainTextSchema,
  NonEmptyPlainTextSchema
} from './common';

// =============================================================================
// Offer Schema
// =============================================================================
// Validates a single pricing offer
export const OfferSchema = z.object({
  id: z.number().int().positive('Offer ID must be a positive integer'),
  title: NonEmptyPlainTextSchema.max(100, 'Offer title must be 100 characters or less'),
  subtitle: PlainTextSchema.max(200, 'Offer subtitle must be 200 characters or less'),
  price: PositiveNumberSchema,
  originalPrice: PositiveNumberSchema,
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  badge: PlainTextSchema.max(50, 'Badge must be 50 characters or less').nullable(),
  image: UrlOrPathSchema.optional().default(''),
  isPopular: z.boolean()
});

export type Offer = z.infer<typeof OfferSchema>;

// =============================================================================
// Gallery Image Schema
// =============================================================================
// Validates a gallery image entry
export const GalleryImageSchema = z.object({
  src: UrlOrPathSchema,
  alt: PlainTextSchema.max(200, 'Alt text must be 200 characters or less')
});

export type GalleryImage = z.infer<typeof GalleryImageSchema>;

// =============================================================================
// FAQ Item Schema
// =============================================================================
// Validates a FAQ entry
export const FaqItemSchema = z.object({
  question: PlainTextSchema,
  answer: PlainTextSchema
});

export type FaqItem = z.infer<typeof FaqItemSchema>;

// =============================================================================
// Carousel Schema
// =============================================================================
export const CarouselBadgeSchema = z.object({
  text: z.string(),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
});

export const CarouselSlideSchema = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      const copy = { ...val };
      if (copy.src && !copy.image) {
        copy.image = copy.src;
      }
      return copy;
    }
    return val;
  },
  z.object({
    image: UrlOrPathSchema,
    alt: z.string().optional(),
    title: z.string().optional(),
    bgGradient: z.string().optional(),
    badge: CarouselBadgeSchema.nullable().optional()
  })
);

export type CarouselSlide = z.infer<typeof CarouselSlideSchema>;

// =============================================================================
// Killers Schema
// =============================================================================
export const KillersSchema = z.object({
  bullets: z.array(z.string()).max(10).optional(),
  featuredReview: z.object({
    text: z.string(),
    image: UrlOrPathSchema,
    author: z.string()
  }).optional(),
  stories: z.array(z.object({
    name: z.string(),
    text: z.string()
  })).max(10).optional(),
  gridReviews: z.array(z.object({
    name: z.string(),
    text: z.string(),
    image: UrlOrPathSchema
  })).max(10).optional(),
  benefits: z.array(z.object({
    title: z.string(),
    text: z.string()
  })).max(10).optional(),
  usageSteps: z.array(z.string()).max(10).optional(),
  footerCta: z.object({
    text: z.string(),
    image: UrlOrPathSchema
  }).optional(),
  guarantees: z.array(z.object({
    title: z.string(),
    text: z.string(),
    image: UrlOrPathSchema
  })).max(10).optional()
}).optional();

// =============================================================================
// Product Content Schema
// =============================================================================
// Validates the content section of a product
export const ProductContentSchema = z.object({
  heroImage: UrlOrPathSchema,
  title: NonEmptyPlainTextSchema.max(200, 'Title must be 200 characters or less'),
  subtitle: PlainTextSchema.max(500, 'Subtitle must be 500 characters or less'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  reviewCount: z.number().int().min(0, 'Review count must be zero or more').max(999999, 'Review count must be less than 1,000,000'),
  gallery: z.array(GalleryImageSchema).max(20, 'Gallery can have at most 20 images'),
  carousel: z.array(CarouselSlideSchema).max(10, 'Carousel can have at most 10 images').optional(),
  faq: z.array(FaqItemSchema),
  footerText: OptionalStringSchema,
  killers: KillersSchema
});

export type ProductContent = z.infer<typeof ProductContentSchema>;

// =============================================================================
// Product Pricing Schema
// =============================================================================
// Validates the pricing section of a product
export const ProductPricingSchema = z.object({
  currency: CurrencySchema,
  offers: z.array(OfferSchema).max(10, 'Can have at most 10 offers')
});

export type ProductPricing = z.infer<typeof ProductPricingSchema>;

// =============================================================================
// Product Order Schema
// =============================================================================
// Validates the order section of a product
export const ProductOrderSchema = z.object({
  sku: NonEmptyStringSchema.max(50, 'SKU must be 50 characters or less'),
  // Optional: allow empty string for products that don't use Google Sheets
  googleSheetsUrl: HttpUrlSchema.optional().or(z.literal('')).transform(v => v ?? ''),
  phoneConfirmation: z.boolean(),
  whatsappNumber: PhoneNumberSchema
});

export type ProductOrder = z.infer<typeof ProductOrderSchema>;

// =============================================================================
// Product SEO Schema
// =============================================================================
// Validates the SEO section of a product
export const ProductSeoSchema = z.object({
  metaTitle: PlainTextSchema.max(60, 'Meta title must be 60 characters or less'),
  // Allow empty string during save/create; non-empty is enforced at publish time in validatePublish()
  metaDescription: PlainTextSchema.max(160, 'Meta description must be 160 characters or less'),
  ogImage: HttpUrlSchema.optional(),
  noindex: z.boolean()
});

export type ProductSeo = z.infer<typeof ProductSeoSchema>;

// =============================================================================
// Product Tracking Schema
// =============================================================================
// Validates the tracking section of a product
export const ProductTrackingSchema = z.object({
  gtmContainerId: GtmContainerIdSchema.optional(),
  facebookPixelId: z.string().optional(),
  googleAdsConversionId: z.string().optional()
});

export type ProductTracking = z.infer<typeof ProductTrackingSchema>;

// =============================================================================
// Product Advanced Schema
// =============================================================================
// Validates the advanced section of a product
// NOTE: These fields intentionally contain executable code.
// Only validate data type and max length - do NOT sanitize content.
export const ProductAdvancedSchema = z.object({
  customCss: z.string().max(50000, 'Custom CSS must be 50,000 characters or less').optional(),
  headScripts: z.string().max(50000, 'Head scripts must be 50,000 characters or less').optional(),
  bodyScripts: z.string().max(50000, 'Body scripts must be 50,000 characters or less').optional(),
  footerScripts: z.string().max(50000, 'Footer scripts must be 50,000 characters or less').optional()
});

export type ProductAdvanced = z.infer<typeof ProductAdvancedSchema>;

// =============================================================================
// Product Changelog Schema
// =============================================================================
// Validates changelog entries
export const ProductChangelogEntrySchema = z.object({
  action: ChangelogActionSchema,
  timestamp: IsoDateTimeSchema
});

export type ProductChangelogEntry = z.infer<typeof ProductChangelogEntrySchema>;

// =============================================================================
// Product Meta Schema
// =============================================================================
// Validates the meta section of a product
export const ProductMetaSchema = z.object({
  tracking: ProductTrackingSchema,
  advanced: ProductAdvancedSchema,
  changelog: z.array(ProductChangelogEntrySchema)
});

export type ProductMeta = z.infer<typeof ProductMetaSchema>;

// =============================================================================
// Product Version Schema (published or draft)
// =============================================================================
// Validates a complete product version (used for both published and draft)
export const ProductVersionSchema = z.object({
  content: ProductContentSchema,
  pricing: ProductPricingSchema,
  order: ProductOrderSchema,
  seo: ProductSeoSchema
});

export type ProductVersion = z.infer<typeof ProductVersionSchema>;

// =============================================================================
// Product Published Schema
// =============================================================================
// Validates the published content block
export const ProductPublishedSchema = ProductVersionSchema;

export type ProductPublished = z.infer<typeof ProductPublishedSchema>;

// =============================================================================
// Product Draft Schema
// =============================================================================
// Same as published, but nullable
export const ProductDraftSchema = ProductVersionSchema.nullable();

export type ProductDraft = z.infer<typeof ProductDraftSchema>;

// =============================================================================
// Product Schema (Full)
// =============================================================================
// Validates a complete product object
export const ProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  slug: SlugSchema,
  status: ProductStatusSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  template: z.string().min(1, 'Template ID is required'),
  published: ProductPublishedSchema,
  draft: ProductDraftSchema,
  meta: ProductMetaSchema
});

export type Product = z.infer<typeof ProductSchema>;

// =============================================================================
// Product Create Schema
// =============================================================================
// Stricter variant for creation
// - id is required
// - status must be 'draft'
// - draft must be null
export const ProductCreateSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  slug: SlugSchema,
  status: z.literal('draft'),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  template: z.string().min(1, 'Template ID is required'),
  published: ProductPublishedSchema,
  draft: z.literal(null),
  meta: ProductMetaSchema
});

export type ProductCreate = z.infer<typeof ProductCreateSchema>;

// =============================================================================
// Product Update Schema
// =============================================================================
// Variant for save
// - allows draft to be non-null
// - validates slug matches URL param (handled at API level)
export const ProductUpdateSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  slug: SlugSchema,
  status: ProductStatusSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  template: z.string().min(1, 'Template ID is required'),
  published: ProductPublishedSchema,
  draft: ProductDraftSchema,
  meta: ProductMetaSchema
});

export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

// =============================================================================
// Product Index Item Schema
// =============================================================================
// Validates an entry in _index.json
export const ProductIndexItemSchema = z.object({
  id: z.string(),
  slug: SlugSchema,
  title: PlainTextSchema,
  subtitle: PlainTextSchema,
  heroImage: z.string(),
  startingPrice: NonNegativeNumberSchema,
  status: ProductStatusSchema,
  template: z.string(),
  updatedAt: IsoDateTimeSchema
});

export type ProductIndexItem = z.infer<typeof ProductIndexItemSchema>;

// =============================================================================
// Product Index Schema
// =============================================================================
// Validates the full _index.json array
export const ProductIndexSchema = z.array(ProductIndexItemSchema);

export type ProductIndex = z.infer<typeof ProductIndexSchema>;
