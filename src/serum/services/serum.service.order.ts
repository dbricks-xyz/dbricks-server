import {
  IDEXOrder,
  IDEXOrderCancelParsed,
  IDEXOrderPlaceParsed,
  ixsAndSigners,
} from '../../common/interfaces/dex/common.interfaces.dex.order';
import SerumClient from '../client/serum.client';

export default class SerumOrderService extends SerumClient implements IDEXOrder {
  async place(params: IDEXOrderPlaceParsed): Promise<ixsAndSigners> {
    const market = await this.loadSerumMarket(params.marketPk);
    const [[ixPayer, signersPayer], payerPk] = await this.getPayerForMarket(
      market,
      params.side,
      params.ownerPk,
    );
    const [ixPlace, signersPlace] = await this.prepPlaceOrderTx(
      market,
      params.side,
      params.price,
      params.size,
      params.orderType,
      params.ownerPk,
      payerPk,
    );
    return [
      [...ixPayer, ...ixPlace],
      [...signersPayer, ...signersPlace],
    ];
  }

  async cancel(params:IDEXOrderCancelParsed): Promise<ixsAndSigners> {
    const market = await this.loadSerumMarket(params.marketPk);
    return this.prepCancelOrderTx(
      market,
      params.ownerPk,
      params.orderId,
    );
  }
}
