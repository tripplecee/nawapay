'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface PaymentStream {
  id: string;
  recipientWallet: string;
  amount: number;
  spent: number;
  ratePerMinute: number | null;
  status: string;
  createdAt: string;
}

export default function StreamManager() {
  const { publicKey } = useWallet();
  const [streams, setStreams] = useState<PaymentStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newStream, setNewStream] = useState({
    recipientWallet: '',
    amount: '',
    ratePerMinute: '',
  });

  useEffect(() => {
    if (publicKey) {
      fetchStreams();
    }
  }, [publicKey]);

  const fetchStreams = async () => {
    try {
      const res = await fetch(`/api/streams?userId=${publicKey?.toString()}`);
      const data = await res.json();
      setStreams(data.streams || []);
    } catch (error) {
      console.error('Failed to fetch streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStream = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: publicKey?.toString(),
          recipientWallet: newStream.recipientWallet,
          amount: parseFloat(newStream.amount),
          ratePerMinute: newStream.ratePerMinute ? parseFloat(newStream.ratePerMinute) : null,
        }),
      });

      if (res.ok) {
        setShowCreate(false);
        setNewStream({ recipientWallet: '', amount: '', ratePerMinute: '' });
        fetchStreams();
      }
    } catch (error) {
      console.error('Failed to create stream:', error);
    }
  };

  const getProgress = (stream: PaymentStream) => {
    return (stream.spent / stream.amount) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading streams...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Streams</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {showCreate ? 'Cancel' : 'Create Stream'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createStream} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Create New Stream</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Recipient Wallet</label>
              <input
                type="text"
                value={newStream.recipientWallet}
                onChange={(e) => setNewStream({ ...newStream, recipientWallet: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Solana address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Amount (SOL)</label>
              <input
                type="number"
                step="0.001"
                value={newStream.amount}
                onChange={(e) => setNewStream({ ...newStream, amount: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rate/Minute (optional)</label>
              <input
                type="number"
                step="0.0001"
                value={newStream.ratePerMinute}
                onChange={(e) => setNewStream({ ...newStream, ratePerMinute: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0.00"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Stream
          </button>
        </form>
      )}

      {streams.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No payment streams yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Create a stream to pay agents continuously</p>
        </div>
      ) : (
        streams.map((stream) => (
          <div key={stream.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Recipient</p>
                <p className="font-mono text-sm">{stream.recipientWallet.slice(0, 8)}...{stream.recipientWallet.slice(-8)}</p>
              </div>
              <span className={"px-3 py-1 rounded-full text-sm font-medium " + getStatusColor(stream.status)}>
                {stream.status}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>{stream.spent.toFixed(4)} SOL spent</span>
                <span>{stream.amount.toFixed(4)} SOL total</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${getProgress(stream)}%` }}
                />
              </div>
              <p className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
                {getProgress(stream).toFixed(1)}%
              </p>
            </div>

            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Remaining: </span>
                <span className="font-medium">{(stream.amount - stream.spent).toFixed(4)} SOL</span>
              </div>
              {stream.ratePerMinute && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Rate: </span>
                  <span className="font-medium">{stream.ratePerMinute} SOL/min</span>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
