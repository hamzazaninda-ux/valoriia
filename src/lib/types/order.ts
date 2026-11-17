export type OrderStatus = 'جديد' | 'مؤكد' | 'جاري الشحن' | 'تم التسليم' | 'ملغي';

export interface StoredOrder {
  id: string; // e.g. ORD-599137
  createdAt: string; // ISO 8601
  fullName: string;
  phone: string;
  city: string;
  address?: string;
  product: string; // e.g. "2 منظمات + 2 رشاشات هدية 🎁"
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  sku?: string;
  pageUrl?: string;
  orderType?: 'cart' | 'upsell' | 'direct';
  items?: string;
  notes?: string;
  /** Offer chosen on the product page, e.g. "الطقم الكامل فالصاك". */
  offer?: string;
  /** True when the post-order add-on was accepted. */
  hasUpsell?: boolean;
  /** Price of the accepted add-on (already included in totalPrice). */
  upsellPrice?: number;
  updatedAt?: string;
}

export interface CreateOrderInput {
  orderId?: string;
  id?: string;
  fullName: string;
  phoneNumber?: string;
  phone?: string;
  city?: string;
  address?: string;
  product?: string;
  productTitle?: string;
  offer?: string;
  quantity?: number;
  qte?: number;
  totalPrice?: number;
  price?: number;
  sku?: string;
  pageUrl?: string;
  orderType?: 'cart' | 'upsell' | 'direct';
  items?: string;
  notes?: string;
  note?: string;
  hasUpsell?: boolean;
  upsellPrice?: number;
}

export interface OrderStats {
  totalOrders: number;
  confirmedOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  confirmedRevenue: number;
  /** Average order value of non-cancelled orders. */
  aov: number;
  /** % of non-cancelled orders that took the post-order add-on. */
  upsellRate: number;
  upsellOrders: number;
  upsellRevenue: number;
  /** % of non-cancelled orders that chose a pack or more than one unit. */
  bundleRate: number;
  /** Confirmed (incl. shipping and delivered) out of orders already called. Null until one is decided. */
  confirmationRate: number | null;
  /** Delivered out of confirmed orders (incl. shipping). Null until one is confirmed. */
  deliveryRate: number | null;
  ordersToday: number;
  revenueToday: number;
}
