import {
  ISerumDEXOrder,
  ISerumDEXOrderCancelParamsParsed,
  ISerumDEXOrderPlaceParamsParsed,
} from '../interfaces/dex/serum.interfaces.dex.order';
import SerumClient from '../client/serum.client';
import {mergeInstructionsAndSigners} from "../../common/util/common.util";
import {DBricksSDK, flattenedBrick, instructionsAndSigners} from "dbricks-lib";
import {COMMITTMENT, CONNECTION_URL} from "../../config/config";
import {PublicKey} from "@solana/web3.js";

export default class SerumOrderService extends SerumClient implements ISerumDEXOrder {
  async place(params: ISerumDEXOrderPlaceParamsParsed): Promise<instructionsAndSigners[]> {
    const market = await this.loadSerumMarket(params.marketPubkey);
    const [payerInstructionsAndSigners, payerPk] = await this.getPayerForMarket(
      market,
      params.side,
      params.ownerPubkey,
    );
    const placeInstructionsAndSigners = await this.prepPlaceOrderTransaction(
      market,
      params.side,
      params.price,
      params.size,
      params.orderType,
      params.ownerPubkey,
      payerPk,
    );
    const transaction = mergeInstructionsAndSigners(payerInstructionsAndSigners, placeInstructionsAndSigners);
    return [transaction];
  }

  async cancel(params: ISerumDEXOrderCancelParamsParsed): Promise<instructionsAndSigners[]> {
    const market = await this.loadSerumMarket(params.marketPubkey);
    const instructionsAndSigners = await this.prepCancelOrderTransaction(
      market,
      params.ownerPubkey,
      params.orderId,
    );
    //the next steps are needed in case there are too many orders to cancel in a single Transaction
    const flattenedBricks: flattenedBrick[] = instructionsAndSigners.instructions.map(i => {
      return {
        id: 0,
        description: '',
        instructionsAndSigners: {
          instructions: [i],
          signers: []
        } as instructionsAndSigners
      }
    })
    const sizedBricks = await (new DBricksSDK(CONNECTION_URL, COMMITTMENT)).findOptimalBrickSize(
      flattenedBricks,
      new PublicKey("75ErM1QcGjHiPMX7oLsf9meQdGSUs4ZrwS2X8tBpsZhA") //doesn't matter what Pk is passed here
    );
    return sizedBricks.map(brick => {
        return {
          instructions: brick.transaction.instructions,
          signers: [],
        } as instructionsAndSigners;
    })
  }
}
