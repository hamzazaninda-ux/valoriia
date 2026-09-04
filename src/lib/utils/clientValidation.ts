// =============================================================================
// Client-Side Validation Utilities
// =============================================================================
// Lightweight validation functions for admin forms.
// These mirror the Zod schema rules without importing Zod on the client.

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// =============================================================================
// Plain Text Validation (rejects HTML)
// =============================================================================
function containsHtml(value: string): boolean {
  return /<[^>]*>/.test(value);
}

// =============================================================================
// Slug Validation
// =============================================================================
export function validateSlug(slug: string): string | null {
  if (!slug.trim()) {
    return 'الرابط مطلوب';
  }
  if (slug.length > 100) {
    return 'الرابط طويل جداً';
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطة فقط';
  }
  return null;
}

// =============================================================================
// Required Field Validation
// =============================================================================
export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) {
    return `${fieldName} مطلوب`;
  }
  if (containsHtml(value)) {
    return 'لا يسمح بعلامات HTML في هذا الحقل';
  }
  return null;
}

// =============================================================================
// Max Length Validation
// =============================================================================
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string
): string | null {
  if (value.length > maxLength) {
    return `${fieldName} يجب أن يكون ${maxLength} حرف أو أقل`;
  }
  return null;
}

// =============================================================================
// Plain Text Validation (rejects HTML)
// =============================================================================
export function validatePlainText(
  value: string,
  fieldName: string
): string | null {
  if (containsHtml(value)) {
    return 'لا يسمح بعلامات HTML في هذا الحقل';
  }
  return null;
}

// =============================================================================
// URL Validation (HTTP/HTTPS only)
// =============================================================================
export function validateHttpUrl(url: string): string | null {
  if (!url) {
    return null; // Empty is allowed for optional fields
  }
  const trimmed = url.trim();
  if (trimmed === '') {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    const valid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    if (!valid) {
      return 'رابط غير صالح (يجب أن يبدأ بـ http:// أو https://)';
    }
  } catch {
    return 'رابط غير صالح (يجب أن يبدأ بـ http:// أو https://)';
  }
  return null;
}

// =============================================================================
// Phone Number Validation (Moroccan)
// =============================================================================
export function validatePhoneNumber(phone: string): string | null {
  if (!phone || phone === '') {
    return null; // Empty is allowed
  }
  const clean = phone.replace(/[\s\-()]/g, '');
  const isValid =
    /^0[567]\d{8}$/.test(clean) ||
    /^(?:\+212|00212|212)[567]\d{8}$/.test(clean);
  if (!isValid) {
    return 'رقم الهاتف غير صحيح';
  }
  return null;
}

// =============================================================================
// Number Validation
// =============================================================================
export function validatePositiveNumber(
  value: number,
  fieldName: string
): string | null {
  if (value <= 0) {
    return `${fieldName} يجب أن يكون أكبر من صفر`;
  }
  return null;
}

export function validateNonNegativeNumber(
  value: number,
  fieldName: string
): string | null {
  if (value < 0) {
    return `${fieldName} يجب أن يكون صفر أو أكبر`;
  }
  return null;
}

// =============================================================================
// Rating Validation
// =============================================================================
export function validateRating(rating: number): string | null {
  if (rating < 1 || rating > 5) {
    return 'التقييم يجب أن يكون بين 1 و 5';
  }
  return null;
}

// =============================================================================
// Order Validation
// =============================================================================
export function validateOrder(order: {
  sku: string;
  googleSheetsUrl: string;
  phoneConfirmation: boolean;
  whatsappNumber: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!order.sku || !order.sku.trim()) {
    errors.push({ field: 'sku', message: 'SKU مطلوب' });
  } else if (order.sku.length > 50) {
    errors.push({ field: 'sku', message: 'SKU طويل جداً (50 حرف كحد أقصى)' });
  }

  if (order.googleSheetsUrl && order.googleSheetsUrl.trim()) {
    const urlError = validateHttpUrl(order.googleSheetsUrl);
    if (urlError) {
      errors.push({ field: 'googleSheetsUrl', message: 'رابط Google Sheets غير صالح' });
    }
  }

  const phoneError = validatePhoneNumber(order.whatsappNumber);
  if (phoneError) {
    errors.push({ field: 'whatsappNumber', message: phoneError });
  }

  return errors;
}

// =============================================================================
// Gallery Validation
// =============================================================================
export function validateGallery(gallery: Array<{ src: string; alt: string }>): ValidationError[] {
  const errors: ValidationError[] = [];

  gallery.forEach((image, index) => {
    if (image.src && image.src.trim()) {
      const urlError = validateHttpUrl(image.src);
      if (urlError) {
        errors.push({ field: `gallery[${index}].src`, message: `رابط الصورة ${index + 1} غير صالح` });
      }
    }
    if (image.alt && containsHtml(image.alt)) {
      errors.push({ field: `gallery[${index}].alt`, message: `لا يسمح بعلامات HTML في النص البديل للصورة ${index + 1}` });
    } else if (image.alt && image.alt.length > 200) {
      errors.push({ field: `gallery[${index}].alt`, message: `النص البديل للصورة ${index + 1} طويل جداً` });
    }
  });

  return errors;
}

// =============================================================================
// Carousel Validation
// =============================================================================
export function validateCarousel(carousel: Array<{ image: string; title?: string }>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (carousel) {
    carousel.forEach((slide, index) => {
      if (slide.image && slide.image.trim()) {
        const urlError = validateHttpUrl(slide.image);
        if (urlError) {
          errors.push({ field: `carousel[${index}].image`, message: `رابط صورة الكاروسيل ${index + 1} غير صالح` });
        }
      }
      if (slide.title && containsHtml(slide.title)) {
        errors.push({ field: `carousel[${index}].title`, message: `لا يسمح بعلامات HTML في عنوان شريحة الكاروسيل ${index + 1}` });
      }
    });
  }

  return errors;
}

// =============================================================================
// Offer Validation
// =============================================================================
export function validateOffer(offer: {
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  quantity: number;
  badge: string | null;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!offer.title || !offer.title.trim()) {
    errors.push({ field: 'title', message: 'عنوان العرض مطلوب' });
  } else if (containsHtml(offer.title)) {
    errors.push({ field: 'title', message: 'لا يسمح بعلامات HTML في عنوان العرض' });
  } else if (offer.title.length > 100) {
    errors.push({ field: 'title', message: 'عنوان العرض طويل جداً' });
  }

  if (containsHtml(offer.subtitle)) {
    errors.push({ field: 'subtitle', message: 'لا يسمح بعلامات HTML في وصف العرض' });
  } else if (offer.subtitle.length > 200) {
    errors.push({ field: 'subtitle', message: 'وصف العرض طويل جداً' });
  }

  if (offer.price <= 0) {
    errors.push({ field: 'price', message: 'السعر يجب أن يكون أكبر من صفر' });
  }

  if (offer.originalPrice <= 0) {
    errors.push({ field: 'originalPrice', message: 'السعر الأصلي يجب أن يكون أكبر من صفر' });
  }

  if (offer.quantity < 1) {
    errors.push({ field: 'quantity', message: 'الكمية يجب أن تكون 1 على الأقل' });
  }

  if (offer.badge && containsHtml(offer.badge)) {
    errors.push({ field: 'badge', message: 'لا يسمح بعلامات HTML في الشارة' });
  } else if (offer.badge && offer.badge.length > 50) {
    errors.push({ field: 'badge', message: 'الشارة طويلة جداً' });
  }

  return errors;
}

// =============================================================================
// Product Content Validation
// =============================================================================
export function validateProductContent(content: {
  title: string;
  subtitle: string;
  heroImage: string;
  rating: number;
  reviewCount: number;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!content.title || !content.title.trim()) {
    errors.push({ field: 'title', message: 'عنوان المنتج مطلوب' });
  } else if (containsHtml(content.title)) {
    errors.push({ field: 'title', message: 'لا يسمح بعلامات HTML في العنوان' });
  } else if (content.title.length > 200) {
    errors.push({ field: 'title', message: 'العنوان طويل جداً' });
  }

  if (containsHtml(content.subtitle)) {
    errors.push({ field: 'subtitle', message: 'لا يسمح بعلامات HTML في العنوان الفرعي' });
  } else if (content.subtitle.length > 500) {
    errors.push({ field: 'subtitle', message: 'العنوان الفرعي طويل جداً' });
  }

  const heroError = validateHttpUrl(content.heroImage);
  if (heroError) {
    errors.push({ field: 'heroImage', message: heroError });
  }

  if (content.rating < 1 || content.rating > 5) {
    errors.push({ field: 'rating', message: 'التقييم يجب أن يكون بين 1 و 5' });
  }

  if (content.reviewCount < 0) {
    errors.push({ field: 'reviewCount', message: 'عدد المراجعات يجب أن يكون صفر أو أكبر' });
  }

  return errors;
}

// =============================================================================
// SEO Validation
// =============================================================================
export function validateSeo(
  seo: {
    metaTitle: string;
    metaDescription: string;
  },
  isPublishing: boolean = false
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isPublishing && (!seo.metaTitle || !seo.metaTitle.trim())) {
    errors.push({ field: 'metaTitle', message: 'عنوان SEO مطلوب للنشر' });
  } else if (seo.metaTitle && containsHtml(seo.metaTitle)) {
    errors.push({ field: 'metaTitle', message: 'لا يسمح بعلامات HTML في عنوان SEO' });
  } else if (seo.metaTitle && seo.metaTitle.length > 60) {
    errors.push({ field: 'metaTitle', message: 'عنوان SEO طويل جداً (60 حرف كحد أقصى)' });
  }

  if (isPublishing && (!seo.metaDescription || !seo.metaDescription.trim())) {
    errors.push({ field: 'metaDescription', message: 'وصف SEO مطلوب للنشر' });
  } else if (seo.metaDescription && containsHtml(seo.metaDescription)) {
    errors.push({ field: 'metaDescription', message: 'لا يسمح بعلامات HTML في وصف SEO' });
  } else if (seo.metaDescription && seo.metaDescription.length > 160) {
    errors.push({ field: 'metaDescription', message: 'وصف SEO طويل جداً (160 حرف كحد أقصى)' });
  }

  return errors;
}

// =============================================================================
// Settings Validation
// =============================================================================
export function validateBrandSettings(brand: {
  name: string;
  tagline: string;
  logo: string;
  favicon: string;
  whatsappNumber: string;
  supportHours: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!brand.name || !brand.name.trim()) {
    errors.push({ field: 'brand.name', message: 'اسم المتجر مطلوب' });
  } else if (containsHtml(brand.name)) {
    errors.push({ field: 'brand.name', message: 'لا يسمح بعلامات HTML في اسم المتجر' });
  } else if (brand.name.length > 100) {
    errors.push({ field: 'brand.name', message: 'اسم المتجر طويل جداً' });
  }

  if (containsHtml(brand.tagline)) {
    errors.push({ field: 'brand.tagline', message: 'لا يسمح بعلامات HTML في الشعار' });
  } else if (brand.tagline.length > 200) {
    errors.push({ field: 'brand.tagline', message: 'الشعار طويل جداً' });
  }

  const logoError = validateHttpUrl(brand.logo);
  if (logoError) {
    errors.push({ field: 'brand.logo', message: logoError });
  }

  if (brand.favicon && !brand.favicon.startsWith('/') && !/^https?:\/\/.+/.test(brand.favicon)) {
    errors.push({ field: 'brand.favicon', message: 'يجب أن يكون رابط صالح أو مسار يبدأ بـ /' });
  }

  const phoneError = validatePhoneNumber(brand.whatsappNumber);
  if (phoneError) {
    errors.push({ field: 'brand.whatsappNumber', message: phoneError });
  }

  if (!brand.supportHours || !brand.supportHours.trim()) {
    errors.push({ field: 'brand.supportHours', message: 'ساعات الدعم مطلوبة' });
  } else if (containsHtml(brand.supportHours)) {
    errors.push({ field: 'brand.supportHours', message: 'لا يسمح بعلامات HTML في ساعات الدعم' });
  } else if (brand.supportHours.length > 50) {
    errors.push({ field: 'brand.supportHours', message: 'ساعات الدعم طويلة جداً' });
  }

  return errors;
}

export function validateCommerceSettings(commerce: {
  currency: string;
  currencySymbol: string;
  freeShippingText: string;
  paymentMethod: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  const allowedCurrencies = ['MAD', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];
  if (!allowedCurrencies.includes(commerce.currency)) {
    errors.push({ field: 'commerce.currency', message: 'العملة غير صالحة' });
  }

  if (!commerce.currencySymbol || !commerce.currencySymbol.trim()) {
    errors.push({ field: 'commerce.currencySymbol', message: 'رمز العملة مطلوب' });
  } else if (containsHtml(commerce.currencySymbol)) {
    errors.push({ field: 'commerce.currencySymbol', message: 'لا يسمح بعلامات HTML في رمز العملة' });
  } else if (commerce.currencySymbol.length > 5) {
    errors.push({ field: 'commerce.currencySymbol', message: 'رمز العملة طويل جداً' });
  }

  if (!commerce.freeShippingText || !commerce.freeShippingText.trim()) {
    errors.push({ field: 'commerce.freeShippingText', message: 'رسالة الشحن المجاني مطلوبة' });
  } else if (containsHtml(commerce.freeShippingText)) {
    errors.push({ field: 'commerce.freeShippingText', message: 'لا يسمح بعلامات HTML في رسالة الشحن' });
  } else if (commerce.freeShippingText.length > 100) {
    errors.push({ field: 'commerce.freeShippingText', message: 'رسالة الشحن المجاني طويلة جداً' });
  }

  if (!commerce.paymentMethod || !commerce.paymentMethod.trim()) {
    errors.push({ field: 'commerce.paymentMethod', message: 'طريقة الدفع مطلوبة' });
  } else if (containsHtml(commerce.paymentMethod)) {
    errors.push({ field: 'commerce.paymentMethod', message: 'لا يسمح بعلامات HTML في طريقة الدفع' });
  } else if (commerce.paymentMethod.length > 100) {
    errors.push({ field: 'commerce.paymentMethod', message: 'طريقة الدفع طويلة جداً' });
  }

  return errors;
}

// =============================================================================
// Full Product Validation
// =============================================================================
export function validateProduct(
  product: {
    slug: string;
    template: string;
    published: {
      content: {
        title: string;
        subtitle: string;
        heroImage: string;
        rating: number;
        reviewCount: number;
        gallery: Array<{ src: string; alt: string }>;
        carousel?: Array<{ image: string; title?: string }>;
      };
      pricing: {
        offers: Array<{
          title: string;
          subtitle: string;
          price: number;
          originalPrice: number;
          quantity: number;
          badge: string | null;
        }>;
      };
      order: {
        sku: string;
        googleSheetsUrl: string;
        phoneConfirmation: boolean;
        whatsappNumber: string;
      };
      seo: {
        metaTitle: string;
        metaDescription: string;
      };
    };
  },
  isPublishing: boolean = false
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Slug validation
  const slugError = validateSlug(product.slug);
  if (slugError) {
    errors.push({ field: 'slug', message: slugError });
  }

  // Content validation
  errors.push(...validateProductContent(product.published.content));

  // Gallery validation
  errors.push(...validateGallery(product.published.content.gallery || []));

  // Carousel validation
  if (product.published.content.carousel) {
    errors.push(...validateCarousel(product.published.content.carousel));
  }

  // Offers validation
  if (!product.published.pricing.offers || product.published.pricing.offers.length === 0) {
    errors.push({ field: 'offers', message: 'يجب إضافة عرض واحد على الأقل' });
  } else {
    product.published.pricing.offers.forEach((offer, index) => {
      const offerErrors = validateOffer(offer);
      offerErrors.forEach(err => {
        errors.push({ field: `offers[${index}].${err.field}`, message: err.message });
      });
    });
  }

  // Order validation
  errors.push(...validateOrder(product.published.order));

  // SEO validation
  errors.push(...validateSeo(product.published.seo, isPublishing));

  return errors;
}
