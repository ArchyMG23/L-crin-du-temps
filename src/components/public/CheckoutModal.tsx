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
import { createOrder, buildWhatsAppOrderUrl } from '../../services/orderService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AuthModal } from './AuthModal';

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
  const currency = currencyProp || settings?.currency || '€';
  const whatsappNumber = whatsappProp || settings?.whatsappNumber || '+33600000000';
  const storeName = storeNameProp || settings?.storeName || "Maison Horlogère";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Require Customer Account
    if (!userProfile) {
      setAuthModalOpen(true);
      return;
    }

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

    try {
      setIsSubmitting(true);

      const orderItems = cart.map(item => {
        const effectivePrice =
          item.product.promotionalPrice && item.product.promotionalPrice > 0
            ? item.product.promotionalPrice
            : item.product.price;
        return {
          productId: item.product.id,
          name: item.product.name,
          image: item.product.images?.[0] || '',
          price: effectivePrice,
          quantity: item.quantity,
          subtotal: effectivePrice * item.quantity
        };
      });

      const newOrder = await createOrder({
        customerId: userProfile.uid,
        customer,
        items: orderItems,
        subtotal,
        shipping: shippingFee,
        total,
        currency,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'whatsapp_direct',
        notes: customer.notes
      });

      const waUrl = buildWhatsAppOrderUrl(newOrder, whatsappNumber, storeName);

      // Clear cart
      clearCart();
      handleClose();

      // Trigger success view and redirect
      if (onOrderSuccess) onOrderSuccess(newOrder, waUrl);
      if (onOrderCreated) onOrderCreated(newOrder, waUrl);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg('Une erreur est survenue lors de l\'enregistrement. Vous pouvez finaliser directement sur WhatsApp.');
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
      <form onSubmit={handleSubmit} className="space-y-6 text-[#F5F5F0]">
        {/* Progress / Step info */}
        <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-white/80 font-sans">
            <span className="font-semibold text-[#D4AF37] block mb-0.5 uppercase tracking-wider text-[11px] font-serif">
              Étape finale : Transmission instantanée sur WhatsApp
            </span>
            Vos coordonnées seront enregistrées pour préparer votre commande. Vous serez ensuite redirigé(e) vers WhatsApp avec votre récapitulatif officiel prêt à être validé avec notre équipe.
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-700 text-rose-200 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Form Fields Column */}
          <div className="md:col-span-7 space-y-4">
            <h4 className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37] flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Coordonnées du Client</span>
            </h4>

            {/* Customer Authentication Status */}
            {userProfile ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-200">
                    Connecté en tant que <strong className="text-white">{userProfile.fullName}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="text-[11px] text-[#D4AF37] hover:underline"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
                  <Lock className="w-4 h-4" />
                  <span>Compte client requis pour commander</span>
                </div>
                <p className="text-xs text-white/70">
                  Veuillez vous connecter ou créer votre compte client pour valider et suivre votre commande en toute sécurité.
                </p>
                <Button
                  type="button"
                  variant="gold"
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full mt-1"
                >
                  Se connecter / Créer un compte
                </Button>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs text-white/70 font-medium mb-1">
                Nom complet <span className="text-[#D4AF37]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  id="checkout-customer-name"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Ex: Alexandre de Montmirail"
                  className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#D4AF37]/50 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Phone (WhatsApp) */}
            <div>
              <label className="block text-xs text-white/70 font-medium mb-1">
                Numéro WhatsApp <span className="text-[#D4AF37]">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  id="checkout-customer-phone"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="Ex: +33 6 12 34 56 78 ou 0612345678"
                  className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#D4AF37]/50 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Numéro utilisé pour la confirmation et le suivi en temps réel de votre commande.
              </p>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-xs text-white/70 font-medium mb-1">
                Adresse Email <span className="text-white/40">(Facultatif)</span>
              </label>
              <input
                type="email"
                id="checkout-customer-email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                placeholder="Ex: alexandre@exemple.com"
                className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#D4AF37]/50 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
              />
            </div>

            {/* City & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/70 font-medium mb-1">
                  Ville <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="checkout-customer-city"
                  value={customer.city}
                  onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                  placeholder="Ex: Paris, Genève, Lyon..."
                  className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#D4AF37]/50 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 font-medium mb-1">
                  Adresse de livraison <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="checkout-customer-address"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  placeholder="Numéro et rue..."
                  className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#D4AF37]/50 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-white/70 font-medium mb-1">
                Instructions particulières / Demande de gravure <span className="text-white/40">(Facultatif)</span>
              </label>
              <textarea
                rows={2}
                id="checkout-customer-notes"
                value={customer.notes}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                placeholder="Ex: Livraison souhaitée en journée, emballage cadeau discret..."
                className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#D4AF37]/50 rounded-lg px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none resize-none transition-colors"
              />
            </div>
          </div>

          {/* Order Summary Column */}
          <div className="md:col-span-5 bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex flex-col justify-between">
            <div>
              <h4 className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37] mb-3 flex items-center justify-between">
                <span>Articles ({cart.length})</span>
                <span className="text-xs font-mono text-white/40">{currency}</span>
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
                        <span className="w-5 h-5 rounded bg-white/10 text-[11px] font-bold text-[#D4AF37] flex items-center justify-center shrink-0">
                          {item.quantity}
                        </span>
                        <span className="text-white/90 line-clamp-1">{item.product.name}</span>
                      </div>
                      <span className="font-mono text-white/70 shrink-0">
                        {(effectivePrice * item.quantity).toLocaleString('fr-FR')} {currency}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Breakdown */}
              <div className="border-t border-white/10 mt-4 pt-3 space-y-2 text-xs font-sans">
                <div className="flex justify-between text-white/60">
                  <span>Sous-total</span>
                  <span className="font-mono text-white">{subtotal.toLocaleString('fr-FR')} {currency}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Livraison</span>
                  <span className="text-emerald-400">
                    {shippingFee === 0 ? 'Offerte (Sécurisée)' : `${shippingFee} ${currency}`}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-serif text-base font-bold text-[#F5F5F0]">
                  <span>Total à régler</span>
                  <span className="text-[#D4AF37] font-mono text-lg">
                    {total.toLocaleString('fr-FR')} {currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Notice (Ready for future online gateways) */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-[11px] text-white/50 flex items-center gap-2 mb-3 font-sans">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
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
