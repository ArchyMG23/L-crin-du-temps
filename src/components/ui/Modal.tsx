import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[var(--carte-bg)] text-[var(--text)] rounded-2xl shadow-2xl border border-[var(--sep)] overflow-hidden z-10 my-8`}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sep)] bg-[var(--bg)]">
                <div className="text-lg font-serif font-semibold text-[var(--text)] tracking-wide">{title}</div>
                <button
                  type="button"
                  id="modal-close-btn"
                  onClick={onClose}
                  className="p-1.5 text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-[var(--badge-bg)] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {!title && (
              <button
                type="button"
                id="modal-direct-close-btn"
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 bg-[var(--carte-bg)]/80 hover:bg-[var(--carte-bg)] text-[var(--text-soft)] hover:text-[var(--text)] rounded-full backdrop-blur-xs transition-colors border border-[var(--sep)]"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="p-6 max-h-[85vh] overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
