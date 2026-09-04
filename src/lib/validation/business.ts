import { listProductsForAdmin, readProduct, readProductDraft } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';
import { createValidationError, ERROR_CODES, ARABIC_MESSAGES } from './helpers';
import { getAvailableTemplateIds } from '$lib/content/templateLoader';
import type { ValidationErrorResponse, FieldError } from './helpers';
import type { Product } from '$lib/types/product';

// =============================================================================
// Slug Uniqueness Check
// =============================================================================
// Verifies that no other product already uses the same slug.
// Ignores the current product during updates.
export async function checkSlugUniqueness(
  slug: string,
  currentSlug?: string
): Promise<{ valid: boolean; error?: ValidationErrorResponse }> {
  // If slug hasn't changed, it's always valid
  if (currentSlug && slug === currentSlug) {
    return { valid: true };
  }

  try {
    const products = await listProductsForAdmin();
    const slugExists = products.some(p => p.slug === slug);

    if (slugExists) {
      return {
        valid: false,
        error: createValidationError(
          [{ field: 'slug', code: ERROR_CODES.SLUG_TAKEN, message: ARABIC_MESSAGES.SLUG_TAKEN }],
          ERROR_CODES.SLUG_TAKEN
        )
      };
    }

    return { valid: true };
  } catch {
    // If we can't check uniqueness (e.g., no products yet), allow it
    return { valid: true };
  }
}

// =============================================================================
// Template Existence Check
// =============================================================================
// Verifies that the selected template exists in the template registry
// and that the corresponding component file exists.
export async function checkTemplateExists(
  templateId: string
): Promise<{ valid: boolean; error?: ValidationErrorResponse }> {
  try {
    const { getTemplate } = await import('$lib/content/templates');
    const template = await getTemplate(templateId);

    if (!template) {
      return {
        valid: false,
        error: createValidationError(
          [{ field: 'template', code: ERROR_CODES.TEMPLATE_NOT_FOUND, message: ARABIC_MESSAGES.TEMPLATE_NOT_FOUND }],
          ERROR_CODES.TEMPLATE_NOT_FOUND
        )
      };
    }

    const availableComponents = getAvailableTemplateIds();
    if (!availableComponents.includes(templateId)) {
      return {
        valid: false,
        error: createValidationError(
          [{ field: 'template', code: ERROR_CODES.TEMPLATE_NOT_FOUND, message: `القالب "${templateId}" مسجل لكن مكون العرض غير موجود` }],
          ERROR_CODES.TEMPLATE_NOT_FOUND
        )
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: createValidationError(
        [{ field: 'template', code: ERROR_CODES.TEMPLATE_NOT_FOUND, message: ARABIC_MESSAGES.TEMPLATE_NOT_FOUND }],
        ERROR_CODES.TEMPLATE_NOT_FOUND
      )
    };
  }
}

// =============================================================================
// Publish Validation
// =============================================================================
// Validates that a product is ready to be published.
// Checks: valid product, draft exists, title, hero image, offers, template.
export async function validatePublish(
  product: Product
): Promise<{ valid: boolean; error?: ValidationErrorResponse }> {
  const errors: FieldError[] = [];

  // Check if product has a draft (or published content if no draft)
  const content = product.draft || product.published;

  if (!content) {
    errors.push({
      field: 'draft',
      code: ERROR_CODES.NO_DRAFT,
      message: ARABIC_MESSAGES.NO_DRAFT
    });
  }

  // Check title exists
  if (!content?.content?.title || content.content.title.trim() === '') {
    errors.push({
      field: 'published.content.title',
      code: ERROR_CODES.REQUIRED,
      message: 'عنوان المنتج مطلوب للنشر'
    });
  }

  // Check hero image exists
  if (!content?.content?.heroImage || content.content.heroImage.trim() === '') {
    errors.push({
      field: 'published.content.heroImage',
      code: ERROR_CODES.REQUIRED,
      message: 'صورة المنتج الرئيسية مطلوبة للنشر'
    });
  }

  // Check at least one offer exists
  if (!content?.pricing?.offers || content.pricing.offers.length === 0) {
    errors.push({
      field: 'published.pricing.offers',
      code: ERROR_CODES.MIN_OFFERS,
      message: ARABIC_MESSAGES.MIN_OFFERS
    });
  }

  // Check template exists
  const templateCheck = await checkTemplateExists(product.template);
  if (!templateCheck.valid && templateCheck.error) {
    errors.push(...templateCheck.error.details);
  }

  // Check SEO title exists (required for publish, allowed empty for drafts)
  if (!content?.seo?.metaTitle || content.seo.metaTitle.trim() === '') {
    errors.push({
      field: 'seo.metaTitle',
      code: ERROR_CODES.REQUIRED,
      message: 'عنوان SEO مطلوب للنشر'
    });
  }

  // Check SEO description exists (required for publish, allowed empty for drafts)
  if (!content?.seo?.metaDescription || content.seo.metaDescription.trim() === '') {
    errors.push({
      field: 'seo.metaDescription',
      code: ERROR_CODES.REQUIRED,
      message: 'وصف SEO مطلوب للنشر'
    });
  }

  // Check gallery images have valid URLs
  if (content?.content?.gallery && content.content.gallery.length > 0) {
    content.content.gallery.forEach((image, index) => {
      if (image.src && image.src.trim()) {
        try {
          const url = new URL(image.src);
          if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            errors.push({
              field: `content.gallery[${index}].src`,
              code: ERROR_CODES.INVALID_URL,
              message: `رابط الصورة ${index + 1} غير صالح`
            });
          }
        } catch {
          errors.push({
            field: `content.gallery[${index}].src`,
            code: ERROR_CODES.INVALID_URL,
            message: `رابط الصورة ${index + 1} غير صالح`
          });
        }
      }
    });
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: createValidationError(errors)
    };
  }

  return { valid: true };
}


// =============================================================================
// Validate Product for Create/Update
// =============================================================================
// Runs all business rule checks for product creation/update.
// For updates, pass `originalSlug` (the slug from the URL / database) so that
// slug uniqueness is checked against other products, not the product itself.
export async function validateProductBusinessRules(
  product: Product,
  isCreate: boolean = false,
  originalSlug?: string
): Promise<{ valid: boolean; error?: ValidationErrorResponse }> {
  const errors: FieldError[] = [];

  // Check slug uniqueness:
  // - On create: no currentSlug → any existing product with the same slug is a conflict.
  // - On update: pass the ORIGINAL slug from the URL so that keeping the same slug is allowed
  //   while still catching conflicts with other products.
  const slugCheck = await checkSlugUniqueness(
    product.slug,
    isCreate ? undefined : (originalSlug ?? product.slug)
  );
  if (!slugCheck.valid && slugCheck.error) {
    errors.push(...slugCheck.error.details);
  }

  // Check template exists
  const templateCheck = await checkTemplateExists(product.template);
  if (!templateCheck.valid && templateCheck.error) {
    errors.push(...templateCheck.error.details);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: createValidationError(errors)
    };
  }

  return { valid: true };
}
