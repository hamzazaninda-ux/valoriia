import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateOrderUpsell, readOrders } from '$lib/content/orders';
import { sendOrderToGoogleSheets } from '$lib/server/sheets';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => null);

		if (!body || typeof body !== 'object') {
			return json({ success: false, message: 'بيانات غير صالحة' }, { status: 400 });
		}

		const orderId = String(body.orderId || body.order_id || '').trim();
		if (!orderId) {
			return json({ success: false, message: 'معرف الطلب مطلوب' }, { status: 400 });
		}

		const upsellItem = String(body.upsellItem || 'سدادة وفلتر مصرف الأرضية الذكية').trim();
		const upsellPrice = Number(body.upsellPrice || 29);
		const totalAmount = Number(body.totalAmount || 258);

		// 1. Update internal order DB
		const updatedOrder = await updateOrderUpsell(orderId, upsellItem, upsellPrice, totalAmount);

		// 2. Fetch order to sync to sheets
		const currentOrders = await readOrders();
		const baseOrder = currentOrders.find((o) => o.id === orderId) || updatedOrder;

		// 3. Sync upsell row or update to Google Sheets
		if (baseOrder) {
			const casablancaTime = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
			const upsellPayload = {
				orderId: `${orderId}-U`,
				order_id: `${orderId}-U`,
				orderType: 'upsell',
				isUpsell: true,
				hasUpsell: true,
				date_order: casablancaTime,
				fullName: baseOrder.fullName,
				full_name: baseOrder.fullName,
				phone: baseOrder.phone,
				city: baseOrder.city,
				address: baseOrder.address,
				city_address: baseOrder.city && baseOrder.address ? `${baseOrder.city} - ${baseOrder.address}` : (baseOrder.city || baseOrder.address || 'تأكيد هاتفي'),
				bundle: `إضافة أبسيل: ${upsellItem} (+${upsellPrice} DH)`,
				product: `${baseOrder.product} + ${upsellItem}`,
				price: totalAmount,
				total: totalAmount,
				totalPrice: totalAmount,
				quantity: 1,
				sku: 'filter-baloua',
				note: `تم قبول الأبسيل (+${upsellPrice} DH) إجمالي: ${totalAmount} DH`
			};

			sendOrderToGoogleSheets(upsellPayload).catch((e) => {
				console.warn('Google Sheets upsell sync non-fatal error:', e);
			});
		}

		return json({
			success: true,
			orderId,
			updatedTotal: totalAmount
		}, { status: 200 });

	} catch (err: any) {
		console.error('❌ [/api/order/upsell] Processing error:', err);
		return json({
			success: false,
			message: err?.message || 'حدث خطأ أثناء معالجة الأبسيل'
		}, { status: 500 });
	}
};
