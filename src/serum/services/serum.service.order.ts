import {
  ISerumDEXOrder,
  ISerumDEXOrderCancelParamsParsed,
  ISerumDEXOrderPlaceParamsParsed,
} from '../interfaces/dex/serum.interfaces.dex.order';
import SerumClient from '../client/serum.client';
import {
  Action,
  Builder,
  IFlattenedBrick,
  instructionsAndSigners,
  Protocol
} from "@dbricks/dbricks-ts";
import {COMMITTMENT, CONNECTION_URL} from "../../config/config";
import {PublicKey} from "@solana/web3.js";

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
    console.log(placeInstructionsAndSigners.instructions)
    return [placeInstructionsAndSigners];
  }

  async cancel(params: ISerumDEXOrderCancelParamsParsed): Promise<instructionsAndSigners[]> {
    const market = await this.loadSerumMarket(params.marketPubkey);
    const instructionsAndSigners = await this.prepareCancelOrderTransaction(
      market,
      params.ownerPubkey,
      params.orderId,
    );
    //the next steps are needed in case there are too many orders to cancel in a single Transaction
    const flattenedBricks: IFlattenedBrick[] = instructionsAndSigners.instructions.map(i => {
      return {
        protocol: Protocol.Serum,
        action: Action.Serum.CancelOrder,
        instructionsAndSigners: {
          instructions: [i],
          signers: []
        } as instructionsAndSigners
      }
    })
    //we need to pass some publicKey to instantiate the builder, here it doesn't matter which
    const ownerPubkey = new PublicKey("75ErM1QcGjHiPMX7oLsf9meQdGSUs4ZrwS2X8tBpsZhA");
    const builder = new Builder({
      ownerPubkey,
      connectionUrl: CONNECTION_URL,
      committment: COMMITTMENT,
    });
    const sizedBricks = await builder.optimallySizeBricks(flattenedBricks);
    return sizedBricks.map(brick => {
        return {
          instructions: brick.transaction.instructions,
          signers: [],
        } as instructionsAndSigners;
    })
  }
}
