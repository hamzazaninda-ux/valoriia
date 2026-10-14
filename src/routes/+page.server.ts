import type { PageServerLoad } from './$types';
import { listProducts } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';

export const load: PageServerLoad = async ({ setHeaders }) => {
  setHeaders({
    'Cache-Control': 'public, max-age=60, s-maxage=86400, stale-while-revalidate=86400'
  });

  const products = await listProducts();
  const settings = await readSettings();

  return {
    products: products.filter((p) => p.status === 'published'),
    settings
  };
};
