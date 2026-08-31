import { Order, Product } from '../types';

/**
 * Normalizes any international phone number string to a pure digit string for WhatsApp wa.me URLs.
 * Example: "+237 6 99 00 11 22" -> "237699001122"
 * Example: "+33 6 12 34 56 78" -> "33612345678"
 */
export function normalizeWhatsAppNumber(rawNumber?: string | null): string {
  if (!rawNumber) return '33612345678';
  
  // Remove all non-numeric characters except digits
  let cleaned = rawNumber.replace(/[^0-9]/g, '');

  // If user entered with leading double zero "00237...", strip the "00"
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  return cleaned;
}

/**
 * Formats a phone number for elegant human-readable display with '+' and spacing.
 * Example: "+237699001122" -> "+237 6 99 00 11 22"
 */
export function formatDisplayWhatsAppNumber(rawNumber?: string | null): string {
  if (!rawNumber) return '+33 6 12 34 56 78';
  
  const trimmed = rawNumber.trim();
  if (trimmed.startsWith('+')) {
    return trimmed;
  }
  const clean = normalizeWhatsAppNumber(trimmed);
  return `+${clean}`;
}

/**
 * Validates whether the given string is a plausible international phone number.
 */
export function validateWhatsAppNumber(rawNumber: string): {
  isValid: boolean;
  cleanNumber: string;
  error?: string;
} {
  const clean = normalizeWhatsAppNumber(rawNumber);
  
  if (!clean || clean.length < 7) {
    return {
      isValid: false,
      cleanNumber: clean,
      error: 'Le numéro WhatsApp est trop court. Veuillez inclure l\'indicatif pays (ex: +237... ou +33...).'
    };
  }

  if (clean.length > 16) {
    return {
      isValid: false,
      cleanNumber: clean,
      error: 'Le numéro WhatsApp est trop long (maximum 15 chiffres selon le standard international E.164).'
    };
  }

  return {
    isValid: true,
    cleanNumber: clean
  };
}

/**
 * Generates an official wa.me direct conversation URL.
 */
export function buildWhatsAppChatUrl(rawNumber?: string | null, message?: string | null): string {
  const clean = normalizeWhatsAppNumber(rawNumber);
  if (!message || !message.trim()) {
    return `https://wa.me/${clean}`;
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(message.trim())}`;
}

/**
 * Builds a structured luxury inquiry message for a specific watch.
 */
export function buildProductInquiryMessage(
  product: Product,
  storeName = "L'Écrin du Temps",
  customDefaultMessage?: string,
  quantity = 1
): string {
  const effectivePrice = product.promotionalPrice && product.promotionalPrice > 0
    ? product.promotionalPrice
    : product.price;

  const defaultIntro = customDefaultMessage?.trim() || "Bonjour, je souhaite obtenir des informations sur cette montre d'exception et connaître sa disponibilité.";

  const lines = [
    `👑 *DEMANDE D'INFORMATION & RÉSERVATION - ${storeName.toUpperCase()}*`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    defaultIntro,
    ``,
    `💎 *DÉTAILS DU GARDE-TEMPS :*`,
    `▪ *Modèle :* ${product.name}`,
    `▪ *Maison / Marque :* ${product.brand}`,
    product.reference ? `▪ *Référence :* ${product.reference}` : null,
    `▪ *Prix :* ${effectivePrice.toLocaleString('fr-FR')} ${product.currency || '€'}`,
    quantity > 1 ? `▪ *Quantité souhaitée :* ${quantity}` : null,
    product.specifications?.movement ? `▪ *Mouvement :* ${product.specifications.movement}` : null,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `Pouvez-vous me confirmer la disponibilité sous écrin et les délais de livraison svp ?`
  ].filter((line): line is string => line !== null);

  return lines.join('\n');
}

/**
 * Builds the official purchase order breakdown transmitted to WhatsApp upon checkout.
 */
export function buildOrderWhatsAppMessage(
  order: Order,
  storeName = "L'Écrin du Temps",
  customDefaultMessage?: string
): string {
  const itemsText = order.items
    .map(
      (item) =>
        `▪ *${item.quantity}x* ${item.name}\n   Prix: ${item.price.toLocaleString('fr-FR')} ${order.currency} (Sous-total: ${item.subtotal.toLocaleString('fr-FR')} ${order.currency})`
    )
    .join('\n\n');

  const greeting = customDefaultMessage?.trim() || "Bonjour ! Je viens de réserver ces garde-temps sur votre boutique en ligne et je souhaite finaliser ma commande avec vous.";

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
    `📦 *Expédition :* ${order.shipping > 0 ? `${order.shipping.toLocaleString('fr-FR')} ${order.currency}` : 'Offerte (Sous écrin sécurisé)'}`,
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
    greeting
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  return message;
}

/**
 * Builds the official administrative follow-up message from store owner to customer on WhatsApp.
 */
export function buildAdminFollowUpMessage(
  order: Order,
  storeName = "L'Écrin du Temps"
): string {
  const statusLabels: Record<string, string> = {
    pending: 'Reçue et en attente de confirmation',
    confirmed: 'Confirmée avec succès',
    preparing: 'En cours de préparation sous écrin de luxe',
    shipped: 'Expédiée avec numéro de suivi sécurisé',
    delivered: 'Livrée en main propre',
    cancelled: 'Annulée'
  };

  const currentStatusText = statusLabels[order.status] || order.status;

  const lines = [
    `Bonjour ${order.customer.name},`,
    ``,
    `C'est la Maison *${storeName}* concernant votre commande *#${order.orderNumber}* d'un montant de *${order.total.toLocaleString('fr-FR')} ${order.currency}*.`,
    ``,
    `📌 *Statut actuel de votre commande :* ${currentStatusText}`,
    ``,
    `Nous restons à votre entière disposition pour tout renseignement ou précision horlogère.`
  ];

  return lines.join('\n');
}
