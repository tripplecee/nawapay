import { NextRequest, NextResponse } from 'next/server';
import { X402Protocol } from '@/lib/x402';

/**
 * x402 Payment Verification API
 * 
 * This endpoint handles x402 payment verification and proof validation.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      txSignature, 
      paymentRequest,
      recipient,
      amount,
      currency 
    } = body;

    if (!txSignature || !recipient || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment on Solana
    // In production, this would verify the transaction on-chain
    const isValid = await verifyTransaction(txSignature, recipient, amount, currency);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Generate payment proof
    const paymentProof = generatePaymentProof({
      txSignature,
      recipient,
      amount,
      currency,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      paymentProof,
      verified: true,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('x402 verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Parse x402 headers from request
  const headers = Object.fromEntries(request.headers.entries());
  const paymentRequest = X402Protocol.parsePaymentHeaders(headers);

  if (paymentRequest) {
    return NextResponse.json({
      hasPayment: true,
      paymentRequest,
      expired: X402Protocol.isExpired(paymentRequest),
    });
  }

  // Generate a new payment request
  const recipient = searchParams.get('recipient') || process.env.NAWAPAY_WALLET_ADDRESS;
  const amount = searchParams.get('amount') || '0.01';
  const currency = searchParams.get('currency') || 'SOL';
  const description = searchParams.get('description') || 'API Access';

  if (!recipient) {
    return NextResponse.json(
      { error: 'Recipient address required' },
      { status: 400 }
    );
  }

  const newRequest = X402Protocol.createPaymentRequest({
    network: 'solana',
    currency,
    recipient,
    amount: parseFloat(amount),
    description,
    expiryMinutes: 30,
  });

  const paymentUrl = X402Protocol.generatePaymentUrl(newRequest);
  const x402Headers = X402Protocol.createPaymentHeaders(newRequest, paymentUrl);

  return NextResponse.json({
    paymentRequest: newRequest,
    paymentUrl,
    headers: x402Headers,
  }, {
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
  });
}

async function verifyTransaction(
  signature: string,
  recipient: string,
  amount: number,
  currency: string
): Promise<boolean> {
  // In production, verify the transaction on Solana
  // For now, return true for testing
  return true;
}

function generatePaymentProof(data: {
  txSignature: string;
  recipient: string;
  amount: number;
  currency: string;
  timestamp: string;
}): string {
  // Generate a proof token that can be used for subsequent requests
  const proof = Buffer.from(JSON.stringify(data)).toString('base64');
  return proof;
}
