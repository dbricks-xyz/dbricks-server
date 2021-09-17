import { PublicKey } from '@solana/web3.js';
import { ixsAndSigners } from '../dex/common.interfaces.dex.order';

export interface ILenderDeposit {
  deposit: (
    token: string,
    quantity: number,
    ownerPk: PublicKey,
    destinationPk?: PublicKey,
  ) => Promise<ixsAndSigners>;
}
