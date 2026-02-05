import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new service
export async function POST(req: NextRequest) {
  try {
    const { name, description, providerId, price, currency, billingType, interval } = await req.json();

    const service = await prisma.service.create({
      data: {
        name,
        description,
        providerId,
        price,
        currency: currency || 'SOL',
        billingType: billingType || 'SUBSCRIPTION',
        interval,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error('Service creation error:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}

// List all services or filter by provider
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = {};
    if (providerId) where.providerId = providerId;
    if (activeOnly) where.isActive = true;

    const services = await prisma.service.findMany({
      where,
      include: { provider: { select: { name: true, reputation: true, walletAddress: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Fetch services error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
