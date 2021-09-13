import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import {
  IDEXOrder, ixsAndSigners,
  orderType,
  side,
} from '../../common/interfaces/dex/common.interfaces.dex.order';
import SerumClient from '../client/serum.client';

export default class SerumOrderService extends SerumClient implements IDEXOrder {
  async place(
    marketName: string,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    ownerPk: PublicKey,
  ): Promise<ixsAndSigners> {
    const market = await this.loadSerumMarketFromName(marketName);
    const [[ixPayer, signersPayer], payerPk] = await this.getPayerFromMarket(
      market,
      marketName,
      side,
      ownerPk,
    );
    const [ixPlace, signersPlace] = await this.prepPlaceOrderTx(
      market,
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

  async cancel(
    marketName: string,
    orderId: BN,
    ownerPk: PublicKey,
  ): Promise<ixsAndSigners> {
    const market = await this.loadSerumMarketFromName(marketName);
    return this.prepCancelOrderTx(
      market,
      ownerPk,
      orderId,
    );
  }
}
