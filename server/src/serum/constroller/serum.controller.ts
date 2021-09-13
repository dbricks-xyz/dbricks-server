import e from 'express';
import debug from 'debug';
import SerumOrderService from '../services/serum.service.order';
import SerumSettleService from '../services/serum.service.market';
import {
  deserializePk,
  serializeIxs,
  serializeSigners,
} from '../../common/util/common.serializers';

const log: debug.IDebugger = debug('app:serum-controller');

class SerumController {
  async placeOrder(req: e.Request, res: e.Response) {
    log('Begin place order');
    const serumOrderService = new SerumOrderService();
    const [ix, signers] = await serumOrderService.place(
      req.body.market,
      req.body.side,
      req.body.price,
      req.body.size,
      req.body.orderType,
      deserializePk(req.body.ownerPk),
    );
    log('Order instruction/signers generated');
    res.status(200).send([serializeIxs(ix), serializeSigners(signers)]);
  }

  async settleBalance(req: e.Request, res: e.Response) {
    log('Begin settle balance');
    const serumOrderService = new SerumSettleService();
    const [ix, signers] = await serumOrderService.settle(
      req.body.market,
      deserializePk(req.body.ownerPk),
    );
    log('Settle instruction/signers generated');
    res.status(200).send([serializeIxs(ix), serializeSigners(signers)]);
  }
}

export default new SerumController();
