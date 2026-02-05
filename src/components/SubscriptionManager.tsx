'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface Subscription {
  id: string;
  service: {
    name: string;
    price: number;
    currency: string;
    interval: string;
  };
  status: string;
  nextBilling: string;
  autoRenew: boolean;
}

export default function SubscriptionManager() {
  const { publicKey } = useWallet();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (publicKey) {
      fetchSubscriptions();
    }
  }, [publicKey]);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`/api/subscriptions?userId=${publicKey?.toString()}`);
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (subscriptionId: string, action: string) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, action }),
      });

      if (res.ok) {
        fetchSubscriptions();
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading subscriptions...</div>;
  }

  return (
    <div className="space-y-4">
      {subscriptions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No active subscriptions</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Browse services to subscribe</p>
        </div>
      ) : (
        subscriptions.map((sub) => (
          <div key={sub.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{sub.service.name}</h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {sub.service.price} {sub.service.currency}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> / {sub.service.interval?.toLowerCase()}</span>
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sub.status)}`>
                {sub.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Next billing</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {sub.nextBilling ? new Date(sub.nextBilling).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Auto-renew</p>
                <p className="font-medium text-gray-900 dark:text-white">{sub.autoRenew ? 'On' : 'Off'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {sub.status === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => handleAction(sub.id, 'PAUSE')}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => handleAction(sub.id, 'CANCEL')}
                    className="px-4 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
              {sub.status === 'PAUSED' && (
                <button
                  onClick={() => handleAction(sub.id, 'RESUME')}
                  className="px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  Resume
                </button>
              )}
              <button
                onClick={() => handleAction(sub.id, 'TOGGLE_RENEW')}
                className="px-4 py-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {sub.autoRenew ? 'Disable Auto-renew' : 'Enable Auto-renew'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
