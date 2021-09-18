import { PublicKey } from '@solana/web3.js';
import { ixsAndSigners } from './common.interfaces.dex.order';

export interface IDEXMarket {
  init: (
    baseMintPk: PublicKey,
    quoteMintPk: PublicKey,
    lotSize: number,
    tickSize: number,
    ownerPk: PublicKey,
    ) => Promise<ixsAndSigners>
  settle: (
    marketPk: PublicKey,
    ownerPk: PublicKey
  ) => Promise<ixsAndSigners>;
}
