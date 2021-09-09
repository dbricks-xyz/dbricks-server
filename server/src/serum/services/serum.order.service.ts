import { Signer, TransactionInstruction } from '@solana/web3.js';
import {
  IDEXOrder,
  orderType,
  side,
} from '../../common/interfaces/dex/dex.order.interface';
import { getNewOrderV3Tx, loadSerumMarket } from '../logic/serum.order.logic';
import SolClient from '../../common/logic/client';
import { ownerKp } from '../../../play/keypair';

class SerumOrderService implements IDEXOrder {
  async place(
    market: string,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
  ): Promise<[TransactionInstruction[], Signer[]]> {
    const marketInstance = await loadSerumMarket(SolClient.connection, market);
    const placeOrderTx = await getNewOrderV3Tx(
      SolClient.connection,
      marketInstance,
      market,
      ownerKp, // todo this should absolutely not be here, but right now I just want the function to work
      side,
      price,
      size,
      orderType,
    );

    const placeOrderIx = placeOrderTx.transaction.instructions;
    const placeOrderSigners = placeOrderTx.signers;
    return [placeOrderIx, placeOrderSigners];
  }
}

export default new SerumOrderService();
