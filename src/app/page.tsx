'use client';

import { useState } from 'react';
import WalletConnect from '@/components/WalletConnect';
import PaymentForm from '@/components/PaymentForm';
import ServiceList from '@/components/ServiceList';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('services');

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl"></div>
              <h1 className="text-2xl font-bold text-gray-900">NawaPay</h1>
            </div>
            <WalletConnect onConnect={setWalletAddress} />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['services', 'payments', 'subscriptions', 'streams'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!walletAddress ? (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Agentic Micro-Payments on Solana
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              NawaPay enables AI agents to manage subscriptions, execute micro-payments,
              and facilitate an agent-to-agent economy.
            </p>
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="mb-4">Connect your wallet to get started</p>
                <WalletConnect onConnect={setWalletAddress} />
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'services' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Available Services</h2>
                <ServiceList />
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="max-w-md mx-auto">
                <PaymentForm walletAddress={walletAddress} />
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Your Subscriptions</h2>
                <p className="text-gray-600">Subscription management coming soon!</p>
              </div>
            )}

            {activeTab === 'streams' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Payment Streams</h2>
                <p className="text-gray-600">Streaming payments coming soon!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-500">Built for the Colosseum Agent Hackathon</p>
            <a
              href="https://github.com/tripplecee/nawapay"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-900"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
