import React, { useState } from 'react';
import {
  LayoutDashboard,
  Watch,
  Layers,
  Boxes,
  ShoppingBag,
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
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F0] flex flex-col md:flex-row font-sans">
      {/* Mobile Top App Bar */}
      <div className="md:hidden bg-[#0D0D0D] border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            id="admin-mobile-drawer-toggle"
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="p-2 text-white/70 hover:text-white rounded-lg bg-white/5 border border-white/10"
            title="Menu CMS"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37]">
              <Watch className="w-4 h-4" />
            </span>
            <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              CMS Horlogerie
            </span>
          </div>
        </div>

        <button
          onClick={onExitAdmin}
          className="text-[11px] text-white/60 hover:text-[#D4AF37] flex items-center gap-1 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Boutique</span>
        </button>
      </div>

      {/* Desktop Sidebar / Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static top-0 left-0 bottom-0 z-50 w-72 md:w-64 bg-[#0D0D0D] border-r border-white/10 shrink-0 flex flex-col justify-between transition-transform duration-300 ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Admin Header / Brand */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37]">
                <Watch className="w-5 h-5" />
              </span>
              <div>
                <h1 className="font-serif text-sm font-bold uppercase tracking-[0.15em] text-[#F5F5F0]">
                  CMS Horlogerie
                </h1>
                <span className="text-[10px] text-[#D4AF37] font-medium block uppercase tracking-wider">
                  Console Propriétaire
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="md:hidden p-1 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] font-semibold border border-[#D4AF37]/30 shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-white/50'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeVariant === 'gold'
                          ? 'bg-[#D4AF37] text-black font-semibold'
                          : 'bg-amber-950 text-amber-300 border border-amber-600/50'
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
        <div className="p-4 border-t border-white/10 space-y-2">
          <div className="px-3 py-2 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between text-xs">
            <div className="truncate">
              <span className="text-[10px] text-white/40 block">Connecté en tant que</span>
              <span className="font-semibold text-stone-200 truncate block text-[11px]">
                {user?.email || 'Administrateur'}
              </span>
            </div>
            <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
          </div>

          <button
            id="admin-view-store-btn"
            onClick={onExitAdmin}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-white/70 hover:text-[#D4AF37] bg-[#0A0A0A] hover:bg-white/5 border border-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Voir la boutique publique</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </button>

          <button
            id="admin-logout-btn"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs text-white/50 hover:text-rose-300 hover:bg-rose-950/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion sécurisée</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] overflow-y-auto">
        {/* Top Header bar for desktop */}
        <header className="hidden md:flex h-16 px-6 border-b border-white/10 bg-[#0D0D0D]/60 backdrop-blur-md items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-serif font-bold">
              Administration • {currentTabLabel}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Session active ({user?.email || 'Gérante'})</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
