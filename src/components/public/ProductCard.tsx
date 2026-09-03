import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Eye, Check, AlertTriangle, XCircle, Sparkles, Flame, Shield } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  featuredLayout?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart } = useCart();
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 2);
  const hasPromo = product.promotionalPrice && product.promotionalPrice < product.price;

  const discountPercent = hasPromo
    ? Math.round(((product.price - product.promotionalPrice!) / product.price) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
  };

  const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800';

  return (
    <motion.div
      id={`product-card-${product.id}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(product)}
      className="group relative bg-[var(--carte-bg)] rounded-2xl border border-[var(--sep)] hover:border-[var(--or)]/60 hover:shadow-2xl hover:shadow-[var(--or)]/10 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer shadow-sm"
    >
      {/* Top subtle golden shimmer accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--or)]/0 group-hover:via-[var(--or)]/80 to-transparent transition-all duration-500 z-20" />

      {/* Visual Image Container */}
      <div className="relative aspect-square w-full theme-watch-stage overflow-hidden flex items-center justify-center p-3 sm:p-4">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 bg-radial from-[var(--or)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <img
          src={primaryImage}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out group-hover:scale-108 ${
            isOutOfStock ? 'grayscale opacity-50' : ''
          }`}
          loading="lazy"
        />

        {/* Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1 z-10 pointer-events-none">
          {product.featured && (
            <span className="inline-flex items-center gap-1 bg-[var(--or)] text-black text-[8px] sm:text-[9px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded shadow-lg tracking-wider uppercase font-serif">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />
              <span>D'Exception</span>
            </span>
          )}
          {product.orderCount && product.orderCount > 0 ? (
            <span className="inline-flex items-center gap-1 bg-amber-500/90 text-black text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-md tracking-wider uppercase">
              <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-current" />
              <span>Populaire</span>
            </span>
          ) : null}
          {hasPromo && (
            <span className="inline-flex items-center bg-rose-700/90 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-md tracking-wider">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Stock status indicator tag */}
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 pointer-events-none">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 bg-[var(--bg)]/90 text-[var(--text-soft)] border border-[var(--sep)] text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded backdrop-blur-md">
              <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-400" />
              <span>Épuisé</span>
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 bg-[var(--badge-bg)] text-[var(--or)] border border-[var(--badge-border)] text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded backdrop-blur-md">
              <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--or)]" />
              <span>Derniers ({product.stock})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-[var(--bg)]/90 text-emerald-500 border border-emerald-500/30 text-[9px] sm:text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded backdrop-blur-md">
              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" />
              <span>En stock</span>
            </span>
          )}
        </div>

        {/* Hover Quick View Button Overlay (Desktop) */}
        <div className="hidden lg:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center p-4 pointer-events-none">
          <div className="p-3 bg-[var(--or)] text-black rounded-full shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center">
            <Eye className="w-5 h-5 text-black" />
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-3.5 sm:p-5 flex flex-col flex-grow justify-between bg-[var(--carte-bg)] border-t border-[var(--sep)]">
        <div>
          {/* Brand & Reference */}
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-[var(--or)] font-serif uppercase tracking-[0.2em] mb-1">
            <span className="font-bold truncate">{product.brand}</span>
            {product.reference && (
              <span className="text-[9px] text-[var(--text-muted)] font-sans tracking-normal hidden xs:inline">{product.reference}</span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-xs sm:text-base font-semibold text-[var(--text)] group-hover:text-[var(--or)] transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Short Description */}
          <p className="text-[11px] sm:text-xs text-[var(--text-soft)] mt-1 line-clamp-2 leading-relaxed font-sans font-light">
            {product.shortDescription || product.description}
          </p>

          {/* Key specification snippet if available */}
          {product.specifications?.movement && (
            <div className="mt-2 pt-1.5 border-t border-[var(--sep)] flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[var(--text-muted)]">
              <Shield className="w-3 h-3 text-[var(--or)] shrink-0" />
              <span className="truncate">{product.specifications.movement}</span>
            </div>
          )}
        </div>

        {/* Price & Action Button */}
        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-[var(--sep)] flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            {hasPromo ? (
              <>
                <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] line-through truncate font-serif">
                  {product.price.toLocaleString('fr-FR')} {product.currency}
                </span>
                <span className="font-serif text-sm sm:text-lg font-bold text-[var(--or)] truncate">
                  {product.promotionalPrice!.toLocaleString('fr-FR')} {product.currency}
                </span>
              </>
            ) : (
              <span className="font-serif text-sm sm:text-lg font-bold text-[var(--text)] truncate">
                {product.price.toLocaleString('fr-FR')} {product.currency}
              </span>
            )}
          </div>

          <button
            id={`quick-add-${product.id}`}
            type="button"
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`min-h-[36px] sm:min-h-[40px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 transition-all ${
              isOutOfStock
                ? 'bg-[var(--bg-3)] text-[var(--text-muted)] border border-[var(--sep)] cursor-not-allowed'
                : 'bg-[var(--or)] hover:bg-[var(--or-hover)] text-black shadow-md shadow-[var(--or)]/15 active:scale-95'
            }`}
            title={isOutOfStock ? 'Produit épuisé' : 'Ajouter au panier'}
            aria-label={isOutOfStock ? 'Produit épuisé' : `Ajouter ${product.name} au panier`}
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">
              {isOutOfStock ? 'Épuisé' : 'Ajouter'}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
