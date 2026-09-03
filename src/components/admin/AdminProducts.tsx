import React, { useState } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Watch,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  AlertCircle
} from 'lucide-react';
import { Product, Category, StoreSettings } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface AdminProductsProps {
  products: Product[];
  categories: Category[];
  settings?: StoreSettings;
  onOpenNewModal: () => void;
  onEditProduct: (product: Product) => void;
  onDuplicateProduct?: (product: Product) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onToggleActive: (productId: string, currentActive: boolean) => Promise<void>;
  onToggleFeatured: (productId: string, currentFeatured: boolean) => Promise<void>;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  categories,
  settings,
  onOpenNewModal,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onToggleActive,
  onToggleFeatured
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all | available | low | out
  const [activeFilter, setActiveFilter] = useState('all'); // all | active | inactive
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currency = settings?.currency || '€';

  // Filter logic
  const filteredProducts = products.filter((product) => {
    // Search
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.reference && product.reference.toLowerCase().includes(searchTerm.toLowerCase()));

    // Category
    const matchesCat = categoryFilter === 'all' || product.categoryId === categoryFilter;

    // Gender
    const matchesGender = genderFilter === 'all' || product.gender === genderFilter;

    // Stock
    const isOut = product.stock <= 0;
    const isLow = product.stock > 0 && product.stock <= (product.lowStockThreshold || 2);
    let matchesStock = true;
    if (stockFilter === 'out') matchesStock = isOut;
    if (stockFilter === 'low') matchesStock = isLow;
    if (stockFilter === 'available') matchesStock = !isOut && !isLow;

    // Active
    let matchesActive = true;
    if (activeFilter === 'active') matchesActive = product.active;
    if (activeFilter === 'inactive') matchesActive = !product.active;

    return matchesSearch && matchesCat && matchesGender && matchesStock && matchesActive;
  });

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setDeleting(true);
      await onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--text)] tracking-wide">
            Catalogue des Montres ({products.length})
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-soft)] mt-1">
            Gérez vos pièces d'horlogerie, fixez les prix, ajustez les visibilités et mettez en vedette vos modèles phares.
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          id="admin-add-product-main-btn"
          onClick={onOpenNewModal}
          icon={Plus}
          className="shadow-md font-semibold text-xs sm:text-sm py-2.5 px-4 self-start sm:self-auto"
        >
          Ajouter une Montre
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--carte-bg)] p-4 sm:p-5 rounded-2xl border border-[var(--sep)] space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search text */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
            <input
              type="text"
              id="admin-product-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, marque, référence..."
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none shadow-xs"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[var(--text)] focus:outline-none shadow-xs"
            >
              <option value="all">Toutes les collections</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[var(--text)] focus:outline-none shadow-xs"
            >
              <option value="all">Tous genres</option>
              <option value="homme">Hommes</option>
              <option value="femme">Femmes</option>
              <option value="mixte">Mixte</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[var(--text)] focus:outline-none shadow-xs"
            >
              <option value="all">Tous les stocks</option>
              <option value="available">Disponible</option>
              <option value="low">Stock Faible</option>
              <option value="out">Rupture de Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Content: Desktop Table & Mobile Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[var(--carte-bg)] border border-[var(--sep)] rounded-2xl p-12 text-center text-xs text-[var(--text-muted)] space-y-3 shadow-sm">
          <Watch className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
          <p className="text-[var(--text)] font-medium text-sm">Aucune montre ne correspond aux filtres actuels.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setGenderFilter('all');
              setStockFilter('all');
            }}
            className="text-[var(--or)] font-semibold hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards Layout (< md) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredProducts.map((product) => {
              const isOut = product.stock <= 0;
              const isLow = product.stock > 0 && product.stock <= (product.lowStockThreshold || 2);
              const categoryName = categories.find((c) => c.id === product.categoryId)?.name || 'Général';
              const hasPromo = product.promotionalPrice && product.promotionalPrice < product.price;

              return (
                <div
                  key={product.id}
                  className="bg-[var(--carte-bg)] border border-[var(--sep)] rounded-2xl p-4 space-y-3.5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        product.images?.[0] ||
                        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=200'
                      }
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover bg-[var(--bg-2)] border border-[var(--sep)] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] text-[var(--or)] font-bold uppercase tracking-wider">
                          {product.brand}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {product.featured && (
                            <span className="p-1 bg-[var(--badge-bg)] text-[var(--or)] rounded-md border border-[var(--badge-border)]" title="Vedette">
                              <Sparkles className="w-3 h-3" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleActive(product.id, product.active)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              product.active
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : 'bg-[var(--bg-2)] text-[var(--text-muted)] border border-[var(--sep)]'
                            }`}
                          >
                            {product.active ? 'En ligne' : 'Masqué'}
                          </button>
                        </div>
                      </div>

                      <h4 className="font-serif font-bold text-[var(--text)] text-sm truncate mt-0.5">
                        {product.name}
                      </h4>

                      <div className="text-[11px] text-[var(--text-soft)] mt-1 flex items-center justify-between">
                        <span>{categoryName} • <span className="capitalize">{product.gender}</span></span>
                        <div className="font-mono font-bold text-[var(--text)]">
                          {hasPromo ? (
                            <span className="text-[var(--or)]">
                              {product.promotionalPrice!.toLocaleString('fr-FR')} {currency}
                            </span>
                          ) : (
                            <span>
                              {product.price.toLocaleString('fr-FR')} {currency}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-[var(--sep)] text-xs">
                    <div>
                      {isOut ? (
                        <Badge variant="danger">Rupture (0)</Badge>
                      ) : isLow ? (
                        <Badge variant="warning">Faible ({product.stock})</Badge>
                      ) : (
                        <Badge variant="success">En stock ({product.stock})</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onDuplicateProduct && (
                        <button
                          type="button"
                          onClick={() => onDuplicateProduct(product)}
                          className="p-2 text-[var(--text-soft)] hover:text-[var(--text)] bg-[var(--bg-2)] hover:bg-[var(--badge-bg)] border border-[var(--sep)] rounded-xl"
                          title="Dupliquer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        className="px-3 py-2 text-[var(--text)] hover:text-[var(--or)] bg-[var(--bg-2)] hover:bg-[var(--badge-bg)] border border-[var(--sep)] rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[var(--or)]" />
                        <span>Modifier</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductToDelete(product)}
                        className="p-2 text-rose-600 dark:text-rose-300 hover:bg-rose-500/15 bg-[var(--bg-2)] border border-[var(--sep)] hover:border-rose-500/40 rounded-xl"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-[var(--carte-bg)] border border-[var(--sep)] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[var(--text)]">
                <thead className="bg-[var(--bg-2)] text-[11px] uppercase tracking-wider text-[var(--text-soft)] font-serif border-b border-[var(--sep)]">
                  <tr>
                    <th className="py-4 px-4 font-bold">Montre</th>
                    <th className="py-4 px-4 font-bold">Collection / Genre</th>
                    <th className="py-4 px-4 font-bold">Prix Public</th>
                    <th className="py-4 px-4 font-bold">Stock</th>
                    <th className="py-4 px-4 text-center font-bold">En Vedette</th>
                    <th className="py-4 px-4 text-center font-bold">Visibilité</th>
                    <th className="py-4 px-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sep)]">
                  {filteredProducts.map((product) => {
                    const isOut = product.stock <= 0;
                    const isLow = product.stock > 0 && product.stock <= (product.lowStockThreshold || 2);
                    const categoryName = categories.find((c) => c.id === product.categoryId)?.name || 'Général';
                    const hasPromo = product.promotionalPrice && product.promotionalPrice < product.price;

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-[var(--badge-bg)]/40 transition-colors group"
                      >
                        {/* Product identity & photo */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                product.images?.[0] ||
                                'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=200'
                              }
                              alt={product.name}
                              className="w-12 h-12 rounded-xl object-cover bg-[var(--bg-2)] border border-[var(--sep)] shrink-0 shadow-xs"
                            />
                            <div>
                              <div className="font-serif font-bold text-[var(--text)] text-sm group-hover:text-[var(--or)] transition-colors">
                                {product.name}
                              </div>
                              <div className="text-[11px] text-[var(--or)] font-medium flex items-center gap-1.5">
                                <span>{product.brand}</span>
                                {product.reference && (
                                  <span className="text-[var(--text-muted)] font-mono">({product.reference})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Gender */}
                        <td className="py-3.5 px-4">
                          <div className="text-[var(--text)] font-semibold">{categoryName}</div>
                          <div className="text-[10px] text-[var(--text-muted)] capitalize">{product.gender}</div>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4">
                          {hasPromo ? (
                            <div>
                              <div className="text-[var(--text-muted)] line-through text-[11px]">
                                {product.price.toLocaleString('fr-FR')} {currency}
                              </div>
                              <div className="font-mono font-bold text-[var(--or)] text-sm">
                                {product.promotionalPrice!.toLocaleString('fr-FR')} {currency}
                              </div>
                            </div>
                          ) : (
                            <div className="font-mono font-bold text-[var(--text)] text-sm">
                              {product.price.toLocaleString('fr-FR')} {currency}
                            </div>
                          )}
                        </td>

                        {/* Stock Badge */}
                        <td className="py-3.5 px-4">
                          {isOut ? (
                            <Badge variant="danger">Rupture (0)</Badge>
                          ) : isLow ? (
                            <Badge variant="warning">Faible ({product.stock})</Badge>
                          ) : (
                            <Badge variant="success">En stock ({product.stock})</Badge>
                          )}
                        </td>

                        {/* Featured Star Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onToggleFeatured(product.id, product.featured)}
                            className={`p-2 rounded-xl transition-colors ${
                              product.featured
                                ? 'text-[var(--or)] bg-[var(--badge-bg)] hover:bg-[var(--badge-bg)] border border-[var(--badge-border)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--bg-2)]'
                            }`}
                            title={product.featured ? 'Retirer des vedettes' : 'Mettre en vedette'}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        </td>

                        {/* Active / Hidden Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onToggleActive(product.id, product.active)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
                              product.active
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-[var(--bg-2)] text-[var(--text-muted)] border border-[var(--sep)] hover:bg-[var(--badge-bg)]'
                            }`}
                          >
                            {product.active ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>En ligne</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Masqué</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions (Edit / Duplicate / Delete) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onDuplicateProduct && (
                              <button
                                type="button"
                                onClick={() => onDuplicateProduct(product)}
                                className="p-2 text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-[var(--bg-2)] rounded-xl transition-colors"
                                title="Dupliquer la montre"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onEditProduct(product)}
                              className="p-2 text-[var(--or)] hover:opacity-80 hover:bg-[var(--bg-2)] rounded-xl transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductToDelete(product)}
                              className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        title="Confirmation de suppression"
        maxWidth="sm"
      >
        {productToDelete && (
          <div className="space-y-4 text-[var(--text)] text-xs">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-rose-700 dark:text-rose-200">Action irréversible</h4>
                <p className="text-rose-800 dark:text-rose-300 mt-1">
                  Êtes-vous certain de vouloir supprimer définitivement la montre{' '}
                  <strong className="text-[var(--text)]">"{productToDelete.name}"</strong> ?
                </p>
                <p className="text-[var(--text-soft)] text-[11px] mt-2">
                  Astuce : si cette pièce a déjà été commandée, préférez la désactiver pour préserver vos historiques.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProductToDelete(null)}
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDelete}
                loading={deleting}
              >
                Confirmer la suppression
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
