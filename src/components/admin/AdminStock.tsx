import React, { useState } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Save,
  RotateCcw
} from 'lucide-react';
import { Product, StoreSettings } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AdminStockProps {
  products: Product[];
  settings?: StoreSettings;
  onUpdateStock: (productId: string, newStock: number) => Promise<void>;
}

export const AdminStock: React.FC<AdminStockProps> = ({
  products,
  settings,
  onUpdateStock
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all');
  const [localStockEdits, setLocalStockEdits] = useState<{ [id: string]: number }>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const outOfStockCount = products.filter(p => p.stock <= 0).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 2)).length;

  const handleStockChange = (id: string, currentStock: number, delta: number) => {
    const current = localStockEdits[id] !== undefined ? localStockEdits[id] : currentStock;
    const nextVal = Math.max(0, current + delta);
    setLocalStockEdits(prev => ({ ...prev, [id]: nextVal }));
  };

  const handleSaveSingle = async (id: string, defaultStock: number) => {
    const val = localStockEdits[id] !== undefined ? localStockEdits[id] : defaultStock;
    try {
      setSavingId(id);
      await onUpdateStock(id, val);
      setLocalStockEdits(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } finally {
      setSavingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase()));

    const isOut = p.stock <= 0;
    const isLow = p.stock > 0 && p.stock <= (p.lowStockThreshold || 2);

    if (statusFilter === 'out') return matchesSearch && isOut;
    if (statusFilter === 'low') return matchesSearch && isLow;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
            Contrôle & Ajustement des Stocks
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1">
            Mettez à jour vos quantités en stock en 1 clic pour éviter toute rupture lors des commandes clients.
          </p>
        </div>

        {/* Quick status tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-amber-500/20 text-[#E5C058] border border-amber-500/50 shadow-xs'
                : 'bg-[#151722] text-zinc-300 border border-zinc-700 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Tous ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter('low')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              statusFilter === 'low'
                ? 'bg-amber-950 text-amber-200 border border-amber-600 shadow-xs'
                : 'bg-[#151722] text-zinc-300 border border-zinc-700 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Stock Faible ({lowStockCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('out')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              statusFilter === 'out'
                ? 'bg-rose-950 text-rose-200 border border-rose-600 shadow-xs'
                : 'bg-[#151722] text-zinc-300 border border-zinc-700 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Ruptures ({outOfStockCount})</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filtrer une référence ou une montre..."
          className="w-full bg-[#151722] border border-zinc-700 focus:border-[#E5C058] rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none shadow-xs"
        />
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const editedStock =
            localStockEdits[product.id] !== undefined
              ? localStockEdits[product.id]
              : product.stock;
          const isDirty = localStockEdits[product.id] !== undefined && localStockEdits[product.id] !== product.stock;
          const isOut = editedStock <= 0;
          const isLow = editedStock > 0 && editedStock <= (product.lowStockThreshold || 2);

          return (
            <div
              key={product.id}
              className={`p-4 sm:p-5 bg-[#151722] rounded-2xl border transition-all flex flex-col justify-between shadow-sm ${
                isDirty
                  ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                  : 'border-zinc-700/80 hover:border-zinc-600'
              }`}
            >
              <div>
                <div className="flex items-start gap-3">
                  <img
                    src={
                      product.images?.[0] ||
                      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=200'
                    }
                    alt={product.name}
                    className="w-14 h-14 rounded-xl object-cover bg-zinc-900 border border-zinc-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#E5C058] font-serif uppercase tracking-wider block font-bold">
                      {product.brand}
                    </span>
                    <h3 className="font-serif text-sm font-bold text-white truncate">
                      {product.name}
                    </h3>
                    <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                      Réf: {product.reference || 'Non spécifiée'}
                    </div>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="mt-3.5 flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Disponibilité :</span>
                  {isOut ? (
                    <Badge variant="danger">Rupture de Stock</Badge>
                  ) : isLow ? (
                    <Badge variant="warning">Stock Faible</Badge>
                  ) : (
                    <Badge variant="success">Disponible</Badge>
                  )}
                </div>
              </div>

              {/* Counter Controls */}
              <div className="mt-4 pt-3.5 border-t border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-200 font-bold">
                    Quantité en stock :
                  </span>

                  <div className="flex items-center bg-[#1c1e2b] border border-zinc-700 rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => handleStockChange(product.id, product.stock, -1)}
                      className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Diminuer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={editedStock}
                      onChange={(e) =>
                        setLocalStockEdits(prev => ({
                          ...prev,
                          [product.id]: Math.max(0, parseInt(e.target.value) || 0)
                        }))
                      }
                      className="w-12 text-center bg-transparent text-xs font-mono font-bold text-[#E5C058] focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => handleStockChange(product.id, product.stock, 1)}
                      className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Augmenter"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Save button if altered */}
                {isDirty && (
                  <Button
                    variant="gold"
                    size="sm"
                    loading={savingId === product.id}
                    onClick={() => handleSaveSingle(product.id, product.stock)}
                    icon={Save}
                    className="w-full mt-2 font-bold py-2 shadow-md"
                  >
                    Enregistrer le stock ({editedStock})
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
