import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');

export class SolanaService {
  // Create a simple transfer transaction
  static async createTransferTransaction(
    from: string,
    to: string,
    amount: number
  ): Promise<Transaction> {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(from),
        toPubkey: new PublicKey(to),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(from);

    return transaction;
  }

  // Verify a transaction
  static async verifyTransaction(signature: string): Promise<{
    confirmed: boolean;
    amount?: number;
    from?: string;
    to?: string;
  }> {
    try {
      const status = await connection.getSignatureStatus(signature);

      if (!status.value || status.value.err) {
        return { confirmed: false };
      }

      const txInfo = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!txInfo || !txInfo.meta) {
        return { confirmed: false };
      }

      // Parse transfer details
      const accountKeys = txInfo.transaction.message.getAccountKeys();
      const from = accountKeys.get(0)?.toString();
      const to = accountKeys.get(1)?.toString();

      const preBalance = txInfo.meta.preBalances[0];
      const postBalance = txInfo.meta.postBalances[0];
      const amount = (preBalance - postBalance) / LAMPORTS_PER_SOL;

      return { confirmed: true, amount, from, to };
    } catch (error) {
      console.error('Verification error:', error);
      return { confirmed: false };
    }
  }

  // Get wallet balance
  static async getBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await connection.getBalance(new PublicKey(walletAddress));
      return balance / LAMPORTS_PER_SOL;
    } catch {
      return 0;
    }
  }

  // Request airdrop (devnet only)
  static async requestAirdrop(walletAddress: string, amount: number = 1): Promise<string> {
    try {
      const signature = await connection.requestAirdrop(
        new PublicKey(walletAddress),
        amount * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      throw new Error('Airdrop failed: ' + (error as Error).message);
    }
  }
}
