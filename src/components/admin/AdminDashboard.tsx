import React from 'react';
import {
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Watch,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Boxes,
  Clock
} from 'lucide-react';
import { Product, Order, StoreSettings } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { buildWhatsAppAdminToClientUrl } from '../../services/orderService';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  onNavigateTab: (tab: string) => void;
  onOpenNewProductModal: () => void;
  onQuickRestock: (productId: string, addQty: number) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: any) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  settings,
  onNavigateTab,
  onOpenNewProductModal,
  onQuickRestock,
  onUpdateOrderStatus
}) => {
  const currency = settings.currency || '€';

  // Metrics Calculations
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeProducts = products.filter(p => p.active);
  const outOfStockProducts = products.filter(p => p.stock <= 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 2));
  const totalStockAlerts = outOfStockProducts.length + lowStockProducts.length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 p-6 rounded-2xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-amber-400 font-serif font-bold">
            Tableau de Bord Exécutif
          </span>
          <h2 className="font-serif text-2xl font-bold text-stone-100 mt-1">
            Bienvenue dans votre gestionnaire {settings.storeName}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Suivi des ventes, gestion des stocks en direct et traitement des commandes clients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="gold"
            size="sm"
            id="dashboard-add-product-btn"
            onClick={onOpenNewProductModal}
            icon={Plus}
          >
            Nouvelle Montre
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('orders')}
          >
            Voir les Commandes
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-stone-900/70 border border-stone-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Chiffre d'Affaires</span>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-stone-100 font-mono">
            {totalRevenue.toLocaleString('fr-FR')} {currency}
          </div>
          <div className="text-[11px] text-stone-400 flex items-center gap-1">
            <span>Sur {validOrders.length} commande(s) confirmée(s)</span>
          </div>
        </div>

        {/* Orders Count & Pending */}
        <div className="bg-stone-900/70 border border-stone-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Commandes Totales</span>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-stone-100 font-mono">
            {orders.length}
          </div>
          <div className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3" />
            <span>{pendingOrders.length} en attente de traitement</span>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-stone-900/70 border border-stone-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Alertes Stock</span>
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-stone-100 font-mono">
            {totalStockAlerts}
          </div>
          <div className="text-[11px] text-rose-400 flex items-center gap-2">
            <span>{outOfStockProducts.length} épuisé(s)</span>
            <span>•</span>
            <span>{lowStockProducts.length} stock faible</span>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-stone-900/70 border border-stone-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Montres Actives</span>
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg">
              <Watch className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-stone-100 font-mono">
            {activeProducts.length} <span className="text-xs text-stone-400 font-sans font-normal">/ {products.length}</span>
          </div>
          <div className="text-[11px] text-stone-400">
            Visibles en vitrine publique
          </div>
        </div>
      </div>

      {/* Two Column Section: Pending Orders & Low Stock Quick Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Pending Orders requiring action */}
        <div className="lg:col-span-7 bg-stone-900/60 border border-stone-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif text-base font-semibold text-stone-100">
                Commandes Récentes à Traiter
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              <span>Voir tout</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400 bg-stone-950 rounded-xl">
              Aucune commande enregistrée pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 4).map((order) => {
                const waUrl = buildWhatsAppAdminToClientUrl(order, settings.storeName);

                return (
                  <div
                    key={order.id}
                    className="p-4 bg-stone-950 rounded-xl border border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          #{order.orderNumber}
                        </span>
                        <Badge
                          variant={
                            order.status === 'delivered'
                              ? 'success'
                              : order.status === 'cancelled'
                              ? 'danger'
                              : order.status === 'pending'
                              ? 'gold'
                              : 'default'
                          }
                        >
                          {order.status === 'pending'
                            ? 'À confirmer'
                            : order.status === 'confirmed'
                            ? 'Confirmée'
                            : order.status === 'preparing'
                            ? 'En préparation'
                            : order.status === 'shipped'
                            ? 'Expédiée'
                            : order.status === 'delivered'
                            ? 'Livrée'
                            : 'Annulée'}
                        </Badge>
                      </div>

                      <div className="text-xs text-stone-200 mt-1 font-medium">
                        {order.customer.name} ({order.customer.city})
                      </div>

                      <div className="text-[11px] text-stone-400 mt-0.5">
                        {order.items.length} article{order.items.length > 1 ? 's' : ''} • Total:{' '}
                        <span className="font-semibold text-stone-200">
                          {order.total.toLocaleString('fr-FR')} {order.currency}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                        title="Contacter le client sur WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                        <span>WhatsApp Client</span>
                      </a>

                      {order.status === 'pending' && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'confirmed')}
                          className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs transition-colors"
                          title="Confirmer la commande"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Low Stock Alert & Quick Restock */}
        <div className="lg:col-span-5 bg-stone-900/60 border border-stone-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif text-base font-semibold text-stone-100">
                Alerte Réapprovisionnement
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('stock')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              <span>Gérer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {totalStockAlerts === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400 bg-stone-950 rounded-xl flex flex-col items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span>Tous les niveaux de stock sont optimaux.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {[...outOfStockProducts, ...lowStockProducts].slice(0, 4).map((product) => {
                const isOut = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className="p-3 bg-stone-950 rounded-xl border border-stone-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0]}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-lg border border-stone-800"
                      />
                      <div>
                        <h4 className="text-xs font-medium text-stone-200 line-clamp-1">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isOut ? 'bg-rose-950 text-rose-300' : 'bg-amber-950 text-amber-300'
                            }`}
                          >
                            {isOut ? 'Épuisé (0)' : `Stock: ${product.stock}`}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            Seuil: {product.lowStockThreshold || 2}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fast Restock Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onQuickRestock(product.id, 1)}
                        className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-md font-semibold transition-colors"
                        title="Ajouter 1 pièce"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => onQuickRestock(product.id, 5)}
                        className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs rounded-md font-semibold transition-colors"
                        title="Ajouter 5 pièces"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
