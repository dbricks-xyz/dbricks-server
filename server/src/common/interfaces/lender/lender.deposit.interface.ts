import { Signer, TransactionInstruction } from '@solana/web3.js';

export type ixAndSigners = [TransactionInstruction[], Signer[]];

export interface ILenderDeposit {
  deposit: (
    market: string,
    side: side,
    price: number,
    size: number,
    orderType: orderType
  ) => Promise<ixAndSigners>;

}
