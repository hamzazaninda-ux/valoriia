import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { publishProduct, unpublishProduct, readProductForAdmin } from '$lib/content/products';
import { StatusActionSchema, parseJsonBody, validatePublish, createValidationError, ERROR_CODES } from '$lib/validation';

export const POST: RequestHandler = async ({ params, request }) => {
  const { body, error: parseError } = await parseJsonBody(request);
  if (parseError) {
    return json(parseError.response, { status: parseError.status });
  }

  const result = StatusActionSchema.safeParse(body);
  if (!result.success) {
    return json(
      createValidationError([{ field: 'action', code: ERROR_CODES.INVALID_FORMAT, message: 'الإجراء يجب أن يكون publish أو unpublish' }]),
      { status: 400 }
    );
  }

  const { action } = result.data;
  const slug = params.slug;

  try {
    if (action === 'publish') {
      // Read product for publish validation
      const product = await readProductForAdmin(slug);
      if (!product) {
        return json(
          createValidationError([{ field: 'product', code: ERROR_CODES.PRODUCT_NOT_FOUND, message: 'المنتج غير موجود' }]),
          { status: 404 }
        );
      }

      // Validate product is ready for publish
      const publishValidation = await validatePublish(product);
      if (!publishValidation.valid && publishValidation.error) {
        return json(publishValidation.error, { status: 400 });
      }

      await publishProduct(slug);
      return json({ success: true, message: 'Product published' });
    }

    if (action === 'unpublish') {
      // HIGH-3 fix — check existence before unpublish so we return 404 instead of 500.
      const product = await readProductForAdmin(slug);
      if (!product) {
        return json(
          createValidationError([{ field: 'product', code: ERROR_CODES.PRODUCT_NOT_FOUND, message: 'المنتج غير موجود' }]),
          { status: 404 }
        );
      }

      await unpublishProduct(slug);
      return json({ success: true, message: 'Product unpublished' });
    }

    return json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return json({ error: 'Failed to update product status' }, { status: 500 });
  }
};
