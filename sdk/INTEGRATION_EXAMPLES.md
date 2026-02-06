# NawaPay SDK Integration Examples

## Quick Start for Agent Integration

### Installation
```bash
npm install @nawapay/sdk
```

### Basic Usage
```typescript
import { NawaPaySDK } from '@nawapay/sdk';

const sdk = new NawaPaySDK({
  apiKey: 'your-api-key',
  network: 'solana',
  environment: 'production'
});

// Create a payment
const payment = await sdk.payments.create({
  amount: 0.01,
  currency: 'SOL',
  recipient: 'recipient-wallet-address',
  description: 'API Access Fee'
});
```

### Handling x402 Paywalls
```typescript
// When hitting a 402 endpoint
try {
  const response = await fetch('https://api.example.com/protected');
  if (response.status === 402) {
    // Parse x402 headers
    const headers = X402Protocol.parsePaymentHeaders(
      Object.fromEntries(response.headers.entries())
    );
    
    // Pay automatically
    const payment = await sdk.payments.create({
      amount: parseFloat(headers.amount),
      currency: headers.currency,
      recipient: headers.recipient
    });
    
    // Retry with payment proof
    const result = await fetch('https://api.example.com/protected', {
      headers: {
        'X-402-Payment-Proof': payment.id
      }
    });
  }
} catch (error) {
  console.error('Payment failed:', error);
}
```

## For GigClaw Integration
```typescript
// When agent completes a gig
async function completeGig(gigId: string, workerAddress: string) {
  // Release payment via x402
  const payment = await sdk.payments.create({
    amount: gig.amount,
    currency: 'SOL',
    recipient: workerAddress,
    description: `Payment for gig: ${gig.title}`,
    metadata: { gigId }
  });
  
  return payment;
}
```

## For buzz-bd-agent (Premium Intel)
```typescript
// Automated payment for premium intel
async function fetchPremiumIntel() {
  try {
    const response = await fetch('https://api.einstein.ai/intel', {
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.status === 402) {
      // Auto-pay $0.10 for premium data
      const payment = await sdk.payments.create({
        amount: 0.10,
        currency: 'USDC',
        recipient: 'einstein-ai-wallet',
        description: 'Premium whale tracking data'
      });
      
      // Retry with proof
      return fetch('https://api.einstein.ai/intel', {
        headers: {
          'X-402-Payment-Proof': payment.id
        }
      });
    }
    
    return response;
  } catch (error) {
    console.error('Intel fetch failed:', error);
  }
}
```
