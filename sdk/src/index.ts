/**
 * NawaPay SDK
 * 
 * A comprehensive SDK for integrating x402 payment protocol
 * into your applications and services.
 * 
 * @example
 * ```typescript
 * import { NawaPaySDK } from '@nawapay/sdk';
 * 
 * const sdk = new NawaPaySDK({
 *   apiKey: 'your-api-key',
 *   network: 'solana',
 *   environment: 'production'
 * });
 * 
 * // Create a payment
 * const payment = await sdk.payments.create({
 *   amount: 0.1,
 *   currency: 'SOL',
 *   recipient: 'recipient-wallet-address'
 * });
 * ```
 */

export { NawaPaySDK } from './client';
export { X402Protocol, X402_PAYMENT_REQUIRED_STATUS } from './x402';
export type {
  PaymentConfig,
  X402PaymentRequest,
  X402PaymentResponse,
  X402Headers,
} from './x402';
export type {
  SDKConfig,
  PaymentOptions,
  SubscriptionOptions,
  StreamOptions,
  PaymentResult,
  SubscriptionResult,
  StreamResult,
  WalletInfo,
  ServiceInfo,
} from './types';

// Partner Integrations
export {
  ClawIntegration,
  AgentRegistryIntegration,
  ClawbetIntegration,
  PaymentRequiredError,
} from './integrations';

// Version
export const VERSION = '1.0.0';
