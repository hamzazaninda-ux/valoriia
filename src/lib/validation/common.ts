import { z } from 'zod';

// =============================================================================
// Slug Schema
// =============================================================================
// Regex: ^[a-z0-9]+(-[a-z0-9]+)*$
// Lowercase alphanumeric + hyphens, 1-100 chars
export const SlugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be 100 characters or less')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens');

// =============================================================================
// URL Schema (HTTP/HTTPS only)
// =============================================================================
// Validates HTTP/HTTPS URLs. Allows empty string for optional fields.
// Uses the native URL constructor to reject malformed URLs (e.g., https:// with no hostname).
export const HttpUrlSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (val === '') return true;
      try {
        const url = new URL(val);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    },
    'رابط غير صالح (يجب أن يبدأ بـ http:// أو https://)'
  );

// =============================================================================
// URL or Path Schema (HTTP/HTTPS or relative paths)
// =============================================================================
// Allows HTTP/HTTPS URLs or relative paths starting with /
export const UrlOrPathSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === '' || /^https?:\/\/.+/.test(val) || /^\/.+/.test(val),
    'Must be a valid URL or path starting with /'
  );

// =============================================================================
// Non-Empty String Schema
// =============================================================================
// Trims whitespace, requires length >= 1
export const NonEmptyStringSchema = z
  .string()
  .trim()
  .min(1, 'This field is required');

// =============================================================================
// Optional String Schema (allows empty string)
// =============================================================================
export const OptionalStringSchema = z.string();

// =============================================================================
// Positive Number Schema
// =============================================================================
// Must be a number > 0
export const PositiveNumberSchema = z.number().positive('Must be a positive number');

// =============================================================================
// Non-Negative Number Schema
// =============================================================================
// Must be a number >= 0
export const NonNegativeNumberSchema = z.number().min(0, 'Must be zero or more');

// =============================================================================
// ISO DateTime Schema
// =============================================================================
// Validates ISO 8601 datetime strings strictly.
// Uses Zod's built-in datetime() which enforces full ISO 8601 format
// including date, time, and timezone offset.
export const IsoDateTimeSchema = z.string().datetime({
  message: 'Must be a valid ISO 8601 datetime with timezone offset (e.g., 2024-01-15T10:30:00Z or 2024-01-15T10:30:00+01:00)'
});

// =============================================================================
// Currency Schema
// =============================================================================
// Validates currency code from allowed list
export const CurrencySchema = z.enum(['MAD', 'USD', 'EUR', 'GBP', 'SAR', 'AED']);

// =============================================================================
// GTM Container ID Schema
// =============================================================================
// Validates GTM container ID format: GTM-XXXXXXX
export const GtmContainerIdSchema = z.string().refine(
  (val) => val === '' || /^GTM-[A-Z0-9]+$/.test(val),
  'Must be a valid GTM container ID (e.g., GTM-XXXXXXX)'
);

// =============================================================================
// Phone Number Schema (Moroccan)
// =============================================================================
// Validates Moroccan phone number format
export const PhoneNumberSchema = z.string().refine(
  (val) => {
    if (val === '') return true;
    const clean = val.replace(/[\s\-()]/g, '');
    return /^0[567]\d{8}$/.test(clean) || /^(?:\+212|00212|212)[567]\d{8}$/.test(clean);
  },
  'Must be a valid Moroccan phone number'
);

// =============================================================================
// Color Hex Schema (future use)
// =============================================================================
// Validates CSS hex color
export const ColorHexSchema = z.string().refine(
  (val) => val === '' || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val),
  'Must be a valid hex color (e.g., #fff or #ffffff)'
);

// =============================================================================
// Boolean Schema
// =============================================================================
export const BooleanSchema = z.boolean();

// =============================================================================
// Status Schema
// =============================================================================
// Product status enum
export const ProductStatusSchema = z.enum(['draft', 'published', 'archived']);

// =============================================================================
// Changelog Action Schema
// =============================================================================
export const ChangelogActionSchema = z.enum(['created', 'published', 'archived', 'updated', 'unpublished']);

// =============================================================================
// Plain Text Schema (no HTML tags)
// =============================================================================
// Rejects strings containing HTML tags. For fields that should never contain markup.
export const PlainTextSchema = z.string().refine(
  (val) => !/<[^>]*>/.test(val),
  'HTML tags are not allowed in this field'
);

// =============================================================================
// Non-Empty Plain Text Schema
// =============================================================================
// Trims whitespace, requires length >= 1, rejects HTML tags
export const NonEmptyPlainTextSchema = z
  .string()
  .trim()
  .min(1, 'This field is required')
  .refine(
    (val) => !/<[^>]*>/.test(val),
    'HTML tags are not allowed in this field'
  );
