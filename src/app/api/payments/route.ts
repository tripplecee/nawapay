import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

const prisma = new PrismaClient();
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');

// Create payment request (generate transaction)
export async function POST(req: NextRequest) {
  try {
    const { senderWallet, recipientWallet, amount, type = 'ONE_TIME' } = await req.json();

    // Validate wallets
    try {
      new PublicKey(senderWallet);
      new PublicKey(recipientWallet);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // Create a transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(senderWallet),
        toPubkey: new PublicKey(recipientWallet),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(senderWallet);

    // Serialize transaction (unsigned)
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return NextResponse.json({
      success: true,
      transaction: serialized.toString('base64'),
      message: 'Sign this transaction to complete payment',
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

// Verify and record payment
export async function PUT(req: NextRequest) {
  try {
    const { signature, userId, metadata } = await req.json();

    // Verify transaction on Solana
    const status = await connection.getSignatureStatus(signature);

    if (!status.value || status.value.err) {
      return NextResponse.json({ error: 'Transaction failed or not found' }, { status: 400 });
    }

    // Get transaction details
    const txInfo = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!txInfo) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Calculate amount from transaction
    const amount = txInfo.meta?.postBalances[0] && txInfo.meta?.preBalances[0]
      ? (txInfo.meta.preBalances[0] - txInfo.meta.postBalances[0]) / LAMPORTS_PER_SOL
      : 0;

    // Record transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: 'SOL',
        signature,
        status: 'CONFIRMED',
        type: metadata?.type || 'ONE_TIME',
        metadata: JSON.stringify(metadata),
      },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}

// Get transaction history
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
