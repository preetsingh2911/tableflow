import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const SubscriptionPage = () => {
  const [statusData, setStatusData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, plansRes] = await Promise.all([
        api.get('/subscriptions/status'),
        api.get('/subscriptions/plans')
      ]);
      setStatusData(statusRes.data.data);
      setPlans(plansRes.data.data.plans);
    } catch (error) {
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planSlug) => {
    try {
      setProcessingId(planSlug);
      
      const res = await api.post('/subscriptions/create', { planSlug });
      const { subscriptionId } = res.data.data;
      
      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_stub',
        subscription_id: subscriptionId,
        name: 'TableFlow',
        description: `Upgrade to ${planSlug} plan`,
        handler: function (response) {
          toast.success('Subscription activated successfully!');
          fetchData();
        },
        theme: {
          color: '#1A56DB'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed. Please try again.');
      });
      rzp.open();

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate upgrade');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features immediately.')) return;
    
    try {
      await api.post('/subscriptions/cancel');
      toast.success('Subscription cancelled');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading subscription details...</div>;
  }

  const { subscriptionStatus, plan, usage, trialEndsAt } = statusData || {};

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your plan, billing details, and view usage limits.</p>
      </div>

      {/* Current Plan Card */}
      <div className="dashboard-card mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Current Plan: <span className="font-bold text-blue-600 capitalize">{plan?.name || 'Trial'}</span>
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Status: <span className={`font-medium ${subscriptionStatus === 'active' ? 'text-green-600' : subscriptionStatus === 'trial' ? 'text-yellow-600' : 'text-red-600'}`}>{subscriptionStatus?.toUpperCase()}</span>
            </p>
          </div>
          {subscriptionStatus === 'active' && plan?.id !== 'free' && (
            <button
              onClick={handleCancel}
              className="btn-dashboard-danger !px-3 !py-1.5 text-xs"
            >
              Cancel Subscription
            </button>
          )}
        </div>
        <div className="border-t border-gray-100 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-100">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Outlets Usage</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {usage?.outlets} / {plan?.max_outlets || 'Unlimited'}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 max-w-xs">
                  <div 
                    className={`h-2.5 rounded-full ${plan?.max_outlets && usage?.outlets >= plan.max_outlets ? 'bg-red-600' : 'bg-blue-600'}`} 
                    style={{ width: plan?.max_outlets ? `${Math.min((usage.outlets / plan.max_outlets) * 100, 100)}%` : '10% (Unlimited)' }}
                  ></div>
                </div>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Bookings (This Month)</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {usage?.bookingsThisMonth} / {plan?.max_bookings_monthly || 'Unlimited'}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 max-w-xs">
                  <div 
                    className={`h-2.5 rounded-full ${plan?.max_bookings_monthly && usage?.bookingsThisMonth >= plan.max_bookings_monthly ? 'bg-red-600' : 'bg-blue-600'}`} 
                    style={{ width: plan?.max_bookings_monthly ? `${Math.min((usage.bookingsThisMonth / plan.max_bookings_monthly) * 100, 100)}%` : '10% (Unlimited)' }}
                  ></div>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Plans Comparison */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className={`dashboard-card flex flex-col ${plan?.id === p.id ? 'border-dashboard-primary ring-2 ring-dashboard-primary/20' : 'border-gray-100'}`}>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">{p.name}</h3>
              <p className="mt-4 text-3xl font-extrabold text-gray-900">
                ₹{p.price_monthly}
                <span className="text-base font-medium text-gray-500">/mo</span>
              </p>
              <ul className="mt-6 space-y-4">
                {p.features.map((feature, idx) => (
                  <li key={idx} className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-gray-50 rounded-b-xl border-t border-gray-100 mt-auto">
              <button
                onClick={() => handleUpgrade(p.id)}
                disabled={plan?.id === p.id || processingId === p.id}
                className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors 
                  ${plan?.id === p.id ? 'bg-green-100 text-green-700 cursor-not-allowed' : 'btn-dashboard-primary'}`}
              >
                {processingId === p.id ? 'Processing...' : plan?.id === p.id ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPage;
