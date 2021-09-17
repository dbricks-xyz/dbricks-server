import e from 'express';
import debug from 'debug';
import BN from 'bn.js';
import SerumOrderService from '../services/serum.service.order';
import {
  deserializePk,
  serializeIxs,
  serializeSigners,
} from '../../common/util/common.serializers';
import SerumMarketService from '../services/serum.service.market';

const log: debug.IDebugger = debug('app:serum-controller');

class SerumController {
  // --------------------------------------- order
  async placeOrder(req: e.Request, res: e.Response) {
    const serumOrderService = new SerumOrderService();
    const [ixs, signers] = await serumOrderService.place(
      req.body.marketName,
      req.body.side,
      req.body.price,
      req.body.size,
      req.body.orderType,
      deserializePk(req.body.ownerPk),
    );
    log('Order instruction/signers generated');
    res.status(200).send([serializeIxs(ixs), serializeSigners(signers)]);
  }

  async cancelOrder(req: e.Request, res: e.Response) {
    const orderId = new BN(req.body.orderId);
    const serumOrderService = new SerumOrderService();
    const [ixs, signers] = await serumOrderService.cancel(
      req.body.marketName,
      orderId,
      deserializePk(req.body.ownerPk),
    );
    log(`Order ${orderId} successfully cancelled`);
    res.status(200).send([serializeIxs(ixs), serializeSigners(signers)]);
  }

  // --------------------------------------- market

  async initMarket(req: e.Request, res: e.Response) {
    const serumMarketService = new SerumMarketService();
    const [ixs, signers] = await serumMarketService.init(
      deserializePk(req.body.baseMintPk),
      deserializePk(req.body.quoteMintPk),
      req.body.lotSize,
      req.body.tickSize,
      deserializePk(req.body.ownerPk),
    );
    log(`Market for ${req.body.baseMintPk}/${req.body.quoteMintPk} successfully initialized`);
    res.status(200).send([serializeIxs(ixs), serializeSigners(signers)]);
  }

  async settleMarket(req: e.Request, res: e.Response) {
    const serumMarketService = new SerumMarketService();
    const [ixs, signers] = await serumMarketService.settle(
      req.body.marketName,
      deserializePk(req.body.ownerPk),
    );
    log('Settle instruction/signers generated');
    res.status(200).send([serializeIxs(ixs), serializeSigners(signers)]);
  }
}

export default new SerumController();
