import React, { useState, useEffect } from 'react';
import {
  User,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Home,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  MessageSquare,
  LogOut,
  Save,
  ChevronRight,
  ShieldCheck,
  Package,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderStatus, StoreSettings, UserProfile } from '../../types';
import { getCustomerOrders } from '../../services/orderService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatPrice } from '../../utils/format';

interface AccountViewProps {
  settings?: StoreSettings;
  onNavigate: (view: string) => void;
  onOpenAuthModal?: () => void;
  onSelectProduct?: (product: any) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  settings,
  onNavigate,
  onOpenAuthModal,
  onSelectProduct
}) => {
  const { userProfile, updateCustomerProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Profile form state
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || '',
    phone: userProfile?.phone || '',
    email: userProfile?.email || '',
    city: userProfile?.city || '',
    address: userProfile?.address || ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        email: userProfile.email || '',
        city: userProfile.city || '',
        address: userProfile.address || ''
      });

      // Load isolated customer orders
      const fetchOrders = async () => {
        try {
          setLoadingOrders(true);
          const data = await getCustomerOrders(userProfile.uid);
          setOrders(data);
        } catch (err) {
          console.warn('Error fetching orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [userProfile]);

  if (!userProfile) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-[var(--carte-bg)] rounded-2xl border border-[var(--sep)] space-y-6">
        <div className="w-16 h-16 bg-[var(--badge-bg)] text-[var(--or)] border border-[var(--badge-border)] rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[var(--text)]">
          Espace Client Réservé
        </h2>
        <p className="text-xs text-[var(--text-soft)] leading-relaxed font-sans">
          Connectez-vous ou créez un compte client pour suivre vos commandes et gérer vos adresses de livraison.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            variant="gold"
            size="lg"
            onClick={() => onOpenAuthModal && onOpenAuthModal()}
            className="w-full"
          >
            Se connecter / S'inscrire
          </Button>
          <button
            onClick={() => onNavigate('home')}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Retourner à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    try {
      setSavingProfile(true);
      await updateCustomerProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        city: formData.city,
        address: formData.address
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setSaveError(err.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  interface CustomerStatusPresentation {
    label: string;
    badgeClass: string;
    stepIndex: number;
    description: string;
  }

  const getCustomerStatus = (rawStatus?: string): CustomerStatusPresentation => {
    const s = (rawStatus || '').toLowerCase().trim();
    if (s === 'en attente' || s === 'pending') {
      return {
        label: 'En attente',
        // Orange
        badgeClass: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
        stepIndex: 1,
        description: 'Commande enregistrée, en attente de prise en charge par notre conciergerie.'
      };
    }
    if (s === 'en cours' || s === 'confirmed' || s === 'processing' || s === 'preparing' || s === 'shipped') {
      return {
        label: 'En cours',
        // Bleu
        badgeClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
        stepIndex: 2,
        description: 'Commande confirmée et prise en charge, en cours de préparation minutieuse.'
      };
    }
    if (s === 'payée' || s === 'payee' || s === 'paid') {
      return {
        label: 'Payée',
        // Vert
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        stepIndex: 3,
        description: 'Règlement validé avec succès par la Maison.'
      };
    }
    if (s === 'livrée' || s === 'livree' || s === 'delivered' || s === 'terminée' || s === 'terminee') {
      return {
        label: 'Livrée',
        // Doré
        badgeClass: 'bg-amber-400/20 text-[var(--or)] border border-[var(--or)]/40',
        stepIndex: 4,
        description: 'Garde-temps livré et remis en main propre sous écrin de luxe.'
      };
    }
    return {
      label: rawStatus || 'En attente',
      badgeClass: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
      stepIndex: 1,
      description: 'Statut en cours de traitement.'
    };
  };

  const storeName = settings?.storeName || "Maison Horlogère Prestige";
  const whatsappNumber = settings?.whatsappNumber || "+33600000000";
  const cleanWhatsApp = whatsappNumber.replace(/[^0-9]/g, '');
  const currency = settings?.currency || "FCFA";

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-[var(--text)]">
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--carte-bg)] p-6 sm:p-8 rounded-2xl border border-[var(--sep)] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[var(--badge-bg)] border border-[var(--badge-border)] text-[var(--or)] rounded-full flex items-center justify-center shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--or)] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Compte Client Vérifié</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text)] mt-0.5">
              Bonjour, {userProfile.fullName || 'Cher Client'}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">{userProfile.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('shop')}
            className="px-4 py-2 bg-[var(--badge-bg)] hover:bg-[var(--badge-bg)]/80 border border-[var(--sep)] text-xs font-semibold rounded-xl tracking-wider uppercase text-[var(--text)] transition-colors"
          >
            Catalogue
          </button>
          <button
            onClick={() => logout()}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold rounded-xl tracking-wider uppercase flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--sep)] gap-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-semibold uppercase tracking-[0.15em] flex items-center gap-2 relative transition-colors ${
            activeTab === 'orders'
              ? 'text-[var(--or)]'
              : 'text-[var(--text-soft)] hover:text-[var(--text)]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Mes Commandes ({orders.length})</span>
          {activeTab === 'orders' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--or)]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs font-semibold uppercase tracking-[0.15em] flex items-center gap-2 relative transition-colors ${
            activeTab === 'profile'
              ? 'text-[var(--or)]'
              : 'text-[var(--text-soft)] hover:text-[var(--text)]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Mes Coordonnées & Livraison</span>
          {activeTab === 'profile' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--or)]" />
          )}
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {loadingOrders ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-8 h-8 border-2 border-[var(--or)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[var(--text-muted)]">Chargement de votre historique...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-14 bg-[var(--carte-bg)] rounded-2xl border border-[var(--sep)] space-y-4">
              <Package className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-50" />
              <h3 className="font-serif text-lg font-bold text-[var(--text)]">
                Aucune commande pour l'instant
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                Explorez notre catalogue de prestige et effectuez votre première réservation via notre conciergerie WhatsApp.
              </p>
              <Button
                variant="gold"
                size="md"
                onClick={() => onNavigate('shop')}
              >
                Découvrir la collection
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((order) => {
                const statusInfo = getCustomerStatus(order.status);
                const isCancelled = order.status === 'cancelled';

                return (
                  <div
                    key={order.id}
                    className="bg-[var(--carte-bg)] p-5 sm:p-6 rounded-2xl border border-[var(--sep)] space-y-4 hover:border-[var(--or)]/40 transition-colors shadow-sm"
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--sep)] pb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                          <span className="font-mono text-base font-bold text-[var(--or)]">
                            #{order.orderNumber || order.id.slice(0, 8)}
                          </span>

                          {/* Colored status badge: orange = En attente, bleu = En cours, vert = Payée, doré = Livrée */}
                          {isCancelled ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              Annulée
                            </span>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.badgeClass}`}>
                              {statusInfo.label}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                          Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} à {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">Prix Total</span>
                        <span className="font-serif text-lg font-bold text-[var(--or)] font-mono">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Stepper visual progress bar */}
                    {!isCancelled && (
                      <div className="bg-[var(--bg)]/70 p-3 sm:p-4 rounded-xl border border-[var(--sep)]">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          {(['En attente', 'En cours', 'Payée', 'Livrée'] as const).map((step, idx) => {
                            const stepIndex = idx + 1;
                            const isCurrent = statusInfo.label === step;
                            const isCompleted = statusInfo.stepIndex > stepIndex;

                            return (
                              <div key={step} className="flex-1 flex flex-col items-center text-center relative">
                                {idx > 0 && (
                                  <div
                                    className={`absolute top-3 right-1/2 w-full h-0.5 -z-0 transition-colors ${
                                      statusInfo.stepIndex >= stepIndex
                                        ? 'bg-[var(--or)]'
                                        : 'bg-[var(--sep)]'
                                    }`}
                                  />
                                )}

                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-all ${
                                    isCompleted
                                      ? 'bg-[var(--or)] text-black'
                                      : isCurrent
                                      ? `${statusInfo.badgeClass} ring-2 ring-[var(--or)]`
                                      : 'bg-[var(--carte-bg)] text-[var(--text-muted)] border border-[var(--sep)]'
                                  }`}
                                >
                                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 fill-current" /> : stepIndex}
                                </div>

                                <span
                                  className={`mt-1.5 text-[10px] sm:text-[11px] truncate max-w-[65px] sm:max-w-none ${
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
                        <p className="text-[11px] text-[var(--text-soft)] text-center mt-2.5 pt-2 border-t border-[var(--sep)]/50">
                          {statusInfo.description}
                        </p>
                      </div>
                    )}

                    {/* Order Items with Photos & Details */}
                    <div className="space-y-2.5 pt-1">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                        Garde-temps commandés ({order.items.length})
                      </span>

                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--carte-bg-subtle)] border border-[var(--sep)] text-xs"
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
                                <div className="w-12 h-12 bg-[var(--badge-bg)] rounded-lg border border-[var(--sep)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-[var(--text)] truncate">{item.name}</p>
                                {item.brand && (
                                  <p className="text-[10px] text-[var(--or)] font-medium truncate">{item.brand}</p>
                                )}
                                <p className="text-[10px] text-[var(--text-muted)] font-mono">
                                  {item.quantity} × {formatPrice(item.unitPrice || item.price)}
                                </p>
                              </div>
                            </div>

                            <span className="font-mono font-bold text-[var(--text)] shrink-0">
                              {formatPrice(item.subtotal || ((item.unitPrice || item.price) * item.quantity))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Destination & WhatsApp Follow-up */}
                    <div className="pt-3 border-t border-[var(--sep)] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 self-start sm:self-center">
                        <Truck className="w-3.5 h-3.5 text-[var(--or)] shrink-0" />
                        <span>
                          Livraison : {order.customer.city}
                          {order.customer.address ? ` (${order.customer.address})` : ''}
                        </span>
                      </div>

                      <a
                        href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
                          `Bonjour ${storeName} ! J'aimerais avoir des nouvelles concernant ma commande #${order.orderNumber || order.id.slice(0, 8)} (${formatPrice(order.total)}).`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                        <span>Suivre sur WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="bg-[var(--carte-bg)] p-6 sm:p-8 rounded-2xl border border-[var(--sep)] space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-[var(--text)]">
              Vos Coordonnées Personnelles
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Ces informations sont automatiquement préremplies lors de vos futures commandes.
            </p>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Vos coordonnées ont été mises à jour avec succès.</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                  Nom Complet
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-[var(--bg)] border border-[var(--sep)] focus:border-[var(--or)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                  Téléphone WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[var(--bg)] border border-[var(--sep)] focus:border-[var(--or)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                  Adresse Email (Compte)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full bg-[var(--badge-bg)] border border-[var(--sep)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--text-muted)] cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                  Ville de Livraison
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[var(--bg)] border border-[var(--sep)] focus:border-[var(--or)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                Adresse Postale Complète
              </label>
              <div className="relative">
                <Home className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--sep)] focus:border-[var(--or)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="gold"
                size="md"
                disabled={savingProfile}
                icon={Save}
              >
                {savingProfile ? 'Enregistrement...' : 'Enregistrer mes modifications'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
