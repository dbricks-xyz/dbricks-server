import { instructionsAndSigners } from 'dbricks-lib';
import {
  IMangoDEXOrder, IMangoDEXOrderCancelParamsParsed,
  IMangoDEXOrderPlaceParamsParsed,
} from '../interfaces/dex/mango.interfaces.dex.order';
import MangoClient from '../client/mango.client';
import { splitInstructionsAndSigners } from '../../common/util/common.util';

export default class MangoOrderService extends MangoClient implements IMangoDEXOrder {
  async placeSpot(params: IMangoDEXOrderPlaceParamsParsed): Promise<instructionsAndSigners[]> {
    const spotMarket = await this.loadSpotMarket(params.marketPubkey);
    const mangoAccount = await this.loadMangoAccountForOwner(params.ownerPubkey, params.mangoAccountNumber);
    const transaction = await this.preparePlaceSpotOrderTransaction(
      this.group,
      mangoAccount,
      this.group.mangoCache,
      spotMarket,
      params.ownerPubkey,
      params.side,
      params.price,
      params.size,
      params.orderType,
    );
    return [transaction];
  }

  async cancelSpot(params: IMangoDEXOrderCancelParamsParsed): Promise<instructionsAndSigners[]> {
    const mangoAccount = await this.loadMangoAccountForOwner(params.ownerPubkey, params.mangoAccountNumber);
    const instructionsAndSigners = await this.prepareCancelSpotOrderTransaction(
      mangoAccount,
      params.ownerPubkey,
      params.marketPubkey,
      params.orderId,
    );
    return splitInstructionsAndSigners(instructionsAndSigners);
  }

  async placePerp(params: IMangoDEXOrderPlaceParamsParsed): Promise<instructionsAndSigners[]> {
    await this.loadGroup(); // Necessary to load mangoCache
    const perpMarket = await this.loadPerpMarket(params.marketPubkey);
    const mangoAccount = await this.loadMangoAccountForOwner(params.ownerPubkey, params.mangoAccountNumber);
    const transaction = await this.preparePlacePerpOrderTransaction(
      mangoAccount,
      this.group.mangoCache,
      perpMarket,
      params.ownerPubkey,
      params.side,
      params.price,
      params.size,
      params.orderType,
    );
    return [transaction];
  }

  async cancelPerp(params: IMangoDEXOrderCancelParamsParsed): Promise<instructionsAndSigners[]> {
    await this.loadGroup(); // Group is used in prepareCancelPerpOrderTransaction
    const perpMarket = await this.loadPerpMarket(params.marketPubkey);
    const mangoAccount = await this.loadMangoAccountForOwner(params.ownerPubkey, params.mangoAccountNumber);
    const transaction = await this.prepareCancelPerpOrderTransaction(
      mangoAccount,
      params.ownerPubkey,
      perpMarket,
      params.orderId,
    );
    return [transaction];
  }
}
