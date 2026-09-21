import React, { useState } from 'react';
import {
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Image as ImageIcon,
  Share2,
  ExternalLink
} from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!order) return null;

  const copyOrderNumber = () => {
    if (order.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Primary watch item for picture preview and sharing
  const primaryItem = order.items.find(i => i.image) || order.items[0];

  const handleShareWithPhoto = async () => {
    if (!whatsappUrl) return;

    // Check if Web Share API with files is supported (mobile devices)
    if (typeof navigator !== 'undefined' && navigator.share && primaryItem?.image) {
      try {
        setSharing(true);
        // Attempt to fetch image blob to share actual photo file
        const res = await fetch(primaryItem.image);
        if (res.ok) {
          const blob = await res.blob();
          const ext = blob.type.includes('png') ? 'png' : 'jpg';
          const file = new File([blob], `montre-${order.orderNumber || 'commande'}.${ext}`, {
            type: blob.type || 'image/jpeg'
          });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            const urlObj = new URL(whatsappUrl);
            const decodedText = decodeURIComponent(urlObj.searchParams.get('text') || '');

            await navigator.share({
              title: `Commande #${order.orderNumber} - L'Écrin du Temps`,
              text: decodedText,
              files: [file]
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Web Share with photo note:', err);
      } finally {
        setSharing(false);
      }
    }

    // Direct WhatsApp Web/App redirect with photo URL embedded
    window.open(whatsappUrl, '_blank');
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
            Votre commande a été enregistrée avec succès.
          </p>
        </div>

        {/* Watch Visual & Items Showcase */}
        {order.items && order.items.length > 0 && (
          <div className="bg-[var(--bg)] p-3.5 rounded-2xl border border-[var(--sep)] max-w-md mx-auto space-y-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-serif font-semibold pb-1 border-b border-[var(--sep)]">
              <span>Garde-temps commandé{order.items.length > 1 ? 's' : ''}</span>
              <span className="text-[var(--or)] font-mono">{order.items.length} article{order.items.length > 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="flex items-center gap-3 p-2 rounded-xl bg-[var(--carte-bg)] border border-[var(--sep)] text-left"
                >
                  <div className="w-14 h-14 rounded-lg bg-[var(--bg)] border border-[var(--sep)] shrink-0 overflow-hidden flex items-center justify-center p-1">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain filter drop-shadow-sm"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-[var(--text-muted)]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-serif font-bold text-[var(--text)] truncate">
                      {item.name}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-soft)] mt-0.5">
                      <span>Quantité : <strong className="text-[var(--text)]">{item.quantity}</strong></span>
                      <span className="font-mono font-semibold text-[var(--or)]">
                        {(item.price * item.quantity).toLocaleString('fr-FR')} {order.currency}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Number Box */}
        <div className="bg-[var(--bg)] p-3.5 rounded-xl border border-[var(--sep)] flex items-center justify-between max-w-sm mx-auto">
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
            className="p-2 text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-[var(--badge-bg)] rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
        <div className="bg-[var(--bg)] p-3.5 rounded-xl border border-[var(--sep)] text-left text-xs space-y-2 font-sans max-w-sm mx-auto">
          <div className="flex justify-between text-[var(--text-soft)]">
            <span>Total commande</span>
            <span className="font-mono font-semibold text-[var(--text)]">{order.total.toLocaleString('fr-FR')} {order.currency}</span>
          </div>
          <div className="flex justify-between text-[var(--text-muted)] text-[11px]">
            <span>Livraison vers</span>
            <span className="text-[var(--text-soft)] truncate ml-2">{order.customer.city}, {order.customer.address}</span>
          </div>
        </div>

        {/* Photo Inclusion Notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--or)] bg-[var(--badge-bg)] border border-[var(--badge-border)] p-2.5 rounded-xl max-w-sm mx-auto">
          <ImageIcon className="w-4 h-4 shrink-0" />
          <span className="font-medium text-left text-[11px]">
            La photo de votre montre est automatiquement jointe dans le message WhatsApp pour aperçu instantané.
          </span>
        </div>

        {/* WhatsApp Launch CTA */}
        <div className="space-y-2.5 pt-2 max-w-sm mx-auto">
          {whatsappUrl && (
            <button
              type="button"
              id="order-success-whatsapp-link"
              onClick={handleShareWithPhoto}
              disabled={sharing}
              className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-[0.98] transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-current shrink-0" />
              <span>
                {sharing ? 'Préparation de la photo...' : 'Ouvrir WhatsApp avec la photo'}
              </span>
            </button>
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
