import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';
import {
  IDEXOrder,
  orderType,
  side,
} from '../../common/interfaces/dex/dex.order.interface';
import { loadSerumMarket, prepPlaceOrderV3Tx } from '../logic/serum.order.logic';
import SolClient from '../../common/logic/client';

class SerumOrderService implements IDEXOrder {
  async place(
    market: string,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    ownerPk: PublicKey,
  ): Promise<[TransactionInstruction[], Signer[]]> {
    const marketInstance = await loadSerumMarket(SolClient.connection, market);
    return prepPlaceOrderV3Tx(
      SolClient.connection,
      marketInstance,
      market,
      side,
      price,
      size,
      orderType,
      ownerPk,
    );
  }
}

export default new SerumOrderService();
