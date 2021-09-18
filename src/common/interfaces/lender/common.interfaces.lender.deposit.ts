import { PublicKey } from '@solana/web3.js';
import { ixsAndSigners } from '../dex/common.interfaces.dex.order';

export interface ILenderDeposit {
  deposit: (
    mintPk: PublicKey,
    quantity: number,
    ownerPk: PublicKey,
    destinationPk?: PublicKey,
  ) => Promise<ixsAndSigners>;
}
