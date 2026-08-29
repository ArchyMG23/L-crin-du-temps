import React from 'react';
import { ShoppingBag, X, Trash2, ArrowRight, ShieldCheck, Truck, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { StoreSettings } from '../../types';
import { Button } from '../ui/Button';

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCheckout?: () => void;
  settings?: StoreSettings;
  currency?: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen: isOpenProp,
  onClose,
  onCheckout,
  settings,
  currency: currencyProp
}) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    itemCount,
    setIsCheckoutOpen
  } = useCart();

  const activeIsOpen = isOpenProp !== undefined ? isOpenProp : isCartOpen;

  if (!activeIsOpen) return null;

  const handleClose = () => {
    if (onClose) onClose();
    setIsCartOpen(false);
  };

  const handleProceedToCheckout = () => {
    handleClose();
    if (onCheckout) {
      onCheckout();
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const shippingFee = settings?.shippingEnabled ? (settings.shippingFee || 0) : 0;
  const total = subtotal + shippingFee;
  const currency = currencyProp || settings?.currency || '€';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0E0E0E] border-l border-white/10 text-[#F5F5F0] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#0A0A0A]">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="font-serif text-lg font-semibold tracking-[0.1em] uppercase text-[#F5F5F0]">
                Mon Panier ({itemCount})
              </h2>
            </div>
            <button
              id="close-cart-drawer-btn"
              type="button"
              onClick={handleClose}
              className="p-2 text-white/40 hover:text-white rounded-full hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-white">
                    Votre panier est vide
                  </h3>
                  <p className="text-xs text-white/50 mt-1 max-w-xs leading-relaxed font-sans">
                    Découvrez nos pièces d'exception et sélectionnez le garde-temps qui sublimera votre style.
                  </p>
                </div>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={handleClose}
                  className="uppercase tracking-wider text-xs"
                >
                  Explorer la collection
                </Button>
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-white/10">
                {cart.map((item) => {
                  const effectivePrice =
                    item.product.promotionalPrice && item.product.promotionalPrice > 0
                      ? item.product.promotionalPrice
                      : item.product.price;
                  const lineTotal = effectivePrice * item.quantity;
                  const isMaxStockReached = item.quantity >= item.product.stock;

                  return (
                    <div key={item.product.id} className="pt-4 first:pt-0 flex gap-4">
                      {/* Product Thumbnail */}
                      <div className="relative w-20 h-20 bg-[#0D0D0D] rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img
                          src={
                            item.product.images?.[0] ||
                            'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=300'
                          }
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-serif uppercase tracking-[0.2em] text-[#D4AF37] font-bold block">
                              {item.product.brand}
                            </span>
                            <h4 className="font-serif text-sm font-medium text-[#F5F5F0] line-clamp-1">
                              {item.product.name}
                            </h4>
                            <span className="text-xs text-white/70 font-semibold font-mono">
                              {effectivePrice.toLocaleString('fr-FR')} {currency}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-white/40 hover:text-rose-400 p-1 transition-colors"
                            title="Supprimer du panier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quantity controls & stock limit indicator */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-[#0A0A0A] border border-white/15 rounded-md">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 py-0.5 text-xs font-mono font-semibold text-[#F5F5F0]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={isMaxStockReached}
                              className="px-2 py-0.5 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                              title={isMaxStockReached ? `Stock max disponible (${item.product.stock})` : 'Ajouter une pièce'}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-serif text-sm font-bold text-[#D4AF37]">
                            {lineTotal.toLocaleString('fr-FR')} {currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer & Order Trigger */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-[#0A0A0A] space-y-4">
              {/* Financial summary */}
              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between text-white/70">
                  <span>Sous-total</span>
                  <span className="font-mono text-white font-semibold">
                    {subtotal.toLocaleString('fr-FR')} {currency}
                  </span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Expédition sécurisée</span>
                  </span>
                  <span className="text-emerald-400 font-medium">
                    {shippingFee === 0 ? 'Offerte (Sous écrin)' : `${shippingFee.toLocaleString('fr-FR')} ${currency}`}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between text-base font-serif font-bold text-[#F5F5F0]">
                  <span>Total Estimé</span>
                  <span className="text-[#D4AF37] text-lg font-mono">
                    {total.toLocaleString('fr-FR')} {currency}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                id="cart-checkout-proceed-btn"
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 bg-[#D4AF37] hover:bg-[#B8962F] text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/15 active:scale-[0.98] transition-all text-xs uppercase tracking-wider"
              >
                <span>Commander via WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-white/40 pt-1 font-sans">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Validation instantanée en direct avec la boutique</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
