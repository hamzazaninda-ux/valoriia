import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveOrder, updateOrderAddress } from '$lib/content/orders';
import { sendOrderToGoogleSheets } from '$lib/server/sheets';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body || typeof body !== 'object') {
			return json({ error: 'بيانات الطلب غير صالحة' }, { status: 400 });
		}

		const fullName = String(body.full_name || body.fullName || body.name || '').trim();
		const phone = String(body.phone || body.phoneNumber || '').trim();

		if (!fullName) {
			return json({ error: 'الرجاء إدخال الاسم الكامل' }, { status: 400 });
		}

		if (!phone) {
			return json({ error: 'الرجاء إدخال رقم الهاتف' }, { status: 400 });
		}

		// Ensure default values for city & address if not provided initially
		const city = String(body.city || '').trim() || 'يُحدد بعد التأكيد';
		const address = String(body.address || '').trim() || 'يُحدد بعد التأكيد';
		body.city = city;
		body.address = address;

		let city_address = String(body.city_address || '').trim();
		if (!city_address) {
			if (city && address && city !== address) {
				city_address = `${city} - ${address}`.trim();
			} else {
				city_address = (address || city || 'يُحدد بعد التأكيد').trim();
			}
		}
		body.city_address = city_address;

		// Ensure consistent orderId across both internal storage and Google Sheets
		const orderId = String(
			body.order_id || body.orderId || body.id || ('ORD-' + Math.floor(100000 + Math.random() * 900000))
		).trim();
		body.orderId = orderId;
		body.id = orderId;
		body.order_id = orderId;
		body.fullName = fullName;
		body.full_name = fullName;
		body.name = fullName;
		body.phone = phone;
		body.phoneNumber = phone;

		const casablancaTime = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
		body.date_order = body.date_order || body.date || casablancaTime;

		const qte = Number(body.qte ?? body.quantity ?? 1) || 1;
		const price = Number(body.price ?? body.totalPrice ?? body.total ?? 0);
		body.qte = qte;
		body.quantity = qte;
		body.price = price;
		body.totalPrice = price;
		body.total = price;

		const sku = String(
			body.sku ||
			body.selectedBundleName ||
			body.selectedOfferTitle ||
			body.offer ||
			body.productTitle ||
			body.product ||
			'علكات الكولاجين'
		).trim();
		body.sku = sku;

		const note = String(body.note || body.customerNote || body.notes || '').trim();
		body.note = note;

		body.rowData = [
			body.date_order,
			orderId,
			fullName,
			phone,
			city_address,
			sku,
			qte,
			price,
			note
		];

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
		const orderId = String(body.order_id || body.orderId || body.id || '').trim();
		const address = String(body.address || body.city || '').trim();
		const city = String(body.city || body.address || '').trim();

		if (!orderId || !address) {
			return json({ error: 'معرف الطلب والعنوان مطلوبان' }, { status: 400 });
		}

		const updatedOrder = await updateOrderAddress(orderId, address, city);

		return json({ success: true, order: updatedOrder });
	} catch (err) {
		console.error('❌ Failed to update address:', err);
		return json({ error: 'حدث خطأ أثناء تحديث العنوان' }, { status: 500 });
	}
};
