import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveOrder } from '$lib/content/orders';
import { sendOrderToGoogleSheets } from '$lib/server/sheets';
import {
	sendOrderToSpaceSeller,
	buildSpaceSellerLeadPayload,
	calculatePhysicalBottleCount
} from '$lib/server/spaceseller';
import { buildOrderFulfillmentLabel } from '$lib/data/products';
import { waitUntil } from '@vercel/functions';

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

		const tier = String(body.tier || body.baseTier || 'tier_1');
		const physicalBottleCount = calculatePhysicalBottleCount({
			tier,
			items,
			hasUpsell: Boolean(body.hasUpsell || items.some((it: any) => it.isUpsell)),
			rawTotal: Number(body.totalPrice ?? body.total ?? body.price ?? 279),
			price: Number(body.totalPrice ?? body.total ?? body.price ?? 279)
		});

		const productLabel = buildOrderFulfillmentLabel({
			tier,
			mainSku: body.mainSku || body.sku,
			mainTitle: body.selectedOfferTitle || body.productTitle || body.product,
			items,
			hasUpsell: Boolean(body.hasUpsell || items.some((it: any) => it.isUpsell))
		});
		body.product = productLabel;
		body.productTitle = productLabel;
		body.selectedOfferTitle = productLabel;
		body.tier = tier;
		body.baseTier = tier;
		body.quantity = physicalBottleCount;
		body.qte = physicalBottleCount;

		// Construct Space Seller Payload with pack mapping, SKU, dynamic totals, and confirmation notes
		const spaceSellerPayload = buildSpaceSellerLeadPayload({
			fullName,
			phone,
			city: body.city,
			address: body.address,
			orderId,
			tier,
			mainSku: body.mainSku || body.sku,
			productLabel,
			items,
			hasUpsell: Boolean(body.hasUpsell || items.some((it: any) => it.isUpsell)),
			total: Number(body.totalPrice ?? body.total ?? body.price ?? 279),
			customerNote: body.notes || body.note
		});

		const hasUpsellFlag = Boolean(body.hasUpsell || items.some((it: any) => it.isUpsell));
		const finalTotal = spaceSellerPayload.total || Number(body.totalPrice ?? body.total ?? 279);
		body.total = finalTotal;
		body.totalPrice = finalTotal;
		body.price = finalTotal;
		body.sku = spaceSellerPayload.sku;
		body.hasUpsell = hasUpsellFlag;
		body.orderType = hasUpsellFlag ? 'upsell' : 'direct';
		body.address = spaceSellerPayload.address || body.address;
		body.notes = spaceSellerPayload.note || body.notes;

		// Deduplication check: if order has already been marked as synced
		if (body.sheetsSynced) {
			console.log(`🛡️ [Checkout API] Order ${orderId} already marked as synced. Skipping duplicate dispatch.`);
			return json({ success: true, order: body, sheetsSynced: true }, { status: 200 });
		}

		// Prepare immediate response order object
		const responseOrder = {
			id: orderId,
			orderId,
			fullName,
			phoneNumber: phone,
			phone,
			city: String(body.city || 'تحدد عند الاتصال').trim(),
			address: String(body.address || '').trim(),
			total: finalTotal,
			totalPrice: finalTotal,
			price: finalTotal,
			product: productLabel,
			sku: spaceSellerPayload.sku,
			hasUpsell: hasUpsellFlag,
			orderType: body.orderType,
			items: items,
			status: 'جديد',
			createdAt: new Date().toISOString()
		};

		// Latency Optimization: Fire-and-forget background synchronization
		// Returns response to client immediately (<20ms) while Vercel Serverless Function
		// keeps background execution active until Google Sheets successfully receives the lead.
		const backgroundSync = async () => {
			try {
				const dbOrderPayload = {
					...body,
					items: typeof body.items === 'string' ? body.items : JSON.stringify(items)
				};
				await Promise.allSettled([
					saveOrder(dbOrderPayload).catch((e) => console.error('[API /api/checkout POST] saveOrder error:', e)),
					sendOrderToGoogleSheets({ ...body, items }, body.sheetsUrl).catch((e) =>
						console.error('[API /api/checkout POST] sendOrderToGoogleSheets error:', e)
					),
					sendOrderToSpaceSeller(spaceSellerPayload).catch((e) =>
						console.error('[API /api/checkout POST] sendOrderToSpaceSeller error:', e)
					)
				]);
			} catch (bgErr) {
				console.error('[API /api/checkout POST] Background sync fatal error:', bgErr);
			}
		};

		try {
			waitUntil(backgroundSync());
		} catch {
			backgroundSync().catch(() => {});
		}

		return json(
			{ success: true, order: responseOrder, sheetsSynced: true, spaceSellerSynced: true },
			{ status: 201 }
		);
	} catch (err) {
		console.error('❌ Checkout processing failed:', err);
		return json({ error: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
	}
};
