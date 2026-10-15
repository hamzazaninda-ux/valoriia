import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveOrder } from '$lib/content/orders';
import { sendOrderToGoogleSheets } from '$lib/server/sheets';
import { buildOrderFulfillmentLabel } from '$lib/data/products';

const GOOGLE_SHEETS_WEBHOOK =
	process.env.GOOGLE_SHEETS_URL ||
	'https://script.google.com/macros/s/AKfycbw_IupQuynkwQCrYJNyYdbDhq3R_Ab1DoMkcknXZ9C9vRKYVzJefYKUKN9RSJKOjWWLhQ/exec';

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

		let items = Array.isArray(body.items) ? body.items : [];
		if (typeof body.items === 'string') {
			try {
				const parsed = JSON.parse(body.items);
				if (Array.isArray(parsed)) items = parsed;
			} catch {}
		}
		const productLabel = buildOrderFulfillmentLabel({
			tier: body.tier,
			mainSku: body.mainSku || body.sku,
			mainTitle: body.selectedOfferTitle || body.productTitle || body.product,
			items,
			hasUpsell: Boolean(body.hasUpsell || items.some((it: any) => it.isUpsell))
		});
		body.product = productLabel;
		body.productTitle = productLabel;
		body.selectedOfferTitle = productLabel;

		// Deduplication check: if order has already been marked as synced
		if (body.sheetsSynced) {
			console.log(`🛡️ [Checkout API] Order ${orderId} already marked as synced. Skipping duplicate dispatch.`);
			return json({ success: true, order: body, sheetsSynced: true }, { status: 200 });
		}

		// Parallel dual-storage: In-app DB + Google Sheets (via single unified deduplicated dispatcher)
		const [saveResult, sheetSyncResult] = await Promise.allSettled([
			saveOrder(body),
			sendOrderToGoogleSheets(body, body.sheetsUrl)
		]);

		const order = saveResult.status === 'fulfilled' ? saveResult.value : null;

		if (!order) {
			console.error(
				'[API /api/checkout POST] Failed to save order to primary storage:',
				saveResult.status === 'rejected' ? saveResult.reason : 'unknown'
			);
			const fallbackOrder = {
				id: orderId,
				orderId,
				fullName,
				phoneNumber: phone,
				phone,
				city: String(body.city || 'تحدد عند الاتصال').trim(),
				address: String(body.address || '').trim(),
				total: Number(body.totalPrice ?? body.total ?? 279),
				items: body.items || [],
				status: 'جديد',
				createdAt: new Date().toISOString()
			};
			console.warn('[API /api/checkout POST] Returning fail-safe order response for orderId:', orderId);
			const sheetsSynced = sheetSyncResult.status === 'fulfilled' && sheetSyncResult.value.ok;
			return json({ success: true, order: fallbackOrder, sheetsSynced, fallback: true }, { status: 201 });
		}

		const sheetsSynced = sheetSyncResult.status === 'fulfilled' && sheetSyncResult.value.ok;

		return json({ success: true, order, sheetsSynced }, { status: 201 });
	} catch (err) {
		console.error('❌ Checkout processing failed:', err);
		return json({ error: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
	}
};
