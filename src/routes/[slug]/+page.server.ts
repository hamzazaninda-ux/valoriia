import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listProducts, readProduct } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';
import { readTemplateTheme } from '$lib/content/templateTheme';

export const load: PageServerLoad = async ({ params }) => {
  const product = await readProduct(params.slug);

  if (!product || product.status !== 'published') {
    throw redirect(302, '/');
  }

  const settings = await readSettings();
  const theme = await readTemplateTheme(product.template || 'classic');

  // Other published products, used by templates for cart cross-sell / post-purchase upsell.
  const others = (await listProducts())
    .filter((p) => p.status === 'published' && p.slug !== product.slug)
    .map(({ slug, title, subtitle, heroImage, startingPrice }) => ({
      slug,
      title,
      subtitle,
      heroImage,
      startingPrice
    }));

  return {
    product,
    settings,
    theme,
    others
  };
};
