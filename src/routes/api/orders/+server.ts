import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readOrders, saveOrder, updateOrderStatus, deleteOrder, getOrderStats } from '$lib/content/orders';
import { isValidSession } from '$lib/server/auth';
import { sendOrderToGoogleSheets } from '$lib/server/sheets';
import { sendOrderToSpaceSeller, type SpaceSellerLeadPayload } from '$lib/server/spaceseller';
import type { OrderStatus } from '$lib/types/order';

const VALID_STATUSES: OrderStatus[] = ['جديد', 'مؤكد', 'جاري الشحن', 'تم التسليم', 'ملغي'];
const MOROCCAN_PHONE_REGEX = /^(?:(?:\+?212)|0)[67]\d{8}$/;

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

		const total = Number(body.total ?? body.totalPrice ?? body.price ?? 279);
		const tier = String(body.tier || 'tier_2');

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
		let items = Array.isArray(body.items) ? [...body.items] : [];
		if (items.length === 0) {
			if (tier === 'tier_1') {
				items.push({
					sku: 'gummies_biotine',
					title: 'علكات البيوتين (علبة واحدة)',
					quantity: 1,
					price: 199
				});
			} else if (tier === 'tier_2') {
				items.push(
					{ sku: 'gummies_biotine', title: 'علكات البيوتين للشعر', quantity: 1, price: 139.5 },
					{ sku: 'gummies_collagen', title: 'علكات كولاجين البشرة', quantity: 1, price: 139.5 }
				);
			} else {
				items.push(
					{ sku: 'gummies_biotine', title: 'علكات البيوتين للشعر', quantity: 1, price: 116.33 },
					{ sku: 'gummies_collagen', title: 'علكات كولاجين البشرة', quantity: 1, price: 116.33 },
					{ sku: 'gumies_vitamine', title: 'علكات الفيتامينات المتعددة', quantity: 1, price: 116.34 }
				);
			}
			if (body.hasUpsell) {
				items.push({
					sku: 'gummies_collagen',
					title: 'علبة إضافية (عرض خاطف)',
					quantity: 1,
					price: 99
				});
			}
		}

		const totalQuantity = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);
		const productLabel =
			body.product ||
			body.productTitle ||
			(tier === 'tier_1'
				? 'NOVAVITA - باقة التجربة (1 علبة)'
				: tier === 'tier_2'
					? 'NOVAVITA - باقة الثنائي الأكثر طلباً (2 علب)'
					: 'NOVAVITA - باقة التحول الشامل (3 علب)') +
				(body.hasUpsell ? ' + علبة العرض الخاطف' : '');

		const city = String(body.city || 'تحدد عند التأكيد').trim();
		const address = String(body.address || '').trim();

		// Construct Space Seller Payload
		const spaceSellerProducts = items.map((it: any) => ({
			sku: it.sku || 'gummies_collagen',
			quantity: Number(it.quantity || 1),
			price: Number(it.unitPrice ?? it.price ?? 0)
		}));

		const spaceSellerPayload: SpaceSellerLeadPayload = {
			name: fullName,
			phone: cleanPhone,
			city,
			address,
			note: `طلب NOVAVITA [${tier}]${body.hasUpsell ? ' + عرض خاطف 99 MAD' : ''} [رقم الطلب: ${orderId}]`,
			products: spaceSellerProducts
		};

		// Construct Internal DB payload
		const internalOrderPayload = {
			...body,
			orderId,
			fullName,
			phoneNumber: cleanPhone,
			phone: cleanPhone,
			city,
			address,
			product: productLabel,
			productTitle: productLabel,
			quantity: totalQuantity,
			totalPrice: total,
			items: JSON.stringify(items),
			orderType: body.hasUpsell ? 'upsell' : 'direct',
			status: 'جديد' as OrderStatus
		};

		// Resilient Dual-Dispatch: Space Seller + Google Sheets + Internal Git DB
		const [dbResult, spaceSellerResult, sheetsResult] = await Promise.allSettled([
			saveOrder(internalOrderPayload),
			sendOrderToSpaceSeller(spaceSellerPayload),
			sendOrderToGoogleSheets({
				...internalOrderPayload,
				total,
				items
			})
		]);

		const savedOrder = dbResult.status === 'fulfilled' ? dbResult.value : null;
		const spaceSellerSynced = spaceSellerResult.status === 'fulfilled' && spaceSellerResult.value.ok;
		const sheetsSynced = sheetsResult.status === 'fulfilled' && sheetsResult.value.ok;

		console.log(`📦 [Orders API] Order ${orderId} dispatch summary:`, {
			dbSaved: !!savedOrder,
			spaceSellerSynced,
			sheetsSynced
		});

		const responsePayload = {
			success: true,
			orderId,
			total,
			message: 'تم استلام طلبك بنجاح',
			spaceSellerSynced,
			sheetsSynced,
			order: savedOrder || { id: orderId, orderId, fullName, phone: cleanPhone, total }
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
