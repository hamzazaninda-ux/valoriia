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
}

export interface OrderStats {
  totalOrders: number;
  confirmedOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  confirmedRevenue: number;
}
