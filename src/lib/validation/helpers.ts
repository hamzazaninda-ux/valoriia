import { z, type ZodError, type ZodIssue } from 'zod';

// =============================================================================
// Constants
// =============================================================================
const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB

// =============================================================================
// Error Code Constants
// =============================================================================
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED: 'REQUIRED',
  INVALID_FORMAT: 'INVALID_FORMAT',
  TOO_SHORT: 'TOO_SHORT',
  TOO_LONG: 'TOO_LONG',
  INVALID_URL: 'INVALID_URL',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_GTM: 'INVALID_GTM',
  INVALID_SLUG: 'INVALID_SLUG',
  SLUG_TAKEN: 'SLUG_TAKEN',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  ALREADY_PUBLISHED: 'ALREADY_PUBLISHED',
  ALREADY_DRAFT: 'ALREADY_DRAFT',
  NO_DRAFT: 'NO_DRAFT',
  MIN_OFFERS: 'MIN_OFFERS',
  INVALID_JSON: 'INVALID_JSON',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNEXPECTED_FIELD: 'UNEXPECTED_FIELD'
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// =============================================================================
// Arabic Admin Messages
// =============================================================================
export const ARABIC_MESSAGES: Record<string, string> = {
  REQUIRED: 'هذا الحقل مطلوب',
  INVALID_FORMAT: 'التنسيق غير صحيح',
  TOO_SHORT: 'النص قصير جداً',
  TOO_LONG: 'النص طويل جداً',
  INVALID_URL: 'رابط غير صالح',
  INVALID_PHONE: 'رقم الهاتف غير صحيح',
  INVALID_SLUG: 'الرابط غير صالح',
  SLUG_TAKEN: 'هذا الرابط مستخدم بالفعل',
  TEMPLATE_NOT_FOUND: 'القالب غير موجود',
  PRODUCT_NOT_FOUND: 'المنتج غير موجود',
  NO_DRAFT: 'لا توجد تغييرات للنشر',
  MIN_OFFERS: 'يجب إضافة عرض واحد على الأقل',
  INVALID_JSON: 'بيانات غير صالحة',
  PAYLOAD_TOO_LARGE: 'البيانات كبيرة جداً'
};

// =============================================================================
// Field Error Interface
// =============================================================================
export interface FieldError {
  field: string;
  code: string;
  message: string;
}

// =============================================================================
// Validation Error Response Interface
// =============================================================================
export interface ValidationErrorResponse {
  error: string;
  code: string;
  details: FieldError[];
}

// =============================================================================
// Create Validation Error Response
// =============================================================================
export function createValidationError(
  details: FieldError[],
  code: string = ERROR_CODES.VALIDATION_ERROR
): ValidationErrorResponse {
  return {
    error: 'Validation failed',
    code,
    details
  };
}

// =============================================================================
// Parse JSON Body with Error Handling
// =============================================================================
// Returns parsed body or null with response already set
export async function parseJsonBody(
  request: Request
): Promise<{ body: unknown; error?: { status: number; response: ValidationErrorResponse } }> {
  // Check content-length header for payload size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    return {
      body: null,
      error: {
        status: 413,
        response: createValidationError(
          [{ field: 'body', code: ERROR_CODES.PAYLOAD_TOO_LARGE, message: ARABIC_MESSAGES.PAYLOAD_TOO_LARGE }],
          ERROR_CODES.PAYLOAD_TOO_LARGE
        )
      }
    };
  }

  try {
    const body = await request.json();
    return { body };
  } catch {
    return {
      body: null,
      error: {
        status: 400,
        response: createValidationError(
          [{ field: 'body', code: ERROR_CODES.INVALID_JSON, message: ARABIC_MESSAGES.INVALID_JSON }],
          ERROR_CODES.INVALID_JSON
        )
      }
    };
  }
}

// =============================================================================
// Map Zod Issue Code to Our Error Code
// =============================================================================
function mapZodIssueToErrorCode(issue: ZodIssue): string {
  switch (issue.code) {
    case 'too_small':
      return issue.minimum === 1 ? ERROR_CODES.REQUIRED : ERROR_CODES.TOO_SHORT;
    case 'too_big':
      return ERROR_CODES.TOO_LONG;
    case 'invalid_type':
      // @ts-expect-error accessing received on ZodIssue
      if (issue.received === 'undefined' || issue.received === 'null') {
        return ERROR_CODES.REQUIRED;
      }
      return ERROR_CODES.INVALID_FORMAT;
    case 'invalid_format':
      return ERROR_CODES.INVALID_FORMAT;
    case 'invalid_value':
      return ERROR_CODES.INVALID_FORMAT;
    case 'invalid_union':
      return ERROR_CODES.INVALID_FORMAT;
    case 'invalid_key':
      return ERROR_CODES.INVALID_FORMAT;
    case 'invalid_element':
      return ERROR_CODES.INVALID_FORMAT;
    case 'not_multiple_of':
      return ERROR_CODES.INVALID_FORMAT;
    default:
      return ERROR_CODES.VALIDATION_ERROR;
  }
}

// =============================================================================
// Get Arabic Message for Error Code
// =============================================================================
function getArabicMessage(code: string, fallback: string): string {
  return ARABIC_MESSAGES[code] || fallback;
}

// =============================================================================
// Format Zod Error into Validation Error Response
// =============================================================================
export function formatZodError(zodError: ZodError, pathPrefix?: string): ValidationErrorResponse {
  const details: FieldError[] = zodError.issues.map((issue) => {
    const fieldPath = pathPrefix
      ? `${pathPrefix}.${issue.path.join('.')}`
      : issue.path.join('.');

    const errorCode = mapZodIssueToErrorCode(issue);

    let message = issue.message;

    // Replace generic / raw Zod messages with Arabic defaults
    if (!message || message === 'Invalid input' || message === 'Required' || message === 'Invalid URL') {
      message = getArabicMessage(errorCode, issue.message);
    }

    // Specific formatting for image URL fields
    if (fieldPath.includes('image') || fieldPath.includes('heroImage') || fieldPath.includes('gallery') || fieldPath.includes('carousel') || fieldPath.includes('src')) {
      const slideMatch = fieldPath.match(/carousel[^\d]*(\d+)/) || fieldPath.match(/carousel\.(\d+)/) || fieldPath.match(/gallery[^\d]*(\d+)/);
      const indexStr = slideMatch ? ` رقم ${parseInt(slideMatch[1], 10) + 1}` : '';
      message = `رابط الصورة غير صالح${indexStr} - يجب أن يبدأ الرابط بـ http أو https`;
    } else if (errorCode === ERROR_CODES.INVALID_FORMAT || errorCode === ERROR_CODES.VALIDATION_ERROR) {
      const fieldName = issue.path[issue.path.length - 1];
      if (issue.code === 'invalid_union') {
        message = `القيمة غير صالحة للحقل: ${fieldName}`;
      }
    }

    return {
      field: fieldPath || 'root',
      code: errorCode,
      message
    };
  });

  return createValidationError(details);
}
