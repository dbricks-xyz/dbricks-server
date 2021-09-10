import { PublicKey } from '@solana/web3.js';
import { spawn, Worker } from 'threads';
import { IDEXSettle } from '../../common/interfaces/dex/dex.settle.interface';
import { ixAndSigners } from '../../common/interfaces/dex/dex.order.interface';
import { loadSerumMarket, prepSettleFundsTx } from '../logic/serum.order.logic';
import SolClient from '../../common/logic/client';
import { deserializePk } from '../../common/util/serializers';

class SerumSettleService implements IDEXSettle {
  async settle(market: string, ownerPk: string): Promise<ixAndSigners> {
    // --------------------------------------- worker
    // const worker = await spawn(new Worker('./worker.ts'));
    // return worker.settle({
    //   market,
    //   ownerPk,
    // });

    // --------------------------------------- main thread
    const marketInstance = await loadSerumMarket(SolClient.connection, market);
    return prepSettleFundsTx(
      SolClient.connection,
      marketInstance,
      market,
      deserializePk(ownerPk),
    );
  }
}

export default new SerumSettleService();
