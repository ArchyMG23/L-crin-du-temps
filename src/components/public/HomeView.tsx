import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  MessageSquare,
  Award,
  Flame,
  Clock,
  ShieldCheck,
  Truck,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingBag,
  Compass,
  ChevronDown
} from 'lucide-react';
import { Product, Category, StoreSettings } from '../../types';
import { ProductCard } from './ProductCard';
import { Button } from '../ui/Button';
import {
  normalizeWhatsAppNumber,
  buildWhatsAppChatUrl,
  buildProductInquiryMessage
} from '../../utils/whatsapp';

interface HomeViewProps {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  onNavigate: (view: string, categorySlug?: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  categories,
  settings,
  onNavigate,
  onSelectProduct
}) => {
  const currency = settings.currency || '€';
  const whatsappNumber = settings.whatsappNumber || '+237600000000';
  const storeName = settings.storeName || settings.name || "L'Écrin du Temps";
  const customIntro = settings.whatsappDefaultMessage || settings.contactInformation?.whatsappMessage;
  const cleanWhatsApp = normalizeWhatsAppNumber(whatsappNumber);

  // 1. Filter valid and active products
  const activeProducts = useMemo(() => {
    return products.filter((p) => p.active);
  }, [products]);

  // 2. Strict Hero Candidates selection with priority criteria:
  // Priority 1: Featured
  // Priority 2: Popular (by orderCount)
  // Priority 3: New arrivals (by createdAt)
  const heroCandidates = useMemo(() => {
    const valid = activeProducts.filter((p) => {
      const hasValidImage = Array.isArray(p.images) && p.images.length > 0 && !!p.images[0] && p.images[0].trim() !== '';
      const isAvailable = p.stock > 0;
      return hasValidImage && isAvailable;
    });

    return [...valid].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      const countA = a.orderCount || 0;
      const countB = b.orderCount || 0;
      if (countB !== countA) return countB - countA;

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    }).slice(0, 5);
  }, [activeProducts]);

  // Dynamic Hero Slide State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Rotate hero slide automatically every 7 seconds if not hovered
  useEffect(() => {
    if (heroCandidates.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroCandidates.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [heroCandidates.length, isHovered]);

  useEffect(() => {
    if (currentSlideIndex >= heroCandidates.length && heroCandidates.length > 0) {
      setCurrentSlideIndex(0);
    }
  }, [heroCandidates.length, currentSlideIndex]);

  const activeHeroProduct = heroCandidates[currentSlideIndex] || null;

  // 3. Featured Products for the Editorial Showcase
  const featuredProducts = useMemo(() => {
    return activeProducts.filter((p) => p.featured);
  }, [activeProducts]);

  const spotlightPiece = featuredProducts[0] || activeProducts[0] || null;
  const satellitePieces = useMemo(() => {
    if (!spotlightPiece) return [];
    return featuredProducts.filter((p) => p.id !== spotlightPiece.id).slice(0, 3);
  }, [featuredProducts, spotlightPiece]);

  // 4. Popular Products (by orderCount)
  const popularProducts = useMemo(() => {
    return [...activeProducts]
      .sort((a, b) => {
        const countA = a.orderCount || 0;
        const countB = b.orderCount || 0;
        if (countB !== countA) return countB - countA;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      })
      .slice(0, 10);
  }, [activeProducts]);

  // 5. New Arrivals (by createdAt)
  const newArrivals = useMemo(() => {
    return [...activeProducts]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 8);
  }, [activeProducts]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === '€' ? 'EUR' : currency === '$' ? 'USD' : 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-12 sm:space-y-20 2xl:space-y-28 text-[#F5F5F0]">
      {/* ========================================================================= */}
      {/* 1. HERO RESPONSIVE AVANCÉ : RECOMPOSITION DÉDIÉE PAR FORMAT               */}
      {/* ========================================================================= */}
      {activeHeroProduct ? (
        <section
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#121217] via-[#0c0c0f] to-[#07070a] shadow-2xl transition-all"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <img
              key={`bg-${activeHeroProduct.id}`}
              src={activeHeroProduct.images[0]}
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-15 filter blur-3xl scale-125 transition-all duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07070a] via-[#07070a]/90 to-[#07070a]/60" />
            <div className="absolute inset-0 bg-radial from-transparent via-[#07070a]/60 to-[#07070a]" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeHeroProduct.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="relative z-10"
            >
              {/* ========================================================= */}
              {/* COMPOSITION MOBILE DÉDIÉE (< lg) : PRODUIT AU PREMIER PLAN */}
              {/* ========================================================= */}
              <div className="block lg:hidden p-4 sm:p-7 space-y-4">
                {/* 1. Top Mini-Badge & Brand Hook */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c6a664]/15 border border-[#c6a664]/40 text-[#c6a664] text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase font-serif">
                    <Sparkles className="w-3 h-3 text-[#c6a664]" />
                    <span>
                      {activeHeroProduct.featured
                        ? "Pièce d'Exception"
                        : activeHeroProduct.orderCount && activeHeroProduct.orderCount > 0
                        ? 'Bestseller'
                        : 'Haute Horlogerie'}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-white/60 font-serif font-bold">
                    {activeHeroProduct.brand}
                  </span>
                </div>

                {/* 2. PRODUIT HERO MIS EN SCÈNE (Visuel Central Dominant) */}
                <div className="relative py-2 flex flex-col items-center justify-center">
                  <div
                    onClick={() => onSelectProduct(activeHeroProduct)}
                    className="relative w-full max-w-[260px] sm:max-w-[300px] aspect-square rounded-2xl bg-radial from-white/10 via-black/40 to-black/80 border border-white/10 p-4 shadow-2xl flex items-center justify-center cursor-pointer group"
                  >
                    {/* Radial gold halo */}
                    <div className="absolute inset-0 bg-radial from-[#c6a664]/15 to-transparent rounded-2xl pointer-events-none" />

                    {/* Floating Watch Visual */}
                    <motion.img
                      src={activeHeroProduct.images[0]}
                      alt={activeHeroProduct.name}
                      referrerPolicy="no-referrer"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      className="w-full h-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)] transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Subtle click badge */}
                    <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md border border-white/15 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest text-[#c6a664] font-serif font-semibold">
                      Toucher pour voir
                    </div>
                  </div>

                  {/* Tactile Carousel dots for mobile */}
                  {heroCandidates.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentSlideIndex((prev) => (prev - 1 + heroCandidates.length) % heroCandidates.length);
                        }}
                        className="p-1 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white"
                        aria-label="Pièce précédente"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        {heroCandidates.map((cand, idx) => (
                          <button
                            key={cand.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentSlideIndex(idx);
                            }}
                            className={`h-1.5 rounded-full transition-all ${
                              idx === currentSlideIndex
                                ? 'w-6 bg-[#c6a664]'
                                : 'w-1.5 bg-white/20'
                            }`}
                            aria-label={`Voir montre ${idx + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentSlideIndex((prev) => (prev + 1) % heroCandidates.length);
                        }}
                        className="p-1 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white"
                        aria-label="Pièce suivante"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Essential Product Details & Specs */}
                <div className="text-center space-y-2">
                  <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white line-clamp-1">
                    {activeHeroProduct.name}
                  </h1>

                  {/* Compact Horological Spec Pills */}
                  {activeHeroProduct.specifications && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-white/70">
                      {activeHeroProduct.specifications.movement && (
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                          {activeHeroProduct.specifications.movement}
                        </span>
                      )}
                      {activeHeroProduct.specifications.caseDiameter && (
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                          {activeHeroProduct.specifications.caseDiameter}
                        </span>
                      )}
                      {activeHeroProduct.specifications.waterResistance && (
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                          {activeHeroProduct.specifications.waterResistance}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price Row */}
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-[#c6a664]">
                      {formatPrice(activeHeroProduct.promotionalPrice || activeHeroProduct.price)}
                    </div>
                    {activeHeroProduct.promotionalPrice && activeHeroProduct.promotionalPrice < activeHeroProduct.price && (
                      <div className="text-xs sm:text-sm text-white/40 line-through font-serif">
                        {formatPrice(activeHeroProduct.price)}
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      En stock
                    </span>
                  </div>
                </div>

                {/* 4. Clear Primary Action Buttons (Mobile-first) */}
                <div className="pt-2 flex flex-col gap-2.5">
                  <Button
                    variant="gold"
                    size="lg"
                    id="mobile-hero-view-product-btn"
                    onClick={() => onSelectProduct(activeHeroProduct)}
                    icon={Eye}
                    iconPosition="left"
                    className="w-full shadow-lg shadow-[#c6a664]/20 py-3.5 font-bold text-xs uppercase tracking-wider"
                  >
                    Découvrir cette Montre
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate('shop')}
                      className="border-white/15 hover:border-[#c6a664] text-[11px] py-2.5 uppercase tracking-wider"
                    >
                      Boutique
                    </Button>

                    <a
                      href={buildWhatsAppChatUrl(
                        whatsappNumber,
                        buildProductInquiryMessage(activeHeroProduct, storeName, customIntro)
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-current" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* 5. Scroll Invitation Pill */}
                <div className="pt-3 pb-1 flex items-center justify-center">
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/40 font-serif animate-pulse">
                    <span>Explorer les collections</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* COMPOSITION DESKTOP & GRAND ÉCRAN (lg:grid)               */}
              {/* ========================================================= */}
              <div className="hidden lg:grid grid-cols-12 gap-8 2xl:gap-12 items-center p-10 lg:p-12 2xl:p-16 min-h-[540px] 2xl:min-h-[620px]">
                {/* Left Zone (Editorial & Specs) */}
                <div className="lg:col-span-7 xl:col-span-6 2xl:col-span-6 space-y-6 text-left">
                  {/* Tag & Brand row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c6a664]/15 border border-[#c6a664]/40 text-[#c6a664] text-xs font-bold tracking-[0.25em] uppercase font-serif">
                      <Sparkles className="w-3.5 h-3.5 text-[#c6a664]" />
                      <span>
                        {activeHeroProduct.featured
                          ? 'Pièce Maîtresse en Vedette'
                          : activeHeroProduct.orderCount && activeHeroProduct.orderCount > 0
                          ? 'Modèle le Plus Demandé'
                          : 'Haute Horlogerie Certifiée'}
                      </span>
                    </div>
                    <span className="text-xs uppercase tracking-widest text-white/50 font-semibold font-serif">
                      {activeHeroProduct.brand}
                    </span>
                  </div>

                  {/* Fluid Product Title */}
                  <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl 2xl:text-6xl font-bold tracking-tight text-white leading-[1.15]">
                    {activeHeroProduct.name}
                  </h1>

                  {/* Short Description */}
                  <p className="text-sm sm:text-base 2xl:text-lg text-white/70 max-w-2xl leading-relaxed font-sans font-light line-clamp-3">
                    {activeHeroProduct.shortDescription || activeHeroProduct.description || "Garde-temps de prestige alliant précision mécanique, finitions soignées et élégance intemporelle."}
                  </p>

                  {/* Horological Specifications Badges */}
                  {activeHeroProduct.specifications && (
                    <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs">
                      {activeHeroProduct.specifications.movement && (
                        <div className="px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl flex flex-col">
                          <span className="text-[10px] text-white/40 uppercase tracking-wider font-serif">Mouvement</span>
                          <strong className="text-white font-medium text-xs truncate mt-0.5">{activeHeroProduct.specifications.movement}</strong>
                        </div>
                      )}
                      {activeHeroProduct.specifications.caseDiameter && (
                        <div className="px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl flex flex-col">
                          <span className="text-[10px] text-white/40 uppercase tracking-wider font-serif">Boîtier</span>
                          <strong className="text-white font-medium text-xs truncate mt-0.5">{activeHeroProduct.specifications.caseDiameter}</strong>
                        </div>
                      )}
                      {activeHeroProduct.specifications.waterResistance && (
                        <div className="px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl flex flex-col">
                          <span className="text-[10px] text-white/40 uppercase tracking-wider font-serif">Étanchéité</span>
                          <strong className="text-white font-medium text-xs truncate mt-0.5">{activeHeroProduct.specifications.waterResistance}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price & Availability Row */}
                  <div className="pt-2 flex flex-wrap items-baseline gap-4">
                    <div className="text-3xl sm:text-4xl 2xl:text-5xl font-serif font-bold text-[#c6a664]">
                      {formatPrice(activeHeroProduct.promotionalPrice || activeHeroProduct.price)}
                    </div>
                    {activeHeroProduct.promotionalPrice && activeHeroProduct.promotionalPrice < activeHeroProduct.price && (
                      <div className="text-base sm:text-lg text-white/40 line-through font-serif">
                        {formatPrice(activeHeroProduct.price)}
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      En stock immédiat
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 flex items-center gap-3.5">
                    <Button
                      variant="gold"
                      size="lg"
                      id="hero-view-product-btn"
                      onClick={() => onSelectProduct(activeHeroProduct)}
                      icon={Eye}
                      iconPosition="left"
                      className="shadow-xl shadow-[#c6a664]/20 py-4 px-7 font-bold text-sm"
                    >
                      Découvrir cette Montre
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      id="hero-explore-shop-btn"
                      onClick={() => onNavigate('shop')}
                      icon={ArrowRight}
                      iconPosition="right"
                      className="py-4 px-6 border-white/20 hover:border-[#c6a664] hover:text-[#c6a664] text-sm"
                    >
                      Boutique
                    </Button>

                    <a
                      href={buildWhatsAppChatUrl(
                        whatsappNumber,
                        buildProductInquiryMessage(activeHeroProduct, storeName, customIntro)
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-4 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                      title="Commander directement sur WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4 fill-current" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Center Zone : Watch Centerpiece Showcase */}
                <div className="lg:col-span-5 xl:col-span-4 2xl:col-span-4 flex flex-col items-center justify-center relative">
                  <div
                    onClick={() => onSelectProduct(activeHeroProduct)}
                    className="group relative w-full max-w-sm 2xl:max-w-md aspect-square rounded-3xl bg-radial from-white/10 via-black/50 to-black/90 border border-white/15 p-6 shadow-2xl flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-700 hover:border-[#c6a664]/70 hover:shadow-[#c6a664]/10"
                  >
                    <motion.img
                      src={activeHeroProduct.images[0]}
                      alt={activeHeroProduct.name}
                      referrerPolicy="no-referrer"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                      className="w-full h-full object-contain filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.9)] transition-transform duration-500 ease-out group-hover:scale-110"
                    />

                    {/* Brand Seal */}
                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest text-[#c6a664] font-serif font-bold">
                      {activeHeroProduct.brand}
                    </div>
                  </div>
                </div>

                {/* Right Zone (Grand Écran / Ultrawide) : Interactive Flagship Rail */}
                {heroCandidates.length > 1 && (
                  <div className="hidden xl:flex xl:col-span-2 2xl:col-span-2 flex-col justify-center space-y-2.5 pl-4 border-l border-white/10">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#c6a664] font-serif font-bold mb-1">
                      Sélection Flagship
                    </div>
                    {heroCandidates.map((cand, idx) => {
                      const isSelected = idx === currentSlideIndex;
                      return (
                        <button
                          key={cand.id}
                          onClick={() => setCurrentSlideIndex(idx)}
                          className={`group/item text-left p-2 rounded-xl border transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-white/10 border-[#c6a664] shadow-lg shadow-[#c6a664]/10'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/20 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={cand.images[0]}
                              alt={cand.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[9px] text-[#c6a664] font-serif uppercase tracking-wider truncate">
                              {cand.brand}
                            </div>
                            <div className="text-xs text-white font-medium truncate">
                              {cand.name}
                            </div>
                            <div className="text-[10px] text-white/50 font-serif">
                              {formatPrice(cand.promotionalPrice || cand.price)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      ) : (
        /* Fallback Hero if catalogue has no products yet */
        <section className="relative min-h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-[#0A0A0A] flex items-center justify-center text-center p-8 shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#c6a664]/10 border border-[#c6a664]/30 text-[#c6a664] text-[10px] font-bold tracking-[0.25em] uppercase font-serif">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Maison d'Horlogerie & Conciergerie Privée</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              L'Excellence Horlogère à Portée de Main
            </h1>
            <p className="text-sm sm:text-base text-white/60 font-sans leading-relaxed">
              Découvrez notre sélection exclusive de garde-temps certifiés et commandez directement auprès de notre conciergerie WhatsApp.
            </p>
            <div className="pt-2 flex justify-center">
              <Button
                variant="gold"
                size="lg"
                onClick={() => onNavigate('shop')}
                icon={ArrowRight}
                iconPosition="right"
                className="py-3.5 px-8 font-bold"
              >
                Accéder à la Boutique
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. SECTION ÉDITORIALE ASYMÉTRIQUE : PIÈCE MAÎTRESSE & SATELLITES          */}
      {/* ========================================================================= */}
      {spotlightPiece && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="space-y-6 sm:space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-3 sm:pb-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#c6a664] font-serif font-bold">
                <Award className="w-3.5 h-3.5 text-[#c6a664]" />
                <span>Sélection Haute Horlogerie</span>
              </div>
              <h2 className="font-serif text-xl sm:text-3xl 2xl:text-4xl font-bold text-[#F5F5F0] mt-1">
                La Pièce d'Exception de la Maison
              </h2>
            </div>

            <button
              onClick={() => onNavigate('shop')}
              className="text-xs uppercase tracking-[0.15em] font-semibold text-[#c6a664] hover:text-[#e8d9ad] flex items-center gap-1.5 transition-colors"
            >
              <span>Voir la sélection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Asymmetrical Magazine Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 2xl:gap-8 items-stretch">
            {/* Main Spotlight Featured Card */}
            <div
              onClick={() => onSelectProduct(spotlightPiece)}
              className="lg:col-span-7 xl:col-span-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#18181d] via-[#101014] to-[#0a0a0d] border border-white/15 p-5 sm:p-8 lg:p-10 flex flex-col justify-between cursor-pointer group hover:border-[#c6a664]/60 transition-all duration-500 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-[#c6a664]/10 to-transparent pointer-events-none filter blur-2xl" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="px-3 py-0.5 sm:py-1 bg-[#c6a664]/15 border border-[#c6a664]/40 text-[#c6a664] rounded-full text-[9px] sm:text-[10px] uppercase font-bold tracking-widest font-serif">
                  Signature de la Maison
                </span>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-white/50 font-serif font-bold">
                  {spotlightPiece.brand}
                </span>
              </div>

              {/* Large Central Watch Presentation */}
              <div className="relative z-10 my-6 sm:my-8 py-2 sm:py-4 flex items-center justify-center">
                <img
                  src={spotlightPiece.images[0]}
                  alt={spotlightPiece.name}
                  referrerPolicy="no-referrer"
                  className="max-h-[220px] sm:max-h-[320px] 2xl:max-h-[400px] w-auto object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] group-hover:scale-108 transition-transform duration-700 ease-out"
                />
              </div>

              <div className="relative z-10 space-y-3 sm:space-y-4">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-white group-hover:text-[#c6a664] transition-colors">
                    {spotlightPiece.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60 mt-1 line-clamp-2 font-light">
                    {spotlightPiece.shortDescription || spotlightPiece.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/10">
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-widest font-serif block">Prix Horloger</span>
                    <span className="font-serif text-xl sm:text-3xl font-bold text-[#c6a664]">
                      {formatPrice(spotlightPiece.promotionalPrice || spotlightPiece.price)}
                    </span>
                  </div>

                  <Button
                    variant="gold"
                    size="md"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct(spotlightPiece);
                    }}
                    icon={Eye}
                    iconPosition="left"
                    className="font-bold py-2.5 px-4 sm:py-3 sm:px-6 shadow-lg shadow-[#c6a664]/15 text-xs uppercase tracking-wider"
                  >
                    Examiner
                  </Button>
                </div>
              </div>
            </div>

            {/* Satellite Supporting Cards Grid */}
            <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between gap-4 sm:gap-6">
              {satellitePieces.length > 0 ? (
                satellitePieces.map((sat) => (
                  <div
                    key={sat.id}
                    onClick={() => onSelectProduct(sat)}
                    className="flex-1 rounded-2xl bg-[#111116] border border-white/10 hover:border-[#c6a664]/40 p-3.5 sm:p-5 flex items-center gap-4 sm:gap-5 cursor-pointer group transition-all duration-300 hover:bg-[#14141a]"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-black/50 border border-white/10 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={sat.images[0]}
                        alt={sat.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-[9px] text-[#c6a664] font-serif uppercase tracking-widest font-bold">
                        {sat.brand}
                      </div>
                      <h4 className="font-serif text-sm sm:text-base font-semibold text-white group-hover:text-[#c6a664] transition-colors truncate">
                        {sat.name}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-white/50 line-clamp-1 font-light">
                        {sat.shortDescription || sat.description}
                      </p>
                      <div className="pt-1 flex items-center justify-between">
                        <span className="font-serif text-sm sm:text-base font-bold text-[#c6a664]">
                          {formatPrice(sat.promotionalPrice || sat.price)}
                        </span>
                        <span className="text-[10px] text-[#c6a664] uppercase font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Voir</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full rounded-2xl bg-[#111116] border border-white/10 p-6 flex flex-col justify-center space-y-3">
                  <div className="p-3 bg-[#c6a664]/10 border border-[#c6a664]/30 rounded-xl w-fit text-[#c6a664]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-white">
                    Garde-Temps Rares & Certifiés
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed font-light">
                    Toutes nos pièces sont inspectées par des maîtres horlogers et livrées avec écrin et certificat d'authenticité.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => onNavigate('shop')}
                    icon={ArrowRight}
                    iconPosition="right"
                    className="w-fit border-white/20 hover:border-[#c6a664] hover:text-[#c6a664] text-xs"
                  >
                    Catalogue complet
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* ========================================================================= */}
      {/* 3. SECTION : BESTSELLERS & TENDANCES (GRILLE ADAPTATIVE)                  */}
      {/* ========================================================================= */}
      {popularProducts.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="space-y-6 sm:space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-3 sm:pb-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-amber-400 font-serif font-bold">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Tendances Horlogères</span>
              </div>
              <h2 className="font-serif text-xl sm:text-3xl 2xl:text-4xl font-bold text-[#F5F5F0] mt-1">
                Modèles Populaires & Bestsellers
              </h2>
            </div>

            <button
              onClick={() => onNavigate('shop')}
              className="text-xs uppercase tracking-[0.15em] font-semibold text-[#c6a664] hover:text-[#e8d9ad] flex items-center gap-1.5 transition-colors"
            >
              <span>Explorer le catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fluid adaptive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 2xl:gap-8">
            {popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* ========================================================================= */}
      {/* 4. BANNIÈRE IMMERSIVE : SAVOIR-FAIRE & HAUTE HORLOGERIE                   */}
      {/* ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-r from-[#0d0e12] via-[#14151b] to-[#07070a] p-6 sm:p-12 lg:p-16 shadow-2xl"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-radial from-[#c6a664]/15 to-transparent pointer-events-none filter blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#c6a664] font-serif font-bold">
              <Compass className="w-3.5 h-3.5" />
              <span>L'Art & la Précision Mécanique</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl 2xl:text-4xl font-bold text-white leading-tight">
              Une passion inébranlable pour la mécanique d'exception
            </h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-xl leading-relaxed font-light">
              Chaque montre proposée dans notre écrin fait l'objet d'une sélection rigoureuse. Nous ne sélectionnons que des pièces attestées par un historique irréprochable et un état mécanique certifié.
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-1">
              <div className="font-serif text-xl sm:text-3xl font-bold text-[#c6a664]">100%</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/60 font-serif">Certifié Authentique</div>
            </div>
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-1">
              <div className="font-serif text-xl sm:text-3xl font-bold text-[#c6a664]">24-48h</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/60 font-serif">Expédition Sécurisée</div>
            </div>
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-1">
              <div className="font-serif text-xl sm:text-3xl font-bold text-[#c6a664]">VIP</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/60 font-serif">Conciergerie WhatsApp</div>
            </div>
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-1">
              <div className="font-serif text-xl sm:text-3xl font-bold text-[#c6a664]">Écrin</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/60 font-serif">Coffret de Luxe Inclus</div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* 5. SECTION : DERNIÈRES NOUVEAUTÉS ARRIVÉES                                */}
      {/* ========================================================================= */}
      {newArrivals.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="space-y-6 sm:space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-3 sm:pb-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#c6a664] font-serif font-bold">
                <Clock className="w-3.5 h-3.5 text-[#c6a664]" />
                <span>Disponibilité Immédiate</span>
              </div>
              <h2 className="font-serif text-xl sm:text-3xl 2xl:text-4xl font-bold text-[#F5F5F0] mt-1">
                Dernières Nouveautés Horlogères
              </h2>
            </div>

            <button
              onClick={() => onNavigate('shop')}
              className="text-xs uppercase tracking-[0.15em] font-semibold text-[#c6a664] hover:text-[#e8d9ad] flex items-center gap-1.5 transition-colors"
            >
              <span>Consulter toutes les montres</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 2xl:gap-8">
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* ========================================================================= */}
      {/* 6. SECTION : UNIVERS & COLLECTIONS (CATEGORIES)                           */}
      {/* ========================================================================= */}
      {categories.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="space-y-6 sm:space-y-8"
        >
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#c6a664] font-serif font-bold">
              Collections & Univers
            </span>
            <h2 className="font-serif text-xl sm:text-3xl 2xl:text-4xl font-bold text-[#F5F5F0]">
              Explorez par Collection
            </h2>
            <p className="text-xs sm:text-sm text-white/50 font-sans">
              Des garde-temps classiques, sportifs ou habillés conçus selon les plus hauts standards d'exigence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-5 sm:gap-6 2xl:gap-8">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onNavigate('shop', cat.id)}
                className="group relative h-64 sm:h-80 rounded-2xl overflow-hidden border border-white/10 cursor-pointer shadow-xl hover:border-[#c6a664]/60 transition-all duration-500 flex flex-col justify-end p-5 sm:p-8 bg-[#111116]"
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-50"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A20] to-[#0A0A0E]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/65 to-transparent" />

                <div className="relative z-10 space-y-1.5 sm:space-y-2">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-[#c6a664] transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed font-light">
                      {cat.description}
                    </p>
                  )}
                  <div className="pt-2 flex items-center gap-1.5 text-xs text-[#c6a664] font-semibold tracking-wider uppercase group-hover:translate-x-1.5 transition-transform">
                    <span>Explorer</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ========================================================================= */}
      {/* 7. SECTION : PILIERS DE CONFIANCE ET SERVICES                             */}
      {/* ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="bg-gradient-to-b from-[#111116] to-[#0a0a0d] border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-12 2xl:p-16 shadow-xl"
      >
        <div className="text-center space-y-1.5 sm:space-y-2 mb-8 sm:mb-10 max-w-xl mx-auto">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#c6a664] font-serif font-bold">
            Engagement & Rigueur
          </span>
          <h3 className="font-serif text-xl sm:text-3xl 2xl:text-4xl font-bold text-[#F5F5F0]">
            L'Excellence du Service Horloger
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          <div className="flex items-start space-x-3.5 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#c6a664]/30 transition-colors">
            <div className="p-2.5 sm:p-3 bg-[#c6a664]/10 border border-[#c6a664]/25 rounded-xl text-[#c6a664] shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white font-serif">
                Authenticité 100%
              </h4>
              <p className="text-[11px] sm:text-xs text-white/50 mt-1 leading-relaxed font-sans font-light">
                Chaque pièce fait l'objet d'un contrôle rigoureux avec certificat et numéro de série vérifié.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#c6a664]/30 transition-colors">
            <div className="p-2.5 sm:p-3 bg-[#c6a664]/10 border border-[#c6a664]/25 rounded-xl text-[#c6a664] shrink-0">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white font-serif">
                Conciergerie Dédiée
              </h4>
              <p className="text-[11px] sm:text-xs text-white/50 mt-1 leading-relaxed font-sans font-light">
                Conseils personnalisés, photos et vidéos HD sur demande en direct avec notre équipe sur WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#c6a664]/30 transition-colors">
            <div className="p-2.5 sm:p-3 bg-[#c6a664]/10 border border-[#c6a664]/25 rounded-xl text-[#c6a664] shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white font-serif">
                Écrin & Expédition
              </h4>
              <p className="text-[11px] sm:text-xs text-white/50 mt-1 leading-relaxed font-sans font-light">
                Colis scellé haute sécurité, écrin de luxe offert et remise soignée.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#c6a664]/30 transition-colors">
            <div className="p-2.5 sm:p-3 bg-[#c6a664]/10 border border-[#c6a664]/25 rounded-xl text-[#c6a664] shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white font-serif">
                Garantie & Suivi
              </h4>
              <p className="text-[11px] sm:text-xs text-white/50 mt-1 leading-relaxed font-sans font-light">
                Prise en charge complète du mouvement et révision horlogère soignée.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* 8. GRAND CTA DE CLÔTURE & CONCIERGERIE WHATSAPP                           */}
      {/* ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="p-6 sm:p-12 2xl:p-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1a1a22] via-[#121217] to-[#07070a] border border-white/15 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 shadow-2xl relative overflow-hidden"
      >
        <div className="space-y-2 sm:space-y-3 max-w-2xl text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-[#25D366] font-semibold tracking-[0.2em] uppercase font-serif">
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>Service Conciergerie Privée</span>
          </div>
          <h3 className="font-serif text-xl sm:text-3xl 2xl:text-4xl font-bold text-[#F5F5F0]">
            Une recherche spécifique ou une commande sur-mesure ?
          </h3>
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans font-light">
            Notre équipe vous répond en direct sur WhatsApp pour vous conseiller, vous envoyer des vidéos au poignet ou vérifier la disponibilité d'une référence rare.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
          <a
            href={buildWhatsAppChatUrl(
              whatsappNumber,
              customIntro || "Bonjour ! J'aimerais des conseils sur votre collection de montres et les disponibilités."
            )}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 sm:py-4 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-[0.98] transition-all"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Échanger sur WhatsApp</span>
          </a>

          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('shop')}
            icon={ArrowRight}
            iconPosition="right"
            className="w-full sm:w-auto py-3.5 sm:py-4 px-6 border-white/20 hover:border-[#c6a664] hover:text-[#c6a664] text-xs font-bold uppercase tracking-wider"
          >
            Boutique Complète
          </Button>
        </div>
      </motion.section>
    </div>
  );
};
