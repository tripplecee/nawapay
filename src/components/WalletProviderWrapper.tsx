'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const WalletProvider = dynamic(
  () => import('@/components/WalletProvider').then(mod => mod.default),
  { ssr: false }
);

interface WalletProviderWrapperProps {
  children: ReactNode;
}

export default function WalletProviderWrapper({ children }: WalletProviderWrapperProps) {
  return <WalletProvider>{children}</WalletProvider>;
}
