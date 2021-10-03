import {
  ISerumDEXOrder,
  ISerumDEXOrderCancelParamsParsed,
  ISerumDEXOrderPlaceParamsParsed,
} from '../interfaces/dex/serum.interfaces.dex.order';
import SerumClient from '../client/serum.client';
import {mergeInstructionsAndSigners, splitInstructionsAndSigners} from "../../common/util/common.util";
import {instructionsAndSigners} from "dbricks-lib";


export default class SerumOrderService extends SerumClient implements ISerumDEXOrder {
  async place(params: ISerumDEXOrderPlaceParamsParsed): Promise<instructionsAndSigners[]> {
    const market = await this.loadSerumMarket(params.marketPubkey);
    const [_, payerPubkey] = await this.getPayerForMarket(
      market,
      params.side,
      params.ownerPubkey,
    );
    const placeInstructionsAndSigners = await this.preparePlaceOrderTransaction(
      market,
      params.side,
      params.price,
      params.size,
      params.orderType,
      params.ownerPubkey,
      payerPubkey,
    );
    return [placeInstructionsAndSigners];
  }

  async cancel(params: ISerumDEXOrderCancelParamsParsed): Promise<instructionsAndSigners[]> {
    const market = await this.loadSerumMarket(params.marketPubkey);
    const instructionsAndSigners = await this.prepareCancelOrderTransaction(
      market,
      params.ownerPubkey,
      params.orderId,
    );
    return splitInstructionsAndSigners(instructionsAndSigners);
  }
}
