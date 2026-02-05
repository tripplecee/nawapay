import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const prisma = new PrismaClient();
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');

// Create a new payment stream
export async function POST(req: NextRequest) {
  try {
    const { userId, recipientWallet, amount, ratePerMinute } = await req.json();

    // Validate recipient wallet
    try {
      new PublicKey(recipientWallet);
    } catch {
      return NextResponse.json({ error: 'Invalid recipient wallet address' }, { status: 400 });
    }

    // Create payment stream
    const stream = await prisma.paymentStream.create({
      data: {
        userId,
        recipientWallet,
        amount,
        ratePerMinute: ratePerMinute || null,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, stream });
  } catch (error) {
    console.error('Stream creation error:', error);
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
  }
}

// Execute a payment from a stream
export async function PUT(req: NextRequest) {
  try {
    const { streamId, amount, signature } = await req.json();

    const stream = await prisma.paymentStream.findUnique({
      where: { id: streamId },
      include: { user: true },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    if (stream.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Stream is not active' }, { status: 400 });
    }

    if (stream.spent + amount > stream.amount) {
      return NextResponse.json({ error: 'Insufficient funds in stream' }, { status: 402 });
    }

    // Update stream
    const updatedStream = await prisma.paymentStream.update({
      where: { id: streamId },
      data: {
        spent: stream.spent + amount,
        status: stream.spent + amount >= stream.amount ? 'CLOSED' : 'ACTIVE',
      },
    });

    // Record transaction
    await prisma.transaction.create({
      data: {
        userId: stream.userId,
        amount,
        currency: 'SOL',
        signature,
        status: 'CONFIRMED',
        type: 'STREAM',
        metadata: JSON.stringify({ streamId }),
      },
    });

    return NextResponse.json({ success: true, stream: updatedStream });
  } catch (error) {
    console.error('Payment execution error:', error);
    return NextResponse.json({ error: 'Failed to execute payment' }, { status: 500 });
  }
}

// Get user's payment streams
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const streams = await prisma.paymentStream.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ streams });
  } catch (error) {
    console.error('Fetch streams error:', error);
    return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 });
  }
}
