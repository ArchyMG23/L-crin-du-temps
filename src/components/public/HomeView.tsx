import React from 'react';
import { Sparkles, ArrowRight, MessageSquare, Award } from 'lucide-react';
import { Product, Category, StoreSettings } from '../../types';
import { ProductCard } from './ProductCard';
import { Button } from '../ui/Button';

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
  const featuredProducts = products.filter(p => p.featured && p.active);
  const activeProducts = products.filter(p => p.active);
  const recentProducts = activeProducts.slice(0, 6);

  return (
    <div className="space-y-16 sm:space-y-24 text-[#F5F5F0]">
      {/* Hero Section */}
      <section className="relative min-h-[560px] lg:min-h-[620px] rounded-2xl overflow-hidden border border-white/10 bg-[#0A0A0A] flex items-center justify-center text-center p-6 sm:p-12 shadow-2xl">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1920"
            alt="Haute Horlogerie"
            className="w-full h-full object-cover opacity-25 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#0A0A0A]/60 to-[#0A0A0A]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold tracking-[0.25em] uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Sélection Exclusive 2026</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            L'Excellence Horlogère à Portée de Main
          </h1>

          <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto leading-relaxed font-sans font-light">
            Des garde-temps d'exception sélectionnés avec rigueur. Découvrez nos collections et commandez directement auprès de notre conciergerie WhatsApp.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              variant="gold"
              size="lg"
              id="hero-shop-btn"
              onClick={() => onNavigate('shop')}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full sm:w-auto shadow-lg shadow-[#D4AF37]/15 py-3.5 px-7"
            >
              Découvrir le Catalogue
            </Button>

            <button
              id="hero-men-btn"
              onClick={() => onNavigate('men')}
              className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white border border-white/15 rounded-lg text-xs font-semibold tracking-[0.15em] uppercase transition-all"
            >
              Collection Hommes
            </button>

            <button
              id="hero-women-btn"
              onClick={() => onNavigate('women')}
              className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white border border-white/15 rounded-lg text-xs font-semibold tracking-[0.15em] uppercase transition-all"
            >
              Collection Femmes
            </button>
          </div>
        </div>
      </section>

      {/* Featured Watches (Pièces Maîtresses) */}
      {featuredProducts.length > 0 && (
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#D4AF37] font-serif font-bold">
                <Award className="w-4 h-4 text-[#D4AF37]" />
                <span>Sélection de la Maison</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F5F0] mt-1">
                Pièces Maîtresses en Vedette
              </h2>
            </div>

            <button
              onClick={() => onNavigate('shop')}
              className="text-xs uppercase tracking-[0.15em] font-semibold text-[#D4AF37] hover:text-[#B8962F] flex items-center gap-1.5 transition-colors"
            >
              <span>Voir toute la collection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.slice(0, 3).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* Categories Showcase */}
      {categories.length > 0 && (
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF37] font-serif font-bold">
              Univers & Styles
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F5F0]">
              Nos Collections Horlogères
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onNavigate('shop', cat.id)}
                className="group relative h-72 rounded-2xl overflow-hidden border border-white/10 cursor-pointer shadow-lg hover:border-[#D4AF37]/50 transition-all duration-300 flex flex-col justify-end p-6 bg-[#111111]"
              >
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=600'}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />

                <div className="relative z-10 space-y-1">
                  <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-xs text-[#D4AF37] font-semibold tracking-wider uppercase group-hover:translate-x-1 transition-transform">
                    <span>Explorer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Catalog Highlights */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37] font-serif font-bold">
              Disponibilité Immédiate
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F5F0] mt-1">
              Dernières Arrivées
            </h2>
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="text-xs uppercase tracking-[0.15em] font-semibold text-[#D4AF37] hover:text-[#B8962F] flex items-center gap-1.5 transition-colors"
          >
            <span>Toutes les montres</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* WhatsApp Concierge Banner */}
      <section className="p-8 sm:p-12 rounded-2xl bg-[#111111] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs text-[#25D366] font-semibold tracking-[0.2em] uppercase font-serif">
            <MessageSquare className="w-4 h-4" />
            <span>Service Conciergerie Dédié</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F5F0]">
            Une question ou une recherche spécifique ?
          </h3>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-sans">
            Notre gérante vous répond directement sur WhatsApp pour vous conseiller, vous envoyer des vidéos haute définition de la montre au poignet ou vérifier une disponibilité.
          </p>
        </div>

        <a
          href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
            "Bonjour ! J'aimerais des conseils sur votre collection de montres."
          )}`}
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-[0.98] transition-all shrink-0"
        >
          <MessageSquare className="w-4 h-4 fill-current" />
          <span>Discuter avec notre experte</span>
        </a>
      </section>
    </div>
  );
};
