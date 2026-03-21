import { AnimatePresence, motion } from 'motion/react';
import { useToastStore, ToastType } from '../../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '../../components/ui/Button';

const toastIcons: Record<ToastType, any> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastColors: Record<ToastType, string> = {
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  error: 'border-dragon-red/20 bg-dragon-red/10 text-dragon-red',
  info: 'border-gold-champagne/20 bg-gold-champagne/10 text-gold-champagne',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-[320px] sm:max-w-sm px-4 sm:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type];
          const duration = toast.duration || 3000;

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
              className={cn(
                "pointer-events-auto relative flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden group",
                toastColors[toast.type]
              )}
            >
              {/* Progress Bar */}
              {duration !== Infinity && (
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: duration / 1000, ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-1 bg-current opacity-20"
                />
              )}

              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold tracking-tight leading-tight">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
