import type { PageServerLoad } from './$types';
import { listProducts } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';

export const load: PageServerLoad = async () => {
  const products = await listProducts();
  const settings = await readSettings();

  return {
    products: products.filter(
      (p) =>
        p.status === 'published' &&
        p.slug !== 'hamil-jidari-makanis' &&
        p.slug !== 'filter-baloua' &&
        p.slug !== 'qofl-al-aman' &&
        !p.heroImage?.includes('79')
    ),
    settings
  };
};
