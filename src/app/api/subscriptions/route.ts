import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new subscription
export async function POST(req: NextRequest) {
  try {
    const { userId, serviceId, interval } = await req.json();

    // Check if user already has active subscription
    const existingSub = await prisma.subscription.findFirst({
      where: {
        userId,
        serviceId,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
    });

    if (existingSub) {
      return NextResponse.json(
        { error: 'Active subscription already exists' },
        { status: 409 }
      );
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Calculate next billing date
    const nextBilling = calculateNextBilling(interval || service.interval);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        serviceId,
        status: 'ACTIVE',
        interval: interval || service.interval,
        nextBilling,
        autoRenew: true,
      },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

// Get user's subscriptions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Fetch subscriptions error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

// Update subscription (pause, resume, cancel)
export async function PATCH(req: NextRequest) {
  try {
    const { subscriptionId, action } = await req.json();

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    let updateData: any = {};

    switch (action) {
      case 'PAUSE':
        updateData = { status: 'PAUSED' };
        break;
      case 'RESUME':
        updateData = {
          status: 'ACTIVE',
          nextBilling: calculateNextBilling(subscription.interval),
        };
        break;
      case 'CANCEL':
        updateData = { status: 'CANCELLED', autoRenew: false };
        break;
      case 'TOGGLE_RENEW':
        updateData = { autoRenew: !subscription.autoRenew };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

function calculateNextBilling(interval: string | null): Date {
  const now = new Date();
  switch (interval) {
    case 'HOURLY':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'DAILY':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'WEEKLY':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'MONTHLY':
      return new Date(now.setMonth(now.getMonth() + 1));
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
