import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearAllOrders } from '$lib/content/orders';
import { isValidSession } from '$lib/server/auth';
import { computeDashboardStats } from '$lib/server/adminOrders';

export const POST: RequestHandler = async ({ cookies }) => {
	const session = cookies.get('session');
	const pinCookie = cookies.get('nv_admin_pin');
	if (!isValidSession(session) && pinCookie !== '2026') {
		return json({ error: 'غير مصرح لك بالوصول، يرجى إدخال رمز القفل أولاً' }, { status: 401 });
	}

	try {
		await clearAllOrders();
		const emptyStats = computeDashboardStats([]);

		return json({
			success: true,
			orders: [],
			stats: {
				...emptyStats,
				totalOrders: 0,
				confirmedOrders: 0,
				pendingOrders: 0,
				deliveredOrders: 0,
				cancelledOrders: 0,
				totalRevenue: 0,
				confirmedRevenue: 0
			},
			message: 'تم مسح جميع طلبات الاختبار وإعادة تصفير لوحة القيادة بنجاح'
		});
	} catch (err: any) {
		console.error('[API /api/admin/clear-orders POST] Error clearing orders:', err);
		return json({ error: 'تعذر مسح الطلبات، يرجى المحاولة مرة أخرى' }, { status: 500 });
	}
};
