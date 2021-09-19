import { PublicKey } from '@solana/web3.js';
import {ixsAndSigners} from "dbricks-lib";

export interface ILenderWithdraw {
  withdraw: (
    mintPk: PublicKey,
    quantity: number,
    isBorrow: boolean,
    ownerPk: PublicKey,
    sourcePk?: PublicKey,
  ) => Promise<ixsAndSigners[]>;
}
