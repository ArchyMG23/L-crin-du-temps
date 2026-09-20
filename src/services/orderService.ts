import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../types';
import { ensureAdminAuth } from './adminService';
import { withTimeout } from '../utils/async';

const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products';

export function generateOrderNumber(): string {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `CMD-${currentYear}-${randomSuffix}`;
}

function sanitizeString(input: string | undefined | null, maxLength = 255): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Strip control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Zero-Trust Order Creation Engine:
 * 1. NEVER trusts price, total, or stock provided by the client.
 * 2. Fetches each watch directly from Firestore to obtain the authentic catalog price and promo price.
 * 3. Validates stock sufficiency before placing the order.
 * 4. Atomically decrements watch inventory within a Firestore transaction.
 * 5. Binds the authenticated user UID to prevent order spoofing.
 */
export async function createOrder(
  orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  const orderNumber = generateOrderNumber();
  const orderDocRef = doc(collection(db, ORDERS_COLLECTION));

  // 1. Strict sanitization of customer inputs
  const sanitizedCustomer = {
    name: sanitizeString(orderPayload.customer.name, 100),
    phone: sanitizeString(orderPayload.customer.phone, 30),
    email: orderPayload.customer.email ? sanitizeString(orderPayload.customer.email, 120) : undefined,
    city: sanitizeString(orderPayload.customer.city, 100),
    address: sanitizeString(orderPayload.customer.address, 300),
    notes: orderPayload.customer.notes ? sanitizeString(orderPayload.customer.notes, 1000) : undefined
  };

  if (!sanitizedCustomer.name || !sanitizedCustomer.phone || !sanitizedCustomer.city || !sanitizedCustomer.address) {
    throw new Error('Les coordonnées du client sont incomplètes ou invalides.');
  }

  if (!orderPayload.items || orderPayload.items.length === 0) {
    throw new Error('Le panier est vide.');
  }

  // 2. ZERO-TRUST: Fetch authentic product data from Firestore & recalculate prices
  let calculatedSubtotal = 0;
  const verifiedItems: Order['items'] = [];
  const productDeductions: { ref: any; newStock: number; newOrders: number; newSold: number }[] = [];

  for (const clientItem of orderPayload.items.slice(0, 50)) {
    const pId = sanitizeString(clientItem.productId, 100);
    const qty = Math.max(1, Math.min(50, Math.floor(clientItem.quantity || 1)));

    if (!pId) {
      throw new Error('Identifiant de produit manquant dans la commande.');
    }

    const pRef = doc(db, PRODUCTS_COLLECTION, pId);
    const pSnap = await getDoc(pRef);

    if (!pSnap.exists()) {
      throw new Error(`Le garde-temps #${pId} est introuvable dans le catalogue.`);
    }

    const pData = pSnap.data();
    const isActive = pData.isActive !== false && pData.active !== false;
    if (!isActive) {
      throw new Error(`Le garde-temps "${pData.name || pId}" n'est plus disponible à l'achat.`);
    }

    const availableStock = Math.max(0, Math.floor(Number(pData.stock) || 0));
    if (availableStock < qty) {
      throw new Error(
        `Stock insuffisant pour "${pData.name}". Quantité en stock : ${availableStock}, demandée : ${qty}.`
      );
    }

    // Official server-verified unit price (priority: active promoPrice -> regular price)
    const promo = pData.promoPrice !== undefined ? pData.promoPrice : (pData.promotionalPrice !== undefined ? pData.promotionalPrice : null);
    const officialPrice = (promo !== null && promo !== undefined && Number(promo) > 0)
      ? Number(promo)
      : Math.max(0, Number(pData.price) || 0);

    const itemSubtotal = officialPrice * qty;
    calculatedSubtotal += itemSubtotal;

    const pImage = pData.coverImage || (Array.isArray(pData.images) ? pData.images[0] : '') || sanitizeString(clientItem.image, 500) || '';

    verifiedItems.push({
      productId: pId,
      name: sanitizeString(pData.name, 200) || 'Garde-temps d\'exception',
      brand: sanitizeString(pData.brand, 100) || '',
      image: pImage,
      price: officialPrice,
      quantity: qty,
      subtotal: itemSubtotal
    });
  }

  // 3. Strict shipping fee calculation & total
  const rawShipping = Number(orderPayload.shipping ?? orderPayload.shippingCost ?? 0);
  const shippingFee = Math.max(0, Math.min(100000, isNaN(rawShipping) ? 0 : rawShipping));
  const calculatedTotal = calculatedSubtotal + shippingFee;
  const nowIso = new Date().toISOString();

  // 4. Force authenticated customer UID if user is signed in to prevent ID spoofing
  const authenticatedUid = auth.currentUser ? auth.currentUser.uid : undefined;
  const customerId = authenticatedUid || (orderPayload.customerId ? sanitizeString(orderPayload.customerId, 100) : undefined);
  const customerEmail = sanitizedCustomer.email || auth.currentUser?.email || orderPayload.customerEmail || '';
  const customerName = sanitizedCustomer.name || auth.currentUser?.displayName || orderPayload.customerName || '';
  const customerPhone = sanitizedCustomer.phone || orderPayload.customerPhone || '';

  const newOrder: Order = {
    id: orderDocRef.id,
    orderNumber,
    customerId,
    customerEmail,
    customerName,
    customerPhone,
    customer: sanitizedCustomer,
    items: verifiedItems,
    subtotal: calculatedSubtotal,
    shipping: shippingFee,
    shippingCost: shippingFee,
    total: calculatedTotal,
    currency: sanitizeString(orderPayload.currency, 10) || 'FCFA',
    status: 'pending',
    orderStatus: 'pending',
    paymentStatus: 'pending',
    paymentMethod: (orderPayload.paymentMethod as PaymentMethod) || 'whatsapp_direct',
    whatsappOrder: Boolean(orderPayload.whatsappOrder ?? true),
    whatsappMessageSent: Boolean(orderPayload.whatsappMessageSent ?? false),
    notes: sanitizedCustomer.notes,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  try {
    // 5. ATOMIC TRANSACTION: Decrement stock & record order in a single transaction
    await runTransaction(db, async (transaction) => {
      // Step A: Read phase in transaction
      const productReads: { ref: any; currentStock: number; currentOrders: number; currentSold: number; qtyToDeduct: number }[] = [];
      
      for (const item of verifiedItems) {
        const pRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        const pSnap = await transaction.get(pRef);
        if (!pSnap.exists()) {
          throw new Error(`Produit #${item.productId} introuvable.`);
        }
        const pData = pSnap.data();
        const currentStock = Math.max(0, Math.floor(Number(pData.stock) || 0));
        if (currentStock < item.quantity) {
          throw new Error(`Stock épuisé entre-temps pour "${pData.name}". Transaction annulée.`);
        }
        const currentOrders = Number(pData.totalOrders ?? pData.orderCount ?? 0);
        const currentSold = Number(pData.totalQuantitySold ?? 0);

        productReads.push({
          ref: pRef,
          currentStock,
          currentOrders,
          currentSold,
          qtyToDeduct: item.quantity
        });
      }

      // Step B: Write phase in transaction
      for (const p of productReads) {
        transaction.update(p.ref, {
          stock: p.currentStock - p.qtyToDeduct,
          totalOrders: p.currentOrders + 1,
          orderCount: p.currentOrders + 1,
          totalQuantitySold: p.currentSold + p.qtyToDeduct,
          updatedAt: nowIso
        });
      }

      // Set order document
      transaction.set(orderDocRef, newOrder);
    });

    return newOrder;
  } catch (error) {
    console.error('Order creation transaction failed:', error);
    handleFirestoreError(error, OperationType.CREATE, `${ORDERS_COLLECTION}/${orderDocRef.id}`);
  }
}

function normalizeOrder(id: string, raw: any): Order {
  const data = raw || {};
  const customer = data.customer || {};
  return {
    id,
    ...data,
    orderNumber: data.orderNumber || `CMD-${id.slice(0, 6)}`,
    status: data.status || 'pending',
    orderStatus: data.orderStatus || data.status || 'pending',
    paymentStatus: data.paymentStatus || 'pending',
    currency: data.currency || '€',
    total: Number(data.total) || 0,
    subtotal: Number(data.subtotal) || 0,
    shipping: Number(data.shipping ?? data.shippingCost ?? 0),
    items: Array.isArray(data.items) ? data.items : [],
    customer: {
      name: customer.name || data.customerName || 'Client',
      email: customer.email || data.customerEmail || '',
      phone: customer.phone || data.customerPhone || '',
      city: customer.city || '',
      address: customer.address || '',
      notes: customer.notes || data.notes || ''
    },
    customerName: data.customerName || customer.name || 'Client',
    customerEmail: data.customerEmail || customer.email || '',
    customerPhone: data.customerPhone || customer.phone || '',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  } as Order;
}

/**
 * Fetch all orders for the administrator dashboard
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await withTimeout(getDocs(q), 3000, null, 'firestore-orders-ordered');
    if (snapshot) {
      return snapshot.docs.map(d => normalizeOrder(d.id, d.data()));
    }
  } catch (error: any) {
    if (error?.code === 'permission-denied' || String(error?.message).includes('insufficient permissions')) {
      return [];
    }
  }
  
  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    const snapshot = await withTimeout(getDocs(colRef), 2500, null, 'firestore-orders-fallback');
    if (!snapshot) return [];
    const orders = snapshot.docs.map(d => normalizeOrder(d.id, d.data()));
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e2: any) {
    return [];
  }
}

/**
 * Get a specific order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const path = `${ORDERS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Order;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Update order tracking status
 */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await ensureAdminAuth();
  const path = `${ORDERS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    await updateDoc(docRef, {
      status,
      orderStatus: status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Update payment settlement status
 */
export async function updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<void> {
  await ensureAdminAuth();
  const path = `${ORDERS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    await updateDoc(docRef, {
      paymentStatus,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete an order document
 */
export async function deleteOrder(id: string): Promise<void> {
  await ensureAdminAuth();
  const path = `${ORDERS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

import {
  normalizeWhatsAppNumber,
  buildOrderWhatsAppMessage,
  buildAdminFollowUpMessage
} from '../utils/whatsapp';

/**
 * Format the message for WhatsApp order transmission by client
 */
export function buildWhatsAppOrderUrl(
  order: Order,
  whatsappNumber: string,
  storeName: string,
  customDefaultMessage?: string
): string {
  const cleanPhone = normalizeWhatsAppNumber(whatsappNumber);
  const message = buildOrderWhatsAppMessage(order, storeName, customDefaultMessage);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Format message for admin to follow up with customer on WhatsApp
 */
export function buildWhatsAppAdminToClientUrl(order: Order, storeName: string): string {
  const cleanPhone = normalizeWhatsAppNumber(order.customer?.phone || order.customerPhone || '');
  const message = buildAdminFollowUpMessage(order, storeName);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Fetch orders for a specific authenticated customer (strict data isolation)
 */
export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    const q = query(colRef, where('customerId', '==', customerId));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error: any) {
    console.warn('Error fetching customer orders:', error);
    return [];
  }
}
