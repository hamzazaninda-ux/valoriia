import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listProducts, readProduct, readProductForAdmin, createProduct, saveProductDraft, publishProduct, unpublishProduct, deleteProduct } from '$lib/content/products';
import { ProductCreateSchema, ProductUpdateSchema, parseJsonBody, formatZodError, createValidationError, validateProductBusinessRules, ERROR_CODES } from '$lib/validation';

export const GET: RequestHandler = async ({ url, params }) => {
  const slug = params.slug;

  if (slug) {
    const product = await readProduct(slug);
    if (!product) {
      return json({ error: 'Product not found' }, { status: 404 });
    }
    return json(product);
  }

  const products = await listProducts();
  return json(products);
};

export const POST: RequestHandler = async ({ request, params }) => {
  const { body, error: parseError } = await parseJsonBody(request);
  if (parseError) {
    return json(parseError.response, { status: parseError.status });
  }

  const result = ProductCreateSchema.safeParse(body);
  if (!result.success) {
    return json(formatZodError(result.error), { status: 400 });
  }

  if (result.data.slug !== params.slug) {
    return json({ error: 'Product slug must match the URL' }, { status: 400 });
  }

  // Business rules validation (isCreate=true → full uniqueness check against all products)
  const businessValidation = await validateProductBusinessRules(result.data, true);
  if (!businessValidation.valid && businessValidation.error) {
    return json(businessValidation.error, { status: 400 });
  }

  try {
    await createProduct(result.data);
    return json({ success: true, slug: result.data.slug });
  } catch (err) {
    console.error(`[products POST] createProduct failed for "${result.data.slug}":`, err);
    return json({ error: 'Failed to create product' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request, params }) => {
  const { body, error: parseError } = await parseJsonBody(request);
  if (parseError) {
    return json(parseError.response, { status: parseError.status });
  }

  const result = ProductUpdateSchema.safeParse(body);
  if (!result.success) {
    return json(formatZodError(result.error), { status: 400 });
  }

  if (result.data.slug !== params.slug) {
    return json({ error: 'Product slug cannot be changed after creation' }, { status: 400 });
  }

  // Business rules validation:
  // HIGH-2 fix — pass params.slug (the true original from the URL/database) as originalSlug
  // so the uniqueness check correctly identifies OTHER products with the same slug.
  const businessValidation = await validateProductBusinessRules(result.data, false, params.slug);
  if (!businessValidation.valid && businessValidation.error) {
    return json(businessValidation.error, { status: 400 });
  }

  try {
    await saveProductDraft(result.data);
    return json({ success: true });
  } catch (err) {
    return json({ error: 'Failed to save draft' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  // HIGH-4 fix — check that the product actually exists before attempting deletion.
  // Previously a DELETE on a non-existent slug would return { success: true } misleadingly.
  const product = await readProductForAdmin(params.slug);
  if (!product) {
    return json({ error: 'Product not found' }, { status: 404 });
  }

  try {
    await deleteProduct(params.slug);
    return json({ success: true });
  } catch (err) {
    return json({ error: 'Failed to delete product' }, { status: 500 });
  }
};
