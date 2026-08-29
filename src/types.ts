export type Gender = 'homme' | 'femme' | 'mixte';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'not_required';

export type PaymentMethod =
  | 'whatsapp_direct'
  | 'bank_transfer'
  | 'cash_on_delivery'
  | 'online_gateway';

export interface WatchSpecifications {
  movement?: string; // Ex: Automatique Suisse Calibre ETA 2824-2
  caseDiameter?: string; // Ex: 41 mm
  caseMaterial?: string; // Ex: Acier inoxydable 316L, Or Rose 18K
  waterResistance?: string; // Ex: 10 ATM (100 mètres)
  glass?: string; // Ex: Verre Saphir inrayable avec traitement antireflet
  strapMaterial?: string; // Ex: Cuir alligator véritable, Acier jubilé
  powerReserve?: string; // Ex: 48 heures
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  promotionalPrice?: number | null;
  currency: string;
  categoryId: string;
  gender: Gender;
  brand: string;
  reference?: string;
  images: string[];
  stock: number;
  lowStockThreshold: number;
  featured: boolean;
  active: boolean;
  specifications?: WatchSpecifications;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number; // Historical fixed unit price at time of order
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  whatsappMessageSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
}

export interface ContactInformation {
  email?: string;
  phone?: string;
  address?: string;
  openingHours?: string;
}

export interface StoreSettings {
  storeName: string;
  logo?: string;
  whatsappNumber: string; // Ex: +33612345678 or international without spaces
  currency: string;
  defaultLowStockThreshold: number;
  shippingEnabled: boolean;
  shippingFee: number;
  shippingMessage?: string;
  socialLinks?: SocialLinks;
  contactInformation?: ContactInformation;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'manager';
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
