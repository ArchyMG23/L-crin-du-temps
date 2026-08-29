import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../types';
import { decrementStock } from './productService';

const ORDERS_COLLECTION = 'orders';

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
 * Creates an order in Firestore with fixed snapshot pricing and decrements product inventory.
 * Enforces strict input validation and calculations.
 */
export async function createOrder(
  orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  const orderNumber = generateOrderNumber();
  const docRef = doc(collection(db, ORDERS_COLLECTION));

  // 1. Sanitize customer inputs
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

  // 2. Strict snapshot and recalculation of item pricing fixed at purchase time
  let calculatedSubtotal = 0;
  const sanitizedItems = orderPayload.items.slice(0, 50).map(item => {
    const qty = Math.max(1, Math.min(100, Math.floor(item.quantity || 1)));
    const price = Math.max(0, Number(item.price) || 0);
    const itemSubtotal = price * qty;
    calculatedSubtotal += itemSubtotal;
    return {
      productId: sanitizeString(item.productId, 100),
      name: sanitizeString(item.name, 200),
      image: sanitizeString(item.image, 500) || '',
      price: price,
      quantity: qty,
      subtotal: itemSubtotal
    };
  });

  const shippingFee = Math.max(0, Number(orderPayload.shipping) || 0);
  const calculatedTotal = calculatedSubtotal + shippingFee;

  const newOrder: Order = {
    id: docRef.id,
    orderNumber,
    customer: sanitizedCustomer,
    items: sanitizedItems,
    subtotal: calculatedSubtotal,
    shipping: shippingFee,
    total: calculatedTotal,
    currency: sanitizeString(orderPayload.currency, 10) || '€',
    status: 'pending', // Public visitor CANNOT set to paid or delivered
    paymentStatus: 'pending', // Protected status
    paymentMethod: (orderPayload.paymentMethod as PaymentMethod) || 'whatsapp_direct',
    notes: sanitizedCustomer.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(docRef, newOrder);

    // Attempt to decrement stock for each purchased watch (if allowed or handled)
    for (const item of newOrder.items) {
      if (item.productId) {
        try {
          await decrementStock(item.productId, item.quantity);
        } catch (stockErr) {
          console.warn('Stock decrement note:', stockErr);
        }
      }
    }

    return newOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${ORDERS_COLLECTION}/${docRef.id}`);
  }
}

/**
 * Fetch all orders for the administrator dashboard
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  } catch (error: any) {
    // If user is unauthenticated or has insufficient permissions (e.g. public visitor), return empty
    if (error?.code === 'permission-denied' || String(error?.message).includes('insufficient permissions')) {
      console.info('Public guest session: orders collection access restricted to admins.');
      return [];
    }
    
    try {
      const colRef = collection(db, ORDERS_COLLECTION);
      const snapshot = await getDocs(colRef);
      const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e2: any) {
      if (e2?.code === 'permission-denied' || String(e2?.message).includes('insufficient permissions')) {
        return [];
      }
      console.warn('Orders fetch warning:', e2);
      return [];
    }
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
  const path = `${ORDERS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    await updateDoc(docRef, {
      status,
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
  const path = `${ORDERS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Format the message for WhatsApp order transmission by client
 */
export function buildWhatsAppOrderUrl(order: Order, whatsappNumber: string, storeName: string): string {
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');

  const itemsText = order.items
    .map(
      (item) =>
        `▪ *${item.quantity}x* ${item.name}\n   Prix unitaire: ${item.price.toLocaleString('fr-FR')} ${order.currency} (Total: ${item.subtotal.toLocaleString('fr-FR')} ${order.currency})`
    )
    .join('\n\n');

  const message = [
    `👑 *NOUVELLE COMMANDE - ${storeName.toUpperCase()}*`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *N° Commande :* #${order.orderNumber}`,
    `📅 *Date :* ${new Date(order.createdAt).toLocaleDateString('fr-FR')} à ${new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    ``,
    `🛍️ *ARTICLES COMMANDÉS :*`,
    itemsText,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `💵 *Sous-total :* ${order.subtotal.toLocaleString('fr-FR')} ${order.currency}`,
    `📦 *Expédition :* ${order.shipping > 0 ? `${order.shipping.toLocaleString('fr-FR')} ${order.currency}` : 'Offerte (Sécurisée & Assurée)'}`,
    `💎 *TOTAL À RÉGLER :* *${order.total.toLocaleString('fr-FR')} ${order.currency}*`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `👤 *COORDONNÉES CLIENT :*`,
    `• *Nom :* ${order.customer.name}`,
    `• *Téléphone :* ${order.customer.phone}`,
    order.customer.email ? `• *Email :* ${order.customer.email}` : null,
    `• *Ville :* ${order.customer.city}`,
    `• *Adresse de livraison :* ${order.customer.address}`,
    order.customer.notes ? `• *Instructions particulières :* ${order.customer.notes}` : null,
    ``,
    `💳 *Règlement :* Validation & Échange en direct sur WhatsApp`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `Bonjour ! Je viens de réserver ces garde-temps sur votre boutique en ligne et je souhaite finaliser la commande avec vous.`
  ]
    .filter(line => line !== null)
    .join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Format message for admin to follow up with customer on WhatsApp
 */
export function buildWhatsAppAdminToClientUrl(order: Order, storeName: string): string {
  const cleanPhone = order.customer.phone.replace(/[^0-9]/g, '');
  const message = [
    `Bonjour ${order.customer.name},`,
    ``,
    `C'est la Maison ${storeName} concernant votre commande *#${order.orderNumber}* d'un montant de *${order.total.toLocaleString('fr-FR')} ${order.currency}*.`,
    ``,
    `Statut actuel : *${order.status === 'confirmed' ? 'Confirmée' : order.status === 'preparing' ? 'En cours de préparation sous écrin de luxe' : order.status === 'shipped' ? 'Expédiée avec numéro de suivi sécurisé' : order.status === 'delivered' ? 'Livrée' : 'Reçue'}*.`,
    ``,
    `Nous restons à votre entière disposition pour tout renseignement ou précision horlogère.`
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
