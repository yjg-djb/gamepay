import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'> & { durationMs?: number }) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: ({ type, message, durationMs = 3000 }) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    window.setTimeout(() => {
      // Avoid removing if it was already cleared.
      if (!get().toasts.some((t) => t.id === id)) return;
      get().remove(id);
    }, durationMs);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));



