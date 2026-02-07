# AgentWallet Integration

Complete integration guide for using AgentWallet with NawaPay.

## Overview

AgentWallet provides server-side Solana wallets with policy-controlled actions. When combined with NawaPay, you get:

- **No private key management** - Server-side signing
- **One-step x402 payments** - Automatic 402 handling
- **Policy controls** - Spending limits and approvals
- **Multi-chain support** - Solana and EVM
- **Devnet testing** - Free faucet SOL

## Installation

```bash
npm install @nawapay/sdk
```

## Setup

### Step 1: Connect AgentWallet

**Option A: Via Web (Recommended)**
1. Go to: `https://agentwallet.mcpay.tech/connect?email=your@email.com`
2. Enter OTP from email
3. Save credentials displayed

**Option B: Via API**

```typescript
import { AgentWalletIntegration } from '@nawapay/sdk';

// Start connection
const { username } = await AgentWalletIntegration.connectStart('your@email.com');

// Complete with OTP (get from email)
const { apiToken, solanaAddress } = await AgentWalletIntegration.connectComplete(
  username,
  'your@email.com',
  '123456' // OTP from email
);

// Save to config file
const fs = require('fs');
const config = { username, apiToken, solanaAddress };
fs.writeFileSync(
  `${process.env.HOME}/.agentwallet/config.json`,
  JSON.stringify(config, null, 2)
);
```

### Step 2: Load Credentials

```typescript
import { AgentWalletIntegration } from '@nawapay/sdk';

// Load from default config file
const config = AgentWalletIntegration.loadFromConfig();

// Or create manually
const wallet = new AgentWalletIntegration({
  username: 'kinawa',
  apiToken: 'mf_...'
});
```

### Step 3: Fund Wallet

**For devnet testing:**
```typescript
// Get free SOL (3 requests per 24h)
const result = await wallet.requestDevnetFaucet();
console.log(`Received ${result.amount}, tx: ${result.txHash}`);
```

**For mainnet:**
1. Go to: `https://agentwallet.mcpay.tech/u/YOUR_USERNAME`
2. Fund via Coinbase Onramp
3. Check balance:
```typescript
const balances = await wallet.getBalances();
console.log(`USDC: ${balances.usdc}, SOL: ${balances.sol}`);
```

## Usage

### x402 Payments (One-Step)

```typescript
import { AgentWalletIntegration } from '@nawapay/sdk';

const wallet = new AgentWalletIntegration({
  username: 'kinawa',
  apiToken: 'mf_...'
});

// Execute payment
const result = await wallet.payX402({
  url: 'https://api.service.com/x402/pay',
  method: 'POST',
  body: {
    service: 'PremiumAPI',
    params: { query: 'data' }
  },
  preferredChain: 'solana'
});

console.log('Payment successful!');
console.log('Amount:', result.payment.amountFormatted);
console.log('Tx Hash:', result.payment.txHash);
console.log('Response:', result.response.body);
```

### Preview Payment Cost

```typescript
// Check cost before paying
const preview = await wallet.previewX402Cost({
  url: 'https://api.service.com/x402/pay',
  body: { service: 'PremiumAPI' }
});

console.log('Cost:', preview.payment.amountFormatted);
console.log('Allowed:', preview.payment.policyAllowed);
```

### Solana Transfers

```typescript
// Send USDC
const result = await wallet.transferSolana({
  to: 'RecipientSolanaAddress',
  amount: '1000000', // 1 USDC (6 decimals)
  asset: 'usdc',
  network: 'mainnet'
});

console.log('Transfer confirmed:', result.txHash);
console.log('Explorer:', result.explorer);

// Send SOL
const result = await wallet.transferSolana({
  to: 'RecipientSolanaAddress',
  amount: '1000000000', // 1 SOL (9 decimals)
  asset: 'sol',
  network: 'mainnet'
});
```

## NawaPay + AgentWallet Integration

### Combined Usage

```typescript
import { 
  NawaPaySDK, 
  AgentWalletIntegration,
  NawaPayWithAgentWallet 
} from '@nawapay/sdk';

// Method 1: Use NawaPayWithAgentWallet helper
const nawapayWallet = new NawaPayWithAgentWallet({
  username: 'kinawa',
  apiToken: 'mf_...'
});

// Execute payment with AgentWallet
const result = await nawapayWallet.executePayment(
  {
    recipient: 'service-wallet',
    amount: 0.1,
    currency: 'SOL',
    description: 'API access'
  },
  'https://api.nawapay.io/x402/pay'
);

// Method 2: Use separately
const nawapay = new NawaPaySDK({ apiKey: '...' });
const wallet = new AgentWalletIntegration({
  username: 'kinawa',
  apiToken: 'mf_...'
});

// Create payment with NawaPay
const payment = await nawapay.payments.create({
  recipient: 'service-wallet',
  amount: 0.1,
  currency: 'SOL'
});

// Execute with AgentWallet
const result = await wallet.payX402({
  url: payment.x402Url || 'https://api.nawapay.io/x402/pay',
  body: payment,
  preferredChain: 'solana'
});
```

## Configuration

### Policy Settings

```typescript
// Get current policy
const policy = await wallet.getPolicy();

// Update policy (spending limits)
await wallet.updatePolicy({
  max_per_tx_usd: '25',
  allow_chains: ['solana', 'base'],
  allow_contracts: ['0x...']
});
```

### Activity Monitoring

```typescript
// Get recent activity
const activity = await wallet.getActivity(50);

for (const event of activity) {
  console.log(`${event.type}: ${event.status}`);
}
```

## Error Handling

```typescript
try {
  const result = await wallet.payX402({
    url: 'https://api.service.com/x402/pay',
    body: { amount: 100 }
  });
} catch (error) {
  if (error.message.includes('POLICY_DENIED')) {
    console.error('Payment exceeds policy limits');
  } else if (error.message.includes('insufficient_funds')) {
    console.error('Wallet needs funding');
  } else {
    console.error('Payment failed:', error.message);
  }
}
```

## Complete Example

```typescript
import { AgentWalletIntegration } from '@nawapay/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

async function main() {
  // Load credentials
  const configPath = path.join(os.homedir(), '.agentwallet', 'config.json');
  
  if (!fs.existsSync(configPath)) {
    console.log('Wallet not connected. Run connect flow first.');
    return;
  }

  const wallet = new AgentWalletIntegration(
    AgentWalletIntegration.loadFromConfig()
  );

  // Check connection
  const info = await wallet.getPublicInfo();
  console.log(`Connected as: ${info.username}`);
  console.log(`Solana address: ${info.solanaAddress}`);

  // Get balances
  const balances = await wallet.getBalances();
  console.log(`USDC: ${balances.usdc || '0'}`);
  console.log(`SOL: ${balances.sol || '0'}`);

  // If devnet, get some SOL
  if (process.env.NODE_ENV === 'development') {
    try {
      const faucet = await wallet.requestDevnetFaucet();
      console.log(`Faucet: +${faucet.amount}, remaining: ${faucet.remaining}`);
    } catch (e) {
      console.log('Faucet limit reached');
    }
  }

  // Execute payment
  try {
    const result = await wallet.payX402({
      url: 'https://api.example.com/x402/service',
      method: 'POST',
      body: { service: 'premium-access' },
      preferredChain: 'solana'
    });

    console.log('Payment successful!');
    console.log('Tx Hash:', result.payment.txHash);
    console.log('Response:', result.response.body);
  } catch (error) {
    console.error('Payment failed:', error.message);
  }
}

main().catch(console.error);
```

## API Reference

### AgentWalletIntegration

| Method | Description |
|--------|-------------|
| `payX402(options)` | Execute x402 payment |
| `previewX402Cost(options)` | Preview payment cost |
| `transferSolana(options)` | Send SOL/USDC |
| `getBalances()` | Get wallet balances |
| `requestDevnetFaucet()` | Get free devnet SOL |
| `getActivity(limit)` | Get transaction history |
| `getPolicy()` | Get policy settings |
| `updatePolicy(policy)` | Update policy |
| `getPublicInfo()` | Get wallet public info |
| `loadFromConfig(path?)` | Load credentials from file |
| `connectStart(email)` | Start connection flow |
| `connectComplete(...)` | Complete connection |

### X402PaymentOptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | Target API URL |
| `method` | string | No | HTTP method (default: POST) |
| `body` | any | No | Request body |
| `headers` | object | No | Additional headers |
| `preferredChain` | string | No | auto/solana/evm (default: auto) |
| `dryRun` | boolean | No | Preview only |
| `timeout` | number | No | Timeout ms (default: 30000) |
| `idempotencyKey` | string | No | Prevent duplicates |

## Security

- **API Token**: Keep secure, starts with `mf_`
- **Config File**: Store at `~/.agentwallet/config.json` with `chmod 600`
- **Policy**: Set spending limits to prevent unauthorized transactions
- **Devnet**: Use for testing, free faucet available

## Links

- AgentWallet: https://agentwallet.mcpay.tech
- Connect: https://agentwallet.mcpay.tech/connect
- Skill: https://agentwallet.mcpay.tech/skill.md
- Fund Wallet: https://agentwallet.mcpay.tech/u/YOUR_USERNAME
