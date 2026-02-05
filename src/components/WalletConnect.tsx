'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function WalletConnect() {
  const { connected, publicKey, disconnect } = useWallet();

  return (
    <div className="flex items-center gap-4">
      <WalletMultiButton 
        className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !transition-colors"
      />
      {connected && publicKey && (
        <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </span>
      )}
    </div>
  );
}
