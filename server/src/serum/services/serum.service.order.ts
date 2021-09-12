import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';
import {
  IDEXOrder,
  orderType,
  side,
} from '../../common/interfaces/dex/common.interfaces.dex.order';
import SerumClient from '../client/serum.client';

class SerumOrderService implements IDEXOrder {
  async place(
    market: string,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    ownerPk: PublicKey,
  ): Promise<[TransactionInstruction[], Signer[]]> {
    const marketInstance = await SerumClient.loadSerumMarketFromName(market);
    const [[ixT, signersT], payerPk] = await SerumClient.getPayerFromMarket(
      marketInstance,
      market,
      side,
      ownerPk,
    );
    const [ix, signers] = await SerumClient.prepPlaceOrderTx(
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
