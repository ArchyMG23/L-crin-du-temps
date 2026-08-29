import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Home,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  onSuccess?: () => void;
  titleMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onSuccess,
  titleMessage
}) => {
  const { loginCustomer, registerCustomer, sendResetEmail } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  const resetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSwitchTab = (tab: 'login' | 'register' | 'forgot') => {
    resetForm();
    setActiveTab(tab);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    try {
      setLoading(true);
      await loginCustomer(email, password);
      setSuccessMsg('Connexion réussie !');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setErrorMsg('Veuillez saisir un numéro de téléphone WhatsApp valide.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Veuillez renseigner une adresse email valide.');
      return;
    }
    if (!city.trim() || !address.trim()) {
      setErrorMsg('Veuillez indiquer votre ville et adresse de livraison.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      setLoading(true);
      await registerCustomer(email, password, {
        fullName,
        phone,
        email,
        city,
        address
      });
      setSuccessMsg('Votre compte client a été créé avec succès !');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la création de compte.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Veuillez renseigner votre email pour recevoir les instructions.');
      return;
    }

    try {
      setLoading(true);
      await sendResetEmail(email);
      setSuccessMsg('Si un compte est associé à cette adresse, un lien de réinitialisation vous a été envoyé.');
    } catch (err: any) {
      setErrorMsg('Impossible d\'envoyer le courriel pour l\'instant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        activeTab === 'login'
          ? 'Espace Client • Connexion'
          : activeTab === 'register'
          ? 'Création de Compte Client'
          : 'Récupération de Mot de Passe'
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-5 text-[#F5F5F0]">
        {titleMessage && (
          <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl flex items-start gap-2 text-xs text-[#D4AF37]">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{titleMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 bg-[#121212] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            id="auth-tab-login"
            onClick={() => handleSwitchTab('login')}
            className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-[#D4AF37] text-black shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            id="auth-tab-register"
            onClick={() => handleSwitchTab('register')}
            className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-[#D4AF37] text-black shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Créer un compte
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-700 text-rose-200 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-white/70 font-medium mb-1">
                Adresse Email <span className="text-[#D4AF37]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  id="customer-login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-white/70 font-medium">
                  Mot de passe <span className="text-[#D4AF37]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleSwitchTab('forgot')}
                  className="text-[11px] text-[#D4AF37] hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  id="customer-login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={loading}
              id="customer-login-submit-btn"
              className="w-full mt-2"
              icon={ArrowRight}
              iconPosition="right"
            >
              {loading ? 'Connexion en cours...' : 'Accéder à mon espace'}
            </Button>
          </form>
        )}

        {/* REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs text-white/70 font-medium mb-1">
                Nom complet <span className="text-[#D4AF37]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  id="customer-reg-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ex: Jean Dupont"
                  className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/70 font-medium mb-1">
                  Téléphone WhatsApp <span className="text-[#D4AF37]">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    id="customer-reg-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/70 font-medium mb-1">
                  Email <span className="text-[#D4AF37]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    id="customer-reg-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean@exemple.com"
                    className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/70 font-medium mb-1">
                  Ville de livraison <span className="text-[#D4AF37]">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    id="customer-reg-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris, Lyon, Genève..."
                    className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/70 font-medium mb-1">
                  Mot de passe <span className="text-[#D4AF37]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    id="customer-reg-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 caractères"
                    className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/70 font-medium mb-1">
                Adresse postale complète <span className="text-[#D4AF37]">*</span>
              </label>
              <div className="relative">
                <Home className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  id="customer-reg-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Numéro, rue, bâtiment, code postal"
                  className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={loading}
              id="customer-register-submit-btn"
              className="w-full mt-3"
              icon={ShieldCheck}
              iconPosition="left"
            >
              {loading ? 'Création de votre compte...' : 'Créer mon compte & Continuer'}
            </Button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {activeTab === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-xs text-white/60 leading-relaxed">
              Entrez l'adresse email associée à votre compte client. Nous vous transmettrons un lien sécurisé pour redéfinir votre mot de passe.
            </p>

            <div>
              <label className="block text-xs text-white/70 font-medium mb-1">
                Adresse Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  id="customer-forgot-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => handleSwitchTab('login')}
                className="w-1/2"
              >
                Retour
              </Button>
              <Button
                type="submit"
                variant="gold"
                size="md"
                disabled={loading}
                className="w-1/2"
              >
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
