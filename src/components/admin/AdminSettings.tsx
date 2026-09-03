import React, { useState, useEffect } from 'react';
import {
  Settings,
  MessageSquare,
  DollarSign,
  Truck,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Upload,
  Image as ImageIcon,
  Trash2,
  Watch,
  ExternalLink,
  Copy,
  Check,
  Radio
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { uploadImageFile } from '../../services/storageService';
import { AdminResetModal } from './AdminResetModal';
import { WatchEmblem } from '../common/BrandLogo';
import {
  normalizeWhatsAppNumber,
  formatDisplayWhatsAppNumber,
  validateWhatsAppNumber,
  buildWhatsAppChatUrl
} from '../../utils/whatsapp';

interface AdminSettingsProps {
  settings: StoreSettings;
  onSaveSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  onReSeedDemoData: () => Promise<void>;
  onResetStore?: () => Promise<void>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onSaveSettings,
  onReSeedDemoData,
  onResetStore
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Synchronize internal state whenever settings change upstream
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // WhatsApp helpers
  const cleanWhatsApp = normalizeWhatsAppNumber(formData.whatsappNumber);
  const formattedDisplay = formatDisplayWhatsAppNumber(formData.whatsappNumber);
  const whatsAppValidation = validateWhatsAppNumber(formData.whatsappNumber || '');
  const testWhatsAppUrl = buildWhatsAppChatUrl(
    formData.whatsappNumber,
    formData.whatsappDefaultMessage || formData.contactInformation?.whatsappMessage || "Bonjour ! Ceci est un test de la conciergerie WhatsApp."
  );

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://wa.me/${cleanWhatsApp}`);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      setErrorMsg(null);
      const url = await uploadImageFile(file, 'branding');
      setFormData((prev) => ({ ...prev, logo: url, logoUrl: url }));
      setSuccessMsg('Logo téléversé avec succès. N\'oubliez pas d\'enregistrer.');
    } catch (err) {
      setErrorMsg('Erreur lors de l\'envoi du logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFavicon(true);
      setErrorMsg(null);
      const url = await uploadImageFile(file, 'branding');
      setFormData((prev) => ({ ...prev, faviconUrl: url }));
      setSuccessMsg('Favicon téléversé avec succès. N\'oubliez pas d\'enregistrer.');
    } catch (err) {
      setErrorMsg('Erreur lors de l\'envoi du favicon.');
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!whatsAppValidation.isValid) {
      setErrorMsg(whatsAppValidation.error || 'Numéro WhatsApp invalide.');
      return;
    }

    try {
      setLoading(true);
      await onSaveSettings({
        ...formData,
        storeName: formData.storeName?.trim() || formData.name?.trim() || "L'Écrin du Temps",
        name: formData.name?.trim() || formData.storeName?.trim() || "L'Écrin du Temps",
        whatsappNumber: formData.whatsappNumber?.trim(),
        whatsappDefaultMessage: formData.whatsappDefaultMessage?.trim() || formData.contactInformation?.whatsappMessage?.trim()
      });
      setSuccessMsg('Paramètres de la boutique enregistrés avec succès. Toutes les fonctionnalités WhatsApp sont synchronisées.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg('Erreur lors de l\'enregistrement des paramètres.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (window.confirm('Voulez-vous recharger le catalogue avec les montres et catégories d\'origine ?')) {
      try {
        setSeeding(true);
        await onReSeedDemoData();
        setSuccessMsg('Catalogue de démonstration rechargé avec succès.');
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err) {
        setErrorMsg('Erreur lors du rechargement des données.');
      } finally {
        setSeeding(false);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-4xl text-[var(--text)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--sep)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--or)]" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--text)] uppercase tracking-wide">
              Paramètres de la Boutique
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-soft)] mt-1">
            Gestion centralisée de l'identité, du numéro WhatsApp professionnel, des messages par défaut et des devises.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">WhatsApp Connecté :</span>
          <span className="font-mono font-bold text-[var(--text)]">{cleanWhatsApp ? `+${cleanWhatsApp}` : 'Non configuré'}</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ==================================================== */}
        {/* 1. GESTION DU NUMÉRO WHATSAPP PROFESSIONNEL (PRIORITÉ) */}
        {/* ==================================================== */}
        <div className="p-6 bg-[var(--carte-bg)] rounded-2xl border-2 border-[var(--or)]/40 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--sep)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366]">
                <MessageSquare className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-2">
                  <span>Numéro WhatsApp Professionnel</span>
                  <span className="text-[10px] px-2 py-0.5 bg-[#25D366]/15 text-emerald-600 dark:text-[#25D366] rounded-md font-sans border border-[#25D366]/30 uppercase tracking-widest font-semibold">
                    Source Unique
                  </span>
                </h3>
                <p className="text-[11px] text-[var(--text-soft)]">
                  Le numéro WhatsApp utilisé dynamiquement sur l'ensemble du site et du panier d'achat.
                </p>
              </div>
            </div>

            {/* Current Active Number Badge */}
            <div className="bg-[var(--bg-2)] border border-[var(--sep)] rounded-xl px-3.5 py-2 flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Actif :</span>
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-[#25D366]">
                {formattedDisplay}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Input field for WhatsApp number */}
            <div className="space-y-2">
              <label htmlFor="settings-whatsapp-number" className="block text-xs text-[var(--text)] font-semibold">
                Numéro WhatsApp de réception <span className="text-[var(--or)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  id="settings-whatsapp-number"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="Ex: +237 6 99 00 11 22 ou +33 6 12 34 56 78"
                  className={`w-full bg-[var(--input-bg)] border ${
                    whatsAppValidation.isValid ? 'border-[var(--input-border)] focus:border-[var(--or)]' : 'border-rose-500'
                  } rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none font-mono tracking-wider shadow-xs`}
                />
              </div>
              <p className="text-[11px] text-[var(--text-soft)] leading-relaxed font-sans">
                Saisissez le numéro avec l'indicatif international (ex: <code className="text-[var(--or)] font-mono font-bold">+237...</code> pour le Cameroun, <code className="text-[var(--or)] font-mono font-bold">+33...</code> pour la France, <code className="text-[var(--or)] font-mono font-bold">+225...</code> pour la Côte d'Ivoire).
              </p>
              {!whatsAppValidation.isValid && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{whatsAppValidation.error}</span>
                </p>
              )}
            </div>

            {/* Generated wa.me URL Preview & Quick Test */}
            <div className="bg-[var(--carte-bg-subtle)] rounded-xl border border-[var(--sep)] p-4 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold block mb-1">
                  Lien direct généré automatiquement
                </span>
                <div className="flex items-center gap-2 bg-[var(--bg)] px-3 py-2 rounded-lg border border-[var(--sep)] text-xs font-mono text-emerald-600 dark:text-[#25D366] overflow-hidden">
                  <span className="truncate">https://wa.me/{cleanWhatsApp}</span>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="ml-auto text-[var(--text-muted)] hover:text-[var(--text)] p-1 transition-colors"
                    title="Copier le lien"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={testWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-emerald-700 dark:text-[#25D366] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Tester le lien WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Customizable Default WhatsApp Message */}
          <div className="pt-2 border-t border-[var(--sep)] space-y-2">
            <label htmlFor="settings-whatsapp-default-message" className="block text-xs text-[var(--text)] font-semibold">
              Message WhatsApp par défaut (Information & Conseil)
            </label>
            <textarea
              id="settings-whatsapp-default-message"
              rows={2}
              value={formData.whatsappDefaultMessage || formData.contactInformation?.whatsappMessage || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  whatsappDefaultMessage: e.target.value,
                  contactInformation: {
                    ...formData.contactInformation,
                    whatsappMessage: e.target.value
                  }
                })
              }
              placeholder="Ex: Bonjour, je souhaite obtenir des informations sur cette montre d'exception et connaître sa disponibilité."
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl p-3 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none resize-none leading-relaxed font-sans shadow-xs"
            />
            <div className="p-3 bg-[var(--carte-bg-subtle)] border border-[var(--sep)] rounded-xl text-[11px] text-[var(--text-soft)] leading-relaxed space-y-1">
              <span className="font-semibold text-[var(--or)] block font-serif uppercase tracking-wider text-[10px]">
                Structure automatique des messages de commande :
              </span>
              <p>
                Pour chaque commande validée par un client, le système compose automatiquement un message structuré contenant : <strong>Nom du client</strong>, <strong>N° de commande</strong>, <strong>Liste des montres avec photos et prix</strong>, <strong>Frais d'expédition</strong>, <strong>Total officiel</strong> et <strong>Adresse de livraison</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 2. IDENTITÉ VISUELLE & BRANDING DE LA BOUTIQUE      */}
        {/* ==================================================== */}
        <div className="p-6 bg-[var(--carte-bg)] rounded-2xl border border-[var(--sep)] shadow-sm space-y-5">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[var(--or)] flex items-center gap-2">
            <Watch className="w-4 h-4" />
            <span>Identité Visuelle & Logo de la Maison</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="settings-store-name" className="block text-xs text-[var(--text)] font-medium mb-1">
                  Nom de la Boutique / Maison <span className="text-[var(--or)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="settings-store-name"
                  value={formData.name || formData.storeName || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, storeName: e.target.value })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label htmlFor="settings-store-description" className="block text-xs text-[var(--text)] font-medium mb-1">
                  Description courte / Slogan
                </label>
                <textarea
                  id="settings-store-description"
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Maison d'Horlogerie de Prestige & Garde-Temps d'Exception"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none resize-none shadow-xs"
                />
              </div>

              <div>
                <label htmlFor="settings-favicon-url" className="block text-xs text-[var(--text)] font-medium mb-1">
                  URL de l'Icône / Favicon
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="settings-favicon-url"
                    value={formData.faviconUrl || ''}
                    onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                    placeholder="/favicon.svg ou https://..."
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none font-mono text-[11px] shadow-xs"
                  />
                  <label className="cursor-pointer px-3 py-2 bg-[var(--bg-2)] hover:bg-[var(--badge-bg)] border border-[var(--sep)] text-[var(--text)] rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[var(--or)]" />
                    <span>{uploadingFavicon ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconUpload}
                      disabled={uploadingFavicon}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Logo Manager & Preview */}
            <div className="space-y-3">
              <label className="block text-xs text-[var(--text)] font-medium">
                Prévisualisation du Logo & de la Marque
              </label>

              <div className="p-4 bg-[var(--carte-bg-subtle)] rounded-xl border border-[var(--sep)] space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[var(--sep)] pb-3">
                  <div className="flex items-center gap-3">
                    <WatchEmblem size={44} />
                    <div>
                      <div className="text-xs font-serif font-bold text-[var(--or)] uppercase tracking-wider">
                        {formData.name || formData.storeName || "L'Écrin du Temps"}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-serif tracking-[0.2em] uppercase">
                        Horlogerie d'Exception
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 bg-[var(--or)]/10 text-[var(--or)] border border-[var(--or)]/30 rounded-full font-medium">
                    Logo Actif
                  </span>
                </div>

                {/* Custom Logo Upload & Override */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="text-xs text-[var(--text-soft)]">
                    {formData.logo && !formData.logo.includes('logo-dark') ? (
                      <span className="text-emerald-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Logo personnalisé actif
                      </span>
                    ) : (
                      <span>Emblème et typographie vectorielle officielle.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-[var(--bg-2)] hover:bg-[var(--badge-bg)] border border-[var(--sep)] text-[var(--text)] rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[var(--or)]" />
                      <span>{uploadingLogo ? 'Envoi...' : 'Téléverser'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>

                    {formData.logo && !formData.logo.includes('logo-dark') && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: '/logo-dark.svg', logoUrl: '/logo-dark.svg' })}
                        className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-lg hover:bg-[var(--bg-2)] transition-colors"
                        title="Rétablir le logo officiel vectoriel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 3. DEVISE & GESTION DES STOCKS                       */}
        {/* ==================================================== */}
        <div className="p-6 bg-[var(--carte-bg)] rounded-2xl border border-[var(--sep)] shadow-sm space-y-4">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[var(--or)] flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Devise & Alertes de Stock</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="settings-currency" className="block text-xs text-[var(--text)] font-medium mb-1">
                Symbole Devise
              </label>
              <select
                id="settings-currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2.5 text-xs text-[var(--text)] focus:outline-none shadow-xs"
              >
                <option value="€">EUR (€)</option>
                <option value="FCFA">FCFA (XOF / XAF)</option>
                <option value="CHF">CHF (Franc Suisse)</option>
                <option value="$">USD ($)</option>
                <option value="MAD">MAD (Dirham Marocain)</option>
                <option value="CAD">CAD ($ Canadien)</option>
                <option value="£">GBP (£)</option>
              </select>
            </div>

            <div>
              <label htmlFor="settings-default-low-stock" className="block text-xs text-[var(--text)] font-medium mb-1">
                Seuil d'alerte stock faible
              </label>
              <input
                type="number"
                min="1"
                id="settings-default-low-stock"
                value={formData.defaultLowStockThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, defaultLowStockThreshold: Number(e.target.value) })
                }
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2.5 text-xs text-[var(--text)] focus:outline-none font-mono shadow-xs"
              />
            </div>

            <div>
              <label htmlFor="settings-shipping-fee" className="block text-xs text-[var(--text)] font-medium mb-1">
                Frais d'expédition ({formData.currency})
              </label>
              <input
                type="number"
                min="0"
                id="settings-shipping-fee"
                value={formData.shippingFee}
                onChange={(e) =>
                  setFormData({ ...formData, shippingFee: Number(e.target.value) })
                }
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2.5 text-xs text-[var(--text)] focus:outline-none font-mono shadow-xs"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                0 = Frais de port offerts aux clients.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="settings-shipping-msg" className="block text-xs text-[var(--text)] font-medium mb-1">
              Conditions et message d'expédition
            </label>
            <input
              type="text"
              id="settings-shipping-msg"
              value={formData.shippingMessage || ''}
              onChange={(e) => setFormData({ ...formData, shippingMessage: e.target.value })}
              placeholder="Ex: Expédition sécurisée sous 24-48h avec assurance valeur déclarée"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none shadow-xs"
            />
          </div>
        </div>

        {/* ==================================================== */}
        {/* 4. INFORMATIONS DE CONTACT & RÉSEAUX SOCIAUX         */}
        {/* ==================================================== */}
        <div className="p-6 bg-[var(--carte-bg)] rounded-2xl border border-[var(--sep)] shadow-sm space-y-4">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[var(--or)] flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>Coordonnées Publiques & Réseaux Sociaux</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text)] font-medium mb-1">
                Email de contact
              </label>
              <input
                type="email"
                value={formData.contactInformation?.email || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInformation: {
                      ...formData.contactInformation,
                      email: e.target.value
                    }
                  })
                }
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text)] font-medium mb-1">
                Téléphone d'accueil
              </label>
              <input
                type="tel"
                value={formData.contactInformation?.phone || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInformation: {
                      ...formData.contactInformation,
                      phone: e.target.value
                    }
                  })
                }
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text)] font-medium mb-1">
                Adresse / Showroom
              </label>
              <input
                type="text"
                value={formData.contactInformation?.address || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInformation: {
                      ...formData.contactInformation,
                      address: e.target.value
                    }
                  })
                }
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs text-[var(--text)] font-medium mb-1">
                Lien Instagram
              </label>
              <input
                type="url"
                value={formData.socialLinks?.instagram || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialLinks: {
                      ...formData.socialLinks,
                      instagram: e.target.value
                    }
                  })
                }
                placeholder="https://instagram.com/..."
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text)] font-medium mb-1">
                Lien Facebook
              </label>
              <input
                type="url"
                value={formData.socialLinks?.facebook || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialLinks: {
                      ...formData.socialLinks,
                      facebook: e.target.value
                    }
                  })
                }
                placeholder="https://facebook.com/..."
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 5. SÉCURITÉ & ZONE DE RÉINITIALISATION               */}
        {/* ==================================================== */}
        <div className="p-5 bg-[var(--carte-bg)] border border-[var(--sep)] rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[var(--text)] font-serif text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-[var(--or)]" />
            <span>Sécurité & Rôle Administrateur</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-[var(--carte-bg-subtle)] rounded-xl border border-[var(--sep)] space-y-1">
              <div className="flex items-center gap-1.5 text-[var(--text)] font-medium">
                <UserCheck className="w-3.5 h-3.5 text-[var(--or)]" />
                <span>Session Administrateur Active</span>
              </div>
              <p className="text-[var(--text-soft)] font-mono text-[11px] truncate">
                {user?.email || 'Compte Propriétaire Authentifié'}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                Règles de sécurité Firestore actives (CRUD réservé à l'administrateur)
              </p>
            </div>

            <div className="p-3.5 bg-[var(--carte-bg-subtle)] rounded-xl border border-[var(--sep)] space-y-1">
              <span className="text-[var(--text)] font-medium block">Collections Protégées</span>
              <p className="text-[var(--text-soft)] text-[11px]">
                /products, /categories, /orders, /settings, /admins
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                Synchronisation temps réel Firestore activée
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone & Reset Store */}
        <div className="p-5 bg-rose-500/10 border border-rose-500/25 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Zone de Réinitialisation (RESET)</span>
              </h4>
              <p className="text-[11px] text-[var(--text-soft)]">
                Purger les commandes et le catalogue de test avant le lancement réel en production.
              </p>
            </div>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setResetModalOpen(true)}
              icon={Trash2}
              className="text-xs"
            >
              RESET Boutique
            </Button>
          </div>
        </div>

        {/* Action Controls & Save */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--sep)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSeed}
            loading={seeding}
            icon={RotateCcw}
            className="text-xs"
          >
            Recharger le catalogue de démo
          </Button>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            loading={loading}
            id="settings-save-btn"
            icon={Save}
            className="w-full sm:w-auto px-8 py-3.5 uppercase tracking-wider text-xs font-bold shadow-lg"
          >
            Enregistrer les modifications
          </Button>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      <AdminResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onResetComplete={async () => {
          if (onResetStore) {
            await onResetStore();
          }
          setSuccessMsg('Boutique réinitialisée avec succès. Prête pour le lancement.');
        }}
      />
    </div>
  );
};
