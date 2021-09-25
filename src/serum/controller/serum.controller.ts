import e from 'express';
import debug from 'debug';
import {serializeIxsAndSigners} from 'dbricks-lib';
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

  async placeOrder(req: e.Request, res: e.Response, next: e.NextFunction) {
    const params = deserializePlaceOrder(req);
    const serumOrderService = new SerumOrderService();
    Promise.resolve(serumOrderService.place(params))
      .then((ixsAndSigners) => {
        log('Order instruction/signers generated');
        res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
      })
      .catch(next);
  }

  async cancelOrder(req: e.Request, res: e.Response, next: e.NextFunction) {
    const params = deserializeCancelOrder(req);
    const serumOrderService = new SerumOrderService();
    Promise.resolve(serumOrderService.cancel(params))
      .then((ixsAndSigners) => {
        if (params.orderId) {
          log(`Order ${params.orderId} successfully cancelled`);
        } else {
          log('All orders cancelled.')
        }
        res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
      })
      .catch(next);
  }

  // --------------------------------------- market

  async initMarket(req: e.Request, res: e.Response, next: e.NextFunction) {
    const params = deserializeInitMarket(req);
    const serumMarketService = new SerumMarketService();
    Promise.resolve(serumMarketService.init(params))
      .then((ixsAndSigners) => {
        log(`Market for ${params.baseMintPk}/${params.quoteMintPk} successfully initialized`);
        res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
      })
      .catch(next);
  }

  async settleMarket(req: e.Request, res: e.Response, next: e.NextFunction) {
    const params = deserializeSettleMarket(req);
    const serumMarketService = new SerumMarketService();
    Promise.resolve(serumMarketService.settle(params))
      .then((ixsAndSigners) => {
        log('Settle instruction/signers generated');
        res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
      })
      .catch(next);
  }

  async getMarketMints(req: e.Request, res: e.Response, next: e.NextFunction) {
    const serumMarketService = new SerumMarketService();
    Promise.resolve(serumMarketService.getMarketMints(req.body.marketPk))
      .then(([base, quote]) => {
        log('Base/quote names generated');
        res.status(200).send([base, quote]);
      })
      .catch(next);
  }
}

export default new SerumController();

