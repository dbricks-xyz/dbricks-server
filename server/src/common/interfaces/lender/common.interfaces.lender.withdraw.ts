import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';

export type ixAndSigners = [TransactionInstruction[], Signer[]];

export interface ILenderWithdraw {
  withdraw: (
    token: string,
    quantity: number,
    ownerPk: PublicKey,
    sourcePk?: PublicKey,
  ) => Promise<ixAndSigners>;
}
