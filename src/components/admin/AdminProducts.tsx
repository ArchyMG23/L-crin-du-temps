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
          <h2 className="font-serif text-xl font-bold text-stone-100">
            Catalogue des Montres ({products.length})
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Gérez vos pièces d'horlogerie, fixez les prix, ajustez les visibilités et mettez en vedette vos modèles phares.
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          id="admin-add-product-main-btn"
          onClick={onOpenNewModal}
          icon={Plus}
        >
          Ajouter une Montre
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-900/60 p-4 rounded-xl border border-stone-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search text */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="admin-product-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, marque, référence..."
              className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
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
              className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
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
              className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
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
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-12 text-center text-xs text-stone-400 space-y-3">
          <Watch className="w-8 h-8 text-stone-600 mx-auto" />
          <p className="text-stone-300 font-medium">Aucune montre ne correspond aux filtres actuels.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setGenderFilter('all');
              setStockFilter('all');
            }}
            className="text-[#D4AF37] hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards Layout (< md) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredProducts.map((product) => {
              const isOut = product.stock <= 0;
              const isLow = product.stock > 0 && product.stock <= (product.lowStockThreshold || 2);
              const categoryName = categories.find((c) => c.id === product.categoryId)?.name || 'Général';
              const hasPromo = product.promotionalPrice && product.promotionalPrice < product.price;

              return (
                <div
                  key={product.id}
                  className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        product.images?.[0] ||
                        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=200'
                      }
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover bg-stone-950 border border-stone-800 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] text-[#D4AF37] font-serif uppercase tracking-wider">
                          {product.brand}
                        </span>
                        <div className="flex items-center gap-1">
                          {product.featured && (
                            <span className="p-1 bg-amber-500/10 text-amber-400 rounded" title="Vedette">
                              <Sparkles className="w-3 h-3" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleActive(product.id, product.active)}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                              product.active
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-stone-950 text-stone-500 border border-stone-800'
                            }`}
                          >
                            {product.active ? 'En ligne' : 'Masqué'}
                          </button>
                        </div>
                      </div>

                      <h4 className="font-serif font-semibold text-stone-100 text-sm truncate mt-0.5">
                        {product.name}
                      </h4>

                      <div className="text-[11px] text-stone-400 mt-1 flex items-center justify-between">
                        <span>{categoryName} • <span className="capitalize">{product.gender}</span></span>
                        <div className="font-mono font-bold text-stone-100">
                          {hasPromo ? (
                            <span className="text-amber-400">
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

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 text-xs">
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
                          className="p-2 text-stone-400 hover:text-white bg-stone-950 border border-stone-800 rounded-lg"
                          title="Dupliquer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        className="px-3 py-1.5 text-stone-200 hover:text-white bg-stone-950 border border-stone-800 rounded-lg text-xs flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Modifier</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductToDelete(product)}
                        className="p-2 text-stone-400 hover:text-rose-400 bg-stone-950 border border-stone-800 rounded-lg"
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
          <div className="hidden md:block bg-stone-900/60 border border-stone-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950/80 text-[11px] uppercase tracking-wider text-stone-400 font-serif border-b border-stone-800">
                  <tr>
                    <th className="py-3.5 px-4">Montre</th>
                    <th className="py-3.5 px-4">Collection / Genre</th>
                    <th className="py-3.5 px-4">Prix Public</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4 text-center">En Vedette</th>
                    <th className="py-3.5 px-4 text-center">Visibilité</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredProducts.map((product) => {
                    const isOut = product.stock <= 0;
                    const isLow = product.stock > 0 && product.stock <= (product.lowStockThreshold || 2);
                    const categoryName = categories.find((c) => c.id === product.categoryId)?.name || 'Général';
                    const hasPromo = product.promotionalPrice && product.promotionalPrice < product.price;

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-stone-800/40 transition-colors group"
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
                              className="w-12 h-12 rounded-lg object-cover bg-stone-950 border border-stone-800 shrink-0 shadow"
                            />
                            <div>
                              <div className="font-serif font-semibold text-stone-100 text-sm group-hover:text-amber-300 transition-colors">
                                {product.name}
                              </div>
                              <div className="text-[11px] text-[#D4AF37] font-serif flex items-center gap-1.5">
                                <span>{product.brand}</span>
                                {product.reference && (
                                  <span className="text-stone-500 font-mono">({product.reference})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Gender */}
                        <td className="py-3.5 px-4">
                          <div className="text-stone-200 font-medium">{categoryName}</div>
                          <div className="text-[10px] text-stone-400 capitalize">{product.gender}</div>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4">
                          {hasPromo ? (
                            <div>
                              <div className="text-stone-500 line-through text-[11px]">
                                {product.price.toLocaleString('fr-FR')} {currency}
                              </div>
                              <div className="font-mono font-bold text-amber-400">
                                {product.promotionalPrice!.toLocaleString('fr-FR')} {currency}
                              </div>
                            </div>
                          ) : (
                            <div className="font-mono font-bold text-stone-100">
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
                            className={`p-1.5 rounded-lg transition-colors ${
                              product.featured
                                ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                                : 'text-stone-600 hover:text-stone-400'
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
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                              product.active
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60'
                                : 'bg-stone-900 text-stone-500 border border-stone-800 hover:bg-stone-800'
                            }`}
                          >
                            {product.active ? (
                              <>
                                <Eye className="w-3 h-3 text-emerald-400" />
                                <span>En ligne</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Masqué</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions (Edit / Duplicate / Delete) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onDuplicateProduct && (
                              <button
                                type="button"
                                onClick={() => onDuplicateProduct(product)}
                                className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-md transition-colors"
                                title="Dupliquer la montre"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onEditProduct(product)}
                              className="p-1.5 text-stone-400 hover:text-[#D4AF37] hover:bg-stone-800 rounded-md transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductToDelete(product)}
                              className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded-md transition-colors"
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
          <div className="space-y-4 text-stone-200 text-xs">
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-rose-200">Action irréversible</h4>
                <p className="text-rose-300/80 mt-1">
                  Êtes-vous certain de vouloir supprimer définitivement la montre{' '}
                  <strong className="text-white">"{productToDelete.name}"</strong> ?
                </p>
                <p className="text-stone-400 text-[11px] mt-2">
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
