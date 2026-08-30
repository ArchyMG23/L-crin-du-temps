import React, { useState } from 'react';
import { ShoppingBag, Search, ShieldCheck, Menu, X, User, UserCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { StoreSettings } from '../../types';
import { BrandLogo } from '../common/BrandLogo';

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
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 text-[#F5F5F0] transition-all">
      {/* Top micro-bar: Super compact on mobile, elegant on desktop */}
      <div className="bg-[#09090c] border-b border-white/5 py-1 px-3 sm:px-4 text-center text-[9px] sm:text-[10px] tracking-[0.2em] text-[#D4AF37] flex items-center justify-center gap-1.5 uppercase font-medium">
        <ShieldCheck className="w-3 h-3 text-[#D4AF37] shrink-0" />
        <span className="truncate">Authenticité 100% • Conciergerie WhatsApp</span>
      </div>

      <div className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-12 2xl:px-16">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Mobile menu button (Left on mobile) */}
          <div className="flex items-center lg:hidden">
            <button
              id="mobile-menu-toggle-btn"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-1 text-white/80 hover:text-[#D4AF37] rounded-lg transition-colors focus:outline-none"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Brand Logo / Name: Responsive and perfectly proportioned */}
          <div className="flex items-center">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('home')}
              className="text-left group flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-90 py-1"
              aria-label="Retour à l'accueil"
            >
              {settings?.logo && settings.logo.startsWith('http') && !settings.logo.includes('unsplash') ? (
                <img
                  src={settings.logo}
                  alt={storeTitle}
                  className="h-7 sm:h-9 lg:h-10 w-auto object-contain"
                />
              ) : (
                <>
                  {/* Mobile optimized compact brand mark */}
                  <div className="block sm:hidden">
                    <BrandLogo variant="compact" theme="dark" size="xs" showSubtitle={false} />
                  </div>
                  {/* Desktop / Tablet fuller brand mark */}
                  <div className="hidden sm:block">
                    <BrandLogo variant="horizontal" theme="dark" size="md" showSubtitle={true} />
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
                  className={`text-xs tracking-[0.2em] uppercase transition-all py-2 relative ${
                    isActive
                      ? 'text-[#D4AF37] font-bold'
                      : 'text-white/60 hover:text-[#D4AF37]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Search, Customer Account, Cart */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 lg:space-x-4">
            {/* Search Button (Opens Search Modal) */}
            <button
              id="navbar-search-toggle-btn"
              onClick={() => {
                if (onOpenSearch) onOpenSearch();
              }}
              className="p-2 sm:p-2.5 text-white/70 hover:text-[#D4AF37] transition-colors rounded-full hover:bg-white/5 flex items-center gap-1.5"
              title="Rechercher une montre (Échap)"
              aria-label="Rechercher une montre"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xl:inline text-[11px] uppercase tracking-widest text-white/50 hover:text-[#D4AF37]">
                Recherche
              </span>
            </button>

            {/* Account / Customer Space Button */}
            <button
              id="navbar-account-btn"
              onClick={() => onNavigate('account')}
              className={`p-2 sm:p-2.5 rounded-full transition-all flex items-center justify-center border text-xs gap-1.5 ${
                userProfile
                  ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/25'
                  : 'bg-[#151515] hover:bg-[#202020] border-white/10 text-white/80 hover:text-[#D4AF37]'
              }`}
              title={userProfile ? `Compte: ${userProfile.fullName}` : 'Espace Client'}
              aria-label="Espace Client"
            >
              {userProfile ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
                  <span className="hidden xl:inline text-[11px] font-medium tracking-wide max-w-[90px] truncate text-white">
                    {userProfile.fullName.split(' ')[0]}
                  </span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xl:inline text-[11px] uppercase tracking-wider font-semibold">
                    Compte
                  </span>
                </>
              )}
            </button>

            {/* Cart Button with luxury badge */}
            <button
              id="navbar-cart-btn"
              onClick={handleCartClick}
              className="relative p-2 sm:p-2.5 bg-[#151515] hover:bg-[#202020] border border-white/10 text-white/80 hover:text-[#D4AF37] rounded-full transition-all flex items-center justify-center group shadow-sm"
              title="Mon Panier"
              aria-label={`Panier (${itemCount} articles)`}
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-105" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-[9px] sm:text-[10px] font-bold h-4 min-w-[16px] sm:h-4.5 sm:min-w-[18px] px-1 rounded-full flex items-center justify-center shadow-md">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0f0f13] border-b border-white/10 px-5 pt-3 pb-5 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="mb-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenSearch) onOpenSearch();
              }}
              className="w-full flex items-center justify-between bg-[#07070a] border border-white/10 hover:border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-xs text-white/60"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Rechercher une montre...</span>
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Ouvrir</span>
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
              className={`block w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-[0.2em] uppercase transition-all ${
                currentView === link.id
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] font-bold border-l-2 border-[#D4AF37]'
                  : 'text-white/75 hover:bg-white/5 hover:text-white'
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
            className={`block w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-[0.2em] uppercase border-t border-white/10 pt-3 ${
              currentView === 'account'
                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-l-2 border-[#D4AF37]'
                : 'text-[#D4AF37] hover:bg-white/5'
            }`}
          >
            {userProfile ? `Mon Compte (${userProfile.fullName.split(' ')[0]})` : 'Espace Client (Connexion)'}
          </button>
        </div>
      )}
    </header>
  );
};
