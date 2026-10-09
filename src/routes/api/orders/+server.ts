import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readOrders, saveOrder, updateOrderStatus, deleteOrder, getOrderStats } from '$lib/content/orders';
import { isValidSession } from '$lib/server/auth';
import { sendOrderToGoogleSheets } from '$lib/server/sheets';
import type { OrderStatus } from '$lib/types/order';

const VALID_STATUSES: OrderStatus[] = ['جديد', 'مؤكد', 'جاري الشحن', 'تم التسليم', 'ملغي'];

// Public: Customer checkout submission
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

    // Ensure consistent orderId across both storage systems
    const orderId = String(body.orderId || body.id || ('ORD-' + Math.floor(100000 + Math.random() * 900000))).trim();
    body.orderId = orderId;
    body.id = orderId;

    // Dual-Storage: Save to internal Git DB and Google Sheets simultaneously (parallel non-blocking)
    const [saveResult, sheetsResult] = await Promise.allSettled([
      saveOrder(body),
      sendOrderToGoogleSheets(body, body.sheetsUrl)
    ]);

    const order = saveResult.status === 'fulfilled' ? saveResult.value : null;

    if (!order) {
      console.error('[API /api/orders POST] Failed to save order to internal DB:', saveResult.status === 'rejected' ? saveResult.reason : 'unknown');
      return json({ error: 'حدث خطأ أثناء حفظ الطلب' }, { status: 500 });
    }

    const sheetsSynced = sheetsResult.status === 'fulfilled' && sheetsResult.value.ok;

    return json({ success: true, order, sheetsSynced }, { status: 201 });
  } catch (err) {
    console.error('[API /api/orders POST] Error creating order:', err);
    return json({ error: 'حدث خطأ أثناء حفظ الطلب' }, { status: 500 });
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
