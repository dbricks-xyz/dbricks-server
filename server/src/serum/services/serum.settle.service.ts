import { PublicKey } from '@solana/web3.js';
import { IDEXSettle } from '../../common/interfaces/dex/dex.settle.interface';
import { ixAndSigners } from '../../common/interfaces/dex/dex.order.interface';
import { loadSerumMarket, prepSettleFundsTx } from '../logic/serum.order.logic';
import SolClient from '../../common/logic/client';

class SerumSettleService implements IDEXSettle {
  async settle(market: string, ownerPk: PublicKey): Promise<ixAndSigners> {
    const marketInstance = await loadSerumMarket(SolClient.connection, market);
    return prepSettleFundsTx(
      SolClient.connection,
      marketInstance,
      market,
      ownerPk,
    );
  }
}

export default new SerumSettleService();
