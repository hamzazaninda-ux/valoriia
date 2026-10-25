import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveOrder, updateOrderAddress } from '$lib/content/orders';
import { sendOrderToGoogleSheets, formatMoroccanPhone } from '$lib/server/sheets';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body || typeof body !== 'object') {
			return json({ error: 'بيانات الطلب غير صالحة' }, { status: 400 });
		}

		const fullName = String(body.full_name || body.fullName || body.name || '').trim();
		const rawPhone = String(body.phone || body.phoneNumber || '').trim();

		if (!fullName) {
			return json({ error: 'الرجاء إدخال الاسم الكامل' }, { status: 400 });
		}

		if (!rawPhone) {
			return json({ error: 'الرجاء إدخال رقم الهاتف' }, { status: 400 });
		}

		// 1. Phone Formatter: Always enforce '212' country code without '+' or leading '0'
		const phone = formatMoroccanPhone(rawPhone);

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

		const qte = Number(body.qte !== undefined ? body.qte : (body.quantity !== undefined ? body.quantity : 1)) || 1;
		
		// Force pure integer: remove any trailing decimal/fraction (e.g. 349.0 or 349,0 -> 349)
		const rawPrice = body.price !== undefined ? body.price : (body.totalPrice !== undefined ? body.totalPrice : (body.total !== undefined ? body.total : 349));
		const cleanPrice = parseInt(String(rawPrice).replace(/[,.]\d+$/, ''), 10) || 349;
		body.qte = qte;
		body.quantity = qte;
		body.price = cleanPrice;
		body.totalPrice = cleanPrice;
		body.total = cleanPrice;

		// 3. SKU Formatter: Capture the human-readable selected offer name/tier label instead of product slug
		let offerSku = String(
			body.selectedOfferTitle ||
			body.selectedBundleName ||
			body.offer ||
			body.offerSku ||
			''
		).trim();

		if (!offerSku || offerSku === 'kit-tandim' || offerSku === 'SKU-GENERAL' || offerSku === 'filter-baloua') {
			const candidate = String(body.sku || body.productTitle || body.product || '').trim();
			if (candidate === 'filter-baloua' || body.orderType === 'upsell' || body.isUpsell) {
				offerSku = body.productTitle || 'سدادة وفلتر مصرف الأرضية الذكية (مضاد للروائح والحشرات)';
			} else if (candidate && candidate !== 'kit-tandim' && candidate !== 'SKU-GENERAL') {
				offerSku = candidate;
			} else {
				offerSku = qte === 2 ? '2 قطع + رشاشين هدية 🎁' : '1 قطعة + رشاشة هدية 🎁';
			}
		}

		body.sku = offerSku;
		body.selectedOfferTitle = offerSku;
		body.offer = offerSku;
		body.offerSku = offerSku;

		const note = String(body.note || body.customerNote || body.notes || '').trim();
		const delivery_note = String(body.delivery_note || body.deliveryNote || '').trim();
		body.note = note;
		body.delivery_note = delivery_note;

		body.rowData = [
			body.date_order,
			orderId,
			fullName,
			phone,
			city_address,
			offerSku,
			qte,
			cleanPrice,
			note,
			delivery_note
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
