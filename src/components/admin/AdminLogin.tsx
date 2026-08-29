import React, { useState } from 'react';
import { Lock, ArrowRight, KeyRound, Delete, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface AdminLoginProps {
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToStore }) => {
  const { loginWithCode, loginWithEmail, loading } = useAuth();
  
  // Pin code state (masked by default)
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Alternative login mode
  const [loginMode, setLoginMode] = useState<'code' | 'credentials'>('code');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinCode.trim()) {
      setError('Veuillez saisir votre code d\'accès.');
      return;
    }
    setError(null);
    try {
      await loginWithCode(pinCode);
    } catch (err: any) {
      setError(err?.message || 'Code de sécurité invalide.');
    }
  };

  const handleKeypadPress = (digit: string) => {
    setError(null);
    if (pinCode.length < 10) {
      const nextCode = pinCode + digit;
      setPinCode(nextCode);
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPinCode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(null);
    setPinCode('');
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError(err?.message || 'Identifiants incorrects ou compte non autorisé.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col justify-center items-center p-4 sm:p-6 text-[#F5F5F0]">
      {/* Container */}
      <div className="w-full max-w-md bg-[#0C0C0C] border border-[#D4AF37]/25 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/95 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-13 h-13 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl text-[#D4AF37] mx-auto flex items-center justify-center shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-serif font-bold block pt-1">
            Espace d'Administration
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F5F0] tracking-wide">
            Accès Sécurisé CMS
          </h2>
          <p className="text-xs text-white/50 font-sans">
            Veuillez vous authentifier pour accéder à la console de gestion.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {/* MODE 1: CODE PIN SÉCURISÉ (DEFAULT) */}
        {loginMode === 'code' ? (
          <div className="space-y-5">
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              
              {/* Masked PIN Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span className="font-medium flex items-center gap-1.5 text-[#D4AF37]">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Code secret</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-white/40 hover:text-white text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPin ? 'Masquer' : 'Afficher'}</span>
                  </button>
                </div>

                {/* Input with masked bullets visual feedback */}
                <div className="relative">
                  <input
                    id="admin-pin-input"
                    type={showPin ? "text" : "password"}
                    value={pinCode}
                    onChange={(e) => {
                      setPinCode(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••"
                    maxLength={10}
                    className="w-full bg-[#050505] border border-white/15 focus:border-[#D4AF37] rounded-xl px-4 py-3.5 text-center text-2xl tracking-[0.35em] font-mono text-white placeholder-white/10 focus:outline-none transition-all shadow-inner"
                    autoFocus
                  />
                </div>

                {/* Masked Dots Indicator for Mobile/Touch UX */}
                <div className="flex justify-center gap-2 pt-1">
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = pinCode.length > index;
                    return (
                      <div
                        key={index}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                          isFilled
                            ? 'bg-[#D4AF37] scale-110 shadow-sm shadow-[#D4AF37]/50'
                            : 'bg-white/15'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Touch Keypad (Luxury aesthetic) */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="py-3 bg-white/[0.04] hover:bg-[#D4AF37]/15 active:bg-[#D4AF37]/30 border border-white/10 hover:border-[#D4AF37]/40 rounded-xl text-lg font-mono font-medium text-white transition-all cursor-pointer select-none"
                  >
                    {digit}
                  </button>
                ))}
                
                {/* Backspace */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-3 bg-white/[0.04] hover:bg-rose-900/25 active:bg-rose-900/40 border border-white/10 hover:border-rose-700/40 rounded-xl text-xs font-semibold text-rose-300 transition-all flex items-center justify-center cursor-pointer select-none"
                  title="Effacer le dernier chiffre"
                >
                  <Delete className="w-5 h-5" />
                </button>
                
                {/* Zero */}
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3 bg-white/[0.04] hover:bg-[#D4AF37]/15 active:bg-[#D4AF37]/30 border border-white/10 hover:border-[#D4AF37]/40 rounded-xl text-lg font-mono font-medium text-white transition-all cursor-pointer select-none"
                >
                  0
                </button>

                {/* Submit button on keypad */}
                <button
                  type="submit"
                  disabled={loading || !pinCode}
                  className="py-3 bg-[#D4AF37] hover:bg-[#B8962F] disabled:opacity-30 disabled:cursor-not-allowed border border-[#D4AF37] rounded-xl text-xs font-bold text-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer select-none shadow-md shadow-[#D4AF37]/20"
                  title="Valider le code"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>

              {/* Submit Action Button */}
              <Button
                type="submit"
                variant="gold"
                size="md"
                loading={loading}
                disabled={!pinCode}
                id="admin-pin-submit-btn"
                className="w-full uppercase tracking-wider text-xs py-3 mt-1 cursor-pointer"
              >
                Déverrouiller la Console
              </Button>
            </form>
          </div>
        ) : (
          /* MODE 2: EMAIL / MOT DE PASSE */
          <form onSubmit={handleCredentialSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/70 font-medium mb-1">
                Email Administrateur
              </label>
              <input
                type="email"
                required
                id="admin-login-email"
                value={email}
                placeholder="admin@horlogerie-prestige.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#050505] border border-white/15 focus:border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-white/70 font-medium mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                required
                id="admin-login-password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050505] border border-white/15 focus:border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
              />
            </div>

            <Button
              type="submit"
              variant="gold"
              size="md"
              loading={loading}
              id="admin-login-submit-btn"
              className="w-full uppercase tracking-wider text-xs py-3 cursor-pointer"
            >
              Se connecter
            </Button>
          </form>
        )}

        {/* Toggle Login Mode */}
        <div className="pt-2 text-center border-t border-white/10">
          {loginMode === 'code' ? (
            <button
              type="button"
              onClick={() => setLoginMode('credentials')}
              className="text-xs text-white/40 hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Connexion par Email et Mot de passe
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLoginMode('code')}
              className="text-xs text-[#D4AF37] hover:underline transition-colors cursor-pointer"
            >
              ← Retour au code de sécurité
            </button>
          )}
        </div>

        {/* Back to store */}
        <div className="text-center pt-1">
          <button
            type="button"
            id="admin-login-back-btn"
            onClick={onBackToStore}
            className="text-xs text-white/40 hover:text-white transition-colors inline-flex items-center gap-1.5 font-sans cursor-pointer"
          >
            <span>Retour à la boutique publique</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

