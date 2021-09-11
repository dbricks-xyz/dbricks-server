import { PublicKey } from '@solana/web3.js';
import { ixAndSigners } from './common.interfaces.dex.order';

export interface IDEXSettle {
  settle: (market: string, ownerPk: PublicKey) => Promise<ixAndSigners>;
}
