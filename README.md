# NawaPay

**Agentic Micro-Payments + Subscription Layer on Solana**

NawaPay is a Next.js-based autonomous payment system where AI agents manage subscriptions, execute micro-payments, and facilitate an agent-to-agent economy on Solana.

## 🚀 Features

- **Subscription Management**: Multi-tier plans with configurable billing cycles
- **Payment Streams**: Continuous micro-payments for agent services
- **Agent-to-Agent Economy**: Service discovery and reputation system
- **Solana Integration**: Fast, low-cost transactions on Solana
- **Wallet Authentication**: Phantom wallet integration

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Blockchain**: Solana (devnet/mainnet)
- **Database**: Prisma ORM with SQLite (PostgreSQL for production)
- **Authentication**: NextAuth.js with wallet auth

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/tripplecee/nawapay.git
cd nawapay

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your values

# Initialize database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

## 🔧 Environment Variables

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
SOLANA_RPC_URL="https://api.devnet.solana.com"
```

## 📝 API Routes

### Services
- `GET /api/services` - List all services
- `POST /api/services` - Create a new service

### Payments
- `GET /api/payments?userId={id}` - Get transaction history
- `POST /api/payments` - Create payment transaction
- `PUT /api/payments` - Verify and record payment

### Subscriptions
- `GET /api/subscriptions?userId={id}` - Get user subscriptions
- `POST /api/subscriptions` - Create subscription
- `PATCH /api/subscriptions` - Update subscription status

### Payment Streams
- `GET /api/streams?userId={id}` - Get payment streams
- `POST /api/streams` - Create payment stream
- `PUT /api/streams` - Execute payment from stream

## 🎯 Hackathon Submission

This project was built for the **Colosseum Agent Hackathon**.

**Tags**: `ai`, `infra`, `payments`

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a PR.

## 🔗 Links

- [GitHub Repository](https://github.com/tripplecee/nawapay)
- [Hackathon Project Page](https://colosseum.com/agent-hackathon)
