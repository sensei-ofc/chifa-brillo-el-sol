import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}: ConfirmModalProps) {
  const variantColors = {
    danger: 'text-dragon-red bg-dragon-red/10 border-dragon-red/20',
    warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    info: 'text-gold-champagne bg-gold-champagne/10 border-gold-champagne/20',
  };

  const iconColors = {
    danger: 'text-dragon-red',
    warning: 'text-amber-500',
    info: 'text-gold-champagne',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
          >
            {/* Header Accent */}
            <div className={`h-1.5 w-full ${variant === 'danger' ? 'bg-dragon-red' : variant === 'warning' ? 'bg-amber-500' : 'bg-gold-champagne'}`} />

            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${variantColors[variant]} border`}>
                  <AlertTriangle className={`w-6 h-6 ${iconColors[variant]}`} />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-xl font-heading font-bold text-white mb-2 uppercase tracking-wide">
                {title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border-white/10 hover:bg-white/5 text-xs font-bold tracking-widest uppercase"
                >
                  {cancelText}
                </Button>
                <Button
                  variant={variant === 'danger' ? 'danger' : 'primary'}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-widest uppercase ${
                    variant === 'info' ? 'bg-gold-champagne hover:bg-gold-champagne/80 text-black' : ''
                  }`}
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
