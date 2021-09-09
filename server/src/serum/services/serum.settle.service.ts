import { IDEXSettle } from '../../common/interfaces/dex/dex.settle.interface';
import { ixAndSigners } from '../../common/interfaces/dex/dex.order.interface';
import { getSettleFundsTx, loadSerumMarket } from '../logic/serum.order.logic';
import SolClient from '../../common/logic/client';
import { ownerKp } from '../../../play/keypair';

class SerumSettleService implements IDEXSettle {
  async settle(market: string): Promise<ixAndSigners> {
    const marketInstance = await loadSerumMarket(SolClient.connection, market);
    const settleTx = await getSettleFundsTx(
      SolClient.connection,
      marketInstance,
      ownerKp, // todo this should absolutely not be here, but right now I just want the function to work
      market,
    );
    const settleIx = settleTx ? settleTx.transaction.instructions : [];
    const settleSigners = settleTx ? settleTx.signers : [];
    return [settleIx, settleSigners];
  }
}

export default new SerumSettleService();
