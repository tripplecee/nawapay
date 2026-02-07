/**
 * AgentWallet Integration for NawaPay
 * 
 * Enables NawaPay to use AgentWallet for x402 payments and Solana transfers.
 * AgentWallet provides server-side wallets with policy-controlled actions.
 * 
 * @example
 * ```typescript
 * import { NawaPaySDK, AgentWalletIntegration } from '@nawapay/sdk';
 * 
 * const nawapay = new NawaPaySDK({ apiKey: 'your-key' });
 * const wallet = new AgentWalletIntegration({
 *   username: 'kinawa',
 *   apiToken: 'mf_...' // From ~/.agentwallet/config.json
 * });
 * 
 * // Execute payment via AgentWallet
 * const result = await wallet.payX402({
 *   url: 'https://api.service.com/x402/pay',
 *   body: { amount: 0.1, recipient: '...' }
 * });
 * ```
 */

import { PaymentOptions, PaymentResult } from './types';

export interface AgentWalletConfig {
  /** AgentWallet username */
  username: string;
  /** AgentWallet API token (starts with mf_) */
  apiToken: string;
  /** Optional base URL override */
  baseUrl?: string;
}

export interface X402PaymentOptions {
  /** Target API URL */
  url: string;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Request body */
  body?: any;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Preferred chain: auto, solana, evm */
  preferredChain?: 'auto' | 'solana' | 'evm';
  /** Preview payment without executing */
  dryRun?: boolean;
  /** Request timeout in ms */
  timeout?: number;
  /** Idempotency key */
  idempotencyKey?: string;
}

export interface X402PaymentResult {
  success: boolean;
  response: {
    status: number;
    body: any;
    contentType: string;
  };
  payment: {
    chain: string;
    amountFormatted: string;
    recipient: string;
    txHash?: string;
  };
  paid: boolean;
  attempts: number;
  duration: number;
}

export interface SolanaTransferOptions {
  /** Recipient Solana address */
  to: string;
  /** Amount in smallest units (SOL: 9 decimals, USDC: 6 decimals) */
  amount: string;
  /** Asset type */
  asset: 'sol' | 'usdc';
  /** Network */
  network: 'mainnet' | 'devnet';
  /** Optional idempotency key */
  idempotencyKey?: string;
}

export interface WalletBalances {
  sol?: string;
  usdc?: string;
  [key: string]: string | undefined;
}

export class AgentWalletIntegration {
  private config: AgentWalletConfig;
  private baseUrl: string;

  constructor(config: AgentWalletConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://agentwallet.mcpay.tech/api';
  }

  /**
   * Execute x402 payment via AgentWallet
   * This is a ONE-STEP payment - AgentWallet handles 402 detection, signing, and retry
   */
  async payX402(options: X402PaymentOptions): Promise<X402PaymentResult> {
    const response = await fetch(
      `${this.baseUrl}/wallets/${this.config.username}/actions/x402/fetch`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: options.url,
          method: options.method || 'POST',
          body: options.body,
          headers: options.headers,
          preferredChain: options.preferredChain || 'solana',
          dryRun: options.dryRun || false,
          timeout: options.timeout || 30000,
          idempotencyKey: options.idempotencyKey
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AgentWallet x402 payment failed: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Preview x402 payment cost without executing
   */
  async previewX402Cost(options: Omit<X402PaymentOptions, 'dryRun'>): Promise<{
    success: boolean;
    dryRun: true;
    payment: {
      required: boolean;
      chain: string;
      amountFormatted: string;
      policyAllowed: boolean;
    }
  }> {
    const result = await this.payX402({ ...options, dryRun: true });
    return result as any;
  }

  /**
   * Transfer SOL or USDC on Solana
   */
  async transferSolana(options: SolanaTransferOptions): Promise<{
    actionId: string;
    status: 'confirmed' | 'pending';
    txHash: string;
    explorer: string;
  }> {
    const response = await fetch(
      `${this.baseUrl}/wallets/${this.config.username}/actions/transfer-solana`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: options.to,
          amount: options.amount,
          asset: options.asset,
          network: options.network,
          idempotencyKey: options.idempotencyKey
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AgentWallet transfer failed: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Get wallet balances
   */
  async getBalances(): Promise<WalletBalances> {
    const response = await fetch(
      `${this.baseUrl}/wallets/${this.config.username}/balances`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get balances: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Request devnet SOL from faucet (for testing)
   * Limited to 3 requests per 24 hours
   */
  async requestDevnetFaucet(): Promise<{
    actionId: string;
    status: 'confirmed';
    amount: string;
    txHash: string;
    explorer: string;
    remaining: number;
  }> {
    const response = await fetch(
      `${this.baseUrl}/wallets/${this.config.username}/actions/faucet-sol`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Faucet request failed: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Get wallet activity/history
   */
  async getActivity(limit: number = 50): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/wallets/${this.config.username}/activity?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get activity: ${response.status}`);
    }

    const data = await response.json();
    return data.activity || [];
  }

  /**
   * Get current policy settings
   */
  async getPolicy(): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/wallets/${this.config.username}/policy`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get policy: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Update policy settings
   */
  async updatePolicy(policy: {
    max_per_tx_usd?: string;
    allow_chains?: string[];
    allow_contracts?: string[];
  }): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/wallets/${this.config.username}/policy`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(policy)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update policy: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Check if wallet is connected and get public info
   */
  async getPublicInfo(): Promise<{
    connected: boolean;
    username: string;
    evmAddress?: string;
    solanaAddress?: string;
  }> {
    const response = await fetch(
      `${this.baseUrl}/wallets/${this.config.username}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get wallet info: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Static method to connect/start OTP flow
   */
  static async connectStart(email: string): Promise<{
    username: string;
    message: string;
  }> {
    const response = await fetch(
      'https://agentwallet.mcpay.tech/api/connect/start',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }
    );

    if (!response.ok) {
      throw new Error(`Connect start failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Static method to complete OTP connection
   */
  static async connectComplete(
    username: string,
    email: string,
    otp: string
  ): Promise<{
    apiToken: string;
    evmAddress: string;
    solanaAddress: string;
  }> {
    const response = await fetch(
      'https://agentwallet.mcpay.tech/api/connect/complete',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, otp })
      }
    );

    if (!response.ok) {
      throw new Error(`Connect complete failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Load credentials from standard config file
   */
  static loadFromConfig(configPath?: string): AgentWalletConfig {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const filePath = configPath || path.join(os.homedir(), '.agentwallet', 'config.json');

    if (!fs.existsSync(filePath)) {
      throw new Error(`AgentWallet config not found at ${filePath}. Run connect flow first.`);
    }

    const config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    return {
      username: config.username,
      apiToken: config.apiToken,
    };
  }
}

/**
 * Extended NawaPay SDK with AgentWallet integration
 */
export class NawaPayWithAgentWallet {
  private agentWallet: AgentWalletIntegration;

  constructor(agentWalletConfig: AgentWalletConfig) {
    this.agentWallet = new AgentWalletIntegration(agentWalletConfig);
  }

  /**
   * Execute payment using AgentWallet
   */
  async executePayment(
    paymentOptions: PaymentOptions,
    x402Url: string
  ): Promise<X402PaymentResult> {
    // Preview cost first
    const preview = await this.agentWallet.previewX402Cost({
      url: x402Url,
      body: paymentOptions
    });

    if (!preview.payment.policyAllowed) {
      throw new Error('Payment exceeds AgentWallet policy limits');
    }

    // Execute payment
    return this.agentWallet.payX402({
      url: x402Url,
      body: paymentOptions,
      preferredChain: 'solana'
    });
  }

  /**
   * Get underlying AgentWallet instance
   */
  getWallet(): AgentWalletIntegration {
    return this.agentWallet;
  }
}
