import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listProducts, readProduct, readProductDraft } from '$lib/content/products';
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

  let others: Array<{ slug: string; title: string; subtitle?: string; heroImage?: string; startingPrice?: number }> = [];
  try {
    const all = await listProducts();
    others = all
      .filter((p) => p.status === 'published' && p.slug !== product.slug)
      .slice(0, 4)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        heroImage: p.heroImage,
        startingPrice: p.startingPrice
      }));
  } catch {
    others = [];
  }

  return {
    product,
    settings,
    theme,
    others,
    isDraft: !!draft
  };
};
