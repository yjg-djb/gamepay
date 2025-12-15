import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Language } from '../types';

export type AuthMode = 'demo' | 'auth0';
export type DemoRole = 'visitor' | 'user' | 'admin' | 'merchant';

interface StoreState {
  currentLang: Language;
  user: User | null;
  authMode: AuthMode;
  demoRole: DemoRole;
  demoMerchantId: string | null;
  adminTab: string;
  merchantTab: string;
  setLanguage: (lang: Language) => void;
  setUser: (user: User | null) => void;
  setAuthMode: (mode: AuthMode) => void;
  setDemoSession: (session: { role: DemoRole; merchantId?: string | null; user?: User | null }) => void;
  setAdminTab: (tab: string) => void;
  setMerchantTab: (tab: string) => void;
  logout: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      currentLang: 'zh',
      user: null,
      authMode: 'demo',
      demoRole: 'visitor',
      demoMerchantId: null,
      adminTab: 'games',
      merchantTab: 'orders',
      setLanguage: (lang) => set({ currentLang: lang }),
      setUser: (user) => set({ user }),
      setAuthMode: (mode) => set({ authMode: mode }),
      setDemoSession: ({ role, merchantId = null, user = null }) =>
        set({
          demoRole: role,
          demoMerchantId: role === 'merchant' ? merchantId : null,
          user,
        }),
      setAdminTab: (tab) => set({ adminTab: tab }),
      setMerchantTab: (tab) => set({ merchantTab: tab }),
      logout: () => set({ user: null, demoRole: 'visitor', demoMerchantId: null }),
    }),
    {
      name: 'game-recharge-storage',
      partialize: (state) => ({
        currentLang: state.currentLang,
        user: state.user,
        authMode: state.authMode,
        demoRole: state.demoRole,
        demoMerchantId: state.demoMerchantId,
      }),
    }
  )
);

