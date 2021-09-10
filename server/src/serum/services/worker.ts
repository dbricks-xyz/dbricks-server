import { expose } from 'threads';
import {
  loadSerumMarket,
  prepPlaceOrderV3Tx,
  prepSettleFundsTx,
} from '../logic/serum.order.logic';
import SolClient from '../../common/logic/client';
import {
  deserializePk,
  serializeIxs,
  serializeSigners,
} from '../../common/util/serializers';

expose({
  async order({
    market,
    side,
    price,
    size,
    orderType,
    ownerPk,
  }) {
    const marketInstance = await loadSerumMarket(SolClient.connection, market);
    const [ix, signers] = await prepPlaceOrderV3Tx(
      SolClient.connection,
      marketInstance,
      market,
      side,
      price,
      size,
      orderType,
      deserializePk(ownerPk), // todo dedup
    );
    return [serializeIxs(ix), serializeSigners(signers)];
  },
  async settle({
    market,
    ownerPk,
  }) {
    const marketInstance = await loadSerumMarket(SolClient.connection, market);
    const [ix, signers] = await prepSettleFundsTx(
      SolClient.connection,
      marketInstance,
      market,
      deserializePk(ownerPk),
    );
    return [serializeIxs(ix), serializeSigners(signers)];
  },
});
