import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAppAuth } from '../auth/useAppAuth';
import { ChevronDown, Globe, LogOut, ShoppingBag, User as UserIcon, Settings, LayoutDashboard } from 'lucide-react';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setLanguage, currentLang, authMode, setAuthMode, demoRole, demoMerchantId, setDemoSession } = useStore();
  const { isLoading, user, role, loginWithRedirect, logout } = useAppAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as any;
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const demoOptions: Array<{ label: string; role: 'visitor' | 'user' | 'admin' | 'merchant'; merchantId?: string | null; user: any | null }> = [
    { label: 'Visitor', role: 'visitor', merchantId: null, user: null },
    { label: 'Admin', role: 'admin', merchantId: null, user: { name: 'Demo Admin', email: 'admin@demo.local', role: 'admin' } },
    { label: 'Merchant A', role: 'merchant', merchantId: 'merchant_a', user: { name: 'Merchant A', email: 'a@merchant.local', role: 'merchant' } },
    { label: 'Merchant B', role: 'merchant', merchantId: 'merchant_b', user: { name: 'Merchant B', email: 'b@merchant.local', role: 'merchant' } },
    { label: 'Merchant C', role: 'merchant', merchantId: 'merchant_c', user: { name: 'Merchant C', email: 'c@merchant.local', role: 'merchant' } },
  ];

  const currentDemoLabel =
    demoRole === 'admin'
      ? 'Admin'
      : demoRole === 'merchant'
      ? `Merchant (${demoMerchantId || '-'})`
      : demoRole === 'user'
      ? 'User'
      : 'Visitor';

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
            {/* Logo Icon - Waffo Style Tag */}
            <div className="relative w-9 h-9 bg-[#2b65ff] rounded-lg transform -skew-x-6 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
            </div>
            {/* Logo Text */}
            <span className="ml-2 font-display font-black text-2xl text-[#2b65ff] tracking-tight lowercase group-hover:opacity-90 transition-opacity">
              waffogamepay
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Demo login selector (only in demo mode) */}
            {authMode === 'demo' && (
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none" />
                <select
                  value={`${demoRole}:${demoMerchantId || ''}`}
                  onChange={(e) => {
                    const v = e.target.value;
                    const opt = demoOptions.find((o) => `${o.role}:${o.merchantId || ''}` === v);
                    if (opt) {
                      setAuthMode('demo');
                      setDemoSession({ role: opt.role as any, merchantId: opt.merchantId ?? null, user: opt.user as any });
                      // Close any menus + keep navigation sane
                      setShowUserMenu(false);
                      if (opt.role === 'admin') navigate('/admin');
                      else if (opt.role === 'merchant') navigate('/merchant');
                      else if (opt.role === 'visitor') navigate('/login');
                      else navigate('/');
                    }
                  }}
                  className="appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium pl-9 pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title={`Demo: ${currentDemoLabel}`}
                >
                  {demoOptions.map((o) => (
                    <option key={`${o.role}:${o.merchantId || ''}`} value={`${o.role}:${o.merchantId || ''}`}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 pointer-events-none" />
              </div>
            )}
            {authMode === 'auth0' && (
              <span className="text-xs font-bold px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                Auth0
              </span>
            )}

            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none" />
              <select
                value={currentLang}
                onChange={handleLanguageChange}
                className="appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium pl-9 pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 pointer-events-none" />
            </div>

            {user ? (
              <div className="relative group">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                    {(user.name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {user.name || user.email}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                <div className={`absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 transition-all duration-200 ${showUserMenu ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'}`}>
                  <div className="py-2">
                    <button onClick={() => navigate('/orders')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      {t('myOrders')}
                    </button>
                    {role === 'admin' && (
                      <button onClick={() => navigate('/admin')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        {t('admin')}
                      </button>
                    )}
                    {(role === 'merchant' || role === 'admin') && (
                      <button onClick={() => navigate('/merchant')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        {t('merchant')}
                      </button>
                    )}
                    {role === 'user' && (
                      <button onClick={() => navigate('/merchant/apply')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Become a Merchant
                      </button>
                    )}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={async () => {
                        setShowUserMenu(false);
                        await logout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('logout')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md transition-all transform hover:scale-105"
              >
                <UserIcon className="w-4 h-4" />
                <span>{t('login')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

