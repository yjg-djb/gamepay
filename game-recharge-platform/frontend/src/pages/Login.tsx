import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth0 } from '@auth0/auth0-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setDemoSession, setAuthMode } = useStore();

  let auth0: ReturnType<typeof useAuth0> | null = null;
  try {
    auth0 = useAuth0();
  } catch {
    auth0 = null;
  }

  const hasAuth0Config = Boolean(import.meta.env.VITE_AUTH0_DOMAIN && import.meta.env.VITE_AUTH0_CLIENT_ID);

  const options: Array<{ label: string; role: 'visitor' | 'user' | 'admin' | 'merchant'; merchantId?: string; user: any | null; to: string }> =
    [
      { label: 'Visitor (Browse only)', role: 'visitor', user: null, to: '/' },
      { label: 'Demo User', role: 'user', user: { name: 'Demo User', email: 'user@demo.local', role: 'user' }, to: '/' },
      { label: 'Admin', role: 'admin', user: { name: 'Demo Admin', email: 'admin@demo.local', role: 'admin' }, to: '/admin' },
      { label: 'Merchant A', role: 'merchant', merchantId: 'merchant_a', user: { name: 'Merchant A', email: 'a@merchant.local', role: 'merchant' }, to: '/merchant' },
      { label: 'Merchant B', role: 'merchant', merchantId: 'merchant_b', user: { name: 'Merchant B', email: 'b@merchant.local', role: 'merchant' }, to: '/merchant' },
      { label: 'Merchant C', role: 'merchant', merchantId: 'merchant_c', user: { name: 'Merchant C', email: 'c@merchant.local', role: 'merchant' }, to: '/merchant' },
    ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-display">Demo Login</h1>
        <p className="text-gray-600 mt-2">
          This project uses <b>demo login</b>. Pick a role below to enter Admin/Merchant pages.
        </p>

        <div className="mt-6 p-4 rounded-2xl border border-gray-200 bg-gray-50">
          <div className="font-bold text-gray-900">Auth0 Login (Real User)</div>
          <div className="text-sm text-gray-600 mt-1">
            Use Auth0 to login as a real user, then pay with Stripe/PayPal (requires keys).
          </div>
          <div className="mt-3">
            <button
              disabled={!hasAuth0Config || !auth0}
              onClick={() => {
                setAuthMode('auth0');
                // keep demo session in visitor state while redirecting
                setDemoSession({ role: 'visitor' as any, merchantId: null, user: null });
                auth0?.loginWithRedirect({ authorizationParams: { redirect_uri: window.location.origin } });
              }}
              className={`px-4 py-2 rounded-xl font-semibold ${
                hasAuth0Config && auth0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              Login with Auth0
            </button>
            {!hasAuth0Config && (
              <div className="text-xs text-gray-500 mt-2">
                Missing env: <code>VITE_AUTH0_DOMAIN</code>, <code>VITE_AUTH0_CLIENT_ID</code> (optional: <code>VITE_AUTH0_AUDIENCE</code>, <code>VITE_AUTH0_NAMESPACE</code>)
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {options.map((o) => (
            <button
              key={`${o.role}:${o.merchantId || ''}`}
              className="text-left p-4 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              onClick={() => {
                setAuthMode('demo');
                setDemoSession({ role: o.role as any, merchantId: o.merchantId ?? null, user: o.user });
                navigate(o.to);
              }}
            >
              <div className="font-bold text-gray-900">{o.label}</div>
              <div className="text-xs text-gray-500 mt-1">
                {o.role === 'merchant' ? `merchantId=${o.merchantId}` : `role=${o.role}`}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-sm text-gray-500">
          Tip: You can also switch roles from the top header dropdown anytime.
        </div>
      </div>
    </div>
  );
};


