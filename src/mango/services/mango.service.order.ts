import {ixsAndSigners} from 'dbricks-lib';
import {Order} from '@project-serum/serum/lib/market';
import {IMangoDEXOrder,} from '../interfaces/dex/mango.interfaces.dex.order';
import MangoClient from '../client/mango.client';
import {
  ISerumDEXOrderCancelParamsParsed,
  ISerumDEXOrderPlaceParamsParsed
} from "../../serum/interfaces/dex/serum.interfaces.dex.order";

export default class MangoOrderService extends MangoClient implements IMangoDEXOrder {
  async placeSpot(params: ISerumDEXOrderPlaceParamsParsed): Promise<ixsAndSigners[]> {
    const markets = await this.loadSpotMarkets();
    const spotMarket = markets.find(
      (m) => m.publicKey.toBase58() === params.marketPk.toBase58(),
    );
    if (!spotMarket) {
      throw new Error(`Failed to load spot market: ${params.marketPk.toBase58()}`);
    }
    const mangoAcc = await this.loadMangoAccForOwner(params.ownerPk);

    const tx = await this.prepPlaceSpotOrderTx(
      this.group,
      mangoAcc,
      this.group.mangoCache,
      spotMarket,
      params.ownerPk,
      params.side,
      params.price,
      params.size,
      params.orderType,
    );
    return [tx];
  }

  //todo needs to be able to cancel all orders (see serum)
  async cancelSpot(params: ISerumDEXOrderCancelParamsParsed): Promise<ixsAndSigners[]> {
    const markets = await this.loadSpotMarkets();
    const spotMarket = markets.find(
      (m) => m.publicKey.toBase58() === params.marketPk.toBase58(),
    );
    if (!spotMarket) {
      throw new Error(`Failed to load spot market: ${params.marketPk.toBase58()}`);
    }
    const mangoAcc = await this.loadMangoAccForOwner(params.ownerPk);
    const openOrders = mangoAcc.spotOpenOrdersAccounts.find(
      (acc) => acc?.market.toBase58() === params.marketPk.toBase58(),
    );
    if (!openOrders) {
      throw new Error(`Could not find open orders from: ${mangoAcc.publicKey.toBase58()} for market: ${params.marketPk.toBase58()}`);
    }
    const openOrdersPk = openOrders.owner;
    const orders = await spotMarket.loadOrdersForOwner(this.connection, openOrdersPk);
    const order = orders.find((o) => o.orderId.toString() === params.orderId!.toString()) as Order;

    const tx = await this.prepCancelSpotOrderTx(
      mangoAcc,
      params.ownerPk,
      spotMarket,
      order,
    );
    return [tx];
  }

  //todo needs to be able to cancel all orders (see serum)
  async placePerp(params: ISerumDEXOrderPlaceParamsParsed): Promise<ixsAndSigners[]> {
    await this.loadGroup(); // Necessary to load mangoCache
    const perpMarket = await this.loadPerpMarket(params.marketPk);
    const mangoAcc = await this.loadMangoAccForOwner(params.ownerPk);

    const tx = await this.prepPlacePerpOrderTx(
      mangoAcc,
      this.group.mangoCache,
      perpMarket,
      params.ownerPk,
      params.side,
      params.price,
      params.size,
      params.orderType,
    );
    return [tx];
  }

  async cancelPerp(params: ISerumDEXOrderCancelParamsParsed): Promise<ixsAndSigners[]> {
    await this.loadGroup(); // Group is used in prepCancelPerpOrderTx
    const perpMarket = await this.loadPerpMarket(params.marketPk);
    const mangoAcc = await this.loadMangoAccForOwner(params.ownerPk);

    const openOrders = await perpMarket.loadOrdersForAccount(
      this.connection,
      mangoAcc,
    );
    console.log('oo are', openOrders.map(o => o.orderId.toString()));
    const order = openOrders.find((o) => o.orderId.toString() === params.orderId!.toString());
    if (!order) {
      throw new Error(`Could not find perp order: ${params.orderId!.toString()}`);
    }

    const tx = await this.prepCancelPerpOrderTx(
      mangoAcc,
      params.ownerPk,
      perpMarket,
      order,
    );
    return [tx];
  }
}
