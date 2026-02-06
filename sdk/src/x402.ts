/**
 * x402 Payment Protocol Implementation
 */

export interface X402PaymentRequest {
  version: string;
  network: string;
  scheme: string;
  amount: string;
  currency: string;
  recipient: string;
  deadline: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface X402PaymentResponse {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  currency: string;
  timestamp: string;
  confirmed: boolean;
}

export interface X402Headers {
  'X-402-Version': string;
  'X-402-Network': string;
  'X-402-Scheme': string;
  'X-402-Amount': string;
  'X-402-Currency': string;
  'X-402-Recipient': string;
  'X-402-Deadline': string;
  'X-402-Description'?: string;
  'X-402-Payment-URL'?: string;
}

export const X402_VERSION = '1.0.0';
export const X402_PAYMENT_REQUIRED_STATUS = 402;

export interface PaymentConfig {
  network: 'solana' | 'ethereum' | 'base';
  currency: string;
  recipient: string;
  amount: number;
  description?: string;
  expiryMinutes?: number;
  metadata?: Record<string, unknown>;
}

export class X402Protocol {
  static createPaymentRequest(config: PaymentConfig): X402PaymentRequest {
    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + (config.expiryMinutes || 30));

    return {
      version: X402_VERSION,
      network: config.network,
      scheme: config.network === 'solana' ? 'solana-pay' : 'eip-681',
      amount: config.amount.toString(),
      currency: config.currency,
      recipient: config.recipient,
      deadline: deadline.toISOString(),
      description: config.description,
      metadata: config.metadata,
    };
  }

  static createPaymentHeaders(request: X402PaymentRequest, paymentUrl?: string): X402Headers {
    const headers: X402Headers = {
      'X-402-Version': request.version,
      'X-402-Network': request.network,
      'X-402-Scheme': request.scheme,
      'X-402-Amount': request.amount,
      'X-402-Currency': request.currency,
      'X-402-Recipient': request.recipient,
      'X-402-Deadline': request.deadline,
    };

    if (request.description) {
      headers['X-402-Description'] = request.description;
    }

    if (paymentUrl) {
      headers['X-402-Payment-URL'] = paymentUrl;
    }

    return headers;
  }

  static parsePaymentHeaders(headers: Record<string, string>): X402PaymentRequest | null {
    const version = headers['x-402-version'] || headers['X-402-Version'];
    if (!version) return null;

    return {
      version,
      network: headers['x-402-network'] || headers['X-402-Network'] || 'solana',
      scheme: headers['x-402-scheme'] || headers['X-402-Scheme'] || 'solana-pay',
      amount: headers['x-402-amount'] || headers['X-402-Amount'] || '0',
      currency: headers['x-402-currency'] || headers['X-402-Currency'] || 'SOL',
      recipient: headers['x-402-recipient'] || headers['X-402-Recipient'] || '',
      deadline: headers['x-402-deadline'] || headers['X-402-Deadline'] || new Date().toISOString(),
      description: headers['x-402-description'] || headers['X-402-Description'],
    };
  }

  static isExpired(request: X402PaymentRequest): boolean {
    return new Date(request.deadline) < new Date();
  }

  static generatePaymentUrl(request: X402PaymentRequest, callbackUrl?: string): string {
    if (request.network === 'solana') {
      const params = new URLSearchParams({
        amount: request.amount,
        reference: this.generateReference(),
      });
      
      if (request.description) {
        params.append('label', encodeURIComponent(request.description));
      }
      
      if (callbackUrl) {
        params.append('callback', encodeURIComponent(callbackUrl));
      }

      return `solana:${request.recipient}?${params.toString()}`;
    }

    // For other networks, use a generic payment URL
    const baseUrl = 'https://nawapay.io/pay';
    const params = new URLSearchParams({
      to: request.recipient,
      amount: request.amount,
      currency: request.currency,
      network: request.network,
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  private static generateReference(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

export default X402Protocol;
