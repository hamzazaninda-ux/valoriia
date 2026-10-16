import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readOrders } from '$lib/content/orders';
import { isValidSession } from '$lib/server/auth';
import { computeDashboardStats, enrichOrderForDashboard } from '$lib/server/adminOrders';

export const GET: RequestHandler = async ({ cookies }) => {
	// 1. Session or PIN Cookie Authentication Check
	const session = cookies.get('session');
	const pinCookie = cookies.get('nv_admin_pin');
	if (!isValidSession(session) && pinCookie !== '2026') {
		return json({ error: 'غير مصرح لك بالوصول، يرجى إدخال رمز القفل أولاً' }, { status: 401 });
	}

	try {
		// 2. Fetch fresh orders from local storage / Git DB
		const rawOrders = await readOrders(true);

		// 3. Compute KPI metrics and enrich orders
		const stats = computeDashboardStats(rawOrders);
		const enrichedOrders = rawOrders.map(enrichOrderForDashboard);

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
