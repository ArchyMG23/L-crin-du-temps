import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  ShoppingBag,
  Users,
  Watch
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { resetStoreData, ResetOptions } from '../../services/resetService';

interface AdminResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetComplete: () => Promise<void>;
}

export const AdminResetModal: React.FC<AdminResetModalProps> = ({
  isOpen,
  onClose,
  onResetComplete
}) => {
  const [confirmWord, setConfirmWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [options, setOptions] = useState<ResetOptions>({
    deleteOrders: true,
    deleteProducts: true,
    deleteCategories: true,
    deleteCustomers: true
  });

  const isConfirmed = confirmWord.trim().toUpperCase() === 'RESET' || confirmWord.trim().toUpperCase() === 'SUPPRIMER';

  const handleExecuteReset = async () => {
    if (!isConfirmed) return;
    setErrorMsg(null);

    try {
      setLoading(true);
      await resetStoreData(options);
      await onResetComplete();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la remise à zéro de la boutique.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Réinitialisation Complète de la Boutique (RESET)"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6 text-[#F5F5F0]">
        {/* Warning Banner */}
        <div className="p-4 bg-rose-950/80 border-2 border-rose-600 rounded-2xl flex items-start gap-3.5">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-serif text-sm font-bold text-rose-200 uppercase tracking-wide">
              Action Destructive & Définitive
            </h4>
            <p className="text-xs text-rose-300/90 leading-relaxed font-sans">
              Cette opération permet de purger toutes les données de test (commandes, catalogue de démonstration, faux clients) pour préparer le lancement de votre vraie collection.
            </p>
          </div>
        </div>

        {/* What WILL be deleted */}
        <div className="space-y-3 bg-stone-900/80 p-4 rounded-xl border border-stone-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 block">
            Éléments ciblés par la purge :
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.deleteOrders}
                onChange={(e) => setOptions({ ...options, deleteOrders: e.target.checked })}
                className="rounded accent-rose-500"
              />
              <ShoppingBag className="w-4 h-4 text-stone-400" />
              <span>Toutes les commandes</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.deleteProducts}
                onChange={(e) => setOptions({ ...options, deleteProducts: e.target.checked })}
                className="rounded accent-rose-500"
              />
              <Watch className="w-4 h-4 text-stone-400" />
              <span>Tous les produits de test</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.deleteCategories}
                onChange={(e) => setOptions({ ...options, deleteCategories: e.target.checked })}
                className="rounded accent-rose-500"
              />
              <Layers className="w-4 h-4 text-stone-400" />
              <span>Toutes les collections</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.deleteCustomers}
                onChange={(e) => setOptions({ ...options, deleteCustomers: e.target.checked })}
                className="rounded accent-rose-500"
              />
              <Users className="w-4 h-4 text-stone-400" />
              <span>Les comptes clients de test</span>
            </label>
          </div>
        </div>

        {/* What is PRESERVED */}
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-1 text-xs text-emerald-200">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Données strictement protégées et préservées :</span>
          </div>
          <ul className="list-disc list-inside text-[11px] text-emerald-300/80 pl-2 space-y-0.5">
            <li>Votre compte administrateur et votre session de gestion</li>
            <li>Le nom de votre boutique, votre logo et votre numéro WhatsApp</li>
            <li>La structure de votre base Firestore et vos règles de sécurité</li>
          </ul>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Confirmation Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-stone-300">
            Pour confirmer, veuillez taper <span className="font-bold text-rose-400">RESET</span> ou <span className="font-bold text-rose-400">SUPPRIMER</span> ci-dessous :
          </label>
          <input
            type="text"
            id="admin-reset-confirm-input"
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            placeholder="Tapez RESET ici..."
            className="w-full bg-stone-950 border border-stone-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none uppercase tracking-widest font-mono"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>

          <Button
            type="button"
            variant="danger"
            size="md"
            disabled={!isConfirmed || loading}
            onClick={handleExecuteReset}
            icon={Trash2}
            className="bg-rose-700 hover:bg-rose-800 text-white"
          >
            {loading ? 'Purge en cours...' : 'Exécuter le RESET de la boutique'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
