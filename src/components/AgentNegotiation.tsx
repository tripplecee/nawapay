'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface Negotiation {
  id: string;
  agentName: string;
  agentWallet: string;
  service: string;
  proposedPrice: number;
  counterPrice?: number;
  status: string;
  message: string;
  timestamp: string;
}

export default function AgentNegotiation() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState('incoming');
  const [showNewNegotiation, setShowNewNegotiation] = useState(false);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([
    {
      id: '1',
      agentName: 'DataScout Alpha',
      agentWallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      service: 'Market Analysis Report',
      proposedPrice: 0.5,
      status: 'pending',
      message: 'I need a comprehensive market analysis for DeFi protocols on Solana. Can you deliver this in 24 hours?',
      timestamp: '2026-02-05T10:30:00Z',
    },
    {
      id: '2',
      agentName: 'TradeBot Pro',
      agentWallet: '8yLYtg3DW98d98UYKTRebE6kIfUqB94TZSaKpthQBtV',
      service: 'Trading Strategy Backtesting',
      proposedPrice: 1.2,
      counterPrice: 0.9,
      status: 'countered',
      message: 'I can backtest your strategy with 2 years of historical data.',
      timestamp: '2026-02-05T09:15:00Z',
    },
  ]);

  const [newNegotiation, setNewNegotiation] = useState({
    agentWallet: '',
    service: '',
    price: '',
    message: '',
  });

  const handleResponse = (id: string, action: string, counterPrice?: number) => {
    setNegotiations((prev) =>
      prev.map((neg) => {
        if (neg.id === id) {
          return {
            ...neg,
            status: action === 'counter' ? 'countered' : action === 'accept' ? 'accepted' : 'rejected',
            counterPrice: counterPrice || neg.counterPrice,
          };
        }
        return neg;
      })
    );
  };

  const submitNegotiation = (e: React.FormEvent) => {
    e.preventDefault();
    const negotiation: Negotiation = {
      id: Date.now().toString(),
      agentName: 'Unknown Agent',
      agentWallet: newNegotiation.agentWallet,
      service: newNegotiation.service,
      proposedPrice: parseFloat(newNegotiation.price),
      status: 'pending',
      message: newNegotiation.message,
      timestamp: new Date().toISOString(),
    };
    setNegotiations([negotiation, ...negotiations]);
    setShowNewNegotiation(false);
    setNewNegotiation({ agentWallet: '', service: '', price: '', message: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'countered':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Agent Negotiations</h2>
        <button
          onClick={() => setShowNewNegotiation(!showNewNegotiation)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {showNewNegotiation ? 'Cancel' : 'New Negotiation'}
        </button>
      </div>

      {showNewNegotiation && (
        <form
          onSubmit={submitNegotiation}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4">Start New Negotiation</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Agent Wallet Address</label>
              <input
                type="text"
                value={newNegotiation.agentWallet}
                onChange={(e) => setNewNegotiation({ ...newNegotiation, agentWallet: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter agent's Solana address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service Requested</label>
              <input
                type="text"
                value={newNegotiation.service}
                onChange={(e) => setNewNegotiation({ ...newNegotiation, service: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="What service do you need?"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Proposed Price (SOL)</label>
              <input
                type="number"
                step="0.001"
                value={newNegotiation.price}
                onChange={(e) => setNewNegotiation({ ...newNegotiation, price: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={newNegotiation.message}
                onChange={(e) => setNewNegotiation({ ...newNegotiation, message: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                placeholder="Describe your requirements..."
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send Offer
          </button>
        </form>
      )}

      <div className="flex gap-4 border-b dark:border-gray-700">
        {['incoming', 'sent', 'active'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 capitalize ${
              activeTab === tab
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {negotiations.map((neg) => (
          <div
            key={neg.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{neg.service}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  with {neg.agentName} ({neg.agentWallet.slice(0, 6)}...
                  {neg.agentWallet.slice(-6)})
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  neg.status
                )}`}
              >
                {neg.status}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              &quot;{neg.message}&quot;
            </p>

            <div className="flex items-center gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Proposed Price</p>
                <p className="text-xl font-bold">{neg.proposedPrice} SOL</p>
              </div>

              {neg.counterPrice && (
                <div>
                  <p className="text-sm text-gray-500">Counter Offer</p>
                  <p className="text-xl font-bold text-yellow-600">{neg.counterPrice} SOL</p>
                </div>
              )}
            </div>

            {neg.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleResponse(neg.id, 'accept')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleResponse(neg.id, 'counter', neg.proposedPrice * 0.8)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Counter Offer
                </button>
                <button
                  onClick={() => handleResponse(neg.id, 'reject')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Decline
                </button>
              </div>
            )}

            {neg.status === 'accepted' && (
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Proceed to Payment
              </button>
            )}
          </div>
        ))}

        {negotiations.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No negotiations yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Start negotiating with agents for services
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
