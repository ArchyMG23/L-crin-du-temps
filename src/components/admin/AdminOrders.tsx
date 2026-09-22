import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Package,
  ChevronRight,
  ExternalLink,
  Check,
  X
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, StoreSettings } from '../../types';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatPrice } from '../../utils/format';
import { normalizeWhatsAppNumber } from '../../utils/whatsapp';

interface AdminOrdersProps {
  orders: Order[];
  settings?: StoreSettings;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onUpdatePaymentStatus: (orderId: string, paymentStatus: PaymentStatus) => Promise<void>;
}

type CanonicalStatus = 'En attente' | 'En cours' | 'Payée' | 'Livrée';

interface StatusDefinition {
  label: CanonicalStatus;
  stepIndex: number;
  badgeClass: string;
  dotColor: string;
  description: string;
  nextStatus?: CanonicalStatus;
  nextActionText?: string;
}

const STATUS_CONFIG: Record<CanonicalStatus, StatusDefinition> = {
  'En attente': {
    label: 'En attente',
    stepIndex: 1,
    badgeClass: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
    dotColor: 'bg-amber-500',
    description: 'Commande enregistrée via WhatsApp, en attente de prise en charge par l\'équipe.',
    nextStatus: 'En cours',
    nextActionText: 'Prendre en charge (En cours)'
  },
  'En cours': {
    label: 'En cours',
    stepIndex: 2,
    badgeClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    dotColor: 'bg-blue-400',
    description: 'Commande prise en charge / confirmée par l\'admin, en préparation ou en attente de paiement.',
    nextStatus: 'Payée',
    nextActionText: 'Valider le paiement (Payée)'
  },
  'Payée': {
    label: 'Payée',
    stepIndex: 3,
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    description: 'Paiement reçu et validé par l\'administrateur.',
    nextStatus: 'Livrée',
    nextActionText: 'Confirmer la livraison (Livrée)'
  },
  'Livrée': {
    label: 'Livrée',
    stepIndex: 4,
    badgeClass: 'bg-amber-400/20 text-[var(--or)] border border-[var(--or)]/40',
    dotColor: 'bg-[var(--or)]',
    description: 'Garde-temps livré en main propre au client sous écrin de luxe.'
  }
};

export function getCanonicalStatus(rawStatus?: string): CanonicalStatus {
  if (!rawStatus) return 'En attente';
  const s = rawStatus.toLowerCase().trim();
  if (s === 'en attente' || s === 'pending') return 'En attente';
  if (s === 'en cours' || s === 'confirmed' || s === 'processing' || s === 'preparing' || s === 'shipped') return 'En cours';
  if (s === 'payée' || s === 'payee' || s === 'paid') return 'Payée';
  if (s === 'livrée' || s === 'livree' || s === 'delivered' || s === 'terminée' || s === 'terminee') return 'Livrée';
  return 'En attente';
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  settings,
  onUpdateStatus,
  onUpdatePaymentStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CanonicalStatus | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status transition confirmation state
  const [statusConfirmation, setStatusConfirmation] = useState<{
    order: Order;
    targetStatus: OrderStatus;
    actionLabel: string;
  } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const storeName = settings?.storeName || settings?.name || "L'Écrin du Temps";

  // Counts by status
  const countPending = orders.filter((o) => getCanonicalStatus(o.status) === 'En attente').length;
  const countInProgress = orders.filter((o) => getCanonicalStatus(o.status) === 'En cours').length;
  const countPaid = orders.filter((o) => getCanonicalStatus(o.status) === 'Payée').length;
  const countDelivered = orders.filter((o) => getCanonicalStatus(o.status) === 'Livrée').length;

  // Filtered orders
  const filteredOrders = orders
    .filter((order) => {
      const canonical = getCanonicalStatus(order.status);
      const isCancelled = order.status === 'cancelled';

      if (statusFilter === 'all') return true;
      if (statusFilter === 'cancelled') return isCancelled;
      return canonical === statusFilter;
    })
    .filter((order) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const numMatch = (order.orderNumber || '').toLowerCase().includes(term);
      const nameMatch = (order.customer?.name || order.customerName || '').toLowerCase().includes(term);
      const phoneMatch = (order.customer?.phone || order.customerPhone || '').includes(term);
      const cityMatch = (order.customer?.city || '').toLowerCase().includes(term);
      const modelMatch = (order.items || []).some((it) => (it.name || '').toLowerCase().includes(term));
      return numMatch || nameMatch || phoneMatch || cityMatch || modelMatch;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Trigger confirmation modal for any status change
  const promptStatusChange = (order: Order, targetStatus: OrderStatus, actionLabel?: string) => {
    setStatusConfirmation({
      order,
      targetStatus,
      actionLabel: actionLabel || `Passer au statut "${targetStatus}"`
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusConfirmation) return;
    try {
      setIsUpdatingStatus(true);
      await onUpdateStatus(statusConfirmation.order.id, statusConfirmation.targetStatus);

      // Auto update payment if target is Payée
      if (statusConfirmation.targetStatus === 'Payée' && statusConfirmation.order.paymentStatus !== 'paid') {
        await onUpdatePaymentStatus(statusConfirmation.order.id, 'paid');
      }

      // If the modal was viewing this order, update local selected view
      if (selectedOrder && selectedOrder.id === statusConfirmation.order.id) {
        setSelectedOrder({
          ...selectedOrder,
          status: statusConfirmation.targetStatus,
          orderStatus: statusConfirmation.targetStatus
        });
      }
      setStatusConfirmation(null);
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Build WhatsApp follow up URL
  const buildWhatsAppFollowUp = (order: Order) => {
    const rawPhone = normalizeWhatsAppNumber(order.customer?.phone || order.customerPhone || '');
    const canonical = getCanonicalStatus(order.status);
    const config = STATUS_CONFIG[canonical];
    const customerName = order.customer?.name || order.customerName || 'Client';

    const msg = [
      `Bonjour ${customerName},`,
      ``,
      `C'est la Maison *${storeName}* au sujet de votre commande *#${order.orderNumber || order.id.slice(0, 8)}* (${formatPrice(order.total)}).`,
      ``,
      `📌 *Statut actuel :* ${config.label} (${config.description})`,
      ``,
      `Nous sommes à votre entière disposition pour toute précision.`
    ].join('\n');

    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--or)] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Gestion Commerciale & Commandes</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--text)] tracking-wide mt-0.5">
            Commandes ({orders.length})
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-soft)] mt-1">
            Suivi en temps réel des commandes clients, validation des étapes (En attente → En cours → Payée → Livrée) et contact WhatsApp.
          </p>
        </div>
      </div>

      {/* Filter Tabs by Status */}
      <div className="bg-[var(--carte-bg)] p-3 sm:p-4 rounded-2xl border border-[var(--sep)] shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[var(--sep)]">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-[var(--or)] text-black shadow-xs font-bold'
                : 'bg-[var(--input-bg)] text-[var(--text-soft)] hover:text-[var(--text)] border border-[var(--sep)]'
            }`}
          >
            Toutes ({orders.length})
          </button>

          <button
            onClick={() => setStatusFilter('En attente')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === 'En attente'
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>En attente ({countPending})</span>
          </button>

          <button
            onClick={() => setStatusFilter('En cours')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === 'En cours'
                ? 'bg-blue-500 text-white font-bold shadow-xs'
                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
            }`}
          >
            <Package className="w-3 h-3" />
            <span>En cours ({countInProgress})</span>
          </button>

          <button
            onClick={() => setStatusFilter('Payée')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === 'Payée'
                ? 'bg-emerald-500 text-white font-bold shadow-xs'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            <CreditCard className="w-3 h-3" />
            <span>Payée ({countPaid})</span>
          </button>

          <button
            onClick={() => setStatusFilter('Livrée')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === 'Livrée'
                ? 'bg-[var(--or)] text-black font-bold shadow-xs'
                : 'bg-[var(--badge-bg)] text-[var(--or)] hover:bg-[var(--badge-bg)]/80 border border-[var(--badge-border)]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Livrée ({countDelivered})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
          <input
            type="text"
            id="admin-order-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par n° de commande, client, ville, téléphone, montre..."
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[var(--carte-bg)] border border-[var(--sep)] rounded-2xl p-12 text-center text-xs text-[var(--text-muted)] space-y-3 shadow-sm">
          <ShoppingBag className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-40" />
          <p className="text-[var(--text)] font-semibold text-sm">Aucune commande trouvée pour ces filtres.</p>
          <p className="text-xs text-[var(--text-soft)]">Essayez de modifier votre recherche ou sélectionnez un autre statut.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const canonical = getCanonicalStatus(order.status);
            const statusDef = STATUS_CONFIG[canonical];
            const isCancelled = order.status === 'cancelled';
            const nextStatus = statusDef.nextStatus;

            return (
              <div
                key={order.id}
                className="bg-[var(--carte-bg)] rounded-2xl border border-[var(--sep)] p-5 sm:p-6 space-y-4 hover:border-[var(--or)]/40 transition-all shadow-sm"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[var(--sep)] gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm sm:text-base font-bold text-[var(--or)]">
                      #{order.orderNumber || order.id.slice(0, 8)}
                    </span>

                    {/* Status Badge */}
                    {isCancelled ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        Annulée
                      </span>
                    ) : (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusDef.badgeClass}`}>
                        {statusDef.label}
                      </span>
                    )}

                    <span className="text-xs text-[var(--text-soft)] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
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
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">Prix Total</span>
                      <span className="font-serif text-base sm:text-lg font-bold text-[var(--or)] font-mono">
                        {formatPrice(order.total)}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1.5 bg-[var(--badge-bg)] hover:bg-[var(--badge-bg)]/80 border border-[var(--sep)] text-xs text-[var(--text)] rounded-xl flex items-center gap-1.5 transition-colors"
                      title="Voir tous les détails"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Détails</span>
                    </button>
                  </div>
                </div>

                {/* Stepper visual lifecycle */}
                {!isCancelled && (
                  <div className="bg-[var(--bg)]/70 p-3 rounded-xl border border-[var(--sep)]">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      {(['En attente', 'En cours', 'Payée', 'Livrée'] as CanonicalStatus[]).map((step, idx) => {
                        const stepConfig = STATUS_CONFIG[step];
                        const isCurrent = canonical === step;
                        const isCompleted = statusDef.stepIndex > stepConfig.stepIndex;

                        return (
                          <div key={step} className="flex-1 flex flex-col items-center text-center relative">
                            {/* Line connector */}
                            {idx > 0 && (
                              <div
                                className={`absolute top-3 right-1/2 w-full h-0.5 -z-0 transition-colors ${
                                  statusDef.stepIndex >= stepConfig.stepIndex
                                    ? 'bg-[var(--or)]'
                                    : 'bg-[var(--sep)]'
                                }`}
                              />
                            )}

                            {/* Step circle */}
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-all ${
                                isCompleted
                                  ? 'bg-[var(--or)] text-black'
                                  : isCurrent
                                  ? `${stepConfig.badgeClass} ring-2 ring-[var(--or)]`
                                  : 'bg-[var(--carte-bg)] text-[var(--text-muted)] border border-[var(--sep)]'
                              }`}
                            >
                              {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                            </div>

                            <span
                              className={`mt-1 text-[10px] sm:text-[11px] truncate max-w-[70px] sm:max-w-none ${
                                isCurrent
                                  ? 'text-[var(--or)] font-bold'
                                  : isCompleted
                                  ? 'text-[var(--text)] font-medium'
                                  : 'text-[var(--text-muted)]'
                              }`}
                            >
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Order Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  {/* Customer Information */}
                  <div className="md:col-span-5 space-y-2 bg-[var(--carte-bg-subtle)] p-3.5 rounded-xl border border-[var(--sep)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                        Client
                      </span>
                      {order.clientId && (
                        <span className="text-[9px] px-2 py-0.5 bg-[var(--badge-bg)] text-[var(--or)] rounded-full font-mono">
                          Compte client lié
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-[var(--text)] text-sm">
                      {order.customer?.name || order.customerName || 'Client'}
                    </div>

                    <div className="text-[var(--text-soft)] flex items-center justify-between gap-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[var(--or)] shrink-0" />
                        <span className="font-mono">{order.customer?.phone || order.customerPhone}</span>
                      </div>
                      <a
                        href={`https://wa.me/${normalizeWhatsAppNumber(order.customer?.phone || order.customerPhone || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat WhatsApp</span>
                      </a>
                    </div>

                    <div className="text-[var(--text-soft)] flex items-start gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[var(--or)] shrink-0 mt-0.5" />
                      <span>
                        {order.customer?.city ? `${order.customer.city} • ` : ''}
                        {order.customer?.address || 'Adresse non précisée'}
                      </span>
                    </div>

                    {order.customer?.notes && (
                      <div className="text-[var(--or)] text-[11px] italic pt-1.5 border-t border-[var(--sep)]">
                        Note client : "{order.customer.notes}"
                      </div>
                    )}
                  </div>

                  {/* Watches Ordered Showcase */}
                  <div className="md:col-span-7 space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                      Garde-temps commandés ({order.items.length} modèle{order.items.length > 1 ? 's' : ''})
                    </span>

                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 p-2.5 bg-[var(--carte-bg-subtle)] rounded-xl border border-[var(--sep)]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-lg object-cover border border-[var(--sep)] shrink-0 bg-[var(--bg)]"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-[var(--badge-bg)] border border-[var(--sep)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <h5 className="font-bold text-[var(--text)] truncate text-xs">{item.name}</h5>
                              {item.brand && (
                                <p className="text-[10px] text-[var(--or)] font-medium truncate">{item.brand}</p>
                              )}
                              <p className="text-[10px] text-[var(--text-soft)] font-mono">
                                {item.quantity} × {formatPrice(item.unitPrice || item.price)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-[var(--text-muted)] block">Sous-total</span>
                            <span className="font-mono font-bold text-[var(--text)] text-xs">
                              {formatPrice(item.subtotal || ((item.unitPrice || item.price) * item.quantity))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar: Step Evolution & WhatsApp Contact */}
                <div className="pt-3 border-t border-[var(--sep)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Step Transition Button & Dropdown */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Primary Evolution Button (Step by Step) */}
                    {!isCancelled && nextStatus ? (
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() =>
                          promptStatusChange(
                            order,
                            nextStatus,
                            `Passer à l'étape suivante : "${nextStatus}"`
                          )
                        }
                        className="flex items-center gap-2 font-bold shadow-xs text-xs"
                      >
                        <span>Passer à : {nextStatus}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    ) : !isCancelled && canonical === 'Livrée' ? (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Commande finalisée avec succès</span>
                      </div>
                    ) : null}

                    {/* Quick Manual Dropdown (Triggers Confirmation) */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[var(--text-muted)]">Changer statut :</span>
                      <select
                        id={`order-status-select-${order.id}`}
                        value={canonical}
                        onChange={(e) => {
                          const target = e.target.value as OrderStatus;
                          if (target !== canonical) {
                            promptStatusChange(
                              order,
                              target,
                              `Modifier le statut vers "${target}"`
                            );
                          }
                        }}
                        className="bg-[var(--input-bg)] border border-[var(--sep)] rounded-xl px-2.5 py-1 text-xs text-[var(--text)] font-semibold focus:border-[var(--or)] focus:outline-none"
                      >
                        <option value="En attente">🟡 En attente</option>
                        <option value="En cours">🔵 En cours</option>
                        <option value="Payée">🟢 Payée</option>
                        <option value="Livrée">👑 Livrée</option>
                        <option value="cancelled">🔴 Annulée</option>
                      </select>
                    </div>
                  </div>

                  {/* WhatsApp Follow Up Direct Link */}
                  <a
                    href={buildWhatsAppFollowUp(order)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 dark:text-emerald-300 text-xs font-semibold rounded-xl transition-colors shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Notifier client sur WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Status Updates */}
      {statusConfirmation && (
        <Modal
          isOpen={Boolean(statusConfirmation)}
          onClose={() => setStatusConfirmation(null)}
          title="Confirmation du statut de commande"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-[var(--text)]">
            <div className="p-4 rounded-xl bg-[var(--badge-bg)] border border-[var(--badge-border)] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--or)] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-[var(--text)]">
                  Faire évoluer la commande #{statusConfirmation.order.orderNumber || statusConfirmation.order.id.slice(0, 8)}
                </h4>
                <p className="text-[var(--text-soft)] mt-1">
                  Voulez-vous modifier le statut de cette commande de{' '}
                  <strong className="text-[var(--text)]">
                    "{getCanonicalStatus(statusConfirmation.order.status)}"
                  </strong>{' '}
                  vers{' '}
                  <strong className="text-[var(--or)]">
                    "{statusConfirmation.targetStatus}"
                  </strong>{' '}
                  ?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[var(--bg)] rounded-xl border border-[var(--sep)] space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Client :</span>
                <span className="font-semibold text-[var(--text)]">
                  {statusConfirmation.order.customer?.name || statusConfirmation.order.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Montant total :</span>
                <span className="font-mono font-bold text-[var(--or)]">
                  {formatPrice(statusConfirmation.order.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Nouvel état :</span>
                <span className="font-bold text-[var(--text)]">
                  {statusConfirmation.targetStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusConfirmation(null)}
                disabled={isUpdatingStatus}
              >
                Annuler
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={handleConfirmStatusChange}
                disabled={isUpdatingStatus}
                className="font-bold"
              >
                {isUpdatingStatus ? 'Mise à jour en cours...' : 'Confirmer le changement'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Full Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Détails Commande #${selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs text-[var(--text)] py-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--sep)] gap-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">Date et heure</span>
                <span className="text-xs text-[var(--text)] font-semibold">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} à {new Date(selectedOrder.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">Statut</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[getCanonicalStatus(selectedOrder.status)].badgeClass}`}>
                  {getCanonicalStatus(selectedOrder.status)}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-xl bg-[var(--carte-bg-subtle)] border border-[var(--sep)] space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                Coordonnées du client
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[var(--text-muted)] block">Nom complet :</span>
                  <span className="font-semibold text-[var(--text)]">{selectedOrder.customer?.name}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">Téléphone WhatsApp :</span>
                  <span className="font-mono font-semibold text-[var(--text)]">{selectedOrder.customer?.phone}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">Ville :</span>
                  <span className="font-semibold text-[var(--text)]">{selectedOrder.customer?.city || 'Non renseignée'}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">Adresse de livraison :</span>
                  <span className="font-semibold text-[var(--text)]">{selectedOrder.customer?.address || 'Non renseignée'}</span>
                </div>
              </div>
              {selectedOrder.customer?.notes && (
                <div className="pt-2 border-t border-[var(--sep)] text-[11px] text-[var(--or)] italic">
                  Note : "{selectedOrder.customer.notes}"
                </div>
              )}
            </div>

            {/* Items */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                Montres commandées ({selectedOrder.items.length})
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--carte-bg-subtle)] border border-[var(--sep)] text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover border border-[var(--sep)] bg-[var(--bg)]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[var(--badge-bg)] border border-[var(--sep)] flex items-center justify-center text-[var(--text-muted)]">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[var(--text)]">{item.name}</p>
                        {item.brand && <p className="text-[10px] text-[var(--or)]">{item.brand}</p>}
                        <p className="text-[10px] text-[var(--text-soft)] font-mono">
                          Prix unitaire : {formatPrice(item.unitPrice || item.price)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-[var(--or)]">
                      {formatPrice(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Recap */}
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--sep)] space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-[var(--text-soft)]">
                <span>Sous-total articles :</span>
                <span>{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-soft)]">
                <span>Frais d'expédition :</span>
                <span>{selectedOrder.shipping > 0 ? formatPrice(selectedOrder.shipping) : 'Offerte'}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[var(--or)] pt-2 border-t border-[var(--sep)]">
                <span>TOTAL :</span>
                <span>{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <a
                href={buildWhatsAppFollowUp(selectedOrder)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-semibold rounded-xl text-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ouvrir WhatsApp client</span>
              </a>

              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
