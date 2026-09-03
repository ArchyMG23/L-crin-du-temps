import React from 'react';
import {
  ShieldCheck,
  MessageSquare,
  Truck,
  Clock,
  Sparkles,
  Award,
  ArrowRight,
  Gem,
  CheckCircle2,
  Compass,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { Button } from '../ui/Button';

interface AboutViewProps {
  settings?: StoreSettings;
  onNavigate: (view: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ settings, onNavigate }) => {
  const storeTitle = settings?.storeName || "L'ÉCRIN DU TEMPS";
  const whatsappNumber = settings?.whatsappNumber || '+33600000000';
  const cleanWhatsApp = whatsappNumber.replace(/[^0-9]/g, '');

  const commitments = [
    {
      icon: ShieldCheck,
      title: 'Authenticité & Traçabilité 100%',
      description:
        'Chaque montre de notre collection est rigoureusement expertisée par nos spécialistes : vérification du numéro de série, conformité du calibre et délivrance d’un certificat de garantie.'
    },
    {
      icon: MessageSquare,
      title: 'Conciergerie Privée WhatsApp',
      description:
        'Une expérience d’achat sur-mesure et réactive. Obtenez en direct des vidéos HD de la montre au poignet, des conseils personnalisés et une prise en charge immédiate.'
    },
    {
      icon: Truck,
      title: 'Écrin de Luxe & Envoi Haute Sécurité',
      description:
        'Toutes nos pièces sont soigneusement présentées dans leur écrin haute facture et expédiées sous colis scellé avec assurance ad valorem et remise contre signature.'
    },
    {
      icon: Clock,
      title: 'Garantie Mécanique 24 Mois',
      description:
        'Nous garantissons le parfait fonctionnement mécanique de chaque garde-temps. Notre atelier d’horlogerie partenaire assure les révisions et réglages de haute précision.'
    }
  ];

  const standards = [
    {
      step: '01',
      title: 'Sélection Exigeante',
      detail: 'Seules les pièces d’exception répondant à nos critères stricts de finition et d’esthétique rejoignent la collection.'
    },
    {
      step: '02',
      title: 'Contrôle Chronométrique',
      detail: 'Test d’amplitude, de précision au chronocomparateur et vérification de la réserve de marche.'
    },
    {
      step: '03',
      title: 'Contrôle d’Étanchéité',
      detail: 'Vérification méticuleuse des joints, du boîtier et de la couronne selon les spécifications d’origine.'
    },
    {
      step: '04',
      title: 'Préparation Personnalisée',
      detail: 'Mise à taille du bracelet à votre poignet et conditionnement sous scellé avant expédition sécurisée.'
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 text-[var(--text)]">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER DE LA MAISON                                               */}
      {/* ========================================================================= */}
      <section className="relative rounded-3xl overflow-hidden border border-[var(--sep)] bg-[var(--carte-bg)] p-8 sm:p-14 lg:p-20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)]/95 via-[var(--bg)]/75 to-transparent z-0 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--or)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--badge-bg)] border border-[var(--badge-border)] text-[var(--or)] text-[10px] font-bold tracking-[0.25em] uppercase font-serif">
            <Sparkles className="w-3.5 h-3.5 text-[var(--or)]" />
            <span>Maison d'Horlogerie & Haute Exigence</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text)] leading-tight">
            La Passion du Garde-Temps et de l'Excellence Mécanique
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-soft)] leading-relaxed font-sans font-light">
            Fondée avec la volonté d'offrir une expérience horlogère prestigieuse, accessible et personnalisée, <strong className="text-[var(--text)] font-medium">{storeTitle}</strong> sélectionne des garde-temps rares et remarquables pour les passionnés et collectionneurs exigeants.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Button
              variant="gold"
              size="lg"
              onClick={() => onNavigate('shop')}
              icon={ArrowRight}
              iconPosition="right"
              className="py-3.5 px-6 font-bold"
            >
              Explorer le Catalogue
            </Button>

            <a
              href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
                `Bonjour ${storeTitle}, j'aimerais en savoir plus sur vos services et collections.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>Contacter notre Conciergerie</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. NOTRE PHILOSOPHIE & HISTOIRE                                           */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--or)] font-serif font-bold">
            <Gem className="w-4 h-4 text-[var(--or)]" />
            <span>Notre Philosophie</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text)]">
            L'Art de Capturer le Temps avec Noblesse
          </h2>

          <div className="space-y-4 text-xs sm:text-sm text-[var(--text-soft)] font-sans leading-relaxed">
            <p>
              Une montre ne se résume pas à donner l'heure : elle témoigne d'un savoir-faire artisanal séculaire, d'une personnalité et d'un héritage que l'on transmet.
            </p>
            <p>
              Chez <strong className="text-[var(--text)]">{storeTitle}</strong>, nous mettons un point d'honneur à allier la rigueur technique de l'expertise horlogère à la proximité d'un service de conciergerie privée. Chaque client bénéficie d'un accompagnement personnalisé tout au long de sa démarche.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[var(--carte-bg)] border border-[var(--sep)] space-y-1 shadow-sm">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[var(--or)]">100%</span>
              <p className="text-xs text-[var(--text-soft)] font-medium">Contrôle d'authenticité certifié</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--carte-bg)] border border-[var(--sep)] space-y-1 shadow-sm">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[var(--or)]">24h</span>
              <p className="text-xs text-[var(--text-soft)] font-medium">Réactivité conciergerie WhatsApp</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 relative">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-[var(--sep)] bg-[var(--carte-bg)] shadow-2xl relative">
            <img
              src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1000"
              alt="Atelier d'horlogerie"
              className="w-full h-full object-cover opacity-85 filter contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-[var(--carte-bg)]/90 backdrop-blur-md p-4 rounded-2xl border border-[var(--sep)] flex items-center justify-between shadow-lg">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-widest text-[var(--or)] font-semibold">Atelier & Expertise</span>
                <p className="font-serif text-xs font-bold text-[var(--text)]">Chaque composant vérifié avec précision</p>
              </div>
              <Award className="w-6 h-6 text-[var(--or)] shrink-0" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LES 4 PILIERS D'ENGAGEMENT                                             */}
      {/* ========================================================================= */}
      <section className="space-y-10">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--or)] font-serif font-bold">
            Garanties & Confiance
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text)]">
            Les 4 Engagements de la Maison
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-sans">
            Des engagements stricts pour vous assurer une sérénité totale lors de chaque acquisition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commitments.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-[var(--carte-bg)] p-6 sm:p-8 rounded-3xl border border-[var(--sep)] hover:border-[var(--or)]/40 transition-all duration-300 flex flex-col justify-between space-y-4 group shadow-sm"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] border border-[var(--badge-border)] flex items-center justify-center text-[var(--or)] group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[var(--text)] group-hover:text-[var(--or)] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-soft)] leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--or)] font-semibold tracking-wider uppercase pt-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Protocole Approuvé</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. NOTRE PROTOCOLE D'EXPERTISES                                           */}
      {/* ========================================================================= */}
      <section className="bg-[var(--bg-2)] border border-[var(--sep)] rounded-3xl p-8 sm:p-12 shadow-xl space-y-10">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--or)] font-serif font-bold">
            Savoir-Faire & Rigueur
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text)]">
            Le Protocole d'Expertise en 4 Étapes
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-sans">
            Avant chaque expédition, chaque modèle suit un parcours de vérification pointu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {standards.map((std, idx) => (
            <div
              key={idx}
              className="bg-[var(--carte-bg)] p-6 rounded-2xl border border-[var(--sep)] space-y-3 relative overflow-hidden shadow-sm"
            >
              <span className="font-serif text-3xl font-bold text-[var(--text)]/10 absolute top-4 right-4 select-none">
                {std.step}
              </span>
              <div className="w-8 h-8 rounded-full bg-[var(--badge-bg)] border border-[var(--badge-border)] text-[var(--or)] text-xs font-bold flex items-center justify-center font-serif">
                {std.step}
              </div>
              <h4 className="font-serif text-base font-bold text-[var(--text)]">
                {std.title}
              </h4>
              <p className="text-xs text-[var(--text-soft)] leading-relaxed font-sans">
                {std.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. COORDONNÉES & CONTACT CONCIERGERIE                                     */}
      {/* ========================================================================= */}
      <section className="p-8 sm:p-12 rounded-3xl bg-[var(--carte-bg)] border border-[var(--sep)] shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 text-xs text-[#25D366] font-semibold tracking-[0.2em] uppercase font-serif">
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Service Conciergerie Privée</span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text)]">
            Une recherche de modèle particulier ou une question ?
          </h3>

          <p className="text-xs sm:text-sm text-[var(--text-soft)] leading-relaxed font-sans">
            Nous sommes à votre disposition pour vous orienter, vous transmettre des vidéos sous différents angles ou organiser une commande personnalisée.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-[var(--text-soft)]">
            {settings?.contactInformation?.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[var(--or)]" />
                {settings.contactInformation.phone}
              </span>
            )}
            {settings?.contactInformation?.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[var(--or)]" />
                {settings.contactInformation.email}
              </span>
            )}
            {settings?.contactInformation?.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--or)]" />
                {settings.contactInformation.address}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <a
            href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
              `Bonjour ${storeTitle}, je souhaiterais échanger avec votre conciergerie à propos de votre catalogue.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="px-7 py-4 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.98]"
          >
            <MessageSquare className="w-4.5 h-4.5 fill-current" />
            <span>Échanger sur WhatsApp</span>
          </a>

          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('shop')}
            icon={ArrowRight}
            iconPosition="right"
            className="py-4 px-6 border-[var(--sep)] hover:border-[var(--or)] hover:text-[var(--or)] text-[var(--text)]"
          >
            Voir la Boutique
          </Button>
        </div>
      </section>
    </div>
  );
};
