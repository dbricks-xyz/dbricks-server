import { PublicKey } from '@solana/web3.js';
import { ixsAndSigners } from './common.interfaces.dex.order';

export interface IDEXMarket {
  init: (
    baseMintPk: PublicKey,
    quoteMintPk: PublicKey,
    lotSize: string,
    tickSize: string,
    ownerPk: PublicKey,
    ) => Promise<ixsAndSigners>
  settle: (
    market: string,
    ownerPk: PublicKey
  ) => Promise<ixsAndSigners>;
}
