import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Calendar,
  Eye,
  MessageSquare,
  DollarSign,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserProfile, Order, StoreSettings } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface AdminCustomersProps {
  customers: UserProfile[];
  orders: Order[];
  settings?: StoreSettings;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({
  customers,
  orders,
  settings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);

  // Compute metrics per customer (order count & total spent)
  const customersWithStats = useMemo(() => {
    // Also include unique customers extracted from orders if not yet in auth users
    const userMap = new Map<string, UserProfile>();

    customers.forEach((c) => {
      userMap.set(c.uid || c.email, { ...c });
    });

    orders.forEach((o) => {
      const key = o.customerId || o.customer.email || o.customer.phone;
      if (!userMap.has(key)) {
        userMap.set(key, {
          uid: o.customerId || `guest_${o.customer.phone}`,
          fullName: o.customer.name,
          email: o.customer.email || 'N/A',
          phone: o.customer.phone,
          city: o.customer.city,
          address: o.customer.address,
          role: 'customer',
          createdAt: o.createdAt,
          updatedAt: o.updatedAt
        });
      }
    });

    const list = Array.from(userMap.values());

    return list.map((cust) => {
      const customerOrders = orders.filter(
        (o) =>
          (o.customerId && o.customerId === cust.uid) ||
          (cust.email && o.customer.email === cust.email) ||
          (cust.phone && o.customer.phone.replace(/[^0-9]/g, '') === cust.phone.replace(/[^0-9]/g, ''))
      );

      const nonCancelled = customerOrders.filter((o) => o.status !== 'cancelled');
      const totalSpent = nonCancelled.reduce((sum, o) => sum + o.total, 0);

      return {
        ...cust,
        ordersCount: customerOrders.length,
        totalSpent,
        customerOrders
      };
    });
  }, [customers, orders]);

  const filteredCustomers = customersWithStats.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.city && c.city.toLowerCase().includes(term))
    );
  });

  const selectedCustomerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter(
      (o) =>
        (o.customerId && o.customerId === selectedCustomer.uid) ||
        (selectedCustomer.email && o.customer.email === selectedCustomer.email) ||
        (selectedCustomer.phone && o.customer.phone.replace(/[^0-9]/g, '') === selectedCustomer.phone.replace(/[^0-9]/g, ''))
    );
  }, [selectedCustomer, orders]);

  const storeName = settings?.storeName || "Maison Horlogère Prestige";
  const currency = settings?.currency || "€";

  return (
    <div className="space-y-6 text-[var(--text)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--text)] flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--or)]" />
            <span>Répertoire Clients & Comptes ({customersWithStats.length})</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-soft)] mt-1">
            Consultez les fiches de vos clients, l'historique de leurs achats et communiquez directement sur WhatsApp.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[var(--carte-bg)] p-4 rounded-2xl border border-[var(--sep)] shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
          <input
            type="text"
            id="admin-customer-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone ou ville..."
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[var(--carte-bg)] border border-[var(--sep)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-2)] text-[var(--text-muted)] border-b border-[var(--sep)] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Client</th>
                <th className="px-5 py-3.5">Contact WhatsApp</th>
                <th className="px-5 py-3.5">Ville & Adresse</th>
                <th className="px-5 py-3.5 text-center">Commandes</th>
                <th className="px-5 py-3.5 text-right">Total Dépensé</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sep)]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[var(--text-muted)]">
                    Aucun client trouvé pour cette recherche.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const rawPhone = cust.phone.replace(/[^0-9]/g, '');
                  return (
                    <tr key={cust.uid} className="hover:bg-[var(--bg-2)]/50 transition-colors">
                      <td className="px-5 py-4 font-medium text-[var(--text)]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--or)]/15 text-[var(--or)] border border-[var(--or)]/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {cust.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-medium">{cust.fullName}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">{cust.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-[var(--text-soft)]">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{cust.phone || 'Non renseigné'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-[var(--text-soft)]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                          <span>{cust.city || 'Non renseigné'}</span>
                        </div>
                        {cust.address && (
                          <span className="text-[10px] text-[var(--text-muted)] block truncate max-w-xs">{cust.address}</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <Badge variant={cust.ordersCount > 0 ? 'gold' : 'secondary'}>
                          {cust.ordersCount} commande{cust.ordersCount > 1 ? 's' : ''}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-right font-serif font-bold text-[var(--or)]">
                        {cust.totalSpent.toLocaleString('fr-FR')} {settings?.currency || '€'}
                      </td>

                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="p-1.5 bg-[var(--bg-2)] hover:bg-[var(--badge-bg)] text-[var(--text-soft)] hover:text-[var(--text)] rounded-xl border border-[var(--sep)] transition-colors inline-flex items-center gap-1 text-[11px]"
                          title="Voir la fiche client"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Détails</span>
                        </button>

                        {rawPhone && (
                          <a
                            href={`https://wa.me/${rawPhone}?text=${encodeURIComponent(
                              `Bonjour ${cust.fullName}, c'est ${storeName}. Nous espérons que vous vous portez bien !`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl transition-colors inline-flex items-center gap-1 text-[11px]"
                            title="Contacter sur WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-current" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          title={`Fiche Client • ${selectedCustomer.fullName}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-[var(--text)]">
            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--carte-bg-subtle)] p-4 rounded-xl border border-[var(--sep)]">
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Email</span>
                <p className="text-xs text-[var(--text)] font-medium">{selectedCustomer.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">WhatsApp</span>
                <p className="text-xs text-[var(--text)] font-medium">{selectedCustomer.phone || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Ville</span>
                <p className="text-xs text-[var(--text)] font-medium">{selectedCustomer.city || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Adresse de livraison</span>
                <p className="text-xs text-[var(--text)] font-medium">{selectedCustomer.address || 'N/A'}</p>
              </div>
            </div>

            {/* Historical Orders */}
            <div className="space-y-3">
              <h4 className="font-serif text-sm font-semibold text-[var(--or)] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>Commandes associées ({selectedCustomerOrders.length})</span>
              </h4>

              {selectedCustomerOrders.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">Aucune commande enregistrée pour ce compte.</p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {selectedCustomerOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-[var(--carte-bg-subtle)] p-3 rounded-xl border border-[var(--sep)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[var(--text)]">#{ord.orderNumber}</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">
                          {new Date(ord.createdAt).toLocaleDateString('fr-FR')} • {ord.items.length} article(s)
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={ord.status === 'delivered' ? 'success' : ord.status === 'cancelled' ? 'danger' : 'warning'}>
                          {ord.status}
                        </Badge>
                        <span className="font-serif font-bold text-[var(--or)]">
                          {ord.total.toLocaleString('fr-FR')} {ord.currency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedCustomer(null)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
