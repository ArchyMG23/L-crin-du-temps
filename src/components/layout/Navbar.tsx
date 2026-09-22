import React, { useState } from 'react';
import { ShoppingBag, Search, ShieldCheck, Menu, X, User, UserCheck, Sun, Moon } from 'lucide-react';
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
  const { isDark, toggleTheme } = useTheme();
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

  const storeTitle = settings?.storeName || "L'ÉCRIN DU TEMPS";

  return (
    <header className="sticky top-0 z-40 bg-[var(--header-bg)] backdrop-blur-md border-b border-[var(--sep)] text-[var(--text)] transition-all">
      {/* Top micro-bar: Super compact on mobile, elegant on desktop */}
      <div className="bg-[var(--bg-2)] border-b border-[var(--sep)] py-1 px-3 sm:px-4 text-center text-[9px] sm:text-[10px] tracking-[0.2em] text-[var(--or)] flex items-center justify-center gap-1.5 uppercase font-medium">
        <ShieldCheck className="w-3 h-3 text-[var(--or)] shrink-0" />
        <span className="truncate">Authenticité 100% • Conciergerie WhatsApp</span>
      </div>

      <div className="max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-12 2xl:px-16 w-full">
        {/* Strict flexbox container with space-between and no absolute overlapping */}
        <div
          className="flex items-center justify-between h-14 sm:h-16 lg:h-20 gap-2 sm:gap-4 w-full"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {/* ZONE GAUCHE : Menu Hamburger + Logo de marque côte à côte dans un conteneur dédié */}
          <div className="flex items-center gap-1 sm:gap-2.5 min-w-0 flex-1 overflow-visible pr-1 sm:pr-2">
            {/* Bouton Menu Hamburger mobile (>= 44x44px touch target) */}
            <button
              id="mobile-menu-toggle-btn"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-[var(--text-soft)] hover:text-[var(--or)] hover:bg-[var(--carte-bg)] rounded-xl transition-colors focus:outline-none"
              aria-label="Ouvrir le menu de navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo de marque : Zone dédiée sans contrainte rigide coupante, utilisant clamp() fluide */}
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('home')}
              className="group flex items-center text-left py-1 min-w-0 hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
              aria-label="Retour à l'accueil L'Écrin du Temps"
            >
              {settings?.logo && settings.logo.startsWith('http') && !settings.logo.includes('unsplash') ? (
                <img
                  src={settings.logo}
                  alt={storeTitle}
                  className="h-7 sm:h-9 lg:h-10 w-auto object-contain shrink-0"
                />
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                  {/* Cadran d'horlogerie avec taille préservée */}
                  <div className="shrink-0 flex items-center justify-center">
                    <BrandLogo variant="emblem" size="xs" theme={isDark ? 'dark' : 'light'} />
                  </div>

                  {/* Typographie fluide : clamp(0.85rem, 3.6vw, 1.25rem) */}
                  <div className="flex flex-col justify-center text-left min-w-0">
                    <span
                      className="font-serif font-bold tracking-[0.06em] sm:tracking-[0.14em] uppercase text-[var(--or)] leading-tight whitespace-nowrap block"
                      style={{
                        fontFamily: "'Cinzel', Georgia, serif",
                        fontSize: 'clamp(0.85rem, 3.6vw, 1.25rem)'
                      }}
                    >
                      {/* Très petit écran (<360px) : bascule propre vers "L'ÉCRIN", complet au-delà */}
                      <span className="inline min-[360px]:hidden">L'ÉCRIN</span>
                      <span className="hidden min-[360px]:inline">L'ÉCRIN DU TEMPS</span>
                    </span>
                    <span
                      className="hidden sm:block text-[8px] sm:text-[9px] tracking-[0.25em] text-[var(--text-soft)] uppercase font-medium whitespace-nowrap mt-0.5"
                      style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                    >
                      Horlogerie d'Exception
                    </span>
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* ZONE CENTRALE : Navigation Desktop uniquement */}
          <nav className="hidden lg:flex items-center space-x-8 xl:space-x-10 shrink-0 px-4">
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

          {/* ZONE DROITE : Groupe d'icônes avec flex-shrink: 0 (ne rétrécit JAMAIS) */}
          <div
            className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0"
            style={{ flexShrink: 0 }}
          >
            {/* 1. Recherche : Visible directement sur mobile et desktop */}
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

            {/* 2. Thème clair/sombre : Visible sur tablette/desktop, regroupé dans le menu sur mobile */}
            <div className="hidden sm:flex shrink-0">
              <ThemeToggle
                id="navbar-theme-toggle"
                className="min-w-[44px] min-h-[44px] w-11 h-11 shrink-0 shadow-sm"
              />
            </div>

            {/* 3. Espace Client : Visible sur desktop, regroupé dans le menu sur mobile */}
            <button
              id="navbar-account-btn"
              onClick={() => onNavigate('account')}
              className={`hidden md:flex min-h-[44px] h-11 rounded-full transition-all items-center justify-center border text-xs px-3.5 gap-1.5 shrink-0 shadow-sm ${
                userProfile
                  ? 'bg-[var(--badge-bg)] border-[var(--or)] text-[var(--or)] hover:opacity-90'
                  : 'bg-[var(--carte-bg)] hover:bg-[var(--bg-2)] border border-[var(--sep)] hover:border-[var(--or)] text-[var(--text-soft)] hover:text-[var(--or)]'
              }`}
              title={userProfile ? `Compte : ${userProfile.fullName}` : 'Espace Client'}
              aria-label="Espace Client"
            >
              {userProfile ? (
                <>
                  <UserCheck className="w-4 h-4 text-[var(--or)] shrink-0" />
                  <span className="text-[11px] font-medium tracking-wide max-w-[110px] truncate text-[var(--text)]">
                    {userProfile.fullName.split(' ')[0]}
                  </span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    Compte
                  </span>
                </>
              )}
            </button>

            {/* 4. Panier avec badge numérique : Visible directement sur mobile et desktop */}
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

      {/* Menu Tiroir Mobile (Accessible via le bouton hamburger à gauche) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[var(--bg-2)] border-b border-[var(--sep)] px-4 pt-3 pb-5 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          {/* Raccourci recherche rapide */}
          <div className="mb-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenSearch) onOpenSearch();
              }}
              className="w-full min-h-[44px] flex items-center justify-between bg-[var(--carte-bg)] border border-[var(--sep)] hover:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-soft)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[var(--or)]" />
                <span>Rechercher une montre...</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Ouvrir</span>
            </button>
          </div>

          {/* Liens de navigation principaux */}
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

          {/* Section Profil / Espace Client regroupé */}
          <button
            id="mobile-nav-account"
            onClick={() => {
              onNavigate('account');
              setMobileMenuOpen(false);
            }}
            className={`w-full min-h-[44px] flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-[0.15em] uppercase border-t border-[var(--sep)] pt-3 transition-colors ${
              currentView === 'account'
                ? 'bg-[var(--badge-bg)] text-[var(--or)] font-bold border-l-2 border-[var(--or)]'
                : 'text-[var(--text)] hover:bg-[var(--badge-bg)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {userProfile ? (
                <UserCheck className="w-4 h-4 text-[var(--or)] shrink-0" />
              ) : (
                <User className="w-4 h-4 text-[var(--text-soft)] shrink-0" />
              )}
              <span className="truncate">
                {userProfile
                  ? `Mon Compte (${userProfile.fullName.split(' ')[0]})`
                  : 'Espace Client / Connexion'}
              </span>
            </div>
            {userProfile && (
              <span className="text-[10px] text-[var(--or)] bg-[var(--badge-bg)] px-2 py-0.5 rounded-full border border-[var(--or)]/30 lowercase shrink-0">
                connecté
              </span>
            )}
          </button>

          {/* Section Thème Clair / Sombre regroupé */}
          <div className="pt-2 border-t border-[var(--sep)]">
            <button
              id="mobile-nav-theme-toggle"
              onClick={() => toggleTheme()}
              className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase text-[var(--text-soft)] hover:bg-[var(--carte-bg)] hover:text-[var(--text)] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {isDark ? (
                  <Sun className="w-4 h-4 text-[var(--or)] shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 text-[var(--or)] shrink-0" />
                )}
                <span>Apparence : {isDark ? 'Mode Sombre' : 'Mode Clair'}</span>
              </div>
              <span className="text-[10px] text-[var(--or)] font-mono border border-[var(--or)]/30 px-2 py-0.5 rounded-md shrink-0">
                Changer
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
