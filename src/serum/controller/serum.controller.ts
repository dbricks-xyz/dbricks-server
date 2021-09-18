import e from 'express';
import debug from 'debug';
import {serializeIxs, serializeSigners,} from 'dbricks-lib';
import SerumOrderService from '../services/serum.service.order';
import SerumMarketService from '../services/serum.service.market';
import {
  deserializeCancelOrder,
  deserializeInitMarket,
  deserializePlaceOrder,
  deserializeSettleMarket
} from "./serum.controller.serializers";

const log: debug.IDebugger = debug('app:serum-controller');

class SerumController {
  // --------------------------------------- order

  async placeOrder(req: e.Request, res: e.Response) {
    const params = deserializePlaceOrder(req);
    const serumOrderService = new SerumOrderService();
    const [ixs, signers] = await serumOrderService.place(params);
    log('Order instruction/signers generated');
    res.status(200).send([serializeIxs(ixs), serializeSigners(signers)]);
  }

  async cancelOrder(req: e.Request, res: e.Response) {
    const params = deserializeCancelOrder(req);
    const serumOrderService = new SerumOrderService();
    const [ixs, signers] = await serumOrderService.cancel(params);
    log(`Order ${params.orderId} successfully cancelled`);
    res.status(200).send([serializeIxs(ixs), serializeSigners(signers)]);
  }

  // --------------------------------------- market

  async initMarket(req: e.Request, res: e.Response) {
    const params = deserializeInitMarket(req);
    const serumMarketService = new SerumMarketService();
    const [ixs, signers] = await serumMarketService.init(params);
    log(`Market for ${params.baseMintPk}/${params.quoteMintPk} successfully initialized`);
    res.status(200).send([serializeIxs(ixs), serializeSigners(signers)]);
  }

  async settleMarket(req: e.Request, res: e.Response) {
    const params = deserializeSettleMarket(req);
    const serumMarketService = new SerumMarketService();
    const [ixs, signers] = await serumMarketService.settle(params);
    log('Settle instruction/signers generated');
    res.status(200).send([serializeIxs(ixs), serializeSigners(signers)]);
  }
}

export default new SerumController();
