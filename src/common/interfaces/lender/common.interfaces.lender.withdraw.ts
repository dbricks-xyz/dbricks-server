import { PublicKey } from '@solana/web3.js';
import { ixsAndSigners } from '../dex/common.interfaces.dex.order';

export interface ILenderWithdraw {
  withdraw: (
    mintPk: PublicKey,
    quantity: number,
    isBorrow: boolean,
    ownerPk: PublicKey,
    sourcePk?: PublicKey,
  ) => Promise<ixsAndSigners>;
}
