import React from 'react';
import { ShoppingBag, Eye, Check, AlertTriangle, XCircle, Sparkles, Flame } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { Badge } from '../ui/Badge';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
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
    <div
      id={`product-card-${product.id}`}
      onClick={() => onSelect(product)}
      className="group relative bg-[#121212] rounded-xl border border-white/10 hover:border-[#D4AF37]/40 hover:shadow-2xl hover:shadow-[#D4AF37]/5 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Visual Image Container */}
      <div className="relative aspect-square w-full bg-[#0D0D0D] overflow-hidden flex items-center justify-center">
        <img
          src={primaryImage}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 ${
            isOutOfStock ? 'grayscale opacity-50' : ''
          }`}
          loading="lazy"
        />

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.orderCount && product.orderCount > 0 ? (
            <span className="bg-amber-500/90 text-black text-[9px] font-bold px-2 py-0.5 rounded shadow-md tracking-wider uppercase flex items-center gap-1">
              <Flame className="w-3 h-3 text-black fill-current" />
              <span>Populaire ({product.orderCount})</span>
            </span>
          ) : null}
          {product.featured && (
            <Badge variant="gold" className="shadow-md flex items-center gap-1 bg-[#D4AF37]/90 text-black font-bold uppercase tracking-widest text-[9px] py-1 px-2">
              <Sparkles className="w-3 h-3 text-black" />
              <span>Pièce d'Exception</span>
            </Badge>
          )}
          {hasPromo && (
            <span className="bg-rose-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md tracking-wider">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Stock status indicator tag */}
        <div className="absolute top-3 right-3 z-10">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 bg-black/80 text-white/60 border border-white/10 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded backdrop-blur-xs">
              <XCircle className="w-3 h-3 text-rose-400" />
              <span>Épuisé</span>
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded backdrop-blur-xs">
              <AlertTriangle className="w-3 h-3 text-[#D4AF37]" />
              <span>Derniers ({product.stock})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-black/70 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded backdrop-blur-xs">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Disponible</span>
            </span>
          )}
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 p-4">
          <button
            type="button"
            className="p-3 bg-[#D4AF37] text-black rounded-full shadow-lg hover:bg-[#F9E79F] transition-colors transform translate-y-2 group-hover:translate-y-0 duration-200"
            title="Consulter les détails"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-5 flex flex-col flex-grow justify-between bg-[#141414]">
        <div>
          {/* Brand & Reference */}
          <div className="flex items-center justify-between text-[11px] text-[#D4AF37] font-serif uppercase tracking-[0.2em] mb-1.5">
            <span>{product.brand}</span>
            {product.reference && (
              <span className="text-[10px] text-white/40 font-sans tracking-normal">{product.reference}</span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-base font-semibold text-[#F5F5F0] group-hover:text-[#D4AF37] transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-white/50 mt-1.5 line-clamp-2 leading-relaxed font-sans">
            {product.shortDescription || product.description}
          </p>
        </div>

        {/* Price & Action Button */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
          <div className="flex flex-col">
            {hasPromo ? (
              <>
                <span className="text-xs text-white/40 line-through">
                  {product.price.toLocaleString('fr-FR')} {product.currency}
                </span>
                <span className="font-serif text-lg font-bold text-[#D4AF37]">
                  {product.promotionalPrice!.toLocaleString('fr-FR')} {product.currency}
                </span>
              </>
            ) : (
              <span className="font-serif text-lg font-bold text-[#F5F5F0]">
                {product.price.toLocaleString('fr-FR')} {product.currency}
              </span>
            )}
          </div>

          <button
            id={`quick-add-${product.id}`}
            type="button"
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`px-3 py-2 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              isOutOfStock
                ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                : 'bg-[#D4AF37] hover:bg-[#B8962F] text-black shadow-md shadow-[#D4AF37]/10 active:scale-95'
            }`}
            title={isOutOfStock ? 'Produit épuisé' : 'Ajouter au panier'}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>
              {isOutOfStock ? 'Épuisé' : 'Ajouter'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
