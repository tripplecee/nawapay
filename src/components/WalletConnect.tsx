'use client';

import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

interface WalletConnectProps {
  onConnect: (publicKey: string) => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);

  useEffect(() => {
    // Check if Phantom is installed
    const checkPhantom = () => {
      const { solana } = window as any;
      if (solana?.isPhantom) {
        setIsPhantomInstalled(true);
        // Check if already connected
        if (solana.isConnected) {
          setIsConnected(true);
          setPublicKey(solana.publicKey.toString());
          onConnect(solana.publicKey.toString());
        }
      }
    };
    checkPhantom();
  }, [onConnect]);

  const connectWallet = async () => {
    try {
      const { solana } = window as any;
      if (solana) {
        const response = await solana.connect();
        setIsConnected(true);
        setPublicKey(response.publicKey.toString());
        onConnect(response.publicKey.toString());
      }
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const disconnectWallet = async () => {
    try {
      const { solana } = window as any;
      if (solana) {
        await solana.disconnect();
        setIsConnected(false);
        setPublicKey(null);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  if (!isPhantomInstalled) {
    return (
      <a
        href="https://phantom.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        Install Phantom Wallet
      </a>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {isConnected ? (
        <>
          <span className="text-sm text-gray-600">
            {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
          </span>
          <button
            onClick={disconnectWallet}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={connectWallet}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
