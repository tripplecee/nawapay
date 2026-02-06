import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack - use webpack for wallet adapter externals config
  turbopack: {},
  transpilePackages: [
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-base',
    '@solana-mobile/mobile-wallet-adapter-protocol',
    '@solana-mobile/wallet-adapter-mobile',
    '@solana-mobile/wallet-standard-mobile',
    '@solana/codecs-core',
    '@solana/codecs-strings',
    '@solana/errors',
  ],
  webpack: (config, { isServer }) => {
    // Fix for @solana-mobile and other wallet adapter issues
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        '@solana-mobile/mobile-wallet-adapter-protocol',
        '@solana-mobile/wallet-adapter-mobile',
        '@solana-mobile/wallet-standard-mobile'
      );
    }
    
    // Handle ESM/CJS interop issues
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
    };
    
    return config;
  },
};

export default nextConfig;
