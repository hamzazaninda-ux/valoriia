import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveOrder } from '$lib/content/orders';
import { sendOrderToGoogleSheets } from '$lib/server/sheets';

const GOOGLE_SHEETS_WEBHOOK =
	process.env.GOOGLE_SHEETS_URL ||
	'https://script.google.com/macros/s/AKfycbzAWD5-wSS8PYWxsvsWbzAnCbudmLJZd4_XhFQDBA5RBvYjg6v_yPJULMs4qdv5xUhwWA/exec';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body || typeof body !== 'object') {
			return json({ error: 'بيانات الطلب غير صالحة' }, { status: 400 });
		}

		const fullName = String(body.fullName || body.name || '').trim();
		const phone = String(body.phoneNumber || body.phone || '').trim();

		if (!fullName && !phone) {
			return json({ error: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 });
		}

		// Ensure consistent orderId across both internal storage and Google Sheets
		const orderId = String(
			body.orderId || body.id || ('ORD-' + Math.floor(100000 + Math.random() * 900000))
		).trim();
		body.orderId = orderId;
		body.id = orderId;

		// Parallel dual-storage: In-app DB + Google Sheets
		const [saveResult, sheetSyncResult] = await Promise.allSettled([
			saveOrder(body),
			(async () => {
				const casablancaDate = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
				const payload = {
					orderId: body.orderId,
					date: body.date || casablancaDate,
					fullName: fullName,
					phoneNumber: phone,
					city: String(body.city || '').trim(),
					address: String(body.address || '').trim(),
					productTitle: String(body.productTitle || body.product || body.offer || 'طقم التنظيم المنزلي').trim(),
					quantity: Number(body.quantity || body.qte || 1),
					price: body.totalPrice || body.total || body.price || ''
				};

				const webhookUrl = body.sheetsUrl || GOOGLE_SHEETS_WEBHOOK;
				const sheetRes = await fetch(webhookUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
					redirect: 'follow'
				});
				console.log('✅ Google Sheets Sync Response:', sheetRes.status);
				return sheetRes.ok;
			})()
		]);

		const order = saveResult.status === 'fulfilled' ? saveResult.value : null;

		if (!order) {
			console.error(
				'[API /api/checkout POST] Failed to save order:',
				saveResult.status === 'rejected' ? saveResult.reason : 'unknown'
			);
			return json({ error: 'حدث خطأ أثناء حفظ الطلب' }, { status: 500 });
		}

		const sheetsSynced = sheetSyncResult.status === 'fulfilled' && sheetSyncResult.value;

		return json({ success: true, order, sheetsSynced }, { status: 201 });
	} catch (err) {
		console.error('❌ Google Sheets sync failed:', err);
		return json({ error: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
	}
};
