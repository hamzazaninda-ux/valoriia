import type { PageServerLoad } from './$types';
import { listProductsForAdmin } from '$lib/content/products';

export const load: PageServerLoad = async () => {
  const products = await listProductsForAdmin();
  return {
    products
  };
};
