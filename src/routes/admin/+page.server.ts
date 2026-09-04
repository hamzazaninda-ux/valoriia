import type { PageServerLoad } from './$types';
import { listProductsForAdmin } from '$lib/content/products';

export const load: PageServerLoad = async () => {
  const products = await listProductsForAdmin();

  const total = products.length;
  const published = products.filter(p => p.status === 'published').length;
  const drafts = products.filter(p => p.status === 'draft').length;
  const archived = products.filter(p => p.status === 'archived').length;

  return {
    stats: {
      total,
      published,
      drafts,
      archived
    }
  };
};
