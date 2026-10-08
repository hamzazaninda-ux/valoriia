import type { PageServerLoad } from './$types';
import { listProductsForAdmin } from '$lib/content/products';
import { listTemplates } from '$lib/content/templates';
import { readSettings } from '$lib/content/settings';
import { readOrders, getOrderStats } from '$lib/content/orders';

export const load: PageServerLoad = async () => {
  const [products, templates, settings, orders, orderStats] = await Promise.all([
    listProductsForAdmin().catch(() => []),
    listTemplates().catch(() => []),
    readSettings().catch(() => null),
    readOrders().catch(() => []),
    getOrderStats().catch(() => ({
      totalOrders: 0,
      confirmedOrders: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      confirmedRevenue: 0
    }))
  ]);

  const total = products.length;
  const published = products.filter((p) => p.status === 'published').length;
  const drafts = products.filter((p) => p.status !== 'published').length;

  const recentProducts = [...products]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5);

  const recentOrders = [...orders].slice(0, 5);

  return {
    stats: {
      total,
      published,
      drafts,
      templates: templates.length,
      totalOrders: orderStats.totalOrders,
      confirmedRevenue: orderStats.confirmedRevenue,
      pendingOrders: orderStats.pendingOrders
    },
    recentProducts,
    recentOrders,
    currencySymbol: settings?.commerce?.currencySymbol || 'درهم',
    health: {
      sheets: !!(settings?.commerce?.googleSheetsUrl || '').trim(),
      whatsapp: !!(settings?.brand?.whatsappNumber || '').trim(),
      brandName: settings?.brand?.name || 'Lhamza Shop'
    }
  };
};
