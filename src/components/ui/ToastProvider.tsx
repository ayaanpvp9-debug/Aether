import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert, CircleCheck, Info, Sparkles, X } from 'lucide-react';
import { ToastContext, type ToastInput } from './toast-context';
import './Toast.css';

interface ToastItem extends ToastInput {
  id: number;
}

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info, neutral: Sparkles };
const DURATION = 3800;

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const timer = useRef<number | undefined>(undefined);
  const start = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onDismiss(toast.id), DURATION);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    start();
    return () => window.clearTimeout(timer.current);
  }, [start]);

  const tone = toast.tone ?? 'neutral';
  const Icon = ICONS[tone];
  return (
    <motion.li
      layout
      className={`vx-toast vx-toast--${tone}`}
      initial={{ opacity: 0, y: 24, scale: 0.94, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(4px)', transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onPointerEnter={() => window.clearTimeout(timer.current)}
      onPointerLeave={start}
    >
      <span className="vx-toast__icon" aria-hidden="true">
        <Icon size={16} strokeWidth={2} />
      </span>
      <span className="vx-toast__body">
        <strong>{toast.title}</strong>
        {toast.description && <span>{toast.description}</span>}
      </span>
      <button type="button" className="vx-toast__close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification" data-cursor="link">
        <X size={14} />
      </button>
      <span className="vx-toast__timer" aria-hidden="true" />
    </motion.li>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback((toast: ToastInput) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((list) => [...list.slice(-2), { ...toast, id }]);
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="vx-toasts" role="status" aria-live="polite" aria-atomic="false">
        <ol>
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
          </AnimatePresence>
        </ol>
      </div>
    </ToastContext.Provider>
  );
}
