'use client';

import { useState, useEffect } from 'react';
import { SolanaService, connection } from '@/lib/solana';

interface PaymentFormProps {
  walletAddress: string;
}

export default function PaymentForm({ walletAddress }: PaymentFormProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress]);

  const fetchBalance = async () => {
    const bal = await SolanaService.getBalance(walletAddress);
    setBalance(bal);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create payment request
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderWallet: walletAddress,
          recipientWallet: recipient,
          amount: parseFloat(amount),
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Sign transaction with Phantom
        const { solana } = window as any;
        const transaction = Buffer.from(data.transaction, 'base64');
        
        const signed = await solana.signTransaction(transaction);
        
        // Send signed transaction
        const signature = await connection.sendRawTransaction(signed.serialize());
        
        // Verify payment
        await fetch('/api/payments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signature,
            userId: 'temp-user-id', // Replace with actual user ID
            metadata: { type: 'ONE_TIME', recipient },
          }),
        });

        alert('Payment sent successfully!');
        setRecipient('');
        setAmount('');
        fetchBalance();
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Send Payment</h2>
      
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <span className="text-gray-600">Balance: </span>
        <span className="font-bold">{balance.toFixed(4)} SOL</span>
      </div>

      <form onSubmit={handlePayment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Solana address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount (SOL)</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Send Payment'}
        </button>
      </form>
    </div>
  );
}
