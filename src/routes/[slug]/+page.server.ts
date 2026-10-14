import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listProducts, readProduct } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';
import { readTemplateTheme } from '$lib/content/templateTheme';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
  const gummieSlugs = [
    'gummies_collagen', 'gummies-collagen', 'collagen',
    'gummies_biotine', 'gummies-biotine', 'biotine', 'biotin',
    'gumies_vitamine', 'gummies_multivitamines', 'gummies-multivitamines', 'multivitamines', 'multivitamin'
  ];
  if (gummieSlugs.includes(params.slug)) {
    throw redirect(301, `/products/${params.slug}`);
  }

  setHeaders({
    'Cache-Control': 'public, max-age=60, s-maxage=86400, stale-while-revalidate=86400'
  });

  const product = await readProduct(params.slug);

  if (!product || product.status !== 'published') {
    throw redirect(302, '/');
  }

  const settings = await readSettings();
  const theme = await readTemplateTheme(product.template || 'classic');

  // Other published products for cart cross-sell / post-purchase upsell:
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
