import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  MessageSquare,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  UserCheck
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { CustomerInfo, Order, StoreSettings } from '../../types';
import { createOrder, buildWhatsAppOrderUrl, generateOrderNumber } from '../../services/orderService';
import { resolveWatchItemPhotoUrl } from '../../utils/whatsapp';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AuthModal } from './AuthModal';
import { formatPrice } from '../../utils/format';

interface CheckoutModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  settings?: StoreSettings;
  currency?: string;
  whatsappNumber?: string;
  storeName?: string;
  onOrderSuccess?: (order: Order, whatsappUrl: string) => void;
  onOrderCreated?: (order: Order, whatsappUrl: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen: isOpenProp,
  onClose,
  settings,
  currency: currencyProp,
  whatsappNumber: whatsappProp,
  storeName: storeNameProp,
  onOrderSuccess,
  onOrderCreated
}) => {
  const { cart, isCheckoutOpen, setIsCheckoutOpen, subtotal, clearCart } = useCart();
  const { userProfile, isCustomer } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    notes: ''
  });

  // Autofill customer profile when authenticated
  useEffect(() => {
    if (userProfile) {
      setCustomer((prev) => ({
        ...prev,
        name: userProfile.fullName || prev.name,
        phone: userProfile.phone || prev.phone,
        email: userProfile.email || prev.email,
        city: userProfile.city || prev.city,
        address: userProfile.address || prev.address
      }));
    }
  }, [userProfile]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeIsOpen = isOpenProp !== undefined ? isOpenProp : isCheckoutOpen;

  if (!activeIsOpen) return null;

  const handleClose = () => {
    if (onClose) onClose();
    setIsCheckoutOpen(false);
  };

  const shippingFee = settings?.shippingEnabled ? (settings.shippingFee || 0) : 0;
  const total = subtotal + shippingFee;
  const currency = currencyProp || settings?.currency || 'FCFA';
  const whatsappNumber = whatsappProp || settings?.whatsappNumber || '+237600000000';
  const storeName = storeNameProp || settings?.storeName || settings?.name || "L'Écrin du Temps";
  const customIntro = settings?.whatsappDefaultMessage || settings?.contactInformation?.whatsappMessage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form Validations
    if (!customer.name.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!customer.phone.trim() || customer.phone.length < 8) {
      setErrorMsg('Veuillez renseigner un numéro de téléphone WhatsApp valide.');
      return;
    }
    if (!customer.city.trim()) {
      setErrorMsg('Veuillez préciser votre ville de livraison.');
      return;
    }
    if (!customer.address.trim()) {
      setErrorMsg('Veuillez indiquer votre adresse de livraison.');
      return;
    }
    if (cart.length === 0) {
      setErrorMsg('Votre panier est vide.');
      return;
    }

    const orderNumber = generateOrderNumber();
    const nowIso = new Date().toISOString();
    const clientUid = userProfile?.uid || 'guest';

    // Map EVERY watch in the cart with its own individual photo URL
    const orderItems = cart.map((item) => {
      const effectivePrice =
        item.product.promotionalPrice && item.product.promotionalPrice > 0
          ? item.product.promotionalPrice
          : item.product.price;

      const candidateImages = [
        ...(Array.isArray(item.product.images) ? item.product.images : []),
        item.product.coverImage,
        item.product.image
      ].filter((img): img is string => Boolean(img && typeof img === 'string' && img.trim()));

      const rawImg =
        candidateImages.find(
          (img) => img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/')
        ) ||
        candidateImages[0] ||
        '';

      const resolvedPhotoUrl = resolveWatchItemPhotoUrl({
        productId: item.product.id,
        name: item.product.name,
        image: rawImg
      });

      return {
        productId: item.product.id,
        name: item.product.name,
        brand: item.product.brand || 'Horlogerie de prestige',
        image: resolvedPhotoUrl || rawImg,
        unitPrice: effectivePrice,
        price: effectivePrice,
        quantity: item.quantity,
        subtotal: effectivePrice * item.quantity
      };
    });

    const totalItemsCount = orderItems.reduce((sum, it) => sum + (it.quantity || 1), 0);

    const preliminaryOrder: Order = {
      id: orderNumber,
      orderNumber,
      clientId: clientUid,
      customerId: clientUid,
      customerEmail: customer.email?.trim() || userProfile?.email || '',
      customerName: customer.name.trim(),
      customerPhone: customer.phone.trim(),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email?.trim() || userProfile?.email || '',
        city: customer.city.trim(),
        address: customer.address.trim(),
        notes: customer.notes?.trim() || ''
      },
      items: orderItems,
      totalItems: totalItemsCount,
      subtotal,
      shipping: shippingFee,
      shippingCost: shippingFee,
      total,
      currency,
      status: 'En attente',
      orderStatus: 'En attente',
      paymentStatus: 'pending',
      paymentMethod: 'whatsapp_direct',
      whatsappOrder: true,
      whatsappMessageSent: true,
      notes: customer.notes?.trim() || '',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // Build encoded https://wa.me/[numéro]?text=[message] URL with all watches & their photo URLs
    const initialWaUrl = buildWhatsAppOrderUrl(preliminaryOrder, whatsappNumber, storeName, customIntro);

    // Open WhatsApp tab synchronously on user click to prevent browser popup blockers
    const waWindow = typeof window !== 'undefined' ? window.open(initialWaUrl, '_blank') : null;

    try {
      setIsSubmitting(true);

      // Record the order in Firestore with status "En attente"
      const newOrder = await createOrder(
        {
          clientId: clientUid,
          customerId: clientUid,
          customerEmail: customer.email?.trim() || userProfile?.email || '',
          customerName: customer.name.trim(),
          customerPhone: customer.phone.trim(),
          customer: preliminaryOrder.customer,
          items: orderItems,
          subtotal,
          shipping: shippingFee,
          total,
          currency,
          status: 'En attente',
          orderStatus: 'En attente',
          paymentStatus: 'pending',
          paymentMethod: 'whatsapp_direct',
          notes: customer.notes?.trim() || ''
        },
        orderNumber
      );

      const finalWaUrl = buildWhatsAppOrderUrl(newOrder, whatsappNumber, storeName, customIntro);

      // Clear cart and close modal
      clearCart();
      handleClose();

      // Trigger success view in background tab
      if (onOrderSuccess) onOrderSuccess(newOrder, finalWaUrl);
      if (onOrderCreated) onOrderCreated(newOrder, finalWaUrl);

      // Fallback direct navigation if window.open was blocked by mobile/in-app browser
      if (!waWindow && typeof window !== 'undefined') {
        window.location.href = finalWaUrl;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      clearCart();
      handleClose();
      if (onOrderSuccess) onOrderSuccess(preliminaryOrder, initialWaUrl);
      if (onOrderCreated) onOrderCreated(preliminaryOrder, initialWaUrl);
      if (!waWindow && typeof window !== 'undefined') {
        window.location.href = initialWaUrl;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={activeIsOpen}
      onClose={handleClose}
      title="Finalisation de la Commande"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-[var(--text)]">
        {/* Progress / Step info */}
        <div className="p-4 bg-[var(--badge-bg)] border border-[var(--badge-border)] rounded-xl flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-[var(--or)] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-[var(--text-soft)] font-sans">
            <span className="font-semibold text-[var(--or)] block mb-0.5 uppercase tracking-wider text-[11px] font-serif">
              Étape finale : Transmission instantanée sur WhatsApp
            </span>
            Vos coordonnées seront enregistrées pour préparer votre commande. Vous serez ensuite redirigé(e) vers WhatsApp avec votre récapitulatif officiel prêt à être validé avec notre équipe.
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Form Fields Column */}
          <div className="md:col-span-7 space-y-4">
            <h4 className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[var(--or)] flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Coordonnées du Client</span>
            </h4>

            {/* Customer Authentication Status */}
            {userProfile ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-300">
                    Connecté en tant que <strong className="text-[var(--text)]">{userProfile.fullName}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="text-[11px] text-[var(--or)] hover:underline"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="p-3.5 bg-[var(--badge-bg)] border border-[var(--badge-border)] rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--or)]">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Commande rapide ou Espace Client</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-soft)]">
                    Vous pouvez commander directement ci-dessous ou vous connecter pour suivre l'historique de vos commandes.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                  className="shrink-0 text-[11px]"
                >
                  Se connecter
                </Button>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                Nom complet <span className="text-[var(--or)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  id="checkout-customer-name"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Ex: Alexandre de Montmirail"
                  className="w-full bg-[var(--bg)] border border-[var(--sep)] focus:border-[var(--or)]/50 rounded-lg px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Phone (WhatsApp) */}
            <div>
              <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                Numéro WhatsApp <span className="text-[var(--or)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  id="checkout-customer-phone"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="Ex: +33 6 12 34 56 78 ou 0612345678"
                  className="w-full bg-[var(--bg)] border border-[var(--sep)] focus:border-[var(--or)]/50 rounded-lg px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Numéro utilisé pour la confirmation et le suivi en temps réel de votre commande.
              </p>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                Adresse Email <span className="text-[var(--text-muted)]">(Facultatif)</span>
              </label>
              <input
                type="email"
                id="checkout-customer-email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                placeholder="Ex: alexandre@exemple.com"
                className="w-full bg-[var(--bg)] border border-[var(--sep)] focus:border-[var(--or)]/50 rounded-lg px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
              />
            </div>

            {/* City & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                  Ville <span className="text-[var(--or)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="checkout-customer-city"
                  value={customer.city}
                  onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                  placeholder="Ex: Paris, Genève, Lyon..."
                  className="w-full bg-[var(--bg)] border border-[var(--sep)] focus:border-[var(--or)]/50 rounded-lg px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                  Adresse de livraison <span className="text-[var(--or)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="checkout-customer-address"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  placeholder="Numéro et rue..."
                  className="w-full bg-[var(--bg)] border border-[var(--sep)] focus:border-[var(--or)]/50 rounded-lg px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                Instructions particulières / Demande de gravure <span className="text-[var(--text-muted)]">(Facultatif)</span>
              </label>
              <textarea
                rows={2}
                id="checkout-customer-notes"
                value={customer.notes}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                placeholder="Ex: Livraison souhaitée en journée, emballage cadeau discret..."
                className="w-full bg-[var(--bg)] border border-[var(--sep)] focus:border-[var(--or)]/50 rounded-lg px-3.5 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none resize-none transition-colors"
              />
            </div>
          </div>

          {/* Order Summary Column */}
          <div className="md:col-span-5 bg-[var(--bg)] rounded-xl p-4 border border-[var(--sep)] flex flex-col justify-between">
            <div>
              <h4 className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[var(--or)] mb-3 flex items-center justify-between">
                <span>Articles ({cart.length})</span>
                <span className="text-xs font-mono text-[var(--text-muted)]">{currency}</span>
              </h4>

              {/* Items List */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const effectivePrice =
                    item.product.promotionalPrice && item.product.promotionalPrice > 0
                      ? item.product.promotionalPrice
                      : item.product.price;
                  return (
                    <div key={item.product.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[var(--badge-bg)] text-[11px] font-bold text-[var(--or)] flex items-center justify-center shrink-0">
                          {item.quantity}
                        </span>
                        <span className="text-[var(--text)] line-clamp-1">{item.product.name}</span>
                      </div>
                      <span className="font-mono text-[var(--text-soft)] shrink-0">
                        {formatPrice(effectivePrice * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Breakdown */}
              <div className="border-t border-[var(--sep)] mt-4 pt-3 space-y-2 text-xs font-sans">
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Sous-total</span>
                  <span className="font-mono text-[var(--text)]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Livraison</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {shippingFee === 0 ? 'Offerte (Sécurisée)' : formatPrice(shippingFee)}
                  </span>
                </div>
                <div className="border-t border-[var(--sep)] pt-2 flex justify-between font-serif text-base font-bold text-[var(--text)]">
                  <span>Total à régler</span>
                  <span className="text-[var(--or)] font-mono text-lg">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Notice */}
            <div className="mt-4 pt-4 border-t border-[var(--sep)]">
              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mb-3 font-sans">
                <Clock className="w-3.5 h-3.5 text-[var(--or)]" />
                <span>Paiement après confirmation & échange avec la gérante.</span>
              </div>

              <button
                type="submit"
                id="checkout-submit-btn"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-[0.98] transition-all text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 fill-current" />
                    <span>Envoyer la commande sur WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Embedded Customer Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="register"
        titleMessage="Connectez-vous ou créez votre compte pour enregistrer et sécuriser votre commande."
        onSuccess={() => setAuthModalOpen(false)}
      />
    </Modal>
  );
};
