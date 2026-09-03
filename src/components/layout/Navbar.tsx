import React, { useState } from 'react';
import { ShoppingBag, Search, ShieldCheck, Menu, X, User, UserCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { StoreSettings } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, categorySlug?: string) => void;
  settings?: StoreSettings;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenSearch?: () => void;
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  settings,
  searchQuery = '',
  onSearchChange,
  onOpenSearch,
  onOpenCart
}) => {
  const { itemCount, setIsCartOpen } = useCart();
  const { userProfile } = useAuth();
  const { isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
    } else {
      setIsCartOpen(true);
    }
  };

  const navLinks = [
    { id: 'home', label: 'Accueil' },
    { id: 'shop', label: 'Boutique' },
    { id: 'about', label: 'À propos' },
  ];

  const storeTitle = settings?.storeName || "L'ÉMINENCE HORLOGERIE";

  return (
    <header className="sticky top-0 z-40 bg-[var(--header-bg)] backdrop-blur-md border-b border-[var(--sep)] text-[var(--text)] transition-all">
      {/* Top micro-bar: Super compact on mobile, elegant on desktop */}
      <div className="bg-[var(--bg-2)] border-b border-[var(--sep)] py-1 px-3 sm:px-4 text-center text-[9px] sm:text-[10px] tracking-[0.2em] text-[var(--or)] flex items-center justify-center gap-1.5 uppercase font-medium">
        <ShieldCheck className="w-3 h-3 text-[var(--or)] shrink-0" />
        <span className="truncate">Authenticité 100% • Conciergerie WhatsApp</span>
      </div>

      <div className="max-w-[1720px] mx-auto px-2 sm:px-6 lg:px-12 2xl:px-16">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20 gap-1 sm:gap-4">
          {/* Mobile menu button (Left on mobile, at least 44x44px touch target) */}
          <div className="flex items-center lg:hidden shrink-0">
            <button
              id="mobile-menu-toggle-btn"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-[var(--text-soft)] hover:text-[var(--or)] rounded-xl transition-colors focus:outline-none"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Brand Logo / Name: Responsive and proportioned */}
          <div className="flex items-center min-w-0">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('home')}
              className="text-left group flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-90 py-1 min-w-0"
              aria-label="Retour à l'accueil"
            >
              {settings?.logo && settings.logo.startsWith('http') && !settings.logo.includes('unsplash') ? (
                <img
                  src={settings.logo}
                  alt={storeTitle}
                  className="h-7 sm:h-9 lg:h-10 w-auto object-contain shrink-0"
                />
              ) : (
                <>
                  {/* Mobile optimized compact brand mark */}
                  <div className="block sm:hidden shrink-0">
                    <BrandLogo variant="compact" theme={isDark ? 'dark' : 'light'} size="xs" showSubtitle={false} />
                  </div>
                  {/* Desktop / Tablet fuller brand mark */}
                  <div className="hidden sm:block shrink-0">
                    <BrandLogo variant="horizontal" theme={isDark ? 'dark' : 'light'} size="md" showSubtitle={true} />
                  </div>
                </>
              )}
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 xl:space-x-10">
            {navLinks.map((link) => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  onClick={() => onNavigate(link.id)}
                  className={`text-xs tracking-[0.2em] uppercase transition-all py-2 min-h-[44px] flex items-center relative ${
                    isActive
                      ? 'text-[var(--or)] font-bold'
                      : 'text-[var(--text-soft)] hover:text-[var(--or)]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-0 w-full h-0.5 bg-[var(--or)] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Search, Theme Toggle, Customer Account, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0">
            {/* Search Button (Opens Search Modal, >= 44x44px touch target) */}
            <button
              id="navbar-search-toggle-btn"
              onClick={() => {
                if (onOpenSearch) onOpenSearch();
              }}
              className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] w-10 h-10 sm:w-11 sm:h-11 bg-[var(--carte-bg)] hover:bg-[var(--bg-2)] border border-[var(--sep)] hover:border-[var(--or)] text-[var(--text-soft)] hover:text-[var(--or)] transition-all rounded-full flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
              title="Rechercher une montre (⌘K ou /)"
              aria-label="Rechercher une montre"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 transition-transform hover:scale-110" />
            </button>

            {/* Theme Toggle Button (Permanently visible on mobile and desktop) */}
            <ThemeToggle id="navbar-theme-toggle" className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] w-10 h-10 sm:w-11 sm:h-11 shrink-0 shadow-sm" />

            {/* Account / Customer Space Button (>= 44x44px touch target) */}
            <button
              id="navbar-account-btn"
              onClick={() => onNavigate('account')}
              className={`min-h-[40px] sm:min-h-[44px] h-10 sm:h-11 rounded-full transition-all flex items-center justify-center border text-xs px-2.5 sm:px-3.5 gap-1.5 shrink-0 ${
                userProfile
                  ? 'bg-[var(--badge-bg)] border-[var(--or)] text-[var(--or)] hover:opacity-90 shadow-sm'
                  : 'bg-[var(--carte-bg)] hover:bg-[var(--bg-2)] border border-[var(--sep)] hover:border-[var(--or)] text-[var(--text-soft)] hover:text-[var(--or)] shadow-sm'
              }`}
              title={userProfile ? `Compte: ${userProfile.fullName}` : 'Espace Client'}
              aria-label="Espace Client"
            >
              {userProfile ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--or)] shrink-0" />
                  <span className="text-[11px] font-medium tracking-wide max-w-[90px] sm:max-w-[110px] truncate text-[var(--text)]">
                    {userProfile.fullName.split(' ')[0]}
                  </span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline text-[11px] uppercase tracking-wider font-semibold">
                    Compte
                  </span>
                </>
              )}
            </button>

            {/* Cart Button with luxury badge (>= 44x44px touch target) */}
            <button
              id="navbar-cart-btn"
              onClick={handleCartClick}
              className="relative min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] w-10 h-10 sm:w-11 sm:h-11 bg-[var(--carte-bg)] hover:bg-[var(--bg-2)] border border-[var(--sep)] hover:border-[var(--or)] text-[var(--text-soft)] hover:text-[var(--or)] rounded-full transition-all flex items-center justify-center shrink-0 group shadow-sm cursor-pointer"
              title="Mon Panier"
              aria-label={`Panier (${itemCount} articles)`}
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-105" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--or)] text-black text-[9px] sm:text-[10px] font-bold h-4 min-w-[16px] sm:h-4.5 sm:min-w-[18px] px-1 rounded-full flex items-center justify-center shadow-md">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[var(--bg-2)] border-b border-[var(--sep)] px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="mb-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenSearch) onOpenSearch();
              }}
              className="w-full min-h-[44px] flex items-center justify-between bg-[var(--carte-bg)] border border-[var(--sep)] hover:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-soft)]"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[var(--or)]" />
                <span>Rechercher une montre...</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Ouvrir</span>
            </button>
          </div>

          {navLinks.map((link) => (
            <button
              key={link.id}
              id={`mobile-nav-${link.id}`}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full min-h-[44px] flex items-center text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-[0.2em] uppercase transition-all ${
                currentView === link.id
                  ? 'bg-[var(--badge-bg)] text-[var(--or)] font-bold border-l-2 border-[var(--or)]'
                  : 'text-[var(--text-soft)] hover:bg-[var(--badge-bg)] hover:text-[var(--text)]'
              }`}
            >
              {link.label}
            </button>
          ))}

          <button
            id="mobile-nav-account"
            onClick={() => {
              onNavigate('account');
              setMobileMenuOpen(false);
            }}
            className={`w-full min-h-[44px] flex items-center text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-[0.2em] uppercase border-t border-[var(--sep)] pt-3 ${
              currentView === 'account'
                ? 'bg-[var(--badge-bg)] text-[var(--or)] border-l-2 border-[var(--or)]'
                : 'text-[var(--or)] hover:bg-[var(--badge-bg)]'
            }`}
          >
            {userProfile ? `Mon Compte (${userProfile.fullName.split(' ')[0]})` : 'Espace Client (Connexion)'}
          </button>
        </div>
      )}
    </header>
  );
};
