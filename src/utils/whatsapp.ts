import { Order, Product } from '../types';
import { DEFAULT_PRODUCTS } from '../data/defaultData';
import { formatPrice } from './format';

/**
 * Normalizes any international phone number string to a pure digit string for WhatsApp wa.me URLs.
 * Example: "+237 6 99 00 11 22" -> "237699001122"
 * Example: "+33 6 12 34 56 78" -> "33612345678"
 */
export function normalizeWhatsAppNumber(rawNumber?: string | null): string {
  if (!rawNumber) return '237600000000';
  
  // Remove all non-numeric characters except digits (strips '+', spaces, dashes)
  let cleaned = rawNumber.replace(/[^0-9]/g, '');

  // If user entered with leading double zero "00237...", strip the "00"
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  return cleaned || '237600000000';
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
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const effectivePrice = product.promotionalPrice && product.promotionalPrice > 0
    ? product.promotionalPrice
    : product.price;

  const defaultIntro = customDefaultMessage?.trim() || "Bonjour, je souhaite obtenir des informations sur cette montre d'exception et connaître sa disponibilité.";

  let watchImgUrl = product.images?.[0] || product.coverImage || '';
  if (watchImgUrl.startsWith('/') && origin) {
    watchImgUrl = `${origin}${watchImgUrl}`;
  }
  const hasValidImg = watchImgUrl && !watchImgUrl.startsWith('blob:') && !watchImgUrl.startsWith('data:');

  const lines = [
    `👑 *DEMANDE D'INFORMATION & RÉSERVATION - ${storeName.toUpperCase()}*`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    defaultIntro,
    ``,
    `💎 *DÉTAILS DU GARDE-TEMPS :*`,
    `▪ *Modèle :* ${product.name}`,
    `▪ *Maison / Marque :* ${product.brand}`,
    product.reference ? `▪ *Référence :* ${product.reference}` : null,
    `▪ *Prix :* ${formatPrice(effectivePrice)}`,
    quantity > 1 ? `▪ *Quantité souhaitée :* ${quantity}` : null,
    product.specifications?.movement ? `▪ *Mouvement :* ${product.specifications.movement}` : null,
    hasValidImg ? `📸 *Photo de la montre :* ${watchImgUrl}` : null,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `Pouvez-vous me confirmer la disponibilité sous écrin et les délais de livraison svp ?`
  ].filter((line): line is string => line !== null);

  return lines.join('\n');
}

/**
 * Resolves a public HTTP(S) photo URL for a given watch item so WhatsApp can display/click every watch photo.
 */
export function resolveWatchItemPhotoUrl(item: {
  productId?: string;
  name?: string;
  image?: string;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  let imgUrl = (item.image || '').trim();

  if (imgUrl.startsWith('/') && origin) {
    imgUrl = `${origin}${imgUrl}`;
  }

  // If image is missing or is a local blob/data URI, look up the catalog product for a public URL
  if (!imgUrl || imgUrl.startsWith('blob:') || imgUrl.startsWith('data:')) {
    const catalogMatch = DEFAULT_PRODUCTS.find(
      (p) =>
        (item.productId && p.id === item.productId) ||
        (item.name && p.name.toLowerCase() === item.name.toLowerCase())
    );
    const fallbackImg = catalogMatch?.images?.[0] || catalogMatch?.coverImage || '';
    if (fallbackImg) {
      imgUrl = fallbackImg.startsWith('/') && origin ? `${origin}${fallbackImg}` : fallbackImg;
    }
  }

  if (imgUrl && !imgUrl.startsWith('blob:') && !imgUrl.startsWith('data:')) {
    return imgUrl;
  }
  return '';
}

/**
 * Builds the official purchase order breakdown transmitted to WhatsApp upon checkout.
 * Loops over EVERY watch in the cart/order (order.items.map) and includes each watch's
 * own photo URL right after its individual details.
 */
export function buildOrderWhatsAppMessage(
  order: Order,
  storeName = "L'Écrin du Temps",
  customDefaultMessage?: string
): string {
  const allItems = Array.isArray(order.items) ? order.items : [];
  const totalItemsCount = allItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const distinctCount = allItems.length;

  const itemsText = allItems
    .map((item, index) => {
      const imgUrl = resolveWatchItemPhotoUrl(item);
      const unitPriceFormatted = formatPrice(item.unitPrice || item.price);
      const subtotalFormatted = formatPrice(item.subtotal || ((item.unitPrice || item.price) * item.quantity));
      const brandName = item.brand?.trim() || 'Horlogerie de Prestige';

      return [
        `⌚ *MONTRE ${index + 1} / ${distinctCount} :*`,
        `   • *Modèle :* ${item.name}`,
        `   • *Marque :* ${brandName}`,
        `   • *Prix unitaire :* ${unitPriceFormatted}`,
        `   • *Quantité :* ${item.quantity}${item.quantity > 1 ? ` (Sous-total : ${subtotalFormatted})` : ''}`,
        imgUrl ? `   📸 *Photo de la montre :* ${imgUrl}` : null
      ]
        .filter((line): line is string => Boolean(line))
        .join('\n');
    })
    .join('\n\n');

  const greeting =
    customDefaultMessage?.trim() ||
    "Bonjour ! Je viens de réserver ces garde-temps sur votre boutique en ligne et je souhaite finaliser ma commande avec vous.";

  const message = [
    `👑 *NOUVELLE COMMANDE - ${storeName.toUpperCase()}*`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *N° Commande :* #${order.orderNumber || order.id.slice(0, 8)}`,
    `📅 *Date :* ${new Date(order.createdAt).toLocaleDateString('fr-FR')} à ${new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    ``,
    `🛍️ *MONTRES COMMANDÉES (${distinctCount} modèle${distinctCount > 1 ? 's' : ''}) :*`,
    itemsText,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `📊 *RÉCAPITULATIF DE LA COMMANDE :*`,
    `• *Nombre total d'articles :* ${totalItemsCount} montre${totalItemsCount > 1 ? 's' : ''}`,
    `• *Sous-total :* ${formatPrice(order.subtotal)}`,
    `• *Expédition :* ${order.shipping > 0 ? formatPrice(order.shipping) : 'Offerte (Sous écrin sécurisé)'}`,
    `• 💎 *PRIX TOTAL DE LA COMMANDE :* *${formatPrice(order.total)}*`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `👤 *COORDONNÉES DU CLIENT :*`,
    `• *Nom :* ${order.customer.name}`,
    `• *Téléphone :* ${order.customer.phone}`,
    order.customer.email ? `• *Email :* ${order.customer.email}` : null,
    order.customer.city ? `• *Ville :* ${order.customer.city}` : null,
    order.customer.address ? `• *Adresse de livraison :* ${order.customer.address}` : null,
    order.customer.notes ? `• *Instructions particulières :* ${order.customer.notes}` : null,
    ``,
    `💳 *Modalité :* Échange et confirmation en direct sur WhatsApp`,
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
    'En attente': 'En attente de traitement',
    'En cours': 'En cours de préparation / expédition',
    'Payée': 'Paiement reçu et validé avec succès',
    'Livrée': 'Livrée et finalisée sous écrin',
    pending: 'Reçue et en attente de confirmation',
    confirmed: 'Confirmée avec succès',
    preparing: 'En cours de préparation sous écrin de luxe',
    shipped: 'Expédiée avec numéro de suivi sécurisé',
    delivered: 'Livrée en main propre',
    cancelled: 'Annulée'
  };

  const currentStatusText = statusLabels[order.status] || order.status || 'En cours';
  const customerName = order.customer?.name || order.customerName || 'Client';
  const totalAmount = Number(order.total) || 0;

  const lines = [
    `Bonjour ${customerName},`,
    ``,
    `C'est la Maison *${storeName}* concernant votre commande *#${order.orderNumber || ''}* d'un montant de *${formatPrice(totalAmount)}*.`,
    ``,
    `📌 *Statut actuel de votre commande :* ${currentStatusText}`,
    ``,
    `Nous restons à votre entière disposition pour toute précision horlogère ou pour convenir du créneau de livraison.`
  ];

  return lines.join('\n');
}
