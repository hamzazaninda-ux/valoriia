import type { PageServerLoad } from './$types';
import { listProductsForAdmin, readProductForAdmin } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';

export const load: PageServerLoad = async () => {
  const [products, settings] = await Promise.all([
    listProductsForAdmin(),
    readSettings().catch(() => null)
  ]);

  const globalSheets = (settings?.commerce?.googleSheetsUrl || '').trim();

  const rows = await Promise.all(
    products.map(async (p) => {
      let own = '';
      try {
        const full = await readProductForAdmin(p.slug);
        const version = full?.draft || full?.published;
        own = (version?.order?.googleSheetsUrl || '').trim();
      } catch {
        own = '';
      }
      return {
        slug: p.slug,
        title: p.title || p.slug,
        status: p.status,
        sheetsUrl: own || globalSheets,
        source: own ? ('own' as const) : globalSheets ? ('global' as const) : ('none' as const)
      };
    })
  );

  return { rows, globalSheets, total: products.length };
};
