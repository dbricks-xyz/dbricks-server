import {
  ISerumDEXOrder,
  ISerumDEXOrderCancelParamsParsed,
  ISerumDEXOrderPlaceParamsParsed,
} from '../interfaces/dex/serum.interfaces.dex.order';
import SerumClient from '../client/serum.client';
import {mergeIxsAndSigners} from "../../common/util/common.util";
import {DBricksSDK, flattenedBrick, ixsAndSigners} from "dbricks-lib";
import {COMMITTMENT, CONNECTION_URL} from "../../config/config";
import {PublicKey} from "@solana/web3.js";

export default class SerumOrderService extends SerumClient implements ISerumDEXOrder {
  async place(params: ISerumDEXOrderPlaceParamsParsed): Promise<ixsAndSigners[]> {
    const market = await this.loadSerumMarket(params.marketPk);
    const [payerIxsAndSigners, payerPk] = await this.getPayerForMarket(
      market,
      params.side,
      params.ownerPk,
    );
    const placeIxsAndSigners = await this.prepPlaceOrderTx(
      market,
      params.side,
      params.price,
      params.size,
      params.orderType,
      params.ownerPk,
      payerPk,
    );
    const tx = mergeIxsAndSigners(payerIxsAndSigners, placeIxsAndSigners);
    return [tx];
  }

  async cancel(params: ISerumDEXOrderCancelParamsParsed): Promise<ixsAndSigners[]> {
    const market = await this.loadSerumMarket(params.marketPk);
    const ixsAndSigners = await this.prepCancelOrderTx(
      market,
      params.ownerPk,
      params.orderId,
    );
    //the next steps are needed in case there are too many orders to cancel in a single Tx
    const flattenedBricks: flattenedBrick[] = ixsAndSigners.ixs.map(i => {
      return {
        id: 0,
        desc: '',
        ixsAndSigners: {
          ixs: [i],
          signers: []
        }
      }
    })
    const sizedBricks = await (new DBricksSDK(CONNECTION_URL, COMMITTMENT)).findOptimalBrickSize(
      flattenedBricks,
      new PublicKey("75ErM1QcGjHiPMX7oLsf9meQdGSUs4ZrwS2X8tBpsZhA") //doesn't matter what Pk is passed here
    );
    return sizedBricks.map(brick => {
        return {
          ixs: brick.tx.instructions,
          signers: [],
        } as ixsAndSigners;
    })
  }
}
