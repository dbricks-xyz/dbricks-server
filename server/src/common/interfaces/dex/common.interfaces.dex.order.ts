import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';

export type side = 'buy' | 'sell';
export type orderType = 'limit' | 'ioc' | 'postOnly' | undefined;
export type ixAndSigners = [TransactionInstruction[], Signer[]];

export interface IDEXOrder {
  place: (
    market: string,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    ownerPk: PublicKey,
  ) => Promise<ixAndSigners>;
  // todo placeTrigger
  // todo modify
  // todo modifyByClientID
  // todo modifyTrigger
  // todo cancel
  // todo cancelByClientID
  // todo cancelTrigger
  // todo cancelAll
}
