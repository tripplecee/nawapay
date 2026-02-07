/**
 * NawaPay SDK - Partner Integrations
 * Real implementations for partner protocols
 */

import { NawaPaySDK } from './client';
import type { PaymentOptions, PaymentResult } from './types';

/**
 * Claw Integration - Bounded Spending Authority
 * 
 * Claw provides NFT-based spending limits for agents.
 * This integration checks spending authority before processing payments.
 * 
 * @example
 * ```typescript
 * const claw = new ClawIntegration(nawapay, {
 *   clawProgramId: 'CLAW...',
 *   rpcEndpoint: 'https://api.devnet.solana.com'
 * });
 * 
 * // Check if agent can spend
 * const canSpend = await claw.checkSpendingAuthority(agentId, 0.1);
 * if (canSpend) {
 *   await claw.payWithAuthority(agentId, {
 *     recipient: '...',
 *     amount: 0.1,
 *     currency: 'SOL'
 *   });
 * }
 * ```
 */
export class ClawIntegration {
  private nawapay: NawaPaySDK;
  private config: {
    clawProgramId: string;
    rpcEndpoint: string;
  };

  constructor(nawapay: NawaPaySDK, config: {
    clawProgramId: string;
    rpcEndpoint?: string;
  }) {
    this.nawapay = nawapay;
    this.config = {
      clawProgramId: config.clawProgramId,
      rpcEndpoint: config.rpcEndpoint || 'https://api.devnet.solana.com'
    };
  }

  /**
   * Check if agent has valid spending authority
   */
  async checkSpendingAuthority(
    agentId: string,
    amount: number
  ): Promise<{
    authorized: boolean;
    remaining: number;
    maxAmount: number;
    spent: number;
    clawAddress?: string;
  }> {
    try {
      // Query Claw PDA for agent
      const clawData = await this.fetchClawData(agentId);
      
      if (!clawData) {
        return {
          authorized: false,
          remaining: 0,
          maxAmount: 0,
          spent: 0
        };
      }

      const remaining = clawData.maxAmount - clawData.spentAmount;
      
      return {
        authorized: remaining >= amount && clawData.isValid,
        remaining,
        maxAmount: clawData.maxAmount,
        spent: clawData.spentAmount,
        clawAddress: clawData.address
      };
    } catch (error) {
      console.error('Claw authority check failed:', error);
      return {
        authorized: false,
        remaining: 0,
        maxAmount: 0,
        spent: 0
      };
    }
  }

  /**
   * Process payment with Claw authorization
   */
  async payWithAuthority(
    agentId: string,
    payment: PaymentOptions
  ): Promise<PaymentResult & { clawUpdated: boolean }> {
    // Verify authority first
    const authority = await this.checkSpendingAuthority(agentId, payment.amount);
    
    if (!authority.authorized) {
      throw new Error(
        `Claw spending limit exceeded. Available: ${authority.remaining}, ` +
        `Requested: ${payment.amount}`
      );
    }

    // Process payment through NawaPay
    const result = await this.nawapay.payments.create({
      ...payment,
      metadata: {
        ...payment.metadata,
        clawAuthorized: true,
        clawAddress: authority.clawAddress,
        agentId
      }
    });

    // Update Claw spending record
    const clawUpdated = await this.recordClawSpending(
      agentId,
      payment.amount,
      result.id
    );

    return {
      ...result,
      clawUpdated
    };
  }

  /**
   * Fetch Claw data from Solana
   */
  private async fetchClawData(agentId: string): Promise<{
    address: string;
    maxAmount: number;
    spentAmount: number;
    isValid: boolean;
    expiry: number;
  } | null> {
    // TODO: Implement Solana RPC call to fetch Claw PDA
    // This will be implemented when Claw program is deployed
    
    // Placeholder for actual implementation
    console.log(`Fetching Claw data for agent: ${agentId}`);
    
    // For now, return mock data for testing
    // In production, this queries the Claw program on Solana
    return {
      address: `CLAW_${agentId}`,
      maxAmount: 10.0,
      spentAmount: 2.5,
      isValid: true,
      expiry: Date.now() + 86400000 * 30 // 30 days
    };
  }

  /**
   * Record spending on Claw
   */
  private async recordClawSpending(
    agentId: string,
    amount: number,
    paymentId: string
  ): Promise<boolean> {
    // TODO: Implement Solana transaction to update Claw PDA
    console.log(`Recording Claw spending: ${amount} SOL for payment ${paymentId}`);
    return true;
  }
}

/**
 * AgentRegistry Integration - Discovery + Payments
 * 
 * Integrates NawaPay with AgentRegistry for seamless
 * agent discovery and payment.
 * 
 * @example
 * ```typescript
 * const registry = new AgentRegistryIntegration(nawapay, {
 *   registryEndpoint: 'https://api.agentregistry.io'
 * });
 * 
 * // Find and pay an agent
 * const agent = await registry.findAgent({ capability: 'trading' });
 * const result = await registry.hireAgent(agent.id, {
 *   task: 'analyze-market',
 *   payment: { amount: 0.1, currency: 'SOL' }
 * });
 * ```
 */
export class AgentRegistryIntegration {
  private nawapay: NawaPaySDK;
  private endpoint: string;

  constructor(nawapay: NawaPaySDK, config: {
    registryEndpoint?: string;
  } = {}) {
    this.nawapay = nawapay;
    this.endpoint = config.registryEndpoint || 'https://api.agentregistry.io';
  }

  /**
   * Search for agents by capability
   */
  async findAgent(filters: {
    capability?: string;
    minRating?: number;
    maxPrice?: number;
    available?: boolean;
  }): Promise<{
    id: string;
    name: string;
    capabilities: string[];
    pricing: {
      hourlyRate?: number;
      perTaskRate?: number;
      currency: string;
    };
    rating: number;
    wallet: string;
  } | null> {
    try {
      const response = await fetch(`${this.endpoint}/v1/agents/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });

      if (!response.ok) return null;
      
      const agents = await response.json();
      return agents[0] || null;
    } catch (error) {
      console.error('AgentRegistry search failed:', error);
      return null;
    }
  }

  /**
   * Hire an agent with payment
   */
  async hireAgent(
    agentId: string,
    job: {
      task: string;
      description?: string;
      payment: {
        amount: number;
        currency: string;
      };
      deadline?: number; // hours
    }
  ): Promise<{
    jobId: string;
    paymentId: string;
    status: string;
  }> {
    // Get agent details
    const agent = await this.getAgentDetails(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Create payment (held until job complete)
    const payment = await this.nawapay.payments.create({
      recipient: agent.wallet,
      amount: job.payment.amount,
      currency: job.payment.currency,
      metadata: {
        type: 'agent_hire',
        agentId,
        task: job.task,
        deadline: job.deadline,
        held: true
      }
    });

    // Register job with AgentRegistry
    const jobRegistration = await this.registerJob({
      agentId,
      paymentId: payment.id,
      task: job.task,
      description: job.description,
      deadline: job.deadline
    });

    return {
      jobId: jobRegistration.jobId,
      paymentId: payment.id,
      status: 'pending'
    };
  }

  /**
   * Complete job and confirm payment
   */
  async completeJob(jobId: string): Promise<PaymentResult> {
    // Get job details from registry
    const job = await this.getJobDetails(jobId);
    
    // Get payment status
    return await this.nawapay.payments.get(job.paymentId);
  }

  private async getAgentDetails(agentId: string) {
    try {
      const response = await fetch(`${this.endpoint}/v1/agents/${agentId}`);
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  }

  private async registerJob(data: any) {
    // TODO: Implement when AgentRegistry API is live
    console.log('Registering job with AgentRegistry:', data);
    return { jobId: `JOB_${Date.now()}` };
  }

  private async getJobDetails(jobId: string) {
    // TODO: Implement when AgentRegistry API is live
    return { paymentId: jobId.replace('JOB_', 'PAY_') };
  }
}

/**
 * Clawbet Integration - Prediction Market Payments
 * 
 * Handles payments for agent prediction markets.
 * 
 * @example
 * ```typescript
 * const clawbet = new ClawbetIntegration(nawapay, {
 *   clawbetEndpoint: 'https://api.clawbet.io'
 * });
 * 
 * // Enter prediction market
 * await clawbet.enterMarket(agentId, marketId, prediction, 0.1);
 * ```
 */
export class ClawbetIntegration {
  private nawapay: NawaPaySDK;
  private endpoint: string;

  constructor(nawapay: NawaPaySDK, config: {
    clawbetEndpoint?: string;
  } = {}) {
    this.nawapay = nawapay;
    this.endpoint = config.clawbetEndpoint || 'https://api.clawbet.io';
  }

  /**
   * Enter a prediction market
   */
  async enterMarket(
    agentId: string,
    marketId: string,
    prediction: {
      outcome: string;
      probability: number;
      rationale?: string;
    },
    entryFee: number
  ): Promise<{
    entryId: string;
    paymentId: string;
    status: string;
  }> {
    // Get market details
    const market = await this.getMarketDetails(marketId);
    if (!market) {
      throw new Error(`Market ${marketId} not found`);
    }

    // Verify entry fee
    if (entryFee < market.minEntryFee) {
      throw new Error(
        `Entry fee too low. Minimum: ${market.minEntryFee}, Provided: ${entryFee}`
      );
    }

    // Pay entry fee
    const payment = await this.nawapay.payments.create({
      recipient: market.wallet,
      amount: entryFee,
      currency: 'SOL',
      metadata: {
        type: 'clawbet_entry',
        agentId,
        marketId,
        prediction: prediction.outcome,
        probability: prediction.probability
      }
    });

    // Submit prediction to Clawbet
    const entry = await this.submitPrediction(agentId, marketId, {
      ...prediction,
      paymentId: payment.id
    });

    return {
      entryId: entry.id,
      paymentId: payment.id,
      status: 'entered'
    };
  }

  /**
   * Subscribe to premium prediction markets
   */
  async subscribeToPremium(
    agentId: string,
    tier: 'basic' | 'pro' | 'enterprise'
  ): Promise<{
    subscriptionId: string;
    streamId: string;
  }> {
    const pricing = {
      basic: { amount: 0.3, duration: 30 * 86400 }, // 0.3 SOL for 30 days
      pro: { amount: 1.5, duration: 30 * 86400 },    // 1.5 SOL for 30 days
      enterprise: { amount: 6.0, duration: 30 * 86400 } // 6 SOL for 30 days
    };

    const tierConfig = pricing[tier];

    // Create payment stream
    const stream = await this.nawapay.streams.create({
      recipient: 'CLAWBET_WALLET',
      totalAmount: tierConfig.amount,
      duration: tierConfig.duration,
      currency: 'SOL',
      description: `Clawbet ${tier} subscription`
    });

    return {
      subscriptionId: `SUB_${agentId}_${tier}`,
      streamId: stream.id
    };
  }

  private async getMarketDetails(marketId: string) {
    // TODO: Implement when Clawbet API is live
    return {
      id: marketId,
      minEntryFee: 0.01,
      wallet: 'CLAWBET_WALLET',
      status: 'open'
    };
  }

  private async submitPrediction(
    agentId: string,
    marketId: string,
    prediction: any
  ) {
    // TODO: Implement when Clawbet API is live
    return { id: `PRED_${Date.now()}` };
  }
}

/**
 * PaymentRequiredError
 */
export class PaymentRequiredError extends Error {
  public paymentRequest: any;

  constructor(message: string, paymentRequest: any) {
    super(message);
    this.name = 'PaymentRequiredError';
    this.paymentRequest = paymentRequest;
  }
}
