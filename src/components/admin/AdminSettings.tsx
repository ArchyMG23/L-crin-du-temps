import React, { useState } from 'react';
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
  Watch
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { uploadImageFile } from '../../services/storageService';

interface AdminSettingsProps {
  settings: StoreSettings;
  onSaveSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  onReSeedDemoData: () => Promise<void>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onSaveSettings,
  onReSeedDemoData
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      setErrorMsg(null);
      const url = await uploadImageFile(file, 'branding');
      setFormData(prev => ({ ...prev, logo: url }));
      setSuccessMsg('Logo téléversé avec succès. N\'oubliez pas d\'enregistrer.');
    } catch (err) {
      setErrorMsg('Erreur lors de l\'envoi du logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      setLoading(true);
      await onSaveSettings(formData);
      setSuccessMsg('Paramètres de la boutique enregistrés avec succès dans Firestore.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg('Erreur lors de l\'enregistrement des paramètres.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (window.confirm('Voulez-vous réinitialiser le catalogue avec les montres et catégories de démonstration ?')) {
      try {
        setSeeding(true);
        await onReSeedDemoData();
        setSuccessMsg('Données de démonstration réinitialisées avec succès.');
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err) {
        setErrorMsg('Erreur lors de la réinitialisation des données.');
      } finally {
        setSeeding(false);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="font-serif text-xl font-bold text-stone-100">
          Paramètres Généraux de la Boutique
        </h2>
        <p className="text-xs text-stone-400 mt-0.5">
          Configurez votre identité visuelle, votre numéro WhatsApp de réception, vos devises et conditions de livraison.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-700 text-rose-200 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand & Logo Card */}
        <div className="p-6 bg-stone-900/60 rounded-2xl border border-stone-800 space-y-4">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
            <Watch className="w-4 h-4" />
            <span>Identité Visuelle & Logo</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-300 font-medium mb-1">
                  Nom de la Boutique / Maison <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="settings-store-name"
                  value={formData.name || formData.storeName || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, storeName: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-300 font-medium mb-1">
                  Description courte / Slogan
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Maison d'Horlogerie de Prestige & Garde-Temps d'Exception"
                  className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Logo Manager */}
            <div className="space-y-2">
              <label className="block text-xs text-stone-300 font-medium mb-1">
                Logo de la Maison
              </label>

              <div className="flex items-center gap-4 p-3 bg-stone-950 rounded-xl border border-stone-800">
                <div className="w-16 h-16 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Watch className="w-8 h-8 text-[#D4AF37]" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingLogo ? 'Envoi...' : 'Changer le logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>

                    {formData.logo && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: undefined })}
                        className="p-1.5 text-stone-500 hover:text-rose-400 rounded-lg hover:bg-stone-900"
                        title="Retirer le logo personnalisé"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-500">
                    PNG transparent ou JPG recommandé.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp & Orders Card */}
        <div className="p-6 bg-stone-900/60 rounded-2xl border border-stone-800 space-y-4">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Réception des Commandes & Conciergerie WhatsApp</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-300 font-medium mb-1">
                Numéro WhatsApp de réception <span className="text-[#D4AF37]">*</span>
              </label>
              <input
                type="text"
                required
                id="settings-whatsapp-number"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="Ex: +33612345678 ou +2250700000000"
                className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Format international avec indicatif pays sans espaces. C'est sur ce numéro que vous recevrez les messages de commandes.
              </p>
            </div>

            <div>
              <label className="block text-xs text-stone-300 font-medium mb-1">
                Message personnalisé d'accueil WhatsApp
              </label>
              <input
                type="text"
                value={formData.contactInformation?.whatsappMessage || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInformation: {
                      ...formData.contactInformation,
                      whatsappMessage: e.target.value
                    }
                  })
                }
                placeholder="Ex: Bonjour, je souhaite des informations sur..."
                className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Currency & Inventory thresholds */}
        <div className="p-6 bg-stone-900/60 rounded-2xl border border-stone-800 space-y-4">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Devise & Alertes de Stock</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-stone-300 font-medium mb-1">
                Symbole Devise
              </label>
              <select
                id="settings-currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="€">EUR (€)</option>
                <option value="CHF">CHF (Franc Suisse)</option>
                <option value="$">USD ($)</option>
                <option value="FCFA">FCFA (XOF / XAF)</option>
                <option value="MAD">MAD (Dirham Marocain)</option>
                <option value="CAD">CAD ($ Canadien)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-stone-300 font-medium mb-1">
                Seuil d'alerte stock faible par défaut
              </label>
              <input
                type="number"
                min="1"
                id="settings-default-low-stock"
                value={formData.defaultLowStockThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, defaultLowStockThreshold: Number(e.target.value) })
                }
                className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-300 font-medium mb-1">
                Frais de port ({formData.currency})
              </label>
              <input
                type="number"
                min="0"
                id="settings-shipping-fee"
                value={formData.shippingFee}
                onChange={(e) =>
                  setFormData({ ...formData, shippingFee: Number(e.target.value) })
                }
                className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Mettre à 0 pour offrir les frais de port aux clients.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-stone-300 font-medium mb-1">
              Conditions et message d'expédition
            </label>
            <input
              type="text"
              id="settings-shipping-msg"
              value={formData.shippingMessage || ''}
              onChange={(e) => setFormData({ ...formData, shippingMessage: e.target.value })}
              placeholder="Ex: Expédition sécurisée sous 24-48h avec assurance valeur déclarée"
              className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Contact Coordinates */}
        <div className="p-6 bg-stone-900/60 rounded-2xl border border-stone-800 space-y-4">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>Coordonnées Publiques & Réseaux Sociaux</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-stone-300 font-medium mb-1">
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
                className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-300 font-medium mb-1">
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
                className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-300 font-medium mb-1">
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
                className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs text-stone-300 font-medium mb-1">
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
                className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-300 font-medium mb-1">
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
                className="w-full bg-stone-950 border border-stone-800 focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Administrator Role & Firebase Security Info */}
        <div className="p-5 bg-stone-900 border border-stone-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-serif text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Sécurité & Rôle Administrateur</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-stone-950 rounded-lg border border-stone-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-stone-300 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Session Administrateur Active</span>
              </div>
              <p className="text-stone-400 font-mono text-[11px] truncate">
                {user?.email || 'Compte Propriétaire Authentifié'}
              </p>
              <p className="text-[10px] text-emerald-400">
                Règles de sécurité Firestore actives (CRUD réservé à l'administrateur)
              </p>
            </div>

            <div className="p-3 bg-stone-950 rounded-lg border border-stone-800/80 space-y-1">
              <span className="text-stone-300 font-medium block">Collections Protégées</span>
              <p className="text-stone-400 text-[11px]">
                /products, /categories, /orders, /settings, /admins
              </p>
              <p className="text-[10px] text-stone-500">
                Synchronisation temps réel Firestore activée
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSeed}
            loading={seeding}
            icon={RotateCcw}
            className="text-stone-400 hover:text-amber-300 border-stone-800"
          >
            Réinitialiser le catalogue de démo
          </Button>

          <Button
            type="submit"
            variant="gold"
            size="md"
            loading={loading}
            id="settings-save-btn"
            icon={Save}
          >
            Enregistrer les paramètres
          </Button>
        </div>
      </form>
    </div>
  );
};
