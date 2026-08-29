import React, { useState } from 'react';
import { ShoppingBag, Search, ShieldCheck, Menu, X, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { StoreSettings } from '../../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, categorySlug?: string) => void;
  settings?: StoreSettings;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  settings,
  searchQuery = '',
  onSearchChange,
  onOpenCart
}) => {
  const { itemCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchInput = (val: string) => {
    setLocalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

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
    { id: 'men', label: 'Hommes' },
    { id: 'women', label: 'Femmes' },
  ];

  const storeTitle = settings?.storeName || "L'ÉMINENCE HORLOGERIE";

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 text-[#F5F5F0] transition-all">
      {/* Top micro-bar */}
      <div className="bg-[#0D0D0D] border-b border-white/5 py-1.5 px-4 text-center text-[10px] tracking-[0.25em] text-[#D4AF37]/90 flex items-center justify-center gap-2 uppercase">
        <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>Authenticité Certifiée 100% • Conciergerie & Commande Directe WhatsApp</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              id="mobile-menu-toggle-btn"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white/70 hover:text-white rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo / Name */}
          <div className="flex items-center">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('home')}
              className="text-left group flex flex-col"
            >
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-widest text-[#D4AF37] group-hover:text-[#F9E79F] transition-colors uppercase">
                {storeTitle}
              </span>
              <span className="text-[9px] tracking-[0.3em] text-white/50 font-sans uppercase">
                Haute Horlogerie & Prestige
              </span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-10">
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

          {/* Right Action Icons: Search, Cart, Admin Access */}
          <div className="flex items-center space-x-4 sm:space-x-5">
            {/* Search toggler / input */}
            <div className="relative flex items-center">
              {showSearchInput ? (
                <div className="flex items-center bg-[#151515] border border-white/10 focus-within:border-[#D4AF37]/50 rounded-full px-3.5 py-1.5 w-44 sm:w-64 transition-all">
                  <Search className="w-4 h-4 text-white/50 mr-2 shrink-0" />
                  <input
                    type="text"
                    id="navbar-search-input"
                    value={localSearch}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    placeholder="Rechercher une montre..."
                    className="bg-transparent text-xs text-white placeholder-white/40 focus:outline-none w-full"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearchInput(false);
                      handleSearchInput('');
                    }}
                    className="text-white/40 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  id="navbar-search-toggle-btn"
                  onClick={() => setShowSearchInput(true)}
                  className="p-2 text-white/60 hover:text-[#D4AF37] transition-colors rounded-full hover:bg-white/5"
                  title="Rechercher"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Cart Button with luxury badge */}
            <button
              id="navbar-cart-btn"
              onClick={handleCartClick}
              className="relative p-2.5 bg-[#151515] hover:bg-[#202020] border border-white/10 text-white/80 hover:text-[#D4AF37] rounded-full transition-all flex items-center justify-center group shadow-sm"
              title="Mon Panier"
            >
              <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-105" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-black text-[10px] font-bold h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center shadow-md">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#111111] border-b border-white/10 px-6 pt-4 pb-6 space-y-4">
          <div className="mb-3">
            <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-lg px-3.5 py-2">
              <Search className="w-4 h-4 text-white/40 mr-2" />
              <input
                type="text"
                id="mobile-search-input"
                value={localSearch}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Rechercher une montre..."
                className="bg-transparent text-sm text-white placeholder-white/40 focus:outline-none w-full"
              />
            </div>
          </div>
          {navLinks.map((link) => (
            <button
              key={link.id}
              id={`mobile-nav-${link.id}`}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2.5 rounded-md text-xs font-semibold tracking-[0.2em] uppercase ${
                currentView === link.id
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37]'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
