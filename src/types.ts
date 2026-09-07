export type Gender = 'homme' | 'femme' | 'mixte' | 'unisex';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
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
  | 'whatsapp'
  | 'bank_transfer'
  | 'cash_on_delivery'
  | 'online_gateway'
  | 'pending'
  | 'other';

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
  brand: string;
  collectionId?: string;
  collectionName?: string;
  categoryId?: string;
  gender: Gender;
  description: string;
  shortDescription?: string;
  price: number;
  promoPrice?: number | null;
  promotionalPrice?: number | null;
  currency: string;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  coverImage?: string;
  isActive?: boolean;
  active: boolean; // Dual-key compatibility
  isFeatured?: boolean;
  featured: boolean; // Dual-key compatibility
  isPopular?: boolean;
  totalOrders?: number;
  totalQuantitySold?: number;
  slug?: string;
  reference?: string;
  specifications?: WatchSpecifications;
  isDemo?: boolean; // Tag identifying demo/seed fixture data
  isArchived?: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  active: boolean; // Dual-key compatibility
  status?: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  phone: string;
  country?: string;
  city: string;
  address: string;
  role: 'customer' | 'admin' | 'owner';
  isDemo?: boolean; // Tag identifying demo customer accounts
  ordersCount?: number;
  totalSpent?: number;
  lastLoginAt?: string;
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
  productName?: string;
  name: string;
  brand?: string;
  image: string;
  unitPrice?: number;
  price: number; // Historical fixed unit price at time of order
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customerId?: string; // Associated Firebase Auth customer account UID
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shippingCost?: number;
  shipping: number;
  total: number;
  currency: string;
  status: OrderStatus;
  orderStatus?: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  whatsappOrder?: boolean;
  whatsappMessageSent?: boolean;
  isDemo?: boolean; // Tag identifying demo orders
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: {
    uid: string;
    email: string;
  };
  summary: {
    deletedProductsCount: number;
    deletedOrdersCount: number;
    deletedCustomersCount: number;
    timestamp: string;
  };
  preservedData: string[];
  timestamp: string;
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
  whatsappMessage?: string;
}

export interface StoreSettings {
  storeName: string;
  name?: string;
  description?: string;
  logo?: string;
  logoUrl?: string;
  faviconUrl?: string;
  whatsappNumber: string; // Numéro WhatsApp professionnel international (Ex: +237XXXXXXXXX, +33612345678)
  whatsappDefaultMessage?: string; // Message WhatsApp par défaut personnalisable
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
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  userId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
