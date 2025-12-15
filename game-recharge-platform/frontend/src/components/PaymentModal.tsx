import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, CreditCard, Wallet } from 'lucide-react';
import { Game, SKU } from '../types';
import { useAppAuth } from '../auth/useAppAuth';
import { apiCapturePaypalOrder, apiCreateOrderWithMerchant, apiCreatePaypalOrder, apiCreateStripeIntent, apiDemoPayOrder } from '../services/api';
import { useStore } from '../store/useStore';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';

interface PaymentModalProps {
  game: Game;
  sku: SKU;
  merchantId?: string;
  onClose: () => void;
}

const stripePromise = loadStripe((import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) || '');

function StripePaymentInner(props: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (result.error) {
      setError(result.error.message || 'Payment failed');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    props.onSuccess();
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border border-gray-200 bg-white">
        <PaymentElement />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button
        onClick={onSubmit}
        disabled={!stripe || !elements || submitting}
        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg transition-all"
      >
        {submitting ? t('processing') : t('confirmPayment')}
      </button>
    </div>
  );
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ game, sku, merchantId, onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { getApiAccessToken } = useAppAuth();
  const authMode = useStore((s) => s.authMode);
  const [method, setMethod] = useState<'stripe' | 'paypal' | 'alipay'>(() => {
    // Demo-first: default to mock pay to avoid needing any keys.
    if (authMode === 'demo') return 'alipay';
    if (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) return 'stripe';
    if (import.meta.env.VITE_PAYPAL_CLIENT_ID) return 'paypal';
    return 'alipay';
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentLang = i18n.language as keyof typeof game.name;
  const gameName = game.name[currentLang] || game.name.en;
  const skuName = sku.name[currentLang] || sku.name.en;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const startStripeFlow = async () => {
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) return;
    setCreating(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      const order = await apiCreateOrderWithMerchant(token, sku.id, merchantId);
      const newOrderId = (order as any).id as string;
      setOrderId(newOrderId);
      const intent = await apiCreateStripeIntent(token, newOrderId);
      if (!intent.clientSecret) throw new Error('Missing client secret');
      setClientSecret(intent.clientSecret);
    } catch (e: any) {
      setError(e?.message || 'Failed to start payment');
    } finally {
      setCreating(false);
    }
  };

  const startPaypalFlow = async () => {
    if (!import.meta.env.VITE_PAYPAL_CLIENT_ID) throw new Error('Missing VITE_PAYPAL_CLIENT_ID');
    setCreating(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      const order = await apiCreateOrderWithMerchant(token, sku.id, merchantId);
      const newOrderId = (order as any).id as string;
      setOrderId(newOrderId);
      const { paypalOrderId } = await apiCreatePaypalOrder(token, newOrderId);
      setPaypalOrderId(paypalOrderId);
      return paypalOrderId;
    } catch (e: any) {
      setError(e?.message || 'Failed to start PayPal');
      throw e;
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (method !== 'stripe') return;
    if (clientSecret) return;
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) return;
    void startStripeFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  const chooseMethod = (next: 'stripe' | 'paypal' | 'alipay') => {
    setError(null);
    // Reset provider states when switching.
    setClientSecret(null);
    setPaypalOrderId(null);
    setOrderId(null);
    setMethod(next);
  };

  useEffect(() => {
    if (method !== 'paypal') return;
    if (paypalOrderId) return;
    // We'll lazy create via PayPalButtons createOrder handler to avoid pre-loading issues.
  }, [method, paypalOrderId]);

  const startDemoPay = async () => {
    setCreating(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      const order = await apiCreateOrderWithMerchant(token, sku.id, merchantId);
      const newOrderId = (order as any).id as string;
      setOrderId(newOrderId);
      await apiDemoPayOrder(token, newOrderId);
      alert(t('paymentSuccess'));
      onClose();
      navigate('/orders');
    } catch (e: any) {
      setError(e?.message || 'Demo pay failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold font-display">{t('proceedPayment')}</h2>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
            <div className="flex items-center space-x-4 mb-4">
              <img src={game.iconUrl} className="w-14 h-14 rounded-xl object-cover shadow-sm" alt={gameName} />
              <div>
                <h3 className="font-bold text-gray-900">{gameName}</h3>
                <p className="text-sm text-gray-500">{skuName}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-gray-600 font-medium">{t('total')}</span>
              <span className="text-2xl font-bold text-blue-600">
                {sku.currency} {sku.price.toLocaleString()}
              </span>
            </div>
          </div>

          <h3 className="font-bold text-gray-900 mb-4">{t('paymentMethods')}</h3>
          <div className="space-y-3 mb-6">
            <label className="flex items-center p-4 border-2 border-blue-500 bg-blue-50 rounded-xl cursor-pointer transition-colors">
              <input
                type="radio"
                name="payment"
                value="stripe"
                checked={method === 'stripe'}
                onChange={() => chooseMethod('stripe')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3 flex items-center">
                <CreditCard className="w-5 h-5 text-gray-700 mr-2" />
                <span className="font-medium text-gray-900">Credit Card (Stripe)</span>
              </div>
            </label>
            <label className="flex items-center p-4 border-2 border-gray-200 hover:border-gray-300 rounded-xl cursor-pointer transition-colors">
              <input
                type="radio"
                name="payment"
                value="paypal"
                checked={method === 'paypal'}
                onChange={() => chooseMethod('paypal')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3 flex items-center">
                <Wallet className="w-5 h-5 text-gray-700 mr-2" />
                <span className="font-medium text-gray-900">PayPal</span>
              </div>
            </label>
            <label className="flex items-center p-4 border-2 border-gray-200 hover:border-gray-300 rounded-xl cursor-pointer transition-colors">
              <input
                type="radio"
                name="payment"
                value="alipay"
                checked={method === 'alipay'}
                onChange={() => chooseMethod('alipay')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3 flex items-center">
                <span className="font-medium text-gray-900">Demo Pay (Mock)</span>
              </div>
            </label>
          </div>

          {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

          {method === 'stripe' ? (
            !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? (
              <div className="text-sm text-red-600">Missing VITE_STRIPE_PUBLISHABLE_KEY</div>
            ) : clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentInner
                  onSuccess={() => {
                    alert(t('paymentSuccess'));
                    onClose();
                    navigate('/orders');
                  }}
                />
              </Elements>
            ) : (
              <button
                onClick={startStripeFlow}
                disabled={creating}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 text-white font-bold text-lg rounded-xl shadow-lg transition-all"
              >
                {creating ? t('preparing') : `${t('payNow')} - ${sku.currency} ${sku.price.toLocaleString()}`}
              </button>
            )
          ) : method === 'paypal' ? (
            !import.meta.env.VITE_PAYPAL_CLIENT_ID ? (
              <div className="text-sm text-red-600">Missing VITE_PAYPAL_CLIENT_ID</div>
            ) : (
              <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID as string, currency: sku.currency }}>
                <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                  <PayPalButtons
                    style={{ layout: 'vertical' }}
                    createOrder={async () => {
                      const id = await startPaypalFlow();
                      return id;
                    }}
                    onApprove={async (data) => {
                      try {
                        const token = await getApiAccessToken();
                        const oid = orderId;
                        if (!oid) throw new Error('Missing orderId');
                        await apiCapturePaypalOrder(token, oid, data.orderID);
                        alert(t('paymentSuccess'));
                        onClose();
                        navigate('/orders');
                      } catch (e: any) {
                        setError(e?.message || 'PayPal capture failed');
                      }
                    }}
                  />
                </div>
              </PayPalScriptProvider>
            )
          ) : (
            <button
              onClick={startDemoPay}
              disabled={creating}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-60 text-white font-bold text-lg rounded-xl shadow-lg transition-all"
            >
              {creating ? t('processing') : `Demo Pay - ${sku.currency} ${sku.price.toLocaleString()}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

