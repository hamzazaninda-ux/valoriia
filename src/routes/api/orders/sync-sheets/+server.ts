import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readOrders } from '$lib/content/orders';
import { isValidSession } from '$lib/server/auth';
import { sendOrderToGoogleSheets } from '$lib/server/sheets';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const session = cookies.get('session');
	if (!isValidSession(session)) {
		return json({ error: 'غير مصرح بالدخول' }, { status: 401 });
	}

	try {
		const body = await request.json().catch(() => ({}));
		const { orderId, syncAll } = body;

		const orders = await readOrders(true);

		if (orderId && typeof orderId === 'string') {
			const target = orders.find((o) => o.id === orderId.trim());
			if (!target) {
				return json({ error: 'الطلب غير موجود' }, { status: 404 });
			}

			const res = await sendOrderToGoogleSheets(target);
			if (!res.ok) {
				return json({
					error: `فشلت مزامنة الطلب مع Google Sheets (Status: ${res.status})`,
					status: res.status
				}, { status: 502 });
			}

			return json({
				success: true,
				message: `تمت مزامنة الطلب ${orderId} مع Google Sheets بنجاح`,
				orderId,
				status: res.status
			});
		}

		if (syncAll) {
			if (orders.length === 0) {
				return json({ success: true, message: 'لا توجد طلبات للمزامنة', syncedCount: 0 });
			}

			let syncedCount = 0;
			let failCount = 0;

			// Sync in sequence with slight spacing to respect Google Apps Script rate limits
			for (const order of orders) {
				const res = await sendOrderToGoogleSheets(order);
				if (res.ok) {
					syncedCount++;
				} else {
					failCount++;
				}
				// Small delay to be polite to Google Apps Script
				await new Promise((resolve) => setTimeout(resolve, 200));
			}

			return json({
				success: true,
				message: `تمت مزامنة ${syncedCount} من أصل ${orders.length} طلبية مع Google Sheets`,
				syncedCount,
				failCount,
				total: orders.length
			});
		}

		return json({ error: 'يرجى تحديد orderId أو syncAll' }, { status: 400 });
	} catch (err: any) {
		console.error('[API /api/orders/sync-sheets] Error:', err);
		return json({ error: 'حدث خطأ أثناء مزامنة الطلبات مع Google Sheets' }, { status: 500 });
	}
};
