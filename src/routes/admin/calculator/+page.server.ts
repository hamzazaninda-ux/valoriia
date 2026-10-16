import type { PageServerLoad } from './$types';
import { readOrders } from '$lib/content/orders';
import { computeDashboardStats, enrichOrderForDashboard } from '$lib/server/adminOrders';

export const load: PageServerLoad = async () => {
	const rawOrders = await readOrders(true).catch(() => []);
	const dashboardStats = computeDashboardStats(rawOrders);
	const orders = rawOrders.map(enrichOrderForDashboard);

	return {
		dashboardStats,
		orders
	};
};
