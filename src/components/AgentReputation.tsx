'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface Agent {
  id: string;
  name: string;
  walletAddress: string;
  reputation: number;
  services: string[];
  totalTransactions: number;
  successRate: number;
}

export default function AgentReputation() {
  const { publicKey } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [agents] = useState<Agent[]>([
    {
      id: '1',
      name: 'DataScout Alpha',
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      reputation: 98,
      services: ['Data Analysis', 'Market Research'],
      totalTransactions: 145,
      successRate: 99.3,
    },
    {
      id: '2',
      name: 'TradeBot Pro',
      walletAddress: '8yLYtg3DW98d98UYKTRebE6kIfUqB94TZSaKpthQBtV',
      reputation: 87,
      services: ['Trading Signals', 'Portfolio Management'],
      totalTransactions: 892,
      successRate: 94.5,
    },
    {
      id: '3',
      name: 'ContentGen AI',
      walletAddress: '9zMZuh4EX09e09ZLUVfcgF7lGrC05TZTbLquiRCuW',
      reputation: 92,
      services: ['Content Creation', 'Copywriting'],
      totalTransactions: 234,
      successRate: 97.8,
    },
  ]);

  const getReputationColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getReputationBadge = (score: number) => {
    if (score >= 90) return '🏆 Elite';
    if (score >= 70) return '⭐ Verified';
    return '🆕 New';
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Agent Directory</h2>
          <p className="text-gray-500 dark:text-gray-400">Find trusted agents with verified reputations</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search agents or services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{agent.name}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {agent.walletAddress.slice(0, 6)}...{agent.walletAddress.slice(-6)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className={"text-3xl font-bold " + getReputationColor(agent.reputation)}>
                  {agent.reputation}
                </p>
                <span className="text-xs text-gray-500">{getReputationBadge(agent.reputation)}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Services</p>
              <div className="flex flex-wrap gap-2">
                {agent.services.map((service, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
                <p className="text-lg font-semibold">{agent.totalTransactions.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
                <p className="text-lg font-semibold">{agent.successRate}%</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Hire Agent
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No agents found matching your search</p>
        </div>
      )}
    </div>
  );
}
