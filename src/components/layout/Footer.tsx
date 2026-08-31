import React from 'react';
import { ShieldCheck, Truck, Clock, MessageSquare, Instagram, Facebook, Phone, Mail, MapPin } from 'lucide-react';
import { StoreSettings } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import { normalizeWhatsAppNumber, buildWhatsAppChatUrl } from '../../utils/whatsapp';

interface FooterProps {
  settings?: StoreSettings;
  storeName?: string;
  whatsappNumber?: string;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, storeName, whatsappNumber, onNavigate }) => {
  const name = storeName || settings?.storeName || settings?.name || "L'ÉCRIN DU TEMPS";
  const rawWhatsApp = whatsappNumber || settings?.whatsappNumber || '+237600000000';
  const customIntro = settings?.whatsappDefaultMessage || settings?.contactInformation?.whatsappMessage || "Bonjour ! J'aimerais échanger avec votre conciergerie WhatsApp.";

  return (
    <footer className="bg-[#080808] text-white/70 border-t border-white/10 mt-auto">
      {/* Reassurance Pillars */}
      <div className="border-b border-white/5 bg-[#0D0D0D] py-12">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start space-x-4">
              <div className="p-3.5 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-xl text-[#D4AF37] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#F5F5F0] font-serif">
                  100% Authentique
                </h4>
                <p className="text-xs text-white/50 mt-1.5 leading-relaxed font-sans">
                  Chaque garde-temps fait l'objet d'un contrôle rigoureux avec certificat d'authenticité.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3.5 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-xl text-[#D4AF37] shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#F5F5F0] font-serif">
                  Conciergerie WhatsApp
                </h4>
                <p className="text-xs text-white/50 mt-1.5 leading-relaxed font-sans">
                  Conseils personnalisés, photos et vidéos HD sur demande en direct avec la gérante.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3.5 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-xl text-[#D4AF37] shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#F5F5F0] font-serif">
                  Livraison Sous Écrin
                </h4>
                <p className="text-xs text-white/50 mt-1.5 leading-relaxed font-sans">
                  Colis scellé haute sécurité, écrin de luxe offert et remise en main propre sécurisée.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3.5 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-xl text-[#D4AF37] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#F5F5F0] font-serif">
                  Garantie 24 Mois
                </h4>
                <p className="text-xs text-white/50 mt-1.5 leading-relaxed font-sans">
                  Prise en charge complète du mouvement et révision horlogère soignée.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Presentation */}
          <div className="space-y-4 md:col-span-1">
            <button
              onClick={() => onNavigate('home')}
              className="text-left hover:opacity-90 transition-opacity"
            >
              <BrandLogo variant="horizontal" theme="dark" size="sm" />
            </button>
            <p className="text-xs text-white/50 leading-relaxed font-sans">
              Sélection exclusive de pièces d'horlogerie d'exception. Alliance entre tradition mécanique, élégance intemporelle et service sur-mesure.
            </p>
            <div className="flex space-x-3 pt-2">
              {settings?.socialLinks?.instagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-white/5 hover:bg-[#D4AF37]/10 border border-white/10 hover:border-[#D4AF37]/30 text-white/70 hover:text-[#D4AF37] rounded-lg transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings?.socialLinks?.facebook && (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-white/5 hover:bg-[#D4AF37]/10 border border-white/10 hover:border-[#D4AF37]/30 text-white/70 hover:text-[#D4AF37] rounded-lg transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37] font-serif mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="text-white/60 hover:text-[#D4AF37] transition-colors uppercase tracking-wider"
                >
                  Boutique & Montres
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="text-white/60 hover:text-[#D4AF37] transition-colors uppercase tracking-wider"
                >
                  À propos de la Maison
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('search')}
                  className="text-white/60 hover:text-[#D4AF37] transition-colors uppercase tracking-wider"
                >
                  Recherche Rapide
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('account')}
                  className="text-white/60 hover:text-[#D4AF37] transition-colors uppercase tracking-wider"
                >
                  Espace Client
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & WhatsApp */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37] font-serif mb-4">
              Service Client
            </h4>
            <ul className="space-y-3 text-xs text-white/60">
              {settings?.contactInformation?.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>{settings.contactInformation.phone}</span>
                </li>
              )}
              {settings?.contactInformation?.email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>{settings.contactInformation.email}</span>
                </li>
              )}
              {settings?.contactInformation?.address && (
                <li className="flex items-center gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>{settings.contactInformation.address}</span>
                </li>
              )}
              <li className="pt-2">
                <a
                  href={buildWhatsAppChatUrl(rawWhatsApp, customIntro)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-[#25D366] hover:text-[#3ce680] font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse inline-block" />
                  <span>Discuter en direct sur WhatsApp</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Boutique Pillars / Informations */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37] font-serif mb-4">
              Maison & Écrin
            </h4>
            <p className="text-xs text-white/50 mb-3 leading-relaxed">
              Maison spécialisée dans l'horlogerie d'exception, les modèles automatiques, chronographes de prestige et pièces d'horlogerie exclusives.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#D4AF37]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Certificats & Garantie Atelier 2 ans</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 tracking-wider uppercase gap-4 select-none">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} {name}.{' '}
            <span
              id="footer-secret-cms-trigger"
              onClick={() => onNavigate('admin')}
              className="cursor-default hover:text-white/70 transition-colors"
              title=""
            >
              Tous droits réservés.
            </span>
          </p>
          
          <p className="text-white/30 text-[10px] tracking-widest">
            Maison d'Horlogerie de Prestige & Conciergerie WhatsApp
          </p>
        </div>
      </div>
    </footer>
  );
};
