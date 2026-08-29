import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Eye,
  MessageSquare,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Send,
  Sparkles,
  ArrowUpDown,
  DollarSign
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, StoreSettings } from '../../types';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface AdminOrdersProps {
  orders: Order[];
  settings: StoreSettings;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onUpdatePaymentStatus: (orderId: string, paymentStatus: PaymentStatus) => Promise<void>;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  settings,
  onUpdateStatus,
  onUpdatePaymentStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Status mapping
  const statusLabels: Record<OrderStatus, { label: string; variant: 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' }> = {
    pending: { label: 'En attente', variant: 'warning' },
    confirmed: { label: 'Confirmée', variant: 'gold' },
    preparing: { label: 'En préparation', variant: 'info' },
    shipped: { label: 'Expédiée', variant: 'secondary' },
    delivered: { label: 'Livrée', variant: 'success' },
    cancelled: { label: 'Annulée', variant: 'danger' }
  };

  const paymentLabels: Record<PaymentStatus, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'text-amber-400' },
    paid: { label: 'Payée', color: 'text-emerald-400' },
    failed: { label: 'Échouée', color: 'text-rose-400' },
    refunded: { label: 'Remboursée', color: 'text-purple-400' },
    not_required: { label: 'Non requis', color: 'text-stone-400' }
  };

  // Filter & search
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.phone.includes(searchTerm) ||
        (order.customer.city && order.customer.city.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'amount_desc') return b.total - a.total;
      if (sortBy === 'amount_asc') return a.total - b.total;
      return 0;
    });

  // WhatsApp generator with pre-formatted luxury templates
  const generateWhatsAppUrl = (
    order: Order,
    type: 'default' | 'confirm' | 'preparing' | 'shipped' | 'delivered' = 'default'
  ) => {
    const rawPhone = order.customer.phone.replace(/[^0-9]/g, '');
    let text = '';

    const storeName = settings.name || 'Notre Maison Horlogère';
    const totalFormatted = `${order.total.toLocaleString('fr-FR')} ${order.currency}`;

    switch (type) {
      case 'confirm':
        text = `Bonjour ${order.customer.name},\n\nNous confirmons la bonne réception de votre commande *#${order.orderNumber}* chez ${storeName}.\n\nMontant total : *${totalFormatted}*.\nNotre conciergerie prend en charge votre commande dès aujourd'hui.`;
        break;
      case 'preparing':
        text = `Bonjour ${order.customer.name},\n\nVotre garde-temps pour la commande *#${order.orderNumber}* est actuellement en cours de préparation et de contrôle minutieux dans notre atelier horloger.\n\nNous vous informerons dès son expédition.`;
        break;
      case 'shipped':
        text = `Bonjour ${order.customer.name},\n\nExcellente nouvelle ! Votre commande *#${order.orderNumber}* a été expédiée et est en cours d'acheminement vers ${order.customer.city}.\n\nPréparez-vous à recevoir votre écrin.`;
        break;
      case 'delivered':
        text = `Bonjour ${order.customer.name},\n\nVotre commande *#${order.orderNumber}* a bien été livrée. Nous espérons que votre montre vous apporte entière satisfaction et nous tenons à votre disposition pour toute question.`;
        break;
      default:
        text = `Bonjour ${order.customer.name},\n\nJe vous contacte au sujet de votre commande *#${order.orderNumber}* chez ${storeName} (${totalFormatted}).`;
        break;
    }

    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'cancelled') {
      setCancellingOrderId(orderId);
    } else {
      await onUpdateStatus(orderId, newStatus);
    }
  };

  const confirmCancelOrder = async () => {
    if (!cancellingOrderId) return;
    await onUpdateStatus(cancellingOrderId, 'cancelled');
    setCancellingOrderId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-100">
            Commandes & Conciergerie WhatsApp ({orders.length})
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Suivez les commandes passées par vos clients, mettez à jour les statuts et communiquez directement sur WhatsApp.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-stone-900/60 p-4 rounded-xl border border-stone-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="admin-order-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="N° commande, client, ville, tél..."
              className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">Tous les statuts de commande</option>
              <option value="pending">🟡 En attente</option>
              <option value="confirmed">🔵 Confirmée</option>
              <option value="preparing">🟣 En préparation</option>
              <option value="shipped">🚚 Expédiée</option>
              <option value="delivered">🟢 Livrée</option>
              <option value="cancelled">🔴 Annulée</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">Tous les règlements</option>
              <option value="pending">Règlement en attente</option>
              <option value="paid">Payé / Réglé</option>
              <option value="refunded">Remboursé</option>
              <option value="failed">Échoué</option>
              <option value="not_required">Non requis</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="newest">Plus récentes en premier</option>
              <option value="oldest">Plus anciennes en premier</option>
              <option value="amount_desc">Montant le plus élevé</option>
              <option value="amount_asc">Montant le plus faible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-12 text-center text-xs text-stone-400 space-y-3">
          <ShoppingBag className="w-8 h-8 text-stone-600 mx-auto" />
          <p className="text-stone-300 font-medium">Aucune commande ne correspond à ces critères.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = statusLabels[order.status] || { label: order.status, variant: 'secondary' };
            const paymentConfig = paymentLabels[order.paymentStatus] || { label: order.paymentStatus, color: 'text-stone-400' };

            return (
              <div
                key={order.id}
                className="bg-stone-900/60 rounded-xl border border-stone-800 p-4 sm:p-5 space-y-4 hover:border-[#D4AF37]/30 transition-all shadow-md"
              >
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#D4AF37]">
                      #{order.orderNumber}
                    </span>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400">Total :</span>
                    <span className="font-serif text-lg font-bold text-stone-100 font-mono">
                      {order.total.toLocaleString('fr-FR')} {order.currency}
                    </span>
                  </div>
                </div>

                {/* Middle info */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  {/* Customer column */}
                  <div className="md:col-span-5 space-y-1.5 bg-stone-950/70 p-3 rounded-lg border border-stone-800/80">
                    <div className="font-semibold text-stone-200 text-sm">
                      {order.customer.name}
                    </div>
                    <div className="text-stone-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span className="font-mono">{order.customer.phone}</span>
                    </div>
                    <div className="text-stone-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span>{order.customer.city} • {order.customer.address}</span>
                    </div>
                    {order.customer.notes && (
                      <div className="text-amber-300/80 text-[11px] italic pt-1 border-t border-stone-900">
                        Note: "{order.customer.notes}"
                      </div>
                    )}
                  </div>

                  {/* Items preview */}
                  <div className="md:col-span-7 space-y-2">
                    <span className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold block">
                      Articles commandés ({order.items.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 p-2 bg-stone-950 rounded-lg border border-stone-800"
                        >
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=100'}
                            alt={item.name}
                            className="w-10 h-10 rounded-md object-cover border border-stone-800 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h5 className="font-medium text-stone-200 truncate text-[11px]">{item.name}</h5>
                            <div className="text-[10px] text-stone-400 font-mono">
                              {item.quantity}x {item.price.toLocaleString('fr-FR')} {order.currency}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Controls: Status Select + WhatsApp Quick Messages */}
                <div className="pt-3 border-t border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Status picker */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-400">Statut :</span>
                      <select
                        id={`order-status-select-${order.id}`}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-stone-100 font-medium focus:border-[#D4AF37] focus:outline-none"
                      >
                        <option value="pending">🟡 En attente</option>
                        <option value="confirmed">🔵 Confirmée</option>
                        <option value="preparing">🟣 En préparation</option>
                        <option value="shipped">🚚 Expédiée</option>
                        <option value="delivered">🟢 Livrée</option>
                        <option value="cancelled">🔴 Annulée</option>
                      </select>
                    </div>

                    {/* Payment picker */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-400">Règlement :</span>
                      <select
                        value={order.paymentStatus}
                        onChange={(e) =>
                          onUpdatePaymentStatus(order.id, e.target.value as PaymentStatus)
                        }
                        className="bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-stone-100 focus:border-[#D4AF37] focus:outline-none"
                      >
                        <option value="pending">En attente (WhatsApp)</option>
                        <option value="paid">Payé / Réglé</option>
                        <option value="refunded">Remboursé</option>
                        <option value="failed">Échoué</option>
                        <option value="not_required">Non requis</option>
                      </select>
                    </div>
                  </div>

                  {/* WhatsApp Quick Templates Buttons & View Detail */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* WhatsApp Fast link */}
                    <a
                      href={generateWhatsAppUrl(order, 'default')}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
                      title="Contacter sur WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-current" />
                      <span>WhatsApp Direct</span>
                    </a>

                    {/* Fast Template: Confirmation */}
                    <a
                      href={generateWhatsAppUrl(order, 'confirm')}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 text-[11px] text-stone-300 hover:text-white rounded-lg flex items-center gap-1"
                      title="Envoyer confirmation WhatsApp"
                    >
                      <Send className="w-3 h-3 text-[#D4AF37]" />
                      <span>Confirmer</span>
                    </a>

                    {/* Fast Template: Shipped */}
                    <a
                      href={generateWhatsAppUrl(order, 'shipped')}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 text-[11px] text-stone-300 hover:text-white rounded-lg flex items-center gap-1"
                      title="Envoyer avis d'expédition WhatsApp"
                    >
                      <Truck className="w-3 h-3 text-sky-400" />
                      <span>Expédié</span>
                    </a>

                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors border border-stone-800"
                      title="Voir détails complets"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Full Detail Modal */}
      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Détail de la commande #${selectedOrder.orderNumber}` : ''}
        maxWidth="2xl"
      >
        {selectedOrder && (
          <div className="space-y-4 text-stone-100 text-xs">
            {/* Header info */}
            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex justify-between items-center">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase">Client</span>
                <span className="font-semibold text-sm">{selectedOrder.customer.name}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block text-[10px] uppercase">Date d'enregistrement</span>
                <span>{new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</span>
              </div>
            </div>

            {/* Coordinates */}
            <div className="space-y-1.5 p-3 bg-stone-950 rounded-xl border border-stone-800">
              <div className="text-stone-300 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                <strong className="text-stone-400">Téléphone :</strong> {selectedOrder.customer.phone}
              </div>
              {selectedOrder.customer.email && (
                <div className="text-stone-300 flex items-center gap-2">
                  <strong className="text-stone-400">Email :</strong> {selectedOrder.customer.email}
                </div>
              )}
              <div className="text-stone-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                <strong className="text-stone-400">Adresse de livraison :</strong> {selectedOrder.customer.address}, {selectedOrder.customer.city}
              </div>
              {selectedOrder.customer.notes && (
                <div className="text-amber-300 mt-2 pt-2 border-t border-stone-900">
                  <strong className="text-stone-400">Notes du client :</strong> "{selectedOrder.customer.notes}"
                </div>
              )}
            </div>

            {/* Items breakdown with HISTORICAL PRICES */}
            <div className="space-y-2">
              <span className="font-semibold text-stone-300 block">Détail des pièces commandées (prix historiques)</span>
              <div className="divide-y divide-stone-800 border border-stone-800 rounded-xl overflow-hidden bg-stone-950">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-md object-cover border border-stone-800"
                      />
                      <div>
                        <div className="font-medium text-stone-100">{item.name}</div>
                        <div className="text-stone-400 text-[11px] font-mono">
                          Quantité : {item.quantity} x {item.price.toLocaleString('fr-FR')} {selectedOrder.currency}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-semibold">
                      {item.subtotal.toLocaleString('fr-FR')} {selectedOrder.currency}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Recap */}
            <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 space-y-1.5">
              <div className="flex justify-between text-stone-400">
                <span>Sous-total articles</span>
                <span className="font-mono">{selectedOrder.subtotal.toLocaleString('fr-FR')} {selectedOrder.currency}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Frais de livraison</span>
                <span className="font-mono">
                  {selectedOrder.shippingFee === 0 ? 'Gratuit' : `${selectedOrder.shippingFee.toLocaleString('fr-FR')} ${selectedOrder.currency}`}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stone-800 text-sm font-serif font-bold">
                <span className="text-stone-100">Total Commande</span>
                <span className="text-[#D4AF37] text-lg font-mono">
                  {selectedOrder.total.toLocaleString('fr-FR')} {selectedOrder.currency}
                </span>
              </div>
            </div>

            {/* Quick WhatsApp contact links from modal */}
            <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-2">
              <span className="text-[11px] font-semibold text-emerald-300 block">
                Modèles de messages WhatsApp automatiques :
              </span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={generateWhatsAppUrl(selectedOrder, 'confirm')}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-stone-950 hover:bg-emerald-900/40 border border-stone-800 rounded text-[11px] text-stone-300 text-center transition-colors"
                >
                  📨 Confirmation Commande
                </a>
                <a
                  href={generateWhatsAppUrl(selectedOrder, 'preparing')}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-stone-950 hover:bg-emerald-900/40 border border-stone-800 rounded text-[11px] text-stone-300 text-center transition-colors"
                >
                  ⚙️ En Préparation Atelier
                </a>
                <a
                  href={generateWhatsAppUrl(selectedOrder, 'shipped')}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-stone-950 hover:bg-emerald-900/40 border border-stone-800 rounded text-[11px] text-stone-300 text-center transition-colors"
                >
                  🚚 Avis d'Expédition
                </a>
                <a
                  href={generateWhatsAppUrl(selectedOrder, 'delivered')}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-stone-950 hover:bg-emerald-900/40 border border-stone-800 rounded text-[11px] text-stone-300 text-center transition-colors"
                >
                  🟢 Remerciement & Livraison
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Order Confirmation Modal */}
      <Modal
        isOpen={Boolean(cancellingOrderId)}
        onClose={() => setCancellingOrderId(null)}
        title="Confirmation d'annulation"
        maxWidth="sm"
      >
        <div className="space-y-4 text-stone-200 text-xs">
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-rose-200">Annuler cette commande ?</h4>
              <p className="text-rose-300/80 mt-1">
                Le statut de la commande sera marqué comme "Annulée" et celle-ci ne sera plus comptabilisée dans le chiffre d'affaires.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancellingOrderId(null)}
            >
              Conserver la commande
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmCancelOrder}
            >
              Confirmer l'annulation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
