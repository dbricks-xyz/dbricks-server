import { PublicKey } from '@solana/web3.js';
import { ixAndSigners } from './dex.order.interface';

export interface IDEXSettle {
  settle: (market: string, ownerPk: PublicKey) => Promise<ixAndSigners>;
}
