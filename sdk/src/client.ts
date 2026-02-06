/**
 * NawaPay SDK Client
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { X402Protocol, X402_PAYMENT_REQUIRED_STATUS } from './x402';
import type {
  SDKConfig,
  PaymentOptions,
  SubscriptionOptions,
  StreamOptions,
  PaymentResult,
  SubscriptionResult,
  StreamResult,
  WalletInfo,
  ServiceInfo,
  AgentInfo,
} from './types';

export class NawaPaySDK {
  private client: AxiosInstance;
  private config: SDKConfig;

  constructor(config: SDKConfig) {
    this.config = {
      network: 'solana',
      environment: 'production',
      timeout: 30000,
      ...config,
    };

    const baseUrls: Record<string, string> = {
      development: 'http://localhost:3000',
      staging: 'https://staging.nawapay.io',
      production: 'https://nawapay.io',
    };

    this.client = axios.create({
      baseURL: config.baseUrl || baseUrls[this.config.environment!],
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
      },
    });

    // Add response interceptor for x402 handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === X402_PAYMENT_REQUIRED_STATUS) {
          const x402Headers = X402Protocol.parsePaymentHeaders(
            error.response.headers as Record<string, string>
          );
          if (x402Headers) {
            throw new PaymentRequiredError('Payment required', x402Headers);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set wallet address for authenticated requests
   */
  setWallet(walletAddress: string): void {
    this.client.defaults.headers.common['X-Wallet-Address'] = walletAddress;
  }

  /**
   * Get SDK version
   */
  get version(): string {
    return '1.0.0';
  }

  /**
   * Payment methods
   */
  get payments() {
    return {
      /**
       * Create a new payment
       */
      create: async (options: PaymentOptions): Promise<PaymentResult> => {
        const response = await this.client.post('/api/payments', {
          ...options,
          network: this.config.network,
        });
        return response.data;
      },

      /**
       * Get payment status
       */
      get: async (paymentId: string): Promise<PaymentResult> => {
        const response = await this.client.get(`/api/payments/${paymentId}`);
        return response.data;
      },

      /**
       * List payments
       */
      list: async (limit: number = 10): Promise<PaymentResult[]> => {
        const response = await this.client.get(`/api/payments?limit=${limit}`);
        return response.data;
      },

      /**
       * Create x402 payment headers for middleware integration
       */
      createX402Headers: (options: PaymentOptions): Record<string, string> => {
        const request = X402Protocol.createPaymentRequest({
          network: this.config.network || 'solana',
          currency: options.currency,
          recipient: options.recipient,
          amount: options.amount,
          description: options.description,
          expiryMinutes: options.expiryMinutes,
          metadata: options.metadata,
        });

        const paymentUrl = X402Protocol.generatePaymentUrl(
          request,
          options.callbackUrl
        );

        const headers = X402Protocol.createPaymentHeaders(request, paymentUrl);
        return Object.fromEntries(
          Object.entries(headers).filter(([_, v]) => v !== undefined)
        ) as Record<string, string>;
      },
    };
  }

  /**
   * Subscription methods
   */
  get subscriptions() {
    return {
      /**
       * Create a new subscription
       */
      create: async (options: SubscriptionOptions): Promise<SubscriptionResult> => {
        const response = await this.client.post('/api/subscriptions', {
          ...options,
          network: this.config.network,
        });
        return response.data;
      },

      /**
       * Get subscription details
       */
      get: async (subscriptionId: string): Promise<SubscriptionResult> => {
        const response = await this.client.get(`/api/subscriptions/${subscriptionId}`);
        return response.data;
      },

      /**
       * List subscriptions
       */
      list: async (): Promise<SubscriptionResult[]> => {
        const response = await this.client.get('/api/subscriptions');
        return response.data;
      },

      /**
       * Cancel a subscription
       */
      cancel: async (subscriptionId: string): Promise<void> => {
        await this.client.delete(`/api/subscriptions/${subscriptionId}`);
      },

      /**
       * Pause a subscription
       */
      pause: async (subscriptionId: string): Promise<SubscriptionResult> => {
        const response = await this.client.post(`/api/subscriptions/${subscriptionId}/pause`);
        return response.data;
      },

      /**
       * Resume a subscription
       */
      resume: async (subscriptionId: string): Promise<SubscriptionResult> => {
        const response = await this.client.post(`/api/subscriptions/${subscriptionId}/resume`);
        return response.data;
      },
    };
  }

  /**
   * Payment stream methods
   */
  get streams() {
    return {
      /**
       * Create a new payment stream
       */
      create: async (options: StreamOptions): Promise<StreamResult> => {
        const response = await this.client.post('/api/streams', {
          ...options,
          network: this.config.network,
        });
        return response.data;
      },

      /**
       * Get stream details
       */
      get: async (streamId: string): Promise<StreamResult> => {
        const response = await this.client.get(`/api/streams/${streamId}`);
        return response.data;
      },

      /**
       * List streams
       */
      list: async (): Promise<StreamResult[]> => {
        const response = await this.client.get('/api/streams');
        return response.data;
      },

      /**
       * Pause a stream
       */
      pause: async (streamId: string): Promise<StreamResult> => {
        const response = await this.client.post(`/api/streams/${streamId}/pause`);
        return response.data;
      },

      /**
       * Resume a stream
       */
      resume: async (streamId: string): Promise<StreamResult> => {
        const response = await this.client.post(`/api/streams/${streamId}/resume`);
        return response.data;
      },

      /**
       * Cancel a stream
       */
      cancel: async (streamId: string): Promise<void> => {
        await this.client.delete(`/api/streams/${streamId}`);
      },
    };
  }

  /**
   * Service discovery methods
   */
  get services() {
    return {
      /**
       * List available services
       */
      list: async (): Promise<ServiceInfo[]> => {
        const response = await this.client.get('/api/services');
        return response.data;
      },

      /**
       * Get service details
       */
      get: async (serviceId: string): Promise<ServiceInfo> => {
        const response = await this.client.get(`/api/services/${serviceId}`);
        return response.data;
      },

      /**
       * Register a new service
       */
      register: async (service: Omit<ServiceInfo, 'id'>): Promise<ServiceInfo> => {
        const response = await this.client.post('/api/services', service);
        return response.data;
      },

      /**
       * Update service
       */
      update: async (serviceId: string, service: Partial<ServiceInfo>): Promise<ServiceInfo> => {
        const response = await this.client.put(`/api/services/${serviceId}`, service);
        return response.data;
      },
    };
  }

  /**
   * Agent methods
   */
  get agents() {
    return {
      /**
       * Get agent info by wallet address
       */
      get: async (walletAddress: string): Promise<AgentInfo> => {
        const response = await this.client.get(`/api/agents/${walletAddress}`);
        return response.data;
      },

      /**
       * List agents
       */
      list: async (): Promise<AgentInfo[]> => {
        const response = await this.client.get('/api/agents');
        return response.data;
      },
    };  }

  /**
   * Wallet methods
   */
  get wallet() {
    return {
      /**
       * Get wallet info
       */
      info: async (): Promise<WalletInfo> => {
        const response = await this.client.get('/api/wallet');
        return response.data;
      },

      /**
       * Get balance
       */
      balance: async (): Promise<number> => {
        const response = await this.client.get('/api/wallet/balance');
        return response.data.balance;
      },

      /**
       * Request airdrop (devnet only)
       */
      airdrop: async (amount: number = 1): Promise<string> => {
        const response = await this.client.post('/api/wallet/airdrop', { amount });
        return response.data.signature;
      },
    };  }
}

/**
 * Payment Required Error
 * Thrown when a 402 response is received with x402 headers
 */
export class PaymentRequiredError extends Error {
  constructor(
    message: string,
    public readonly paymentRequest: ReturnType<typeof X402Protocol.parsePaymentHeaders>
  ) {
    super(message);
    this.name = 'PaymentRequiredError';
  }
}

export default NawaPaySDK;
