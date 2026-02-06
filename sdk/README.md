# NawaPay SDK

A comprehensive SDK for integrating x402 payment protocol into your applications and services.

## Features

- **x402 Protocol Support**: Full implementation of the x402 payment standard
- **Multiple Payment Types**: One-time payments, subscriptions, and payment streams
- **Multi-Chain**: Support for Solana, Ethereum, and Base networks
- **TypeScript**: Fully typed for better developer experience
- **Easy Integration**: Simple middleware for protecting API endpoints

## Installation

```bash
npm install @nawapay/sdk
# or
yarn add @nawapay/sdk
# or
pnpm add @nawapay/sdk
```

## Quick Start

```typescript
import { NawaPaySDK } from '@nawapay/sdk';

const sdk = new NawaPaySDK({
  apiKey: 'your-api-key',
  network: 'solana',
  environment: 'production'
});

// Create a payment
const payment = await sdk.payments.create({
  amount: 0.1,
  currency: 'SOL',
  recipient: 'recipient-wallet-address',
  description: 'Payment for API usage'
});
```

## Configuration

```typescript
interface SDKConfig {
  apiKey: string;                    // Required: API key for authentication
  network?: 'solana' | 'ethereum' | 'base';  // Default: 'solana'
  environment?: 'development' | 'staging' | 'production';  // Default: 'production'
  baseUrl?: string;                  // Optional: Custom API base URL
  timeout?: number;                  // Optional: Request timeout in ms (default: 30000)
}
```

## Usage Examples

### One-Time Payments

```typescript
// Create a payment
const payment = await sdk.payments.create({
  amount: 0.5,
  currency: 'SOL',
  recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  description: 'API Access',
  metadata: {
    userId: 'user-123',
    plan: 'premium'
  }
});

// Check payment status
const status = await sdk.payments.get(payment.id);
```

### Subscriptions

```typescript
// Create a subscription
const subscription = await sdk.subscriptions.create({
  serviceName: 'Premium API',
  price: 0.01,
  currency: 'SOL',
  interval: 'monthly',
  recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  description: 'Monthly API access'
});

// List subscriptions
const subs = await sdk.subscriptions.list();

// Cancel subscription
await sdk.subscriptions.cancel(subscription.id);
```

### Payment Streams

```typescript
// Create a payment stream (e.g., $1 over 1 hour)
const stream = await sdk.streams.create({
  recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  totalAmount: 1.0,
  currency: 'SOL',
  duration: 3600, // seconds
  description: 'Pay-as-you-go compute'
});

// Pause stream
await sdk.streams.pause(stream.id);

// Resume stream
await sdk.streams.resume(stream.id);
```

### x402 Middleware Integration

Protect your API endpoints with x402 payment requirements:

```typescript
import { NawaPaySDK, X402Protocol } from '@nawapay/sdk';
import express from 'express';

const app = express();
const sdk = new NawaPaySDK({ apiKey: 'your-key' });

// Middleware to require payment
function requirePayment(amount: number, currency: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentProof = req.headers['x-402-payment-proof'];
    
    if (!paymentProof) {
      // Return 402 with payment headers
      const headers = sdk.payments.createX402Headers({
        amount,
        currency,
        recipient: 'your-wallet-address',
        description: 'API Access'
      });
      
      res.status(402).set(headers).json({
        error: 'Payment required',
        paymentUrl: headers['X-402-Payment-URL']
      });
      return;
    }
    
    // Verify payment proof
    // ... validation logic
    next();
  };
}

// Protected endpoint
app.get('/api/premium-data', 
  requirePayment(0.01, 'SOL'),
  async (req, res) => {
    res.json({ data: 'premium content' });
  }
);
```

### Handling 402 Responses

```typescript
try {
  const response = await fetch('https://api.example.com/premium-endpoint');
  
  if (response.status === 402) {
    const headers = X402Protocol.parsePaymentHeaders(
      Object.fromEntries(response.headers.entries())
    );
    
    if (headers) {
      console.log('Payment required:', headers);
      // Redirect user to payment or handle programmatically
    }
  }
} catch (error) {
  if (error instanceof PaymentRequiredError) {
    console.log('Payment request:', error.paymentRequest);
  }
}
```

### Wallet Integration

```typescript
// Set wallet for authenticated requests
sdk.setWallet('your-wallet-address');

// Get wallet info
const info = await sdk.wallet.info();

// Get balance
const balance = await sdk.wallet.balance();

// Request airdrop (devnet only)
const signature = await sdk.wallet.airdrop(2);
```

## Service Discovery

```typescript
// List available services
const services = await sdk.services.list();

// Get service details
const service = await sdk.services.get('service-id');

// Register your own service
const newService = await sdk.services.register({
  name: 'My API Service',
  provider: 'your-wallet-address',
  price: 0.001,
  currency: 'SOL',
  interval: 'per-request',
  description: 'High-quality API access'
});
```

## Error Handling

```typescript
import { PaymentRequiredError } from '@nawapay/sdk';

try {
  await sdk.payments.create({...});
} catch (error) {
  if (error instanceof PaymentRequiredError) {
    // Handle 402 payment required
    console.log(error.paymentRequest);
  } else {
    // Handle other errors
    console.error(error);
  }
}
```

## React Hook Example

```typescript
import { useState, useCallback } from 'react';
import { NawaPaySDK } from '@nawapay/sdk';

const sdk = new NawaPaySDK({
  apiKey: process.env.NEXT_PUBLIC_NAWAPAY_KEY!,
  environment: 'production'
});

export function usePayment() {
  const [loading, setLoading] = useState(false);
  
  const pay = useCallback(async (amount: number, recipient: string) => {
    setLoading(true);
    try {
      const payment = await sdk.payments.create({
        amount,
        currency: 'SOL',
        recipient
      });
      return payment;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { pay, loading };
}
```

## API Reference

See the full [API Documentation](https://docs.nawapay.io/sdk) for detailed information about all available methods and types.

## License

MIT
