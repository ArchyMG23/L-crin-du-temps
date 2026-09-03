import React, { useState } from 'react';
import {
  LayoutDashboard,
  Watch,
  Layers,
  Boxes,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WatchEmblem } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';

interface AdminLayoutProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
  pendingOrdersCount?: number;
  lowStockCount?: number;
  onGlobalSearch?: (term: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onSelectTab,
  onExitAdmin,
  children,
  pendingOrdersCount = 0,
  lowStockCount = 0
}) => {
  const { user, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'products',
      label: 'Gestion des Montres',
      icon: Watch,
      badge: null
    },
    {
      id: 'stock',
      label: 'Contrôle des Stocks',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} alerte${lowStockCount > 1 ? 's' : ''}` : null,
      badgeVariant: 'warning'
    },
    {
      id: 'categories',
      label: 'Collections & Catégories',
      icon: Layers,
      badge: null
    },
    {
      id: 'orders',
      label: 'Commandes WhatsApp',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} nouv.` : null,
      badgeVariant: 'gold'
    },
    {
      id: 'customers',
      label: 'Répertoire Clients',
      icon: Users,
      badge: null
    },
    {
      id: 'settings',
      label: 'Paramètres Boutique',
      icon: Settings,
      badge: null
    }
  ];

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    setMobileDrawerOpen(false);
  };

  const currentTabLabel = menuItems.find(m => m.id === activeTab)?.label || 'Administration';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col md:flex-row font-sans selection:bg-[var(--or)] selection:text-black relative z-10 isolate transition-colors duration-300">
      {/* Mobile Top App Bar */}
      <header className="md:hidden bg-[var(--carte-bg)] border-b border-[var(--sep)] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            id="admin-mobile-drawer-toggle"
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="p-2.5 text-[var(--text)] hover:text-[var(--or)] rounded-xl bg-[var(--bg-2)] active:bg-[var(--badge-bg)] border border-[var(--sep)] shadow-sm"
            aria-label="Menu d'administration"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5 text-[var(--or)]" /> : <Menu className="w-5 h-5 text-[var(--or)]" />}
          </button>
          <div className="flex items-center gap-2">
            <WatchEmblem size={24} theme="dark" />
            <div className="flex flex-col">
              <span className="font-serif text-xs font-bold uppercase tracking-wider text-[var(--or)]">
                L'Écrin du Temps
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                {currentTabLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle id="admin-mobile-theme-toggle" className="w-9 h-9" />
          <button
            onClick={onExitAdmin}
            className="text-xs font-semibold text-[var(--text)] hover:text-[var(--or)] flex items-center gap-1.5 bg-[var(--bg-2)] hover:bg-[var(--badge-bg)] px-3 py-2 rounded-xl border border-[var(--sep)] shadow-sm active:scale-95 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[var(--or)]" />
            <span>Boutique</span>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar / Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static top-0 left-0 bottom-0 z-50 w-72 md:w-64 bg-[var(--carte-bg)] border-r border-[var(--sep)] shrink-0 flex flex-col justify-between transition-transform duration-300 shadow-xl ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Admin Header / Brand */}
          <div className="p-5 sm:p-6 border-b border-[var(--sep)] flex items-center justify-between bg-[var(--bg-2)]">
            <div className="flex items-center gap-3">
              <WatchEmblem size={34} theme="dark" />
              <div>
                <h1 className="font-serif text-sm font-bold uppercase tracking-[0.12em] text-[var(--text)]">
                  L'Écrin du Temps
                </h1>
                <span className="text-[10px] text-[var(--or)] font-bold block uppercase tracking-wider">
                  Console Propriétaire
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="md:hidden p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg bg-[var(--carte-bg)]"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3.5 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[var(--badge-bg)] text-[var(--or)] font-bold border border-[var(--badge-border)] shadow-sm'
                      : 'text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-[var(--bg-2)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--or)]' : 'text-[var(--text-muted)]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.badgeVariant === 'gold'
                          ? 'bg-[var(--or)] text-black font-bold'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Actions */}
        <div className="p-4 border-t border-[var(--sep)] space-y-2 bg-[var(--bg-2)]">
          <div className="px-3 py-2 bg-[var(--carte-bg)] rounded-xl border border-[var(--sep)] flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="text-[10px] text-[var(--text-muted)] block font-medium">Connecté en tant que</span>
              <span className="font-bold text-[var(--text)] truncate block text-[11px]">
                {user?.email || 'Administrateur'}
              </span>
            </div>
            <ShieldCheck className="w-4 h-4 text-[var(--or)] shrink-0" />
          </div>

          <button
            id="admin-view-store-btn"
            onClick={onExitAdmin}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[var(--text)] hover:text-[var(--or)] bg-[var(--carte-bg)] hover:bg-[var(--badge-bg)] border border-[var(--sep)] transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[var(--or)]" />
              <span>Voir la boutique publique</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>

          <button
            id="admin-logout-btn"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion sécurisée</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg)] overflow-y-auto">
        {/* Top Header bar for desktop */}
        <header className="hidden md:flex h-16 px-6 border-b border-[var(--sep)] bg-[var(--carte-bg)] items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--or)] font-serif font-bold">
              Administration • {currentTabLabel}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle id="admin-desktop-theme-toggle" className="w-9 h-9 shadow-sm" />
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--text)] bg-[var(--bg-2)] px-3.5 py-1.5 rounded-full border border-[var(--sep)] font-sans shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Session active ({user?.email || 'Gérante'})</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};
