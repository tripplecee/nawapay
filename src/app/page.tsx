'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletConnect from '@/components/WalletConnect';
import ThemeToggle from '@/components/ThemeToggle';
import PaymentForm from '@/components/PaymentForm';
import ServiceList from '@/components/ServiceList';
import SubscriptionManager from '@/components/SubscriptionManager';
import StreamManager from '@/components/StreamManager';
import AgentReputation from '@/components/AgentReputation';
import AgentNegotiation from '@/components/AgentNegotiation';
import X402Demo from '@/components/X402Demo';

export default function Home() {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState('services');

  const tabs = [
    { id: 'services', label: 'Services', icon: '🏪' },
    { id: 'payments', label: 'Payments', icon: '💸' },
    { id: 'subscriptions', label: 'Subscriptions', icon: '📅' },
    { id: 'streams', label: 'Streams', icon: '🌊' },
    { id: 'x402', label: 'x402 Protocol', icon: '🔐' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'negotiations', label: 'Negotiations', icon: '🤝' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NawaPay</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Agentic Micro-Payments</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!connected ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">N</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Agentic Micro-Payments on Solana
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              NawaPay enables AI agents to manage subscriptions, execute micro-payments,
              and facilitate an agent-to-agent economy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <p className="mb-4 text-gray-600 dark:text-gray-400">Connect your wallet to get started</p>
                <WalletConnect />
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { icon: '📅', title: 'Subscriptions', desc: 'Recurring payments with flexible billing cycles' },
                { icon: '🌊', title: 'Streams', desc: 'Continuous micro-payments for real-time services' },
                { icon: '🤖', title: 'Agent Economy', desc: 'Hire AI agents with reputation scoring' },
              ].map((feature, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'services' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Services</h2>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    + Create Service
                  </button>
                </div>
                <ServiceList />
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="max-w-md mx-auto">
                <PaymentForm walletAddress={publicKey?.toString() || ''} />
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div>
                <SubscriptionManager />
              </div>
            )}

            {activeTab === 'streams' && (
              <div>
                <StreamManager />
              </div>
            )}

            {activeTab === 'x402' && (
              <div>
                <X402Demo />
              </div>
            )}

            {activeTab === 'agents' && (
              <div>
                <AgentReputation />
              </div>
            )}

            {activeTab === 'negotiations' && (
              <div>
                <AgentNegotiation />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Built for the Colosseum Agent Hackathon</p>
            </div>
            <div className="flex gap-6">
              <a
                href="https://github.com/tripplecee/nawapay"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://colosseum.com/agent-hackathon/projects/nawapay"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Hackathon
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
