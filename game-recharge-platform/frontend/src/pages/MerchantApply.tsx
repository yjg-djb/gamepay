import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Building2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAppAuth } from '../auth/useAppAuth';
import { apiSubmitMerchantApplication, apiGetMyMerchantApplications } from '../services/api';

interface Application {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  createdAt: string;
}

export const MerchantApply: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, loginWithRedirect, getApiAccessToken, role } = useAppAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      void loginWithRedirect();
    }
  }, [isAuthenticated, isLoading, loginWithRedirect]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadApplications = async () => {
    setLoadingApps(true);
    try {
      const token = await getApiAccessToken();
      const data = await apiGetMyMerchantApplications(token);
      setApplications(data.applications || []);
    } catch {
      // ignore
    } finally {
      setLoadingApps(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getApiAccessToken();
      await apiSubmitMerchantApplication(token, {
        companyName,
        contactName,
        contactEmail,
        description,
      });
      setSuccess(true);
      setShowForm(false);
      await loadApplications();
    } catch (e: any) {
      setError(e?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  // If user is already a merchant, redirect to merchant page
  if (role === 'merchant' || role === 'admin') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('merchant')}
          </h2>
          <p className="text-gray-600 mb-6">You are already a merchant!</p>
          <button
            onClick={() => navigate('/merchant')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium"
          >
            Go to Merchant Center
          </button>
        </div>
      </div>
    );
  }

  const hasPendingApplication = applications.some((a) => a.status === 'PENDING');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-display">Become a Merchant</h1>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 font-medium flex items-center hover:underline"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t('home')}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">{error}</div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded-xl">
          Application submitted successfully! We will review it and get back to you soon.
        </div>
      )}

      {/* Application History */}
      {applications.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4">Your Applications</h2>
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(app.status)}
                    <div>
                      <h3 className="font-bold text-gray-900">{app.companyName}</h3>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(app.status)}`}
                  >
                    {app.status}
                  </span>
                </div>
                {app.reviewNote && (
                  <div className="mt-3 text-sm text-gray-600 bg-white p-3 rounded-lg">
                    <strong>Review Note:</strong> {app.reviewNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Application Form */}
      {!hasPendingApplication && !showForm ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
          <Building2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Join as a Merchant</h2>
          <p className="text-gray-600 mb-6">
            Apply to become a merchant and start selling your game products on our platform.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg transition-all"
          >
            Start Application
          </button>
        </div>
      ) : hasPendingApplication ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Pending</h2>
          <p className="text-gray-600">
            You already have a pending application. Please wait for our team to review it.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-6">Merchant Application Form</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your company or studio name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tell us about your games *
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your games, target audience, and why you want to join our platform..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};








