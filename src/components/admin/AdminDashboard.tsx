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
  settings?: StoreSettings;
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
  const currency = settings?.currency || '€';
  const storeName = settings?.storeName || 'Horlogerie de Prestige';

  // Metrics Calculations
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeProducts = products.filter(p => p.active);
  const outOfStockProducts = products.filter(p => p.stock <= 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 2));
  const totalStockAlerts = outOfStockProducts.length + lowStockProducts.length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#151722] p-5 sm:p-7 rounded-2xl border border-zinc-700/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#E5C058] font-serif font-bold">
            Tableau de Bord Exécutif
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1 tracking-wide">
            Console de gestion {storeName}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1">
            Suivi des ventes en temps réel, alertes de stock et traitement rapide des commandes WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Button
            variant="gold"
            size="sm"
            id="dashboard-add-product-btn"
            onClick={onOpenNewProductModal}
            icon={Plus}
            className="flex-1 sm:flex-none shadow-md font-semibold text-xs py-2.5 px-4"
          >
            Nouvelle Montre
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('orders')}
            className="flex-1 sm:flex-none bg-zinc-850 hover:bg-zinc-800 text-zinc-100 border-zinc-600 text-xs py-2.5 px-4 font-medium"
          >
            Commandes ({pendingOrders.length})
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards (2x2 on Mobile, 4 columns on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-[#181a26] border border-zinc-700/80 p-4 sm:p-5 rounded-2xl space-y-2 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">Chiffre d'Affaires</span>
            <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-lg sm:text-2xl font-bold text-white tracking-tight">
            {totalRevenue.toLocaleString('fr-FR')} {currency}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
            <span>{validOrders.length} commande(s) valides</span>
          </div>
        </div>

        {/* Orders Count & Pending */}
        <div className="bg-[#181a26] border border-zinc-700/80 p-4 sm:p-5 rounded-2xl space-y-2 shadow-sm hover:border-amber-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">Commandes Totales</span>
            <div className="p-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-lg sm:text-2xl font-bold text-white tracking-tight">
            {orders.length}
          </div>
          <div className="text-[11px] text-[#F3D375] flex items-center gap-1 font-bold">
            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{pendingOrders.length} à traiter</span>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-[#181a26] border border-zinc-700/80 p-4 sm:p-5 rounded-2xl space-y-2 shadow-sm hover:border-rose-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">Alertes Stock</span>
            <div className="p-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-lg sm:text-2xl font-bold text-white tracking-tight">
            {totalStockAlerts}
          </div>
          <div className="text-[11px] text-rose-300 flex items-center gap-1.5 font-semibold">
            <span>{outOfStockProducts.length} épuisé(s)</span>
            <span>•</span>
            <span>{lowStockProducts.length} faible</span>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-[#181a26] border border-zinc-700/80 p-4 sm:p-5 rounded-2xl space-y-2 shadow-sm hover:border-sky-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">Montres Actives</span>
            <div className="p-2 bg-sky-500/15 border border-sky-500/30 text-sky-400 rounded-xl">
              <Watch className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-lg sm:text-2xl font-bold text-white tracking-tight">
            {activeProducts.length} <span className="text-xs text-zinc-400 font-sans font-normal">/ {products.length}</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-medium">
            En vitrine publique
          </div>
        </div>
      </div>

      {/* Two Column Section: Pending Orders & Low Stock Quick Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left: Pending Orders requiring action */}
        <div className="lg:col-span-7 bg-[#151722] border border-zinc-700/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/15 rounded-xl border border-amber-500/30 text-amber-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-white">
                  Commandes Récentes
                </h3>
                <span className="text-[11px] text-zinc-400">Traitement et suivi direct</span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-[#F3D375] hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl border border-zinc-700 flex items-center gap-1 font-semibold transition-colors"
            >
              <span>Voir tout</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 bg-[#1a1c28] rounded-xl border border-zinc-800">
              Aucune commande enregistrée pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 4).map((order) => {
                const waUrl = buildWhatsAppAdminToClientUrl(order, settings?.storeName || storeName);

                return (
                  <div
                    key={order.id}
                    className="p-4 bg-[#1c1e2b] rounded-xl border border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-600 transition-colors shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#E5C058]">
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

                      <div className="text-xs text-white mt-1 font-semibold">
                        {order.customer.name} {order.customer.city ? `(${order.customer.city})` : ''}
                      </div>

                      <div className="text-[11px] text-zinc-300 mt-0.5">
                        {order.items.length} article{order.items.length > 1 ? 's' : ''} • Total:{' '}
                        <span className="font-bold text-white">
                          {order.total.toLocaleString('fr-FR')} {order.currency}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-zinc-800 sm:border-t-0">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none justify-center px-3 py-2 bg-[#25D366] hover:bg-[#20ba59] text-black rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        title="Contacter le client sur WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                        <span>WhatsApp Client</span>
                      </a>

                      {order.status === 'pending' && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'confirmed')}
                          className="px-3 py-2 bg-zinc-800 hover:bg-emerald-950/60 text-emerald-400 hover:text-emerald-300 border border-zinc-700 hover:border-emerald-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                          title="Confirmer la commande"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Confirmer</span>
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
        <div className="lg:col-span-5 bg-[#151722] border border-zinc-700/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500/15 rounded-xl border border-rose-500/30 text-rose-400">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-white">
                  Alerte Stocks
                </h3>
                <span className="text-[11px] text-zinc-400">Réapprovisionnement en 1 clic</span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('stock')}
              className="text-xs text-[#F3D375] hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl border border-zinc-700 flex items-center gap-1 font-semibold transition-colors"
            >
              <span>Gérer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {totalStockAlerts === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-300 bg-[#1a1c28] rounded-xl border border-zinc-800 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              <span className="font-semibold text-white">Tous les niveaux de stock sont optimaux.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {[...outOfStockProducts, ...lowStockProducts].slice(0, 4).map((product) => {
                const isOut = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className="p-3.5 bg-[#1c1e2b] rounded-xl border border-zinc-700/80 flex items-center justify-between gap-3 hover:border-zinc-600 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&q=80'}
                        alt={product.name}
                        className="w-11 h-11 object-cover rounded-xl border border-zinc-700 shrink-0 bg-zinc-900"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOut
                                ? 'bg-rose-900 text-rose-200 border border-rose-700'
                                : 'bg-amber-900/80 text-amber-200 border border-amber-700'
                            }`}
                          >
                            {isOut ? 'Épuisé (0)' : `Stock: ${product.stock}`}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium">
                            Seuil: {product.lowStockThreshold || 2}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fast Restock Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onQuickRestock(product.id, 1)}
                        className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white text-xs rounded-lg font-bold border border-zinc-700 transition-all"
                        title="Ajouter 1 pièce"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => onQuickRestock(product.id, 5)}
                        className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 text-xs rounded-lg font-bold border border-amber-500/40 transition-all"
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
