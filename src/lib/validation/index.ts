// =============================================================================
// Validation Layer - Barrel Exports
// =============================================================================

// Common schemas
export {
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
  ColorHexSchema,
  BooleanSchema,
  ProductStatusSchema,
  ChangelogActionSchema,
  PlainTextSchema,
  NonEmptyPlainTextSchema
} from './common';

// Product schemas
export {
  OfferSchema,
  GalleryImageSchema,
  FaqItemSchema,
  ProductContentSchema,
  ProductPricingSchema,
  ProductOrderSchema,
  ProductSeoSchema,
  ProductTrackingSchema,
  ProductAdvancedSchema,
  ProductChangelogEntrySchema,
  ProductMetaSchema,
  ProductVersionSchema,
  ProductPublishedSchema,
  ProductDraftSchema,
  ProductSchema,
  ProductCreateSchema,
  ProductUpdateSchema,
  ProductIndexItemSchema,
  ProductIndexSchema
} from './product';

// Product types
export type {
  Offer,
  GalleryImage,
  FaqItem,
  ProductContent,
  ProductPricing,
  ProductOrder,
  ProductSeo,
  ProductTracking,
  ProductAdvanced,
  ProductChangelogEntry,
  ProductMeta,
  ProductVersion,
  ProductPublished,
  ProductDraft,
  Product,
  ProductCreate,
  ProductUpdate,
  ProductIndexItem,
  ProductIndex
} from './product';

// Settings schemas
export {
  BrandSettingsSchema,
  CommerceSettingsSchema,
  TrackingSettingsSchema,
  GlobalSettingsSchema
} from './settings';

// Settings types
export type {
  BrandSettings,
  CommerceSettings,
  TrackingSettings,
  GlobalSettings
} from './settings';

// Status schemas
export {
  StatusActionSchema
} from './status';

export type {
  StatusAction
} from './status';

// Business rules
export {
  checkSlugUniqueness,
  checkTemplateExists,
  validatePublish,
  validateProductBusinessRules
} from './business';

// Helpers
export {
  ERROR_CODES,
  formatZodError,
  createValidationError,
  parseJsonBody
} from './helpers';

export type {
  ErrorCode,
  FieldError,
  ValidationErrorResponse
} from './helpers';
