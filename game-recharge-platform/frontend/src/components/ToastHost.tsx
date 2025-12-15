import React from 'react';
import { useToast } from '../store/useToast';

export const ToastHost: React.FC = () => {
  const { toasts, remove } = useToast();
  if (toasts.length === 0) return null;

  const color = (type: string) => {
    if (type === 'success') return 'bg-green-600';
    if (type === 'error') return 'bg-red-600';
    return 'bg-gray-900';
  };

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2 w-[min(420px,calc(100vw-2rem))]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${color(t.type)} text-white px-4 py-3 rounded-xl shadow-lg flex items-start justify-between gap-3`}
          role="status"
        >
          <div className="text-sm font-medium leading-snug">{t.message}</div>
          <button
            type="button"
            onClick={() => remove(t.id)}
            className="text-white/80 hover:text-white font-bold leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};



