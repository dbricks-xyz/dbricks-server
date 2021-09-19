import { PublicKey } from '@solana/web3.js';
import {ixsAndSigners} from "dbricks-lib";

export interface ILenderDeposit {
  deposit: (
    mintPk: PublicKey,
    quantity: number,
    ownerPk: PublicKey,
    destinationPk?: PublicKey,
  ) => Promise<ixsAndSigners[]>;
}
