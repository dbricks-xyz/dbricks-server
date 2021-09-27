import e from 'express';
import debug from 'debug';
import {serializeInstructionsAndSigners} from 'dbricks-lib';
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

  async placeOrder(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializePlaceOrder(request);
    const serumOrderService = new SerumOrderService();
    Promise.resolve(serumOrderService.place(params))
      .then((instructionsAndSigners) => {
        log('Order instruction/signers generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async cancelOrder(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeCancelOrder(request);
    const serumOrderService = new SerumOrderService();
    Promise.resolve(serumOrderService.cancel(params))
      .then((instructionsAndSigners) => {
        if (params.orderId) {
          log(`Order ${params.orderId} successfully cancelled`);
        } else {
          log('All orders cancelled.')
        }
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  // --------------------------------------- market

  async initMarket(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeInitMarket(request);
    const serumMarketService = new SerumMarketService();
    Promise.resolve(serumMarketService.init(params))
      .then((instructionsAndSigners) => {
        log(`Market for ${params.baseMintPubkey}/${params.quoteMintPubkey} successfully initialized`);
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async settleMarket(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeSettleMarket(request);
    const serumMarketService = new SerumMarketService();
    Promise.resolve(serumMarketService.settle(params))
      .then((instructionsAndSigners) => {
        log('Settle instruction/signers generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async getMarketMints(request: e.Request, response: e.Response, next: e.NextFunction) {
    const serumMarketService = new SerumMarketService();
    Promise.resolve(serumMarketService.getMarketMints(request.body.marketPubkey))
      .then(([base, quote]) => {
        log('Base/quote names generated');
        response.status(200).send([base, quote]);
      })
      .catch(next);
  }
}

export default new SerumController();

