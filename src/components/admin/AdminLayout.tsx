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
  Search,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WatchEmblem } from '../common/BrandLogo';

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
  lowStockCount = 0,
  onGlobalSearch
}) => {
  const { user, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (onGlobalSearch) {
      onGlobalSearch(val);
    }
  };

  const currentTabLabel = menuItems.find(m => m.id === activeTab)?.label || 'Administration';

  return (
    <div className="min-h-screen bg-[#0c0d12] text-zinc-100 flex flex-col md:flex-row font-sans selection:bg-[#D4AF37] selection:text-black relative z-10 isolate">
      {/* Mobile Top App Bar */}
      <header className="md:hidden bg-[#141620] border-b border-zinc-700/80 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            id="admin-mobile-drawer-toggle"
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="p-2.5 text-zinc-200 hover:text-white rounded-xl bg-zinc-800/80 active:bg-zinc-700 border border-zinc-600/80 shadow-sm"
            aria-label="Menu d'administration"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5 text-amber-400" />}
          </button>
          <div className="flex items-center gap-2">
            <WatchEmblem size={24} theme="dark" />
            <div className="flex flex-col">
              <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#E5C058]">
                L'Écrin du Temps
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">
                {currentTabLabel}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onExitAdmin}
          className="text-xs font-semibold text-zinc-200 hover:text-[#E5C058] flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl border border-zinc-600/80 shadow-sm active:scale-95 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          <span>Boutique</span>
        </button>
      </header>

      {/* Desktop Sidebar / Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static top-0 left-0 bottom-0 z-50 w-72 md:w-64 bg-[#141620] border-r border-zinc-700/80 shrink-0 flex flex-col justify-between transition-transform duration-300 shadow-xl ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Admin Header / Brand */}
          <div className="p-5 sm:p-6 border-b border-zinc-700/80 flex items-center justify-between bg-[#171924]">
            <div className="flex items-center gap-3">
              <WatchEmblem size={34} theme="dark" />
              <div>
                <h1 className="font-serif text-sm font-bold uppercase tracking-[0.12em] text-white">
                  L'Écrin du Temps
                </h1>
                <span className="text-[10px] text-[#E5C058] font-bold block uppercase tracking-wider">
                  Console Propriétaire
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800"
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
                      ? 'bg-[#D4AF37]/20 text-[#F3D375] font-bold border border-[#D4AF37]/50 shadow-md'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F3D375]' : 'text-zinc-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.badgeVariant === 'gold'
                          ? 'bg-[#D4AF37] text-black font-bold'
                          : 'bg-rose-900 text-rose-200 border border-rose-600'
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
        <div className="p-4 border-t border-zinc-700/80 space-y-2 bg-[#12141c]">
          <div className="px-3 py-2 bg-zinc-800/90 rounded-xl border border-zinc-700 flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="text-[10px] text-zinc-400 block font-medium">Connecté en tant que</span>
              <span className="font-bold text-white truncate block text-[11px]">
                {user?.email || 'Administrateur'}
              </span>
            </div>
            <ShieldCheck className="w-4 h-4 text-[#E5C058] shrink-0" />
          </div>

          <button
            id="admin-view-store-btn"
            onClick={onExitAdmin}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-[#E5C058] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Voir la boutique publique</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            id="admin-logout-btn"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Déconnexion sécurisée</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0c0d12] overflow-y-auto">
        {/* Top Header bar for desktop */}
        <header className="hidden md:flex h-16 px-6 border-b border-zinc-700/80 bg-[#141620] items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-[#E5C058] font-serif font-bold">
              Administration • {currentTabLabel}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-200 bg-zinc-800/90 px-3.5 py-1.5 rounded-full border border-zinc-700 font-sans shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
