import React, { useState } from 'react';
import { Lock, ArrowRight, KeyRound, Delete, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../common/ThemeToggle';

interface AdminLoginProps {
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToStore }) => {
  const { loginWithCode, loginWithEmail, loginWithGoogle, loading } = useAuth();
  
  // Pin code state (masked by default)
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Alternative login mode
  const [loginMode, setLoginMode] = useState<'code' | 'credentials'>('code');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleAdminLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la connexion avec Google.');
    }
  };

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
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-center items-center p-4 sm:p-6 text-[var(--text)] relative z-10 isolate transition-colors duration-300">
      {/* Top action bar: Theme Toggle & Quick return */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3">
        <ThemeToggle id="admin-login-theme-toggle" className="w-10 h-10 shadow-sm" />
      </div>

      {/* Container Card */}
      <div className="w-full max-w-md bg-[var(--carte-bg)] border border-[var(--sep)] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-13 h-13 bg-[var(--badge-bg)] border border-[var(--badge-border)] rounded-2xl text-[var(--or)] mx-auto flex items-center justify-center shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--or)] font-serif font-bold block pt-1">
            Espace d'Administration
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--text)] tracking-wide">
            Accès Sécurisé CMS
          </h2>
          <p className="text-xs text-[var(--text-soft)] font-sans">
            Veuillez vous authentifier pour accéder à la console de gestion.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {/* MODE 1: CODE PIN SÉCURISÉ (DEFAULT) */}
        {loginMode === 'code' ? (
          <div className="space-y-5">
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              
              {/* Masked PIN Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--text-soft)]">
                  <span className="font-medium flex items-center gap-1.5 text-[var(--or)]">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Code secret</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[var(--text-muted)] hover:text-[var(--text)] text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
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
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-4 py-3.5 text-center text-2xl tracking-[0.35em] font-mono text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none transition-all shadow-inner"
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
                            ? 'bg-[var(--or)] scale-110 shadow-sm'
                            : 'bg-[var(--sep)]'
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
                    className="py-3 bg-[var(--bg-2)] hover:bg-[var(--badge-bg)] active:bg-[var(--badge-bg)] border border-[var(--sep)] hover:border-[var(--or)] rounded-xl text-lg font-mono font-medium text-[var(--text)] transition-all cursor-pointer select-none"
                  >
                    {digit}
                  </button>
                ))}
                
                {/* Backspace */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-3 bg-[var(--bg-2)] hover:bg-rose-500/15 active:bg-rose-500/25 border border-[var(--sep)] hover:border-rose-500/40 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-300 transition-all flex items-center justify-center cursor-pointer select-none"
                  title="Effacer le dernier chiffre"
                >
                  <Delete className="w-5 h-5" />
                </button>
                
                {/* Zero */}
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3 bg-[var(--bg-2)] hover:bg-[var(--badge-bg)] active:bg-[var(--badge-bg)] border border-[var(--sep)] hover:border-[var(--or)] rounded-xl text-lg font-mono font-medium text-[var(--text)] transition-all cursor-pointer select-none"
                >
                  0
                </button>

                {/* Submit button on keypad */}
                <button
                  type="submit"
                  disabled={loading || !pinCode}
                  className="py-3 bg-[var(--or)] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed border border-[var(--or)] rounded-xl text-xs font-bold text-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer select-none shadow-md"
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
              <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                Email Administrateur
              </label>
              <input
                type="email"
                required
                id="admin-login-email"
                value={email}
                placeholder="admin@horlogerie-prestige.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-soft)] font-medium mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                required
                id="admin-login-password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--or)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
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

        {/* Toggle Login Mode & Google Access */}
        <div className="pt-3 space-y-2.5 text-center border-t border-[var(--sep)]">
          <button
            type="button"
            id="admin-google-login-btn"
            onClick={handleGoogleAdminLogin}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[var(--sep)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--or)] hover:text-[var(--or)] text-xs font-medium transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Connexion Google (Gérant)</span>
          </button>

          <div>
            {loginMode === 'code' ? (
              <button
                type="button"
                onClick={() => setLoginMode('credentials')}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--or)] transition-colors cursor-pointer"
              >
                Connexion par Email et Mot de passe
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLoginMode('code')}
                className="text-xs text-[var(--or)] hover:underline transition-colors cursor-pointer"
              >
                ← Retour au code de sécurité
              </button>
            )}
          </div>
        </div>

        {/* Back to store */}
        <div className="text-center pt-1">
          <button
            type="button"
            id="admin-login-back-btn"
            onClick={onBackToStore}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors inline-flex items-center gap-1.5 font-sans cursor-pointer"
          >
            <span>Retour à la boutique publique</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

