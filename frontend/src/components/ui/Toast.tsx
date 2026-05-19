import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToastType, ToastItem } from '../../types';

const TOAST_DURATION = 5000;

type AddToastFn = (toast: { message: string; type: ToastType }) => void;
let addToastGlobal: AddToastFn | null = null;

export function toast(message: string, type: ToastType = 'error'): void {
  if (addToastGlobal) addToastGlobal({ message, type });
}

const typeStyles: Record<ToastType, string> = {
  error: 'bg-destructive text-white',
  success: 'bg-teal-600 text-white',
  info: 'bg-primary text-white',
  warning: 'bg-amber-500 text-white',
};

function ToastItemView({ item, onRemove }: { item: ToastItem; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(item.id), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [item.id, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`px-4 py-3 rounded-card shadow-card-lg text-sm font-medium max-w-sm ${
        typeStyles[item.type] || typeStyles.error
      }`}
      role="alert"
      aria-live="polite"
    >
      {item.message}
    </motion.div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const addToast = useCallback(({ message, type }: { message: string; type: ToastType }) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => { addToastGlobal = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItemView key={t.id} item={t} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
