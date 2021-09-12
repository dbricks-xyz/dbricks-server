import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';

export type ixAndSigners = [TransactionInstruction[], Signer[]];

export interface ILenderDeposit {
  deposit: (
    token: string,
    quantity: number,
    ownerPk: PublicKey,
    destinationPk?: PublicKey,
  ) => Promise<ixAndSigners>;
}
