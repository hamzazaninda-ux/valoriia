import type { PageServerLoad } from './$types';
import { readOrders, getOrderStats } from '$lib/content/orders';
import { readSettings } from '$lib/content/settings';
import { listProductsForAdmin } from '$lib/content/products';

export const load: PageServerLoad = async () => {
  const [orders, stats, settings, products] = await Promise.all([
    readOrders().catch(() => []),
    getOrderStats().catch(() => ({
      totalOrders: 0,
      confirmedOrders: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      confirmedRevenue: 0
    })),
    readSettings().catch(() => null),
    listProductsForAdmin().catch(() => [])
  ]);

  const globalSheets = (settings?.commerce?.googleSheetsUrl || '').trim();

  return {
    orders,
    stats,
    globalSheets,
    currencySymbol: settings?.commerce?.currencySymbol || 'درهم',
    productsCount: products.length
  };
};
