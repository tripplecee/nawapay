'use client';

import { useState } from 'react';
import { X402Protocol } from '@/lib/x402';
import { useWallet } from '@solana/wallet-adapter-react';
import { connection } from '@/lib/solana';
import { Transaction } from '@solana/web3.js';

export default function X402Demo() {
  const { connected, publicKey, signTransaction } = useWallet();
  const [demoUrl, setDemoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [paymentRequired, setPaymentRequired] = useState<any>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const simulateProtectedRequest = async () => {
    setLoading(true);
    setPaymentRequired(null);
    setLogs([]);
    addLog('Requesting protected resource: /api/premium-content');

    try {
      // 1. Make request to protected endpoint (simulated)
      const response = await fetch('/api/x402?amount=0.001&description=Premium Content Access');
      
      // 2. Check for 402 Payment Required (simulated here by checking body for demonstration)
      // In a real middleware scenario, this would be response.status === 402
      const data = await response.json();
      
      if (data.paymentRequest) {
        addLog(`❌ 402 Payment Required: ${data.paymentRequest.amount} ${data.paymentRequest.currency}`);
        addLog(`Reason: ${data.paymentRequest.description}`);
        setPaymentRequired(data);
      } else {
        addLog('✅ Access granted (Free tier)');
      }
    } catch (error) {
      addLog(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentRequired || !connected || !publicKey || !signTransaction) {
      addLog('⚠️ Wallet not connected or payment not required');
      return;
    }

    try {
      setLoading(true);
      addLog('Initiating payment...');

      // 1. Create transaction (in a real app, this would use the payment URL or request parameters)
      // For this demo, we'll create a simple transfer based on the request
      const recipient = paymentRequired.paymentRequest.recipient;
      const amount = parseFloat(paymentRequired.paymentRequest.amount);
      
      addLog(`Sending ${amount} SOL to ${recipient.slice(0,8)}...`);

      // Using the server-side API to get a transaction would be safer, but for demo we construct it here
      // or use the solana protocol link if supported
      
      // Simulating the transaction flow
      addLog('Please sign the transaction in your wallet...');
      
      // In a real implementation, we would construct the transaction here
      // const transaction = await createTransferTransaction(...)
      // const signature = await sendTransaction(transaction, connection)
      
      // For demo purposes, we'll simulate a success after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSignature = `demo_sig_${Date.now()}`; 
      addLog(`✅ Transaction sent! Signature: ${mockSignature.slice(0, 16)}...`);

      // 2. Verify payment with server
      addLog('Verifying payment with server...');
      const verifyRes = await fetch('/api/x402', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txSignature: mockSignature,
          paymentRequest: paymentRequired.paymentRequest,
          recipient,
          amount,
          currency: 'SOL'
        })
      });

      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        addLog('✅ Payment Verified!');
        addLog(`🎟️ Payment Proof Token: ${verifyData.paymentProof.slice(0, 20)}...`);
        addLog('🔓 Access Granted to Premium Content');
        setPaymentRequired(null);
      } else {
        addLog('❌ Verification failed');
      }

    } catch (error) {
      addLog(`Payment failed: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">x402 Payment Protocol Demo</h2>
          <p className="text-gray-600 dark:text-gray-400">
            x402 is an open standard for HTTP 402 Payment Required responses.
            It allows AI agents and services to autonomously negotiate and pay for resources.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Client Simulator</h3>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md font-mono text-sm">
              <p className="text-purple-500">GET /api/premium-content</p>
              <p className="text-gray-500">Host: api.nawapay.io</p>
              <p className="text-gray-500">Accept: application/json</p>
            </div>

            <button
              onClick={simulateProtectedRequest}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Request Protected Resource'}
            </button>

            {paymentRequired && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                  <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                    ⚠️ 402 Payment Required
                  </h4>
                  <div className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300 mb-4">
                    <p>Amount: <span className="font-mono font-bold">{paymentRequired.paymentRequest.amount} {paymentRequired.paymentRequest.currency}</span></p>
                    <p>Recipient: <span className="font-mono">{paymentRequired.paymentRequest.recipient.slice(0, 8)}...</span></p>
                    <p>Description: {paymentRequired.paymentRequest.description}</p>
                  </div>
                  
                  {connected ? (
                    <button
                      onClick={handlePayment}
                      disabled={loading}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Pay & Access
                    </button>
                  ) : (
                    <p className="text-center text-sm text-red-500">Connect wallet to pay</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Protocol Logs</h3>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs h-[400px] overflow-y-auto">
              {logs.length === 0 ? (
                <span className="text-gray-600">Waiting for activity...</span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="mb-1 border-b border-gray-800 pb-1 last:border-0">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-8 text-white">
        <h3 className="text-xl font-bold mb-4">Integrate x402 in your Agent</h3>
        <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
{`import { NawaPaySDK } from '@nawapay/sdk';

const sdk = new NawaPaySDK({ apiKey: '...' });

// Agents can automatically handle 402 responses
try {
  const resource = await sdk.fetch('https://api.example.com/data');
} catch (error) {
  if (error.status === 402) {
    // SDK handles payment negotiation automatically
    await sdk.pay(error.paymentRequest);
    // Retry request with proof
  }
}`}
        </pre>
      </div>
    </div>
  );
}
