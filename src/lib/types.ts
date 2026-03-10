export const CATEGORY_OPTIONS = [
  "Sofas",
  "Beds",
  "Dining tables",
  "Chairs",
  "Office furniture",
] as const;

export const PAYMENT_METHODS = ["UPI", "Card", "Cash on Delivery"] as const;

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Dispatched",
  "Delivered",
] as const;

export const PRICE_FILTERS = [
  { label: "All prices", value: "all", min: 0, max: Number.POSITIVE_INFINITY },
  { label: "Under Rs 20,000", value: "under-20000", min: 0, max: 19_999 },
  { label: "Rs 20,000 - Rs 40,000", value: "20000-40000", min: 20_000, max: 40_000 },
  { label: "Above Rs 40,000", value: "above-40000", min: 40_001, max: Number.POSITIVE_INFINITY },
] as const;

export type Category = (typeof CATEGORY_OPTIONS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PriceFilterValue = (typeof PRICE_FILTERS)[number]["value"];

export type UserRole = "customer" | "admin";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: Category;
  price: number;
  imagePath: string;
  description: string;
  size: string;
  material: string;
  color: string;
  stock: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  slug: string;
  name: string;
  category: Category;
  price: number;
  imagePath: string;
  description: string;
  size: string;
  material: string;
  color: string;
  stock: number;
  featured: boolean;
}

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  total: number;
  deliveryAddress: Address;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CustomerSummary {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  ordersCount: number;
  totalSpend: number;
  joinedAt: string;
  savedAddress: string | null;
}

export interface AccountSnapshot {
  address: Address | null;
  orders: Order[];
}

export interface AdminSnapshot {
  products: Product[];
  orders: Order[];
  customers: CustomerSummary[];
}

export interface StorefrontStats {
  productCount: number;
  categoryCount: number;
  deliveredOrders: number;
}

export interface StorefrontSnapshot {
  products: Product[];
  featuredProducts: Product[];
  stats: StorefrontStats;
}

export interface OrderLineInput {
  productId: number;
  quantity: number;
}
