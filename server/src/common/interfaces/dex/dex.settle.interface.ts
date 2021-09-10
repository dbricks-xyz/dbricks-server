import { ixAndSigners } from './dex.order.interface';

export interface IDEXSettle {
    settle: (market: string) => Promise<ixAndSigners>
}
