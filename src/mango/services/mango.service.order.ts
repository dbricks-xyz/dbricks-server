import {instructionsAndSigners} from 'dbricks-lib';
import {Order} from '@project-serum/serum/lib/market';
import {
  IMangoDEXOrder, IMangoDEXOrderCancelParamsParsed,
  IMangoDEXOrderPlaceParamsParsed,
} from '../interfaces/dex/mango.interfaces.dex.order';
import MangoClient from '../client/mango.client';

export default class MangoOrderService extends MangoClient implements IMangoDEXOrder {
  async placeSpot(params: IMangoDEXOrderPlaceParamsParsed): Promise<instructionsAndSigners[]> {
    const markets = await this.loadSpotMarkets();
    const spotMarket = markets.find(
      (m) => m.publicKey.toBase58() === params.marketPubkey.toBase58(),
    );
    if (!spotMarket) {
      throw new Error(`Failed to load spot market: ${params.marketPubkey.toBase58()}`);
    }
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

  // todo needs to be able to cancel all orders (see serum)
  async cancelSpot(params: IMangoDEXOrderCancelParamsParsed): Promise<instructionsAndSigners[]> {
    const markets = await this.loadSpotMarkets();
    const spotMarket = markets.find(
      (m) => m.publicKey.toBase58() === params.marketPubkey.toBase58(),
    );
    if (!spotMarket) {
      throw new Error(`Failed to load spot market: ${params.marketPubkey.toBase58()}`);
    }
    const mangoAccount = await this.loadMangoAccountForOwner(params.ownerPubkey, params.mangoAccountNumber);
    const openOrders = mangoAccount.spotOpenOrdersAccounts.find(
      (account) => account?.market.toBase58() === params.marketPubkey.toBase58(),
    );
    if (!openOrders) {
      throw new Error(`Could not find open orders from: ${mangoAccount.publicKey.toBase58()} for market: ${params.marketPubkey.toBase58()}`);
    }
    const openOrdersPubkey = openOrders.owner;
    const orders = await spotMarket.loadOrdersForOwner(this.connection, openOrdersPubkey);
    const order = orders.find((o) => o.orderId.toString() === params.orderId!.toString()) as Order;

    const transaction = await this.prepareCancelSpotOrderTransaction(
      mangoAccount,
      params.ownerPubkey,
      spotMarket,
      order,
    );
    return [transaction];
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

  // todo needs to be able to cancel all orders (see serum)
  async cancelPerp(params: IMangoDEXOrderCancelParamsParsed): Promise<instructionsAndSigners[]> {
    await this.loadGroup(); // Group is used in prepareCancelPerpOrderTransaction
    const perpMarket = await this.loadPerpMarket(params.marketPubkey);
    const mangoAccount = await this.loadMangoAccountForOwner(params.ownerPubkey, params.mangoAccountNumber);

    const openOrders = await perpMarket.loadOrdersForAccount(
      this.connection,
      mangoAccount,
    );
    console.log('oo are', openOrders.map(o => o.orderId.toString()));
    const order = openOrders.find((o) => o.orderId.toString() === params.orderId!.toString());
    if (!order) {
      throw new Error(`Could not find perp order: ${params.orderId!.toString()}`);
    }

    const transaction = await this.prepareCancelPerpOrderTransaction(
      mangoAccount,
      params.ownerPubkey,
      perpMarket,
      order,
    );
    return [transaction];
  }
}
