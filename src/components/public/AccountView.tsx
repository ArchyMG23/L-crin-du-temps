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
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-[#111111] rounded-2xl border border-white/10 space-y-6">
        <div className="w-16 h-16 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#F5F5F0]">
          Espace Client Réservé
        </h2>
        <p className="text-xs text-white/60 leading-relaxed font-sans">
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
            className="text-xs text-white/50 hover:text-white transition-colors"
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

  const statusLabels: Record<OrderStatus, { label: string; variant: 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' }> = {
    pending: { label: 'En attente', variant: 'warning' },
    confirmed: { label: 'Confirmée', variant: 'gold' },
    preparing: { label: 'En préparation', variant: 'info' },
    shipped: { label: 'Expédiée', variant: 'secondary' },
    delivered: { label: 'Livrée', variant: 'success' },
    cancelled: { label: 'Annulée', variant: 'danger' }
  };

  const storeName = settings?.storeName || "Maison Horlogère Prestige";
  const whatsappNumber = settings?.whatsappNumber || "+33600000000";
  const cleanWhatsApp = whatsappNumber.replace(/[^0-9]/g, '');
  const currency = settings?.currency || "€";

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-[#F5F5F0]">
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] rounded-full flex items-center justify-center shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Compte Client Vérifié</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-0.5">
              Bonjour, {userProfile.fullName || 'Cher Client'}
            </h1>
            <p className="text-xs text-white/50">{userProfile.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('shop')}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold rounded-xl tracking-wider uppercase transition-colors"
          >
            Catalogue
          </button>
          <button
            onClick={() => logout()}
            className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-xs font-semibold rounded-xl tracking-wider uppercase flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-semibold uppercase tracking-[0.15em] flex items-center gap-2 relative transition-colors ${
            activeTab === 'orders'
              ? 'text-[#D4AF37]'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Mes Commandes ({orders.length})</span>
          {activeTab === 'orders' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs font-semibold uppercase tracking-[0.15em] flex items-center gap-2 relative transition-colors ${
            activeTab === 'profile'
              ? 'text-[#D4AF37]'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Mes Coordonnées & Livraison</span>
          {activeTab === 'profile' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37]" />
          )}
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {loadingOrders ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-white/50">Chargement de votre historique...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-14 bg-[#111111] rounded-2xl border border-white/10 space-y-4">
              <Package className="w-12 h-12 text-white/20 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-white">
                Aucune commande pour l'instant
              </h3>
              <p className="text-xs text-white/50 max-w-md mx-auto">
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
            <div className="space-y-4">
              {orders.map((order) => {
                const badgeInfo = statusLabels[order.status] || { label: order.status, variant: 'warning' };
                return (
                  <div
                    key={order.id}
                    className="bg-[#111111] p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4 hover:border-[#D4AF37]/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-serif text-base font-bold text-white">
                            #{order.orderNumber}
                          </span>
                          <Badge variant={badgeInfo.variant as any}>
                            {badgeInfo.label}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-white/40">
                          Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR')} à {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-white/40 block">Montant Total</span>
                        <span className="font-serif text-lg font-bold text-[#D4AF37]">
                          {order.total.toLocaleString('fr-FR')} {order.currency}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 object-cover rounded-lg border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center text-white/30 shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-white">{item.name}</p>
                              <p className="text-white/40">Quantité: {item.quantity} × {item.price.toLocaleString('fr-FR')} {order.currency}</p>
                            </div>
                          </div>
                          <span className="font-medium text-white/80 shrink-0">
                            {item.subtotal.toLocaleString('fr-FR')} {order.currency}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions & WhatsApp Support */}
                    <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-[11px] text-white/50 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Livraison vers : {order.customer.city}</span>
                      </div>

                      <a
                        href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
                          `Bonjour ${storeName} ! J'aimerais avoir des nouvelles concernant ma commande #${order.orderNumber}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
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
        <div className="bg-[#111111] p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-white">
              Vos Coordonnées Personnelles
            </h3>
            <p className="text-xs text-white/50 mt-1">
              Ces informations sont automatiquement préremplies lors de vos futures commandes.
            </p>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Vos coordonnées ont été mises à jour avec succès.</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-rose-950/80 border border-rose-700 text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/70 font-medium mb-1">
                  Nom Complet
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/70 font-medium mb-1">
                  Téléphone WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/70 font-medium mb-1">
                  Adresse Email (Compte)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white/50 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/70 font-medium mb-1">
                  Ville de Livraison
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/70 font-medium mb-1">
                Adresse Postale Complète
              </label>
              <div className="relative">
                <Home className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
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
