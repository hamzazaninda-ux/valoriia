import type { PageServerLoad } from './$types';
import { listProducts } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';

export const load: PageServerLoad = async ({ setHeaders }) => {
  // Cache on Vercel's CDN: pages open instantly; content edits show within ~1 minute.
  setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400' });
  const [products, settings] = await Promise.all([listProducts(), readSettings()]);

  return {
    products: products.filter((p) => p.status === 'published'),
    settings
  };
};
