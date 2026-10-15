import type { PageServerLoad } from './$types';
import { listProductsForAdmin } from '$lib/content/products';
import { listTemplates } from '$lib/content/templates';
import { readSettings } from '$lib/content/settings';
import { readOrders } from '$lib/content/orders';
import { computeDashboardStats, enrichOrderForDashboard } from '$lib/server/adminOrders';

export const load: PageServerLoad = async () => {
	const [products, templates, settings, rawOrders] = await Promise.all([
		listProductsForAdmin().catch(() => []),
		listTemplates().catch(() => []),
		readSettings().catch(() => null),
		readOrders(true).catch(() => [])
	]);

	const dashboardStats = computeDashboardStats(rawOrders);
	const recentOrders = rawOrders.slice(0, 15).map(enrichOrderForDashboard);

	return {
		dashboardStats,
		recentOrders,
		productsCount: products.length,
		templatesCount: templates.length,
		currencySymbol: settings?.commerce?.currencySymbol || 'DH',
		health: {
			sheets: !!(settings?.commerce?.googleSheetsUrl || '').trim(),
			whatsapp: !!(settings?.brand?.whatsappNumber || '').trim(),
			brandName: settings?.brand?.name || 'NOVAVITA'
		}
	};
};
