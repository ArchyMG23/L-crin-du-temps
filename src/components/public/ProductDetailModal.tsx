import React, { useState } from 'react';
import {
  ShoppingBag,
  MessageSquare,
  ShieldCheck,
  Truck,
  Clock,
  Check,
  AlertTriangle,
  XCircle,
  Share2,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Product, StoreSettings } from '../../types';
import { useCart } from '../../context/CartContext';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { buildProductInquiryMessage, buildWhatsAppChatUrl } from '../../utils/whatsapp';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen?: boolean;
  onClose: () => void;
  settings?: StoreSettings;
  currency?: string;
  whatsappNumber?: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen = true,
  onClose,
  settings,
  currency: currencyProp,
  whatsappNumber: whatsappProp
}) => {
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const activeCurrency = currencyProp || settings?.currency || product?.currency || '€';
  const rawWhatsApp = whatsappProp || settings?.whatsappNumber || '+237600000000';
  const storeName = settings?.storeName || settings?.name || "L'Écrin du Temps";
  const customIntro = settings?.whatsappDefaultMessage || settings?.contactInformation?.whatsappMessage;

  React.useEffect(() => {
    if (product) {
      document.title = `${product.name} | ${product.brand} - Haute Horlogerie`;
      setSelectedImageIndex(0);
      setQuantity(1);
      setFeedbackMsg(null);
    }
  }, [product]);

  if (!product || !isOpen) return null;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 2);
  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1000'];

  const hasPromo = product.promotionalPrice && product.promotionalPrice < product.price;
  const effectivePrice = hasPromo ? product.promotionalPrice! : product.price;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const res = addToCart(product, quantity);
    if (res.success) {
      onClose();
    } else if (res.message) {
      setFeedbackMsg(res.message);
    }
  };

  const handleDirectWhatsAppOrder = () => {
    const message = buildProductInquiryMessage(product, storeName, customIntro, quantity);
    const url = buildWhatsAppChatUrl(rawWhatsApp, message);
    window.open(url, '_blank');
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Modal isOpen={Boolean(product)} onClose={onClose} maxWidth="4xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-[var(--text)]">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square w-full bg-[var(--bg)] rounded-xl overflow-hidden border border-[var(--sep)] flex items-center justify-center group">
            <img
              src={images[selectedImageIndex] || images[0]}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transition-all duration-300"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 transition-all opacity-80 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 transition-all opacity-80 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {product.featured && (
              <div className="absolute top-3 left-3">
                <Badge variant="gold" className="shadow-lg bg-[var(--or)] text-black font-bold uppercase tracking-widest text-[9px] py-1 px-2.5">
                  <Sparkles className="w-3 h-3 mr-1 text-black" />
                  Sélection Prestige
                </Badge>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-[var(--or)] scale-105 shadow-md shadow-[var(--or)]/20'
                      : 'border-[var(--sep)] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} vue ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Luxury Reassurance Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-[var(--badge-bg)] border border-[var(--badge-border)] rounded-lg flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[var(--or)] shrink-0" />
              <span className="text-[11px] text-[var(--text-soft)] font-medium font-sans">Contrôle d'authenticité</span>
            </div>
            <div className="p-3 bg-[var(--badge-bg)] border border-[var(--badge-border)] rounded-lg flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-[var(--or)] shrink-0" />
              <span className="text-[11px] text-[var(--text-soft)] font-medium font-sans">Écrin de luxe offert</span>
            </div>
          </div>
        </div>

        {/* Right Column: Information, Specs & Actions */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header: Brand & Gender */}
            <div className="flex items-center justify-between border-b border-[var(--sep)] pb-3">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--or)] font-serif font-bold">
                  {product.brand}
                </span>
                {product.reference && (
                  <span className="text-xs text-[var(--text-muted)] ml-2 font-mono">
                    Réf. {product.reference}
                  </span>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-[var(--text-soft)] border-[var(--sep)]">
                Collection {product.gender}
              </Badge>
            </div>

            {/* Title */}
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text)] leading-tight">
              {product.name}
            </h2>

            {/* Price & Stock Alert */}
            <div className="flex items-center justify-between bg-[var(--bg)] p-4 rounded-xl border border-[var(--sep)]">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-[0.15em]">Prix public</span>
                <div className="flex items-baseline gap-2">
                  {hasPromo && (
                    <span className="text-xs text-[var(--text-muted)] line-through">
                      {product.price.toLocaleString('fr-FR')} {product.currency}
                    </span>
                  )}
                  <span className="font-serif text-2xl font-bold text-[var(--or)]">
                    {effectivePrice.toLocaleString('fr-FR')} {product.currency}
                  </span>
                </div>
              </div>

              {/* Stock Status Badge */}
              <div>
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--badge-bg)] border border-[var(--sep)] text-[var(--text-muted)] text-xs font-semibold rounded">
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Rupture de stock</span>
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded">
                    <AlertTriangle className="w-3.5 h-3.5 text-[var(--or)]" />
                    <span>Derniers ({product.stock})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>En stock ({product.stock} ex.)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="text-xs sm:text-sm text-[var(--text-soft)] leading-relaxed font-sans space-y-2">
              <p>{product.description || product.shortDescription}</p>
            </div>

            {/* Technical Specifications */}
            {product.specifications && (
              <div className="bg-[var(--bg)] rounded-xl p-4 border border-[var(--sep)] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-[0.2em] text-[var(--or)] font-semibold mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Fiche Technique Horlogère</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-sans">
                  {product.specifications.movement && (
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Mouvement</span>
                      <span className="text-[var(--text)] font-medium">{product.specifications.movement}</span>
                    </div>
                  )}
                  {product.specifications.caseDiameter && (
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Diamètre</span>
                      <span className="text-[var(--text)] font-medium">{product.specifications.caseDiameter}</span>
                    </div>
                  )}
                  {product.specifications.caseMaterial && (
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Boîtier</span>
                      <span className="text-[var(--text)] font-medium">{product.specifications.caseMaterial}</span>
                    </div>
                  )}
                  {product.specifications.waterResistance && (
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Étanchéité</span>
                      <span className="text-[var(--text)] font-medium">{product.specifications.waterResistance}</span>
                    </div>
                  )}
                  {product.specifications.glass && (
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Verre</span>
                      <span className="text-[var(--text)] font-medium">{product.specifications.glass}</span>
                    </div>
                  )}
                  {product.specifications.strapMaterial && (
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Bracelet</span>
                      <span className="text-[var(--text)] font-medium">{product.specifications.strapMaterial}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error / Warning Feedback */}
            {feedbackMsg && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}
          </div>

          {/* Action Zone */}
          <div className="mt-6 pt-4 border-t border-[var(--sep)] space-y-3">
            {/* Quantity Selector (if in stock) */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Quantité :</span>
                <div className="flex items-center border border-[var(--sep)] rounded-lg bg-[var(--bg)]">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-[var(--badge-bg)] transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-semibold text-[var(--text)] font-mono">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-1 text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-[var(--badge-bg)] transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Stock disponible : {product.stock}
                </span>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="gold"
                size="lg"
                id="modal-add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                icon={ShoppingBag}
                className="w-full uppercase tracking-wider text-xs font-bold py-3.5"
              >
                {isOutOfStock ? 'Rupture de Stock' : 'Ajouter au Panier'}
              </Button>

              <button
                type="button"
                id="modal-whatsapp-direct-btn"
                onClick={handleDirectWhatsAppOrder}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-[0.98] transition-all"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Commander via WhatsApp</span>
              </button>
            </div>

            <p className="text-[11px] text-center text-[var(--text-muted)] font-sans">
              Commande confidentielle & personnalisée • Échange direct avec notre experte sans engagement.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
