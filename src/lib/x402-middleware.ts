/**
 * x402 Middleware Example
 * 
 * This file demonstrates how to use x402 payment protocol
 * to protect API endpoints in Next.js applications.
 * 
 * Usage in Next.js middleware.ts:
 * 
 * import { x402Middleware } from '@/lib/x402-middleware';
 * 
 * export function middleware(request: NextRequest) {
 *   return x402Middleware(request, {
 *     protectedPaths: ['/api/premium/*'],
 *     amount: 0.001,
 *     currency: 'SOL',
 *     recipient: process.env.NAWAPAY_WALLET_ADDRESS!
 *   });
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { X402Protocol, X402_PAYMENT_REQUIRED_STATUS } from './x402';

export interface X402MiddlewareConfig {
  /** Paths that require payment */
  protectedPaths: string[];
  /** Amount to charge */
  amount: number;
  /** Currency (SOL, USDC, etc.) */
  currency: string;
  /** Recipient wallet address */
  recipient: string;
  /** Payment description */
  description?: string;
  /** Payment expiry in minutes */
  expiryMinutes?: number;
  /** Skip payment check for these paths */
  skipPaths?: string[];
}

export async function x402Middleware(
  request: NextRequest,
  config: X402MiddlewareConfig
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Check if path should be skipped
  if (config.skipPaths?.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if path requires payment
  const requiresPayment = config.protectedPaths.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(pathname);
    }
    return pathname === pattern || pathname.startsWith(pattern + '/');
  });

  if (!requiresPayment) {
    return NextResponse.next();
  }

  // Check for payment proof in headers
  const paymentProof = request.headers.get('x-402-payment-proof');
  
  if (paymentProof) {
    // Validate payment proof
    const isValid = await validatePaymentProof(paymentProof, {
      recipient: config.recipient,
      amount: config.amount,
      currency: config.currency,
    });

    if (isValid) {
      // Add payment info to request headers for downstream use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-402-verified', 'true');
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  // No valid payment proof - return 402 with payment headers
  const paymentRequest = X402Protocol.createPaymentRequest({
    network: 'solana',
    currency: config.currency,
    recipient: config.recipient,
    amount: config.amount,
    description: config.description || `Access to ${pathname}`,
    expiryMinutes: config.expiryMinutes || 30,
  });

  const paymentUrl = X402Protocol.generatePaymentUrl(
    paymentRequest,
    `${request.url}?paid=true`
  );

  const x402Headers = X402Protocol.createPaymentHeaders(paymentRequest, paymentUrl);

  return NextResponse.json(
    {
      error: 'Payment required',
      message: `Payment of ${config.amount} ${config.currency} is required to access this resource`,
      paymentUrl,
      paymentRequest,
    },
    {
      status: X402_PAYMENT_REQUIRED_STATUS,
      headers: {
        'X-402-Version': x402Headers['X-402-Version'],
        'X-402-Network': x402Headers['X-402-Network'],
        'X-402-Scheme': x402Headers['X-402-Scheme'],
        'X-402-Amount': x402Headers['X-402-Amount'],
        'X-402-Currency': x402Headers['X-402-Currency'],
        'X-402-Recipient': x402Headers['X-402-Recipient'],
        'X-402-Deadline': x402Headers['X-402-Deadline'],
        ...(x402Headers['X-402-Description'] && { 'X-402-Description': x402Headers['X-402-Description'] }),
        ...(x402Headers['X-402-Payment-URL'] && { 'X-402-Payment-URL': x402Headers['X-402-Payment-URL'] }),
      },
    }
  );
}

async function validatePaymentProof(
  proof: string,
  expected: {
    recipient: string;
    amount: number;
    currency: string;
  }
): Promise<boolean> {
  try {
    // Decode payment proof
    const data = JSON.parse(Buffer.from(proof, 'base64').toString());
    
    // Validate expected values
    if (data.recipient !== expected.recipient) return false;
    if (parseFloat(data.amount) < expected.amount) return false;
    if (data.currency !== expected.currency) return false;
    
    // Check if proof is expired (valid for 1 hour)
    const proofTime = new Date(data.timestamp).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (now - proofTime > oneHour) return false;
    
    return true;
  } catch {
    return false;
  }
}

export default x402Middleware;
