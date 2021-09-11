import { PublicKey } from '@solana/web3.js';
import { IDEXSettle } from '../../common/interfaces/dex/common.interfaces.dex.settle';
import { ixAndSigners } from '../../common/interfaces/dex/common.interfaces.dex.order';
import SolClient from '../../common/client/common.client';
import { prepSettleFundsTx } from '../logic/serum.logic.settle';
import { loadSerumMarket } from '../serum.util';

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
