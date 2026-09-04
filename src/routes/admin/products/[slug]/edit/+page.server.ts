import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { readProductForAdmin } from '$lib/content/products';
import { listTemplates } from '$lib/content/templates';

export const load: PageServerLoad = async ({ params }) => {
  const product = await readProductForAdmin(params.slug);

  if (!product) {
    throw redirect(302, '/admin/products');
  }

  const templates = await listTemplates();

  return {
    product,
    templates
  };
};
