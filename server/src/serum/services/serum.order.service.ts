import { Signer, TransactionInstruction } from '@solana/web3.js';
import { spawn, Thread, Worker } from 'threads';
import {
  IDEXOrder,
  orderType,
  side,
} from '../../common/interfaces/dex/dex.order.interface';
import { loadSerumMarket, prepPlaceOrderV3Tx } from '../logic/serum.order.logic';
import SolClient from '../../common/logic/client';
import { deserializePk } from '../../common/util/serializers';

class SerumOrderService implements IDEXOrder {
  async place(
    market: string,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    ownerPk: string,
  ): Promise<[TransactionInstruction[], Signer[]]> {
    // --------------------------------------- worker
    // const worker = await spawn(new Worker('./worker.ts'));
    // return worker.order({
    //   market,
    //   side,
    //   price,
    //   size,
    //   orderType,
    //   ownerPk,
    // });

    // --------------------------------------- main thread
    const marketInstance = await loadSerumMarket(SolClient.connection, market);
    return prepPlaceOrderV3Tx(
      SolClient.connection,
      marketInstance,
      market,
      side,
      price,
      size,
      orderType,
      deserializePk(ownerPk),
    );

    // todo ideally serialization would be in controller - but with workers doesn't make sense
  }
}

export default new SerumOrderService();
