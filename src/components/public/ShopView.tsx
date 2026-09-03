import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Watch, X, Sparkles, Check } from 'lucide-react';
import { Product, Category, StoreSettings } from '../../types';
import { ProductCard } from './ProductCard';

interface ShopViewProps {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  initialCategory?: string;
  initialGender?: 'homme' | 'femme' | 'all';
  searchQuery?: string;
  onSelectProduct: (product: Product) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  products,
  categories,
  settings,
  initialCategory,
  initialGender = 'all',
  searchQuery = '',
  onSelectProduct
}) => {
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedGender, setSelectedGender] = useState<'all' | 'homme' | 'femme' | 'mixte'>(initialGender);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name-asc'>('featured');

  React.useEffect(() => {
    if (searchQuery !== undefined) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  React.useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  React.useEffect(() => {
    if (initialGender) {
      setSelectedGender(initialGender);
    }
  }, [initialGender]);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Active check
        if (!p.active) return false;

        // Search text
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matches =
            p.name.toLowerCase().includes(term) ||
            p.brand.toLowerCase().includes(term) ||
            (p.reference && p.reference.toLowerCase().includes(term)) ||
            (p.shortDescription && p.shortDescription.toLowerCase().includes(term));
          if (!matches) return false;
        }

        // Gender
        if (selectedGender !== 'all') {
          if (p.gender !== selectedGender && p.gender !== 'mixte') return false;
        }

        // Category
        if (selectedCategory !== 'all') {
          if (p.categoryId !== selectedCategory) return false;
        }

        // Only in stock
        if (onlyInStock) {
          if (p.stock <= 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          const priceA = a.promotionalPrice && a.promotionalPrice < a.price ? a.promotionalPrice : a.price;
          const priceB = b.promotionalPrice && b.promotionalPrice < b.price ? b.promotionalPrice : b.price;
          return priceA - priceB;
        }
        if (sortBy === 'price-desc') {
          const priceA = a.promotionalPrice && a.promotionalPrice < a.price ? a.promotionalPrice : a.price;
          const priceB = b.promotionalPrice && b.promotionalPrice < b.price ? b.promotionalPrice : b.price;
          return priceB - priceA;
        }
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        // Default: featured first, then stock availability
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0);
      });
  }, [products, searchTerm, selectedGender, selectedCategory, onlyInStock, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedGender('all');
    setSelectedCategory('all');
    setOnlyInStock(false);
    setSortBy('featured');
  };

  const isFiltered =
    searchTerm !== '' ||
    selectedGender !== 'all' ||
    selectedCategory !== 'all' ||
    onlyInStock ||
    sortBy !== 'featured';

  return (
    <div className="space-y-8 text-[var(--text)]">
      {/* Title & Headline */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--or)] font-serif font-bold">
          Catalogue Complet
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--text)]">
          Garde-Temps & Pièces de Prestige
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-soft)] font-sans">
          Explorez nos collections exclusives et commandez directement auprès de notre conciergerie WhatsApp.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[var(--carte-bg)] p-5 sm:p-6 rounded-2xl border border-[var(--sep)] space-y-5 shadow-xl">
        {/* Top row: Gender Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Gender Tabs */}
          <div className="flex items-center bg-[var(--bg)] p-1 rounded-xl border border-[var(--sep)] w-full md:w-auto">
            <button
              onClick={() => setSelectedGender('all')}
              className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                selectedGender === 'all'
                  ? 'bg-[var(--or)] text-black shadow-md shadow-[var(--or)]/20'
                  : 'text-[var(--text-soft)] hover:text-[var(--text)]'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedGender('homme')}
              className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                selectedGender === 'homme'
                  ? 'bg-[var(--or)] text-black shadow-md shadow-[var(--or)]/20'
                  : 'text-[var(--text-soft)] hover:text-[var(--text)]'
              }`}
            >
              Hommes
            </button>
            <button
              onClick={() => setSelectedGender('femme')}
              className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                selectedGender === 'femme'
                  ? 'bg-[var(--or)] text-black shadow-md shadow-[var(--or)]/20'
                  : 'text-[var(--text-soft)] hover:text-[var(--text)]'
              }`}
            >
              Femmes
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-2.5" />
            <input
              type="text"
              id="shop-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une montre, marque..."
              className="w-full bg-[var(--bg)] border border-[var(--sep)] focus:border-[var(--or)]/50 rounded-lg pl-10 pr-4 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom row: Category Pills & Sorting */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-[var(--sep)]">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[var(--badge-bg)] text-[var(--or)] border border-[var(--badge-border)] font-semibold'
                  : 'bg-[var(--bg)] text-[var(--text-soft)] hover:text-[var(--text)] border border-[var(--sep)]'
              }`}
            >
              Toutes les collections
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
                  selectedCategory === c.id
                    ? 'bg-[var(--badge-bg)] text-[var(--or)] border border-[var(--badge-border)] font-semibold'
                    : 'bg-[var(--bg)] text-[var(--text-soft)] hover:text-[var(--text)] border border-[var(--sep)]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Sort & In Stock toggle */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-soft)] select-none">
              <input
                type="checkbox"
                id="shop-only-in-stock"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--or)] bg-[var(--bg)] border-[var(--sep)] focus:ring-0 accent-[var(--or)]"
              />
              <span>En stock uniquement</span>
            </label>

            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="uppercase tracking-wider text-[10px]">Trier :</span>
              <select
                id="shop-sort-select"
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-[var(--bg)] border border-[var(--sep)] focus:border-[var(--or)]/50 rounded-lg px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none"
              >
                <option value="featured">Pièces en vedette</option>
                <option value="price-asc">Prix : croissant</option>
                <option value="price-desc">Prix : décroissant</option>
                <option value="name-asc">Nom (A-Z)</option>
              </select>
            </div>

            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-[var(--or)] hover:text-[var(--or-hover)] underline underline-offset-4 tracking-wider font-medium"
              >
                Réinitialiser filtres
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
        <span>
          Affichage de <strong className="text-[var(--or)] font-semibold">{filteredProducts.length}</strong> montre(s) disponible(s)
        </span>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-16 text-center text-[var(--text-soft)] bg-[var(--carte-bg)] rounded-2xl border border-[var(--sep)] space-y-4 shadow-sm">
          <Watch className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
          <h3 className="font-serif text-lg text-[var(--text)] font-bold">
            Aucun modèle ne correspond à vos critères
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Modifiez vos filtres ou contactez-nous directement sur WhatsApp pour une commande sur-mesure.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-[var(--badge-bg)] hover:bg-[var(--or)]/20 text-[var(--or)] border border-[var(--badge-border)] rounded-lg text-xs font-semibold"
          >
            Effacer tous les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6 2xl:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
