import {
  Keypair, PublicKey, Signer, TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';

export type side = 'buy' | 'sell';
export type orderType = 'limit' | 'ioc' | 'postOnly' | undefined;
export type ixsAndSigners = [TransactionInstruction[], Signer[]];

export interface IDEXOrder {
  place: (
    marketPk: PublicKey,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    ownerPk: PublicKey,
  ) => Promise<ixsAndSigners>;
  cancel: (
    marketPk: PublicKey,
    orderId: BN,
    ownerPk: PublicKey,
  ) => Promise<ixsAndSigners>
}
