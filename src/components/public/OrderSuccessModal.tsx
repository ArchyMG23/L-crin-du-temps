import React from 'react';
import { CheckCircle2, MessageSquare, ArrowRight, ShieldCheck, Copy, Check } from 'lucide-react';
import { Order } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface OrderSuccessModalProps {
  order: Order | null;
  whatsappUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  whatsappUrl,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!order) return null;

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="text-center space-y-5 text-[var(--text)] py-2">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-[var(--badge-bg)] border-2 border-[var(--badge-border)] text-[var(--or)] mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Title */}
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--or)] font-serif font-bold">
            Commande Enregistrée
          </span>
          <h2 className="font-serif text-2xl font-bold text-[var(--text)] mt-1">
            Merci pour votre confiance, {order.customer.name}
          </h2>
          <p className="text-xs text-[var(--text-soft)] mt-1 max-w-sm mx-auto leading-relaxed font-sans">
            Votre demande a été enregistrée dans notre système avec succès.
          </p>
        </div>

        {/* Order Number Box */}
        <div className="bg-[var(--bg)] p-4 rounded-xl border border-[var(--sep)] flex items-center justify-between max-w-sm mx-auto">
          <div className="text-left">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              N° de commande
            </span>
            <span className="font-mono font-bold text-[var(--or)] text-sm">
              #{order.orderNumber}
            </span>
          </div>

          <button
            type="button"
            onClick={copyOrderNumber}
            className="p-2 text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-[var(--badge-bg)] rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            title="Copier le numéro"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 text-[11px]">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copier</span>
              </>
            )}
          </button>
        </div>

        {/* Order Summary Recap */}
        <div className="bg-[var(--bg)] p-4 rounded-xl border border-[var(--sep)] text-left text-xs space-y-2 font-sans">
          <div className="flex justify-between text-[var(--text-soft)]">
            <span>Articles commandés ({order.items.length})</span>
            <span className="font-mono font-semibold text-[var(--text)]">{order.total.toLocaleString('fr-FR')} {order.currency}</span>
          </div>
          <div className="flex justify-between text-[var(--text-muted)] text-[11px]">
            <span>Livraison vers</span>
            <span className="text-[var(--text-soft)]">{order.customer.city}, {order.customer.address}</span>
          </div>
        </div>

        {/* WhatsApp Launch CTA */}
        <div className="space-y-2.5 pt-2">
          {whatsappUrl && (
            <a
              id="order-success-whatsapp-link"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-[0.98] transition-all text-xs uppercase tracking-wider inline-flex"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>Ouvrir la conversation WhatsApp</span>
            </a>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full text-[var(--text-soft)] hover:text-[var(--text)] border-[var(--sep)] uppercase tracking-wider text-xs"
          >
            Continuer la visite de la boutique
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)] font-sans">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--or)]" />
          <span>Notre conciergerie vous répondra dans les plus brefs délais</span>
        </div>
      </div>
    </Modal>
  );
};
