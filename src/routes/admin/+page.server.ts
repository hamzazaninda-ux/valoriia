import type { PageServerLoad } from './$types';
import { listProductsForAdmin } from '$lib/content/products';
import { listTemplates } from '$lib/content/templates';
import { readSettings } from '$lib/content/settings';

export const load: PageServerLoad = async () => {
  const [products, templates, settings] = await Promise.all([
    listProductsForAdmin(),
    listTemplates().catch(() => []),
    readSettings().catch(() => null)
  ]);

  const total = products.length;
  const published = products.filter((p) => p.status === 'published').length;
  const drafts = products.filter((p) => p.status !== 'published').length;

  const recent = [...products]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5);

  return {
    stats: { total, published, drafts, templates: templates.length },
    recent,
    health: {
      sheets: !!(settings?.commerce?.googleSheetsUrl || '').trim(),
      whatsapp: !!(settings?.brand?.whatsappNumber || '').trim(),
      brandName: settings?.brand?.name || 'Lhamza Shop'
    }
  };
};
