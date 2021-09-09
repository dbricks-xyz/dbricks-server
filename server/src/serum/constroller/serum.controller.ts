import e from 'express';
import debug from 'debug';
import SerumOrderService from '../services/serum.order.service';
import SerumSettleService from '../services/serum.settle.service';

const log: debug.IDebugger = debug('app:serum-controller');

class SerumController {
  async getOrders(req: e.Request, res: e.Response) {
    // todo make real
    res.status(200).send('your orders are xyz');
  }

  async placeOrder(req: e.Request, res: e.Response) {
    const ixAndSigners = await SerumOrderService.place(
      req.body.market,
      req.body.side,
      req.body.price,
      req.body.size,
      req.body.orderType,
    );
    log('Order instruction generated');
    res.status(200).send(ixAndSigners);
  }

  async settleBalance(req: e.Request, res: e.Response) {
    const ixAndSigners = await SerumSettleService.settle(
      req.body.market,
    );
    log('Settle instruction generated');
    res.status(200).send(ixAndSigners);
  }
}

export default new SerumController();
