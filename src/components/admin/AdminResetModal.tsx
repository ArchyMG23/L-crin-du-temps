import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  ShoppingBag,
  Users,
  Watch,
  Layers,
  Sparkles
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
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const [options, setOptions] = useState<ResetOptions>({
    deleteDemoProducts: true,
    deleteDemoOrders: true,
    deleteDemoCustomers: true,
    forcePurgeAllTestCatalog: true
  });

  // Strict keyword validation: requires exact "RESET"
  const isConfirmed = confirmWord.trim().toUpperCase() === 'RESET';

  const handleExecuteReset = async () => {
    if (!isConfirmed || loading) return;
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      setLoading(true);
      // Execute atomic transaction with backend role validation and rollback guarantee
      const result = await resetStoreData(options);
      
      setSuccessInfo(
        `Réinitialisation réussie : ${result.deletedProducts} montres/fiches de démo, ${result.deletedOrders} commandes de test et ${result.deletedCustomers} comptes de test purgés.`
      );

      // Trigger state refresh in application
      await onResetComplete();
      
      setTimeout(() => {
        setConfirmWord('');
        setSuccessInfo(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('[Admin Reset Error]', err);
      setErrorMsg(
        err.message || 'Erreur critique lors de la réinitialisation. Rollback transactionnel effectué.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setConfirmWord('');
    setErrorMsg(null);
    setSuccessInfo(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Réinitialiser l'application — L'Écrin du Temps"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6 text-[#F5F5F0]">
        {/* Warning Banner */}
        <div className="p-4 bg-rose-950/80 border-2 border-rose-600 rounded-2xl flex items-start gap-3.5 shadow-lg">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-serif text-sm font-bold text-rose-200 uppercase tracking-wide">
              Mise à Zéro des Données de Démonstration
            </h4>
            <p className="text-xs text-rose-300/90 leading-relaxed font-sans">
              Cette action purge les données factices (montres de test, commandes d'essai, comptes clients factices) pour laisser l'application vierge et prête à recevoir votre véritable catalogue.
            </p>
          </div>
        </div>

        {/* What WILL be purged */}
        <div className="space-y-3 bg-stone-900/80 p-4 rounded-xl border border-stone-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 block font-serif">
            Données ciblées par la suppression :
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-stone-300">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-stone-950/60 border border-stone-800/80">
              <input
                type="checkbox"
                checked={options.deleteDemoProducts}
                onChange={(e) => setOptions({ ...options, deleteDemoProducts: e.target.checked })}
                className="rounded accent-rose-500"
                disabled={loading}
              />
              <Watch className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Montres de démo / test</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-stone-950/60 border border-stone-800/80">
              <input
                type="checkbox"
                checked={options.deleteDemoOrders}
                onChange={(e) => setOptions({ ...options, deleteDemoOrders: e.target.checked })}
                className="rounded accent-rose-500"
                disabled={loading}
              />
              <ShoppingBag className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Commandes de test</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-stone-950/60 border border-stone-800/80 sm:col-span-2">
              <input
                type="checkbox"
                checked={options.deleteDemoCustomers}
                onChange={(e) => setOptions({ ...options, deleteDemoCustomers: e.target.checked })}
                className="rounded accent-rose-500"
                disabled={loading}
              />
              <Users className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Comptes clients factices / créés en test</span>
            </label>
          </div>
        </div>

        {/* What is STRICTLY PRESERVED */}
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-2 text-xs text-emerald-200">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400 font-serif">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
            <span>Structure & Données Essentielles Strictement Préservées :</span>
          </div>
          <ul className="list-disc list-inside text-[11px] text-emerald-300/90 pl-1 space-y-1 font-sans">
            <li>
              <strong>Comptes administrateurs</strong> : Votre compte et vos identifiants restent intacts.
            </li>
            <li>
              <strong>Configuration générale</strong> : Nom de boutique, devises, numéro WhatsApp, coordonnées et livraison.
            </li>
            <li>
              <strong>Structure du catalogue</strong> : Les catégories et univers horlogers sont conservés.
            </li>
            <li>
              <strong>Traçabilité & Sécurité</strong> : Enregistrement automatique de l'action dans le journal d'audit (<span className="font-mono text-[10px]">/audit_logs</span>).
            </li>
          </ul>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-950/90 border border-rose-700 text-rose-200 text-xs rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successInfo && (
          <div className="p-3.5 bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* Confirmation Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-stone-300">
            Pour valider l'opération, tapez le mot-clé exact <span className="font-bold text-rose-400 font-mono tracking-wider">RESET</span> ci-dessous :
          </label>
          <input
            type="text"
            id="admin-reset-confirm-input"
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            disabled={loading}
            placeholder="Tapez RESET..."
            autoComplete="off"
            className="w-full bg-stone-950 border border-stone-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none uppercase tracking-widest font-mono font-bold"
          />
        </div>

        {/* Modal Action Controls */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleClose}
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
            className="bg-rose-700 hover:bg-rose-800 text-white font-bold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Purge transactionnelle en cours...</span>
              </span>
            ) : (
              'Confirmer la Réinitialisation'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
