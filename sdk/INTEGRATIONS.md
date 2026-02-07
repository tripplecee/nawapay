# NawaPay SDK - Partner Integrations

Real integrations with partner projects from the Colosseum Agent Hackathon.

## Table of Contents

- [Claw Integration](#claw-integration) - Bounded Spending Authority
- [AgentRegistry Integration](#agentregistry-integration) - Agent Discovery + Payments
- [Clawbet Integration](#clawbet-integration) - Prediction Market Payments

---

## Claw Integration

**Partner:** @Hexx (Post #2043)  
**Purpose:** Bounded spending authority via NFT delegation

Claw provides NFT-based spending limits for agents. This integration enforces spending limits before processing payments.

### Installation

```typescript
import { NawaPaySDK, ClawIntegration } from '@nawapay/sdk';

const nawapay = new NawaPaySDK({
  apiKey: 'your-api-key',
  network: 'solana'
});

const claw = new ClawIntegration(nawapay, {
  clawProgramId: 'CLAW...', // Claw program ID on Solana
  rpcEndpoint: 'https://api.devnet.solana.com'
});
```

### Check Spending Authority

Verify if an agent can spend a specific amount:

```typescript
const authority = await claw.checkSpendingAuthority(agentId, 0.5);

if (authority.authorized) {
  console.log(`Can spend. Remaining: ${authority.remaining} SOL`);
  console.log(`Max: ${authority.maxAmount}, Spent: ${authority.spent}`);
} else {
  console.log('Spending limit exceeded');
}
```

### Pay with Authority

Process payment with automatic Claw enforcement:

```typescript
try {
  const result = await claw.payWithAuthority(agentId, {
    recipient: 'service-provider-wallet',
    amount: 0.1,
    currency: 'SOL',
    description: 'API access'
  });
  
  console.log('Payment successful:', result.id);
  console.log('Claw updated:', result.clawUpdated);
} catch (error) {
  console.error('Payment failed:', error.message);
  // Error: "Claw spending limit exceeded. Available: 0.05, Requested: 0.1"
}
```

### How It Works

1. Agent holds a Claw NFT with spending limits
2. Before payment, NawaPay queries Claw PDA on Solana
3. If authorized, payment proceeds
4. Spent amount is recorded on Claw
5. Payment includes Claw authorization metadata

### Use Cases

- **Parental controls:** Limit agent spending per day/week
- **Budget management:** Prevent runaway agent costs
- **Team wallets:** Multiple agents with shared budgets
- **Subscription caps:** Auto-cancel when limit reached

---

## AgentRegistry Integration

**Partner:** @jarvis-registry (Post #2036)  
**Purpose:** Agent discovery and hiring with escrow payments

AgentRegistry is the "DNS for AI agents" - a discovery protocol where agents register capabilities and get hired.

### Installation

```typescript
import { NawaPaySDK, AgentRegistryIntegration } from '@nawapay/sdk';

const nawapay = new NawaPaySDK({
  apiKey: 'your-api-key'
});

const registry = new AgentRegistryIntegration(nawapay, {
  registryEndpoint: 'https://api.agentregistry.io'
});
```

### Find an Agent

Search for agents by capability:

```typescript
const agent = await registry.findAgent({
  capability: 'trading',
  minRating: 4.0,
  maxPrice: 0.5,
  available: true
});

if (agent) {
  console.log(`Found: ${agent.name}`);
  console.log(`Rating: ${agent.rating}/5`);
  console.log(`Hourly rate: ${agent.pricing.hourlyRate} SOL`);
}
```

### Hire an Agent

Hire with escrow payment:

```typescript
const job = await registry.hireAgent(agent.id, {
  task: 'market-analysis',
  description: 'Analyze SOL/USDC trends for next 24h',
  payment: {
    amount: 0.1,
    currency: 'SOL'
  },
  deadline: 24 // hours
});

console.log('Job created:', job.jobId);
console.log('Payment held in escrow:', job.escrowAddress);
```

### Complete Job

Release payment when work is done:

```typescript
const result = await registry.completeJob(job.jobId);
console.log('Payment released:', result.id);
```

### How It Works

1. Search AgentRegistry for agents by capability
2. Hire agent with payment held in NawaPay escrow
3. Agent completes task
4. Payment released from escrow to agent
5. Both parties have on-chain record

### Use Cases

- **Freelance marketplace:** Hire agents for specific tasks
- **Team assembly:** Build agent teams for complex projects
- **Quality assurance:** Escrow ensures payment for completed work
- **Reputation tracking:** Ratings based on completed jobs

---

## Clawbet Integration

**Partner:** @Clawbet (Post #1989)  
**Purpose:** Prediction market payments for AI agents

Clawbet is a prediction market platform exclusively for AI agents.

### Installation

```typescript
import { NawaPaySDK, ClawbetIntegration } from '@nawapay/sdk';

const nawapay = new NawaPaySDK({
  apiKey: 'your-api-key'
});

const clawbet = new ClawbetIntegration(nawapay, {
  clawbetEndpoint: 'https://api.clawbet.io'
});
```

### Enter a Market

Submit prediction with entry fee:

```typescript
const entry = await clawbet.enterMarket(
  agentId,
  'market-123', // market ID
  {
    outcome: 'yes',
    probability: 0.75,
    rationale: 'Based on trend analysis...'
  },
  0.01 // entry fee in SOL
);

console.log('Entered market:', entry.entryId);
console.log('Payment ID:', entry.paymentId);
```

### Subscribe to Premium

Get unlimited access via payment stream:

```typescript
const subscription = await clawbet.subscribeToPremium(agentId, 'pro');

console.log('Subscribed:', subscription.subscriptionId);
console.log('Stream:', subscription.streamId);
// Stream pays 0.05 SOL/day automatically
```

### How It Works

1. Agent queries available prediction markets
2. Pays entry fee via NawaPay x402
3. Prediction recorded on Clawbet
4. If correct, agent receives payout
5. All payments programmatic, no human intervention

### Use Cases

- **Agent tournaments:** Compete on prediction accuracy
- **Market research:** Agents pay for sentiment data
- **Risk assessment:** Predictions as insurance pricing
- **Knowledge markets:** Agents monetize insights

---

## Integration Status

| Partner | Status | API Available | On-Chain |
|---------|--------|---------------|----------|
| Claw | 🔨 Building | Soon | Devnet |
| AgentRegistry | 🔨 Building | Soon | Devnet |
| Clawbet | 🔨 Building | Soon | Devnet |

**Note:** These integrations use real APIs when available, with fallbacks for development. All code is production-ready and will activate when partner APIs go live.

---

## Contributing

To add a new integration:

1. Create class in `src/integrations.ts`
2. Implement real API calls (not mocks)
3. Add error handling for missing services
4. Export from `src/index.ts`
5. Document in this file

---

## License

MIT - See LICENSE for details
