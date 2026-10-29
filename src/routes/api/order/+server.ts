import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveOrder } from '$lib/content/orders';
import { sendOrderToGoogleSheets, formatMoroccanPhone } from '$lib/server/sheets';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => null);

		if (!body || typeof body !== 'object') {
			return json({ success: false, message: 'بيانات الطلب غير صالحة' }, { status: 400 });
		}

		const fullName = String(body.fullName || body.full_name || body.name || '').trim();
		const rawPhone = String(body.phone || body.phoneNumber || '').trim();

		if (!fullName) {
			return json({ success: false, message: 'يرجى إدخال الاسم الكامل' }, { status: 400 });
		}

		const phoneDigits = rawPhone.replace(/\D/g, '');
		if (!rawPhone || phoneDigits.length < 9) {
			return json({ success: false, message: 'يرجى إدخال رقم هاتف صحيح' }, { status: 400 });
		}

		// Enforce clean 212 Moroccan phone format
		const phone = formatMoroccanPhone(rawPhone);

		// Safe fallbacks for city & address - no strict requirement
		const city = String(body.city || '').trim() || 'تأكيد هاتفي';
		const address = String(body.address || '').trim() || 'تأكيد هاتفي';
		const city_address = String(body.city_address || '').trim() || (city === address ? city : `${city} - ${address}`);

		const orderId = String(
			body.orderId || body.order_id || body.id || ('ORD-' + Math.floor(100000 + Math.random() * 900000))
		).trim();

		const quantity = Number(body.quantity !== undefined ? body.quantity : (body.qte !== undefined ? body.qte : 1)) || 1;
		const rawPrice = body.price !== undefined ? body.price : (body.totalPrice !== undefined ? body.totalPrice : (body.total !== undefined ? body.total : 229));
		const price = parseInt(String(rawPrice).replace(/[,.]\d+$/, ''), 10) || 229;

		const product = String(body.product || body.productTitle || 'باك الحمام الذكي').trim();
		const bundle = String(
			body.bundle ||
			body.selectedOfferTitle ||
			body.offer ||
			(quantity === 2 ? 'قطعتان + 2 رشاشات هدية 🎁🎁' : 'قطعة واحدة + رشاش هدية 🎁')
		).trim();

		const casablancaTime = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
		const date_order = String(body.date_order || body.date || casablancaTime);

		const orderPayload: Record<string, any> = {
			...body,
			id: orderId,
			orderId,
			order_id: orderId,
			fullName,
			full_name: fullName,
			name: fullName,
			phone,
			phoneNumber: phone,
			city,
			address,
			city_address,
			product,
			productTitle: product,
			bundle,
			offer: bundle,
			selectedOfferTitle: bundle,
			sku: bundle,
			price,
			total: price,
			totalPrice: price,
			quantity,
			qte: quantity,
			source: String(body.source || 'kit-tandim'),
			date_order,
			sheetsUrl: body.sheetsUrl
		};

		orderPayload.rowData = [
			date_order,
			orderId,
			fullName,
			phone,
			city_address,
			bundle,
			quantity,
			price,
			String(body.note || ''),
			String(body.delivery_note || '')
		];

		// Dual-storage: In-app DB + Google Sheets
		const [saveResult, sheetSyncResult] = await Promise.allSettled([
			saveOrder(orderPayload as any),
			sendOrderToGoogleSheets(orderPayload, body.sheetsUrl)
		]);

		const savedOrder = saveResult.status === 'fulfilled' ? saveResult.value : orderPayload;
		const sheetsSynced = sheetSyncResult.status === 'fulfilled' && sheetSyncResult.value.ok;

		// Always return status 200 with success: true and orderId
		return json({
			success: true,
			orderId,
			order: savedOrder,
			sheetsSynced
		}, { status: 200 });
	} catch (err: any) {
		console.error('❌ [/api/order] Order processing error:', err);
		return json({
			success: false,
			message: err?.message || 'حدث خطأ أثناء تسجيل الطلب، يرجى المحاولة ثانية'
		}, { status: 500 });
	}
};
