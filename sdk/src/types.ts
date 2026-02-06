/**
 * SDK Configuration Types
 */

export interface SDKConfig {
  /** API Key for authentication */
  apiKey: string;
  /** Network to use (solana, ethereum, base) */
  network?: 'solana' | 'ethereum' | 'base';
  /** Environment */
  environment?: 'development' | 'staging' | 'production';
  /** Base URL for API calls */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

export interface PaymentOptions {
  /** Amount to pay */
  amount: number;
  /** Currency (SOL, USDC, etc.) */
  currency: string;
  /** Recipient wallet address */
  recipient: string;
  /** Optional description */
  description?: string;
  /** Payment metadata */
  metadata?: Record<string, unknown>;
  /** Expiry time in minutes */
  expiryMinutes?: number;
  /** Callback URL for payment confirmation */
  callbackUrl?: string;
}

export interface SubscriptionOptions {
  /** Service name */
  serviceName: string;
  /** Price per interval */
  price: number;
  /** Currency */
  currency: string;
  /** Billing interval */
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  /** Recipient wallet address */
  recipient: string;
  /** Optional description */
  description?: string;
}

export interface StreamOptions {
  /** Recipient wallet address */
  recipient: string;
  /** Total amount to stream */
  totalAmount: number;
  /** Currency */
  currency: string;
  /** Stream duration in seconds */
  duration: number;
  /** Description */
  description?: string;
}

export interface PaymentResult {
  /** Payment ID */
  id: string;
  /** Transaction signature/hash */
  signature?: string;
  /** Payment status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Payment amount */
  amount: number;
  /** Currency */
  currency: string;
  /** Recipient */
  recipient: string;
  /** Created timestamp */
  createdAt: string;
  /** Payment URL (for QR code) */
  paymentUrl?: string;
  /** x402 headers for programmatic payment */
  x402Headers?: Record<string, string>;
}

export interface SubscriptionResult {
  /** Subscription ID */
  id: string;
  /** Service name */
  serviceName: string;
  /** Status */
  status: 'active' | 'paused' | 'cancelled';
  /** Price */
  price: number;
  /** Currency */
  currency: string;
  /** Interval */
  interval: string;
  /** Next billing date */
  nextBilling?: string;
}

export interface StreamResult {
  /** Stream ID */
  id: string;
  /** Recipient */
  recipient: string;
  /** Total amount */
  totalAmount: number;
  /** Amount spent so far */
  spent: number;
  /** Currency */
  currency: string;
  /** Status */
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  /** Created timestamp */
  createdAt: string;
}

export interface WalletInfo {
  /** Wallet address */
  address: string;
  /** Balance in SOL */
  balance: number;
  /** Network */
  network: string;
  /** Is connected */
  isConnected: boolean;
}

export interface ServiceInfo {
  /** Service ID */
  id: string;
  /** Service name */
  name: string;
  /** Provider wallet address */
  provider: string;
  /** Price */
  price: number;
  /** Currency */
  currency: string;
  /** Interval (for subscriptions) */
  interval?: string;
  /** Description */
  description?: string;
  /** Rating/Reputation */
  rating?: number;
}

export interface AgentInfo {
  /** Agent ID */
  id: string;
  /** Agent name */
  name: string;
  /** Wallet address */
  walletAddress: string;
  /** Reputation score */
  reputation: number;
  /** Services offered */
  services: ServiceInfo[];
}
