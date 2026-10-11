import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listProducts, readProduct } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';
import { readTemplateTheme } from '$lib/content/templateTheme';

export const load: PageServerLoad = async ({ params }) => {
  const gummieSlugs = ['gummies_collagen', 'gummies_biotine', 'gumies_vitamine'];
  if (gummieSlugs.includes(params.slug)) {
    throw redirect(301, `/products/${params.slug}`);
  }

  const product = await readProduct(params.slug);

  if (!product || product.status !== 'published') {
    throw redirect(302, '/');
  }

  const settings = await readSettings();
  const theme = await readTemplateTheme(product.template || 'classic');

  // Other published products for cart cross-sell / post-purchase upsell:
  // Active upsell sequence strictly contains ONLY:
  // قفل أمان ذكي: تهنى من حلان التلاجة والبلاكارات 🔒 — 49 DH
  const allProducts = await listProducts();
  const others = allProducts
    .filter(p => p.slug !== product.slug && p.status === 'published')
    .map(p => ({
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      heroImage: p.heroImage,
      startingPrice: p.startingPrice
    }));

  return {
    product,
    settings,
    theme,
    others
  };
};
