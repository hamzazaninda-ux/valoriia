import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readOrders } from '$lib/content/orders';
import { isValidSession } from '$lib/server/auth';
import { computeDashboardStats, enrichOrderForDashboard } from '$lib/server/adminOrders';

export const GET: RequestHandler = async ({ cookies }) => {
	// 1. Session Authentication Check
	const session = cookies.get('session');
	if (!isValidSession(session)) {
		return json({ error: 'غير مصرح لك بالوصول، يرجى تسجيل الدخول أولاً' }, { status: 401 });
	}

	try {
		// 2. Fetch fresh orders from local storage / Git DB
		const rawOrders = await readOrders(true);

		// 3. Compute KPI metrics and enrich orders
		const stats = computeDashboardStats(rawOrders);
		const enrichedOrders = rawOrders.slice(0, 50).map(enrichOrderForDashboard);

		return json({
			success: true,
			stats,
			orders: enrichedOrders,
			fetchedAt: new Date().toISOString()
		});
	} catch (err: any) {
		console.error('[API /api/admin/orders GET] Error fetching orders:', err);
		return json({ error: 'تعذر جلب الطلبات من التخزين المحلي' }, { status: 500 });
	}
};
