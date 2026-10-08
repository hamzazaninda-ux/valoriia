import { gitReadFile, gitWriteFile } from './git';
import type { StoredOrder, OrderStatus, CreateOrderInput, OrderStats } from '$lib/types/order';

const ORDERS_FILE_PATH = 'content/orders/orders.json';

// In-memory cache for fast serverless responses
let cachedOrders: StoredOrder[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds cache TTL

export async function readOrders(forceFresh = false): Promise<StoredOrder[]> {
  const now = Date.now();
  if (!forceFresh && cachedOrders && now - cacheTime < CACHE_TTL_MS) {
    return cachedOrders;
  }

  try {
    const raw = await gitReadFile('main', ORDERS_FILE_PATH);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Sort newest first
      const orders = parsed.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      cachedOrders = orders;
      cacheTime = now;
      return orders;
    }
    return [];
  } catch (err) {
    console.warn('[Orders] Could not read orders file, checking fallback:', err);
    if (cachedOrders) return cachedOrders;
    return [];
  }
}

export async function saveOrder(input: CreateOrderInput): Promise<StoredOrder> {
  const currentOrders = await readOrders(true);

  const orderId = (input.orderId || input.id || 'ORD-' + Math.floor(100000 + Math.random() * 900000)).trim();
  const now = new Date().toISOString();

  // If order with same ID already exists (e.g. rapid duplicate submit), return it
  const existing = currentOrders.find((o) => o.id === orderId);
  if (existing) {
    return existing;
  }

  const productTitle = (
    input.product ||
    input.offer ||
    input.productTitle ||
    'طقم التنظيم المنزلي + هدية'
  ).trim();

  const price = Number(input.totalPrice ?? input.price ?? 229);
  const qty = Number(input.quantity ?? input.qte ?? 1);

  const newOrder: StoredOrder = {
    id: orderId,
    createdAt: now,
    fullName: (input.fullName || 'زبون').trim(),
    phone: (input.phoneNumber || input.phone || '').trim(),
    city: (input.city || 'يُحدد عند التأكيد').trim(),
    address: (input.address || input.city || '').trim(),
    product: productTitle,
    quantity: isNaN(qty) || qty <= 0 ? 1 : qty,
    totalPrice: isNaN(price) || price <= 0 ? 229 : price,
    status: 'جديد',
    sku: input.sku || 'kit-tandim',
    pageUrl: input.pageUrl || '',
    orderType: input.orderType || 'direct',
    items: input.items || '',
    notes: input.notes || ''
  };

  const updatedList = [newOrder, ...currentOrders];
  cachedOrders = updatedList;
  cacheTime = Date.now();

  try {
    await gitWriteFile(
      'main',
      ORDERS_FILE_PATH,
      JSON.stringify(updatedList, null, 2),
      `feat(orders): add new order ${orderId}`
    );
  } catch (err) {
    console.error('[Orders] Failed to persist new order to storage:', err);
  }

  return newOrder;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  notes?: string
): Promise<StoredOrder | null> {
  const currentOrders = await readOrders(true);
  const index = currentOrders.findIndex((o) => o.id === orderId);
  if (index === -1) {
    return null;
  }

  const updatedOrder: StoredOrder = {
    ...currentOrders[index],
    status,
    updatedAt: new Date().toISOString(),
    ...(notes !== undefined ? { notes } : {})
  };

  currentOrders[index] = updatedOrder;
  cachedOrders = currentOrders;
  cacheTime = Date.now();

  try {
    await gitWriteFile(
      'main',
      ORDERS_FILE_PATH,
      JSON.stringify(currentOrders, null, 2),
      `fix(orders): update order ${orderId} status to ${status}`
    );
  } catch (err) {
    console.error(`[Orders] Failed to persist status update for order ${orderId}:`, err);
  }

  return updatedOrder;
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  const currentOrders = await readOrders(true);
  const filtered = currentOrders.filter((o) => o.id !== orderId);
  if (filtered.length === currentOrders.length) {
    return false;
  }

  cachedOrders = filtered;
  cacheTime = Date.now();

  try {
    await gitWriteFile(
      'main',
      ORDERS_FILE_PATH,
      JSON.stringify(filtered, null, 2),
      `fix(orders): delete order ${orderId}`
    );
    return true;
  } catch (err) {
    console.error(`[Orders] Failed to delete order ${orderId}:`, err);
    return false;
  }
}

export async function getOrderStats(): Promise<OrderStats> {
  const orders = await readOrders();

  let confirmedOrders = 0;
  let pendingOrders = 0;
  let deliveredOrders = 0;
  let cancelledOrders = 0;
  let totalRevenue = 0;
  let confirmedRevenue = 0;

  for (const o of orders) {
    const price = Number(o.totalPrice) || 0;
    totalRevenue += price;

    if (o.status === 'مؤكد') {
      confirmedOrders++;
      confirmedRevenue += price;
    } else if (o.status === 'تم التسليم') {
      deliveredOrders++;
      confirmedRevenue += price;
    } else if (o.status === 'جاري الشحن') {
      confirmedOrders++;
      confirmedRevenue += price;
    } else if (o.status === 'ملغي') {
      cancelledOrders++;
    } else {
      pendingOrders++;
    }
  }

  return {
    totalOrders: orders.length,
    confirmedOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    confirmedRevenue
  };
}
