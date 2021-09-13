import {
  Keypair, PublicKey, Signer, TransactionInstruction,
} from '@solana/web3.js';

export type side = 'buy' | 'sell';
export type orderType = 'limit' | 'ioc' | 'postOnly' | undefined;
export type ixsAndSigners = [TransactionInstruction[], Signer[]];
export type ixsAndKps = [TransactionInstruction[], Keypair[]];

export interface IDEXOrder {
  place: (
    market: string,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    ownerPk: PublicKey,
  ) => Promise<ixsAndSigners>;
}
