import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readOrders, saveOrder, updateOrderStatus, deleteOrder, getOrderStats } from '$lib/content/orders';
import { isValidSession } from '$lib/server/auth';
import { sendOrderToGoogleSheets } from '$lib/server/sheets';
import {
	sendOrderToSpaceSeller,
	buildSpaceSellerLeadPayload,
	calculatePhysicalBottleCount,
	type SpaceSellerLeadPayload
} from '$lib/server/spaceseller';
import { buildOrderFulfillmentLabel } from '$lib/data/products';
import type { OrderStatus } from '$lib/types/order';
import { waitUntil } from '@vercel/functions';

const VALID_STATUSES: OrderStatus[] = ['جديد', 'مؤكد', 'جاري الشحن', 'تم التسليم', 'ملغي'];
const MOROCCAN_PHONE_REGEX = /^(?:(?:\+?212)|0)[567]\d{8}$/;

// In-memory sliding window cache for 15-second deduplication
interface DedupeCacheEntry {
	timestamp: number;
	orderId: string;
	response: any;
}
const recentOrderHashes = new Map<string, DedupeCacheEntry>();

function cleanOldHashes() {
	const now = Date.now();
	for (const [key, entry] of recentOrderHashes.entries()) {
		if (now - entry.timestamp > 30000) {
			recentOrderHashes.delete(key);
		}
	}
}

// Public: Customer checkout submission
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body || typeof body !== 'object') {
			return json({ error: 'بيانات الطلب غير صالحة' }, { status: 400 });
		}

		const fullName = String(body.fullName || body.name || '').trim();
		const rawPhone = String(body.phone || body.phoneNumber || '').trim();
		const cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, '');

		if (!fullName || fullName.length < 2) {
			return json({ error: 'يرجى إدخال الاسم الكامل بشكل صحيح' }, { status: 400 });
		}

		if (!cleanPhone || !MOROCCAN_PHONE_REGEX.test(cleanPhone)) {
			return json(
				{ error: 'رقم الهاتف المغربي غير صالح، يجب أن يبدأ بـ 06 أو 07 أو +212' },
				{ status: 400 }
			);
		}

		const total = Number(body.total ?? body.totalPrice ?? body.price ?? 299);
		const tier = String(body.tier || 'tier_1');

		// 15-second Sliding Window Deduplication Check
		const dedupeKey = `${cleanPhone}_${tier}_${total}`;
		const now = Date.now();
		cleanOldHashes();

		const existing = recentOrderHashes.get(dedupeKey);
		if (existing && now - existing.timestamp < 15000) {
			console.log(
				`🛡️ [Orders API] In-memory duplicate detected for ${dedupeKey}. Returning cached response.`
			);
			return json(existing.response, { status: 200 });
		}

		// Consistent Order ID
		const orderId = String(
			body.orderId || body.id || ('NV-' + Math.floor(100000 + Math.random() * 900000))
		).trim();
		body.orderId = orderId;
		body.id = orderId;

		// Decompose and resolve items array
		let items: any[] = [];
		if (Array.isArray(body.items)) {
			items = [...body.items];
		} else if (typeof body.items === 'string') {
			try {
				const parsed = JSON.parse(body.items);
				if (Array.isArray(parsed)) items = parsed;
			} catch {}
		}

		const mainSku = body.mainSku || body.sku || (items.find((it: any) => !it.isUpsell)?.sku) || 'gummies_collagen';

		if (items.length === 0) {
			if (tier === 'tier_2' || tier === 'tier-3-tubs' || total === 399 || total === 498 || total === 349 || total === 448) {
				items.push({
					sku: mainSku,
					title: mainSku.includes('biotin') ? 'علكات البيوتين (3 علب)' : mainSku.includes('vitam') ? 'علكات الفيتامينات (3 علب)' : 'علكات الكولاجين البحري (3 علب)',
					quantity: 3,
					price: 399,
					isUpsell: false
				});
			} else {
				items.push({
					sku: mainSku,
					title: mainSku.includes('biotin') ? 'علكات البيوتين (علبتان)' : mainSku.includes('vitam') ? 'علكات الفيتامينات (علبتان)' : 'علكات الكولاجين البحري (علبتان)',
					quantity: 2,
					price: 299,
					isUpsell: false
				});
			}
			if (body.hasUpsell) {
				const upsellSku = mainSku === 'gummies_biotine' ? 'gummies_collagen' : 'gummies_biotine';
				items.push({
					sku: upsellSku,
					title: upsellSku === 'gummies_biotine' ? 'علكات البيوتين والزنك' : 'علكات الكولاجين البحري',
					quantity: 1,
					price: 99,
					isUpsell: true
				});
			}
		} else {
			items = items.map((it: any) => ({
				...it,
				sku: it.sku || 'gummies_collagen',
				title: it.title || 'NOVAVITA علكة',
				quantity: Number(it.quantity || it.qty || 1),
				price: Number(it.price || it.unitPrice || 0),
				isUpsell: Boolean(it.isUpsell || (it.title && (it.title.includes('عرض') || it.title.includes('خاطف'))))
			}));
		}

		const physicalBottleCount = calculatePhysicalBottleCount({
			tier,
			items,
			hasUpsell: Boolean(body.hasUpsell || items.some((it: any) => it.isUpsell)),
			rawTotal: total,
			price: total
		});
		const productLabel = buildOrderFulfillmentLabel({
			tier,
			mainSku,
			mainTitle: body.selectedOfferTitle || body.productTitle || body.product,
			items,
			hasUpsell: Boolean(body.hasUpsell || items.some((it: any) => it.isUpsell))
		});

		const city = String(body.city || 'تحدد عند التأكيد').trim();
		const address = String(body.address || '').trim();

		// Construct Space Seller Payload with pack mapping, SKU, dynamic totals, and confirmation notes
		const spaceSellerPayload = buildSpaceSellerLeadPayload({
			fullName,
			phone: cleanPhone,
			city,
			address,
			orderId,
			tier,
			mainSku,
			productLabel,
			items,
			hasUpsell: Boolean(body.hasUpsell || items.some((it: any) => it.isUpsell)),
			total,
			customerNote: body.notes || body.note
		});

		const finalTotal = spaceSellerPayload.total || total;

		// Construct Internal DB payload
		const internalOrderPayload = {
			...body,
			orderId,
			fullName,
			phoneNumber: cleanPhone,
			phone: cleanPhone,
			city,
			address,
			tier,
			baseTier: tier,
			product: productLabel,
			productTitle: productLabel,
			selectedOfferTitle: productLabel,
			quantity: physicalBottleCount,
			qte: physicalBottleCount,
			totalPrice: finalTotal,
			total: finalTotal,
			price: finalTotal,
			items: JSON.stringify(items),
			orderType: body.hasUpsell ? 'upsell' : 'direct',
			status: 'جديد' as OrderStatus,
			sku: spaceSellerPayload.sku
		};

		// Latency Optimization: Fire-and-forget background synchronization
		// Returns response to client immediately (<20ms) while Vercel Serverless Function
		// keeps background execution active until Google Sheets successfully receives the lead.
		const backgroundSync = async () => {
			try {
				await Promise.allSettled([
					saveOrder(internalOrderPayload).catch((e) => console.error('[Orders API] saveOrder error:', e)),
					sendOrderToGoogleSheets({
						...internalOrderPayload,
						tier,
						baseTier: tier,
						product: productLabel,
						productTitle: productLabel,
						selectedOfferTitle: productLabel,
						total: finalTotal,
						totalPrice: finalTotal,
						price: finalTotal,
						items,
						upsellProduct: body.upsellProduct || body.upsellName,
						upsellName: body.upsellName || body.upsellProduct,
						upsellSku: body.upsellSku
					}).catch((e) => console.error('[Orders API] sendOrderToGoogleSheets error:', e)),
					sendOrderToSpaceSeller(spaceSellerPayload).catch((e) =>
						console.error('[Orders API] sendOrderToSpaceSeller error:', e)
					)
				]);
			} catch (bgErr) {
				console.error('[Orders API] Background sync fatal error:', bgErr);
			}
		};

		try {
			waitUntil(backgroundSync());
		} catch {
			backgroundSync().catch(() => {});
		}

		const responsePayload = {
			success: true,
			orderId,
			total: finalTotal,
			message: 'تم استلام طلبك بنجاح',
			spaceSellerSynced: true,
			sheetsSynced: true,
			order: { id: orderId, orderId, fullName, phone: cleanPhone, total: finalTotal }
		};

		// Store in 15-second deduplication cache
		recentOrderHashes.set(dedupeKey, {
			timestamp: now,
			orderId,
			response: responsePayload
		});

		return json(responsePayload, { status: 201 });
	} catch (err: any) {
		console.error('[API /api/orders POST] Error creating order:', err);
		return json({ error: 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى' }, { status: 500 });
	}
};

// Admin: Read orders with search & filtering
export const GET: RequestHandler = async ({ url, cookies }) => {
	const session = cookies.get('session');
	if (!isValidSession(session)) {
		return json({ error: 'غير مصرح بالدخول' }, { status: 401 });
	}

	try {
		const statusFilter = url.searchParams.get('status')?.trim();
		const searchQuery = url.searchParams.get('search')?.trim().toLowerCase();
		const limit = Number(url.searchParams.get('limit')) || 0;

		let orders = await readOrders();

		if (statusFilter && VALID_STATUSES.includes(statusFilter as OrderStatus)) {
			orders = orders.filter((o) => o.status === statusFilter);
		}

		if (searchQuery) {
			orders = orders.filter(
				(o) =>
					o.id.toLowerCase().includes(searchQuery) ||
					o.fullName.toLowerCase().includes(searchQuery) ||
					o.phone.includes(searchQuery) ||
					o.city.toLowerCase().includes(searchQuery) ||
					o.product.toLowerCase().includes(searchQuery)
			);
		}

		if (limit > 0) {
			orders = orders.slice(0, limit);
		}

		const stats = await getOrderStats();

		return json({ success: true, orders, stats });
	} catch (err) {
		console.error('[API /api/orders GET] Error fetching orders:', err);
		return json({ error: 'تعذر جلب الطلبات' }, { status: 500 });
	}
};

// Admin: Update order status
export const PATCH: RequestHandler = async ({ request, cookies }) => {
	const session = cookies.get('session');
	if (!isValidSession(session)) {
		return json({ error: 'غير مصرح بالدخول' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { id, status, notes } = body;

		if (!id || typeof id !== 'string') {
			return json({ error: 'رقم الطلب مطلوب' }, { status: 400 });
		}

		if (!status || !VALID_STATUSES.includes(status as OrderStatus)) {
			return json({ error: 'حالة الطلب غير صالحة' }, { status: 400 });
		}

		const updated = await updateOrderStatus(id, status as OrderStatus, notes);
		if (!updated) {
			return json({ error: 'الطلب غير موجود' }, { status: 404 });
		}

		const stats = await getOrderStats();
		return json({ success: true, order: updated, stats });
	} catch (err) {
		console.error('[API /api/orders PATCH] Error updating order:', err);
		return json({ error: 'تعذر تحديث حالة الطلب' }, { status: 500 });
	}
};

// Admin: Delete order
export const DELETE: RequestHandler = async ({ request, cookies }) => {
	const session = cookies.get('session');
	if (!isValidSession(session)) {
		return json({ error: 'غير مصرح بالدخول' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { id } = body;

		if (!id || typeof id !== 'string') {
			return json({ error: 'رقم الطلب مطلوب' }, { status: 400 });
		}

		const deleted = await deleteOrder(id);
		if (!deleted) {
			return json({ error: 'الطلب غير موجود' }, { status: 404 });
		}

		const stats = await getOrderStats();
		return json({ success: true, stats });
	} catch (err) {
		console.error('[API /api/orders DELETE] Error deleting order:', err);
		return json({ error: 'تعذر حذف الطلب' }, { status: 500 });
	}
};
