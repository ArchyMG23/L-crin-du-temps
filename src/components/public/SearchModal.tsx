import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Watch, ArrowRight, Sparkles, Check, XCircle, AlertTriangle } from 'lucide-react';
import { Product, Category, StoreSettings } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  settings?: StoreSettings;
  onSelectProduct: (product: Product) => void;
  onNavigateToShop: (query: string, categoryId?: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  settings,
  onSelectProduct,
  onNavigateToShop
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<'all' | 'homme' | 'femme'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currency = settings?.currency || '€';

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
      setSelectedGender('all');
      setSelectedCategory('all');
      setOnlyInStock(false);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeProducts = useMemo(() => {
    return products.filter((p) => p.active);
  }, [products]);

  const searchResults = useMemo(() => {
    return activeProducts.filter((product) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = product.name?.toLowerCase().includes(query);
        const matchesBrand = product.brand?.toLowerCase().includes(query);
        const matchesRef = product.reference?.toLowerCase().includes(query);
        const matchesDesc = product.shortDescription?.toLowerCase().includes(query) || product.description?.toLowerCase().includes(query);
        const matchesCat = product.categoryName?.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesRef && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      // Gender filter
      if (selectedGender !== 'all') {
        if (product.gender !== selectedGender && product.gender !== 'mixte') {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (product.categoryId !== selectedCategory) {
          return false;
        }
      }

      // Stock filter
      if (onlyInStock && product.stock <= 0) {
        return false;
      }

      return true;
    });
  }, [activeProducts, searchTerm, selectedGender, selectedCategory, onlyInStock]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === '€' ? 'EUR' : currency === '$' ? 'USD' : 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleProductClick = (product: Product) => {
    onSelectProduct(product);
    onClose();
  };

  const handleViewAllInShop = () => {
    onNavigateToShop(searchTerm, selectedCategory !== 'all' ? selectedCategory : undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 pb-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-[var(--carte-bg)] border border-[var(--sep)] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 transition-all max-h-[85vh]">
        {/* Search Header Bar */}
        <div className="p-4 sm:p-6 border-b border-[var(--sep)] flex items-center gap-3 bg-[var(--bg)]">
          <Search className="w-5 h-5 text-[var(--or)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            id="global-search-modal-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une montre, une marque (Rolex, Omega, Cartier...), une référence..."
            className="w-full bg-transparent text-sm sm:text-base text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none font-sans"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              title="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-soft)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--badge-bg)] transition-colors shrink-0 ml-2"
            title="Fermer (Échap)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filter Bar */}
        <div className="px-4 sm:px-6 py-3 bg-[var(--bg-2)] border-b border-[var(--sep)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Gender Filters */}
            <div className="inline-flex bg-[var(--bg)] p-0.5 rounded-lg border border-[var(--sep)]">
              <button
                onClick={() => setSelectedGender('all')}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  selectedGender === 'all'
                    ? 'bg-[var(--or)] text-black'
                    : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setSelectedGender('homme')}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  selectedGender === 'homme'
                    ? 'bg-[var(--or)] text-black'
                    : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                }`}
              >
                Hommes
              </button>
              <button
                onClick={() => setSelectedGender('femme')}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  selectedGender === 'femme'
                    ? 'bg-[var(--or)] text-black'
                    : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                }`}
              >
                Femmes
              </button>
            </div>

            {/* In Stock toggle */}
            <button
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium tracking-wide transition-colors flex items-center gap-1.5 ${
                onlyInStock
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-[var(--bg)] border-[var(--sep)] text-[var(--text-soft)] hover:text-[var(--text)]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${onlyInStock ? 'bg-emerald-500' : 'bg-[var(--text-muted)]'}`} />
              <span>En stock uniquement</span>
            </button>
          </div>

          {/* Results count */}
          <span className="text-[11px] text-[var(--text-muted)] tracking-wider">
            {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Results List View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 divide-y divide-[var(--sep)]">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Watch className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-40" />
              <p className="font-serif text-base text-[var(--text)]">Aucun garde-temps trouvé</p>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                Essayez d'ajuster votre recherche ou explorez l'ensemble de notre catalogue.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGender('all');
                  setSelectedCategory('all');
                  setOnlyInStock(false);
                }}
                className="mt-2 text-xs text-[var(--or)] hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            searchResults.map((product) => {
              const hasPromo = product.promotionalPrice && product.promotionalPrice < product.price;
              const displayPrice = hasPromo ? product.promotionalPrice! : product.price;
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  id={`search-result-${product.id}`}
                  onClick={() => handleProductClick(product)}
                  className="pt-3 first:pt-0 group flex items-center justify-between gap-4 p-3 rounded-2xl hover:bg-[var(--badge-bg)] transition-all cursor-pointer border border-transparent hover:border-[var(--sep)]"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[var(--bg)] border border-[var(--sep)] overflow-hidden shrink-0 flex items-center justify-center relative">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=300'}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {product.featured && (
                        <div className="absolute top-1 left-1 bg-[var(--or)] text-black p-0.5 rounded shadow">
                          <Sparkles className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-serif uppercase tracking-[0.2em] text-[var(--or)] font-semibold">
                          {product.brand}
                        </span>
                        {product.reference && (
                          <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">
                            • Ref. {product.reference}
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif text-sm sm:text-base font-bold text-[var(--text)] group-hover:text-[var(--or)] transition-colors truncate">
                        {product.name}
                      </h4>

                      <p className="text-xs text-[var(--text-muted)] line-clamp-1 font-sans">
                        {product.shortDescription || product.description}
                      </p>

                      <div className="flex items-center gap-2 pt-0.5">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-500 font-semibold">
                            <XCircle className="w-3 h-3" />
                            <span>Sur commande</span>
                          </span>
                        ) : product.stock <= (product.lowStockThreshold || 2) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Dernières pièces ({product.stock})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                            <Check className="w-3 h-3" />
                            <span>En stock immédiat</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & CTA arrow */}
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <div className="font-serif text-sm sm:text-base font-bold text-[var(--or)]">
                        {formatPrice(displayPrice)}
                      </div>
                      {hasPromo && (
                        <div className="text-[11px] text-[var(--text-muted)] line-through">
                          {formatPrice(product.price)}
                        </div>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[var(--badge-bg)] group-hover:bg-[var(--or)] group-hover:text-black text-[var(--text-soft)] flex items-center justify-center transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        {searchResults.length > 0 && (
          <div className="p-4 bg-[var(--bg)] border-t border-[var(--sep)] flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] hidden sm:inline">
              Astuce : Utilisez la touche <kbd className="px-1.5 py-0.5 bg-[var(--badge-bg)] border border-[var(--badge-border)] rounded text-[10px] font-mono text-[var(--text-soft)]">Échap</kbd> pour fermer
            </span>
            <button
              onClick={handleViewAllInShop}
              className="ml-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--or)] hover:text-[var(--text)] transition-colors"
            >
              <span>Voir tous les résultats dans la Boutique</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
