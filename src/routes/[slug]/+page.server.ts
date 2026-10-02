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

  // Other published products for cart cross-sell / post-purchase upsell
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
    others
  };
};
