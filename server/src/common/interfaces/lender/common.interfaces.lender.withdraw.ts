import { PublicKey } from '@solana/web3.js';
import { ixsAndSigners } from '../dex/common.interfaces.dex.order';

export interface ILenderWithdraw {
  withdraw: (
    token: string,
    quantity: number,
    isborrow: boolean,
    ownerPk: PublicKey,
    sourcePk?: PublicKey,
  ) => Promise<ixsAndSigners>;
}
