import { PublicKey } from '@solana/web3.js';
import { ixAndSigners } from './common.interfaces.dex.order';

export interface IDEXMarket {
  settle: (market: string, ownerPk: PublicKey) => Promise<ixAndSigners>;
}
