import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';
import {
  IDEXOrder,
  orderType,
  side,
} from '../../common/interfaces/dex/common.interfaces.dex.order';
import SerumClient from '../client/serum.client';

export default class SerumOrderService extends SerumClient implements IDEXOrder {
  async place(
    market: string,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    ownerPk: PublicKey,
  ): Promise<[TransactionInstruction[], Signer[]]> {
    const marketInstance = await this.loadSerumMarketFromName(market);
    const [[ixPayer, signersPayer], payerPk] = await this.getPayerFromMarket(
      marketInstance,
      market,
      side,
      ownerPk,
    );
    const [ixPlace, signersPlace] = await this.prepPlaceOrderTx(
      marketInstance,
      side,
      price,
      size,
      orderType,
      ownerPk,
      payerPk,
    );
    return [
      [...ixPayer, ...ixPlace],
      [...signersPayer, ...signersPlace],
    ];
  }
}
