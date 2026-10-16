import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveOrder, updateOrderAddress } from '$lib/content/orders';
import { sendOrderToGoogleSheets, getSheetsWebhookUrl } from '$lib/server/sheets';

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

		if (!fullName) {
			return json({ error: 'الرجاء إدخال الاسم الكامل' }, { status: 400 });
		}

		if (!phone) {
			return json({ error: 'الرجاء إدخال رقم الهاتف' }, { status: 400 });
		}

		// Ensure default values for city & address if not provided initially
		body.city = String(body.city || '').trim() || 'يُحدد بعد التأكيد';
		body.address = String(body.address || '').trim() || 'يُحدد بعد التأكيد';

		// Ensure consistent orderId across both internal storage and Google Sheets
		const orderId = String(
			body.orderId || body.id || ('ORD-' + Math.floor(100000 + Math.random() * 900000))
		).trim();
		body.orderId = orderId;
		body.id = orderId;

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
				'[API /api/checkout POST] Failed to save order:',
				saveResult.status === 'rejected' ? saveResult.reason : 'unknown'
			);
			return json({ error: 'حدث خطأ أثناء حفظ الطلب' }, { status: 500 });
		}

		const sheetsSynced = sheetSyncResult.status === 'fulfilled' && sheetSyncResult.value.ok;

		return json({ success: true, order, sheetsSynced }, { status: 201 });
	} catch (err) {
		console.error('❌ Checkout processing failed:', err);
		return json({ error: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const orderId = String(body.orderId || body.id || '').trim();
		const address = String(body.address || body.city || '').trim();
		const city = String(body.city || body.address || '').trim();

		if (!orderId || !address) {
			return json({ error: 'معرف الطلب والعنوان مطلوبان' }, { status: 400 });
		}

		const updatedOrder = await updateOrderAddress(orderId, address, city);

		// Non-blocking update webhook dispatch if webhook supports updateAddress action
		try {
			const webhookUrl = await getSheetsWebhookUrl(body.sheetsUrl);
			if (webhookUrl) {
				fetch(webhookUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'updateAddress',
						orderId,
						id: orderId,
						address,
						city
					})
				}).catch((e) => console.warn('Sheets address update dispatch warning:', e));
			}
		} catch (e) {
			console.warn('Sheets update warning:', e);
		}

		return json({ success: true, order: updatedOrder });
	} catch (err) {
		console.error('❌ Failed to update address:', err);
		return json({ error: 'حدث خطأ أثناء تحديث العنوان' }, { status: 500 });
	}
};
