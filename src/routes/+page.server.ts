import type { PageServerLoad } from './$types';
import { listProducts } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';

export const load: PageServerLoad = async () => {
  const [products, settings] = await Promise.all([listProducts(), readSettings()]);

  return {
    products: products.filter((p) => p.status === 'published'),
    settings
  };
};
