import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';

export type side = 'buy' | 'sell';
export type orderType = 'limit' | 'ioc' | 'postOnly' | undefined;
export type ixAndSigners = [TransactionInstruction[], Signer[]];

// todo tbh doesn't make sense to have in separate files
export interface IDEXOrder {
  place: (
    market: string,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    ownerPk: PublicKey,
  ) => Promise<ixAndSigners>;
}
