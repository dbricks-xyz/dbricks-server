import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';
import {
  IDEXOrder,
  orderType,
  side,
} from '../../common/interfaces/dex/common.interfaces.dex.order';
import { marketToPayer, prepPlaceOrderTx } from '../logic/serum.logic.order';
import SolClient from '../../common/client/common.client';
import { loadSerumMarketFromName } from '../serum.util';

class SerumOrderService implements IDEXOrder {
  async place(
    market: string,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    ownerPk: PublicKey,
  ): Promise<[TransactionInstruction[], Signer[]]> {
    const marketInstance = await loadSerumMarketFromName(SolClient.connection, market);
    const [[ixT, signersT], payerPk] = await marketToPayer(
      SolClient.connection,
      marketInstance,
      market,
      side,
      ownerPk,
    );
    const [ix, signers] = await prepPlaceOrderTx(
      SolClient.connection,
      marketInstance,
      side,
      price,
      size,
      orderType,
      ownerPk,
      payerPk,
    );
    return [
      [...ixT, ...ix],
      [...signersT, ...signers],
    ];
  }
}

export default new SerumOrderService();
