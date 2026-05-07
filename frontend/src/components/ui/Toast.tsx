import { useState, useCallback, useRef, useEffect } from 'react';
import type { ToastType, ToastItem } from '../../types';

const TOAST_DURATION = 5000;

type AddToastFn = (toast: { message: string; type: ToastType }) => void;
let addToastGlobal: AddToastFn | null = null;

export function toast(message: string, type: ToastType = 'error'): void {
  if (addToastGlobal) addToastGlobal({ message, type });
}

const typeStyles: Record<ToastType, string> = {
  error: 'bg-red-600 text-white',
  success: 'bg-green-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-yellow-500 text-white',
};

function ToastItemView({ item, onRemove }: { item: ToastItem; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(item.id), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [item.id, onRemove]);

  return (
    <div
      className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm animate-slide-in ${
        typeStyles[item.type] || typeStyles.error
      }`}
      role="alert"
    >
      {item.message}
    </div>
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
      {toasts.map((t) => (
        <ToastItemView key={t.id} item={t} onRemove={removeToast} />
      ))}
    </div>
  );
}
