import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { readProduct, readProductDraft } from '$lib/content/products';
import { readSettingsForAdmin } from '$lib/content/settings';
import { readTemplateThemeDraft } from '$lib/content/templateTheme';

export const load: PageServerLoad = async ({ params }) => {
  const draft = await readProductDraft(params.slug);
  const published = await readProduct(params.slug);

  if (!draft && !published) {
    throw redirect(302, '/admin/products');
  }

  const product = draft || published!;
  const settings = await readSettingsForAdmin();
  const theme = await readTemplateThemeDraft(product.template || 'classic');

  return {
    product,
    settings,
    theme,
    isDraft: !!draft
  };
};
