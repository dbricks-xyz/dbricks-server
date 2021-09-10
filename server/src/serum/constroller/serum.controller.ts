import e from 'express';
import debug from 'debug';
import SerumOrderService from '../services/serum.order.service';
import SerumSettleService from '../services/serum.settle.service';
import {
  deserializePk,
  serializeIxs,
  serializeSigners,
} from '../../common/util/serializers';

const log: debug.IDebugger = debug('app:serum-controller');

class SerumController {
  async placeOrder(req: e.Request, res: e.Response) {
    const [ix, signers] = await SerumOrderService.place(
      req.body.market,
      req.body.side,
      req.body.price,
      req.body.size,
      req.body.orderType,
      req.body.ownerPk,
    );
    log('Order instruction/signers generated');
    // --------------------------------------- worker
    // res.status(200).send([ix, signers]);
    // --------------------------------------- main thread
    res.status(200).send([serializeIxs(ix), serializeSigners(signers)]);
  }

  async settleBalance(req: e.Request, res: e.Response) {
    const [ix, signers] = await SerumSettleService.settle(
      req.body.market,
      req.body.ownerPk,
    );
    log('Settle instruction/signers generated');
    // --------------------------------------- workers
    // res.status(200).send([ix, signers]);
    // --------------------------------------- main thread
    res.status(200).send([serializeIxs(ix), serializeSigners(signers)]);
  }
}

export default new SerumController();
