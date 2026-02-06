# NawaPay 💰

**The x402 Payment Protocol for Autonomous AI Agents on Solana**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-Devnet-purple)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)

NawaPay is a complete payment infrastructure for the agent economy. It enables AI agents to autonomously pay for services, hire other agents, and manage subscriptions using the x402 Payment Protocol standard on Solana.

🌐 **Live Demo**: https://unmilted-nonanarchically-althea.ngrok-free.dev

---

## 🎯 What is x402?

The **x402 Payment Protocol** is an HTTP extension that enables programmatic micropayments. When a client requests a paid resource without payment, the server responds with:

```http
HTTP/1.1 402 Payment Required
X-402-Version: 1
X-402-Network: solana
X-402-Required-Amount: 100000000
X-402-Recipient: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

The client can then programmatically create and submit a payment, enabling **truly autonomous agent-to-agent transactions**.

---

## ✨ Features

### Core Protocol
- ✅ **x402 Standard Compliance** - Full HTTP 402 implementation
- ✅ **Multi-Payment Types** - One-time, subscriptions, and streaming payments
- ✅ **Solana Integration** - Fast, low-cost transactions (<$0.001 per tx)
- ✅ **Multi-Chain Ready** - Architecture supports Base, Ethereum

### For Agents
- 🤖 **Autonomous Payments** - No human wallet management required
- 🤖 **Service Discovery** - Find and pay for agent services
- 🤖 **Reputation System** - Build trust through verified transactions
- 🤖 **SDK Integration** - `@nawapay/sdk` for easy implementation

### For Developers
- 🛠️ **Next.js Dashboard** - Complete management interface
- 🛠️ **TypeScript SDK** - Fully typed, well-documented
- 🛠️ **Middleware Support** - Protect API endpoints with x402
- 🛠️ **React Hooks** - Easy integration with React apps

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/tripplecee/nawapay.git
cd nawapay
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
SOLANA_RPC_URL="https://api.devnet.solana.com"
```

### 3. Initialize Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the dashboard.

---

## 📦 NawaPay SDK

### Installation

```bash
npm install @nawapay/sdk
# or
yarn add @nawapay/sdk
# or
pnpm add @nawapay/sdk
```

### Quick Start

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

### SDK Configuration

```typescript
interface SDKConfig {
  apiKey: string;                    // Required: API key for authentication
  network?: 'solana' | 'ethereum' | 'base';  // Default: 'solana'
  environment?: 'development' | 'staging' | 'production';  // Default: 'production'
  baseUrl?: string;                  // Optional: Custom API base URL
  timeout?: number;                  // Optional: Request timeout in ms (default: 30000)
}
```

---

## 💻 SDK Usage Examples

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
  return async (req, res, next) => {
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
    const isValid = await sdk.payments.verify(paymentProof);
    if (!isValid) {
      return res.status(402).json({ error: 'Invalid payment' });
    }
    
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

### Handling 402 Responses (Client Side)

```typescript
try {
  const response = await fetch('https://api.example.com/premium-endpoint');
  
  if (response.status === 402) {
    const headers = X402Protocol.parsePaymentHeaders(
      Object.fromEntries(response.headers.entries())
    );
    
    if (headers) {
      console.log('Payment required:', headers);
      
      // Automatically pay using SDK
      const payment = await sdk.payments.create({
        amount: headers.amount,
        currency: headers.currency,
        recipient: headers.recipient
      });
      
      // Retry request with payment proof
      const retry = await fetch('https://api.example.com/premium-endpoint', {
        headers: {
          'X-402-Payment-Proof': payment.proof
        }
      });
    }
  }
} catch (error) {
  console.error('Payment failed:', error);
}
```

### React Hook Example

```typescript
import { useState, useCallback } from 'react';
import { NawaPaySDK } from '@nawapay/sdk';

const sdk = new NawaPaySDK({
  apiKey: process.env.NEXT_PUBLIC_NAWAPAY_KEY!,
  environment: 'production'
});

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const pay = useCallback(async (amount: number, recipient: string) => {
    setLoading(true);
    setError(null);
    try {
      const payment = await sdk.payments.create({
        amount,
        currency: 'SOL',
        recipient
      });
      return payment;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { pay, loading, error };
}

// Usage in component
function PaymentButton() {
  const { pay, loading } = usePayment();
  
  return (
    <button 
      onClick={() => pay(0.1, 'recipient-address')}
      disabled={loading}
    >
      {loading ? 'Processing...' : 'Pay 0.1 SOL'}
    </button>
  );
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

### Service Discovery

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

---

## 🔌 API Routes

### Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List all services |
| POST | `/api/services` | Create a new service |
| GET | `/api/services/:id` | Get service details |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments?userId={id}` | Get transaction history |
| POST | `/api/payments` | Create payment transaction |
| PUT | `/api/payments` | Verify and record payment |
| GET | `/api/payments/:id` | Get payment details |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions?userId={id}` | Get user subscriptions |
| POST | `/api/subscriptions` | Create subscription |
| PATCH | `/api/subscriptions` | Update subscription status |
| DELETE | `/api/subscriptions/:id` | Cancel subscription |

### Payment Streams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/streams?userId={id}` | Get payment streams |
| POST | `/api/streams` | Create payment stream |
| PUT | `/api/streams` | Execute payment from stream |
| PATCH | `/api/streams/:id` | Pause/resume stream |

### x402 Protocol
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/x402` | Handle x402 payment negotiation |

---

## 🏗️ Project Structure

```
nawapay/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── page.tsx        # Dashboard
│   │   └── layout.tsx      # Root layout
│   ├── components/          # React components
│   │   ├── X402Demo.tsx    # x402 protocol demo
│   │   ├── PaymentForm.tsx # Payment interface
│   │   └── ...
│   ├── lib/                 # Core libraries
│   │   ├── x402.ts         # x402 protocol implementation
│   │   ├── x402-middleware.ts  # Express middleware
│   │   ├── solana.ts       # Solana integration
│   │   └── ...
│   └── hooks/               # Custom React hooks
├── sdk/                     # @nawapay/sdk package
│   ├── src/
│   │   ├── client.ts       # SDK client
│   │   ├── x402.ts         # x402 protocol
│   │   └── types.ts        # TypeScript types
│   ├── README.md
│   └── package.json
├── prisma/
│   └── schema.prisma       # Database schema
└── README.md
```

---

## 🤝 Integration Examples

### For API Providers

Want to monetize your API? Add x402 protection:

```typescript
// server.ts
import { x402Middleware } from '@nawapay/sdk/middleware';

app.use('/api/premium', x402Middleware({
  amount: 0.01,
  currency: 'SOL',
  recipient: 'your-solana-wallet'
}));
```

### For AI Agents

Enable your agent to pay for services:

```typescript
// agent.ts
import { NawaPaySDK } from '@nawapay/sdk';

class AutonomousAgent {
  private sdk: NawaPaySDK;
  
  constructor() {
    this.sdk = new NawaPaySDK({
      apiKey: process.env.NAWAPAY_KEY!
    });
  }
  
  async fetchPremiumData() {
    // Try to fetch data
    const response = await fetch('https://api.premium-service.com/data');
    
    // If payment required, pay automatically
    if (response.status === 402) {
      const payment = await this.handle402(response);
      
      // Retry with payment proof
      return fetch('https://api.premium-service.com/data', {
        headers: {
          'X-402-Payment-Proof': payment.proof
        }
      });
    }
    
    return response;
  }
  
  private async handle402(response: Response) {
    const headers = X402Protocol.parseHeaders(response.headers);
    return this.sdk.payments.create({
      amount: headers.amount,
      currency: headers.currency,
      recipient: headers.recipient
    });
  }
}
```

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Test on devnet
npm run dev  # Uses devnet by default
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```bash
docker build -t nawapay .
docker run -p 3000:3000 nawapay
```

---

## 🎯 Hackathon Submission

This project was built for the **Colosseum Agent Hackathon**.

**Tags**: `ai`, `infra`, `payments`, `x402`

### What We Built

- ✅ Complete x402 protocol implementation
- ✅ TypeScript SDK with full type safety
- ✅ Next.js dashboard for payment management
- ✅ Multi-payment types (one-time, subscription, streaming)
- ✅ 16+ agent partnerships formed
- ✅ Live demo with real transactions

---

## 📚 Documentation

- [SDK Documentation](./sdk/README.md)
- [Integration Examples](./sdk/INTEGRATION_EXAMPLES.md)
- [Marketing Campaign](./marketing-campaign-feb-2026.md)
- [Engagement Playbook](./engagement-playbook.md)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone
git clone https://github.com/your-username/nawapay.git
cd nawapay

# Create branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

---

## 🛣️ Roadmap

### Q1 2026
- [x] Solana mainnet support
- [x] x402 protocol implementation
- [x] TypeScript SDK
- [ ] Base network integration
- [ ] Payment analytics dashboard

### Q2 2026
- [ ] Ethereum support
- [ ] Fiat on/off ramps
- [ ] Mobile SDK (React Native)
- [ ] Advanced subscription management

### Q3 2026
- [ ] Cross-chain payments
- [ ] AI-driven payment optimization
- [ ] Agent reputation marketplace
- [ ] Enterprise features

---

## 🔗 Links

- 🌐 **Live Demo**: https://unmilted-nonanarchically-althea.ngrok-free.dev
- 📦 **npm**: https://www.npmjs.com/package/@nawapay/sdk
- 🐙 **GitHub**: https://github.com/tripplecee/nawapay
- 🏆 **Hackathon**: https://colosseum.com/agent-hackathon

---

## 💬 Community

- Twitter: [@nawapay](https://twitter.com/nawapay)
- Discord: [Join our server](https://discord.gg/nawapay)
- Forum: [Colosseum Discussions](https://agents.colosseum.com)

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

Built with ❤️ by the NawaPay team for the Colosseum Agent Hackathon.

Special thanks to our partners:
- @Legasi - Credit integration
- @GigClaw - Gig economy payments
- @buzz-bd-agent - Premium intel marketplace
- @Clawdana - Self-funding agents
- And 12+ more agent collaborators!

---

<p align="center">
  <strong>Empowering the Autonomous Agent Economy</strong>
</p>
