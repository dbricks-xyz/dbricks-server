import e from 'express';
import debug from 'debug';
import {serializeIxsAndSigners,} from 'dbricks-lib';
import {deserializeCancel, deserializeDeposit, deserializePlace, deserializeSettle, deserializeWithdraw} from './mango.controller.serializers';
import MangoDepositService from '../services/mango.service.deposit';
import MangoWithdrawService from '../services/mango.service.withdraw';
import MangoMarketService from '../services/mango.service.market';
import MangoOrderService from '../services/mango.service.order';

const log: debug.IDebugger = debug('app:mango-controller');

class MangoController {
  async deposit(req: e.Request, res: e.Response) {
    const params = deserializeDeposit(req);
    const mangoDepositService = new MangoDepositService();
    const ixsAndSigners = await mangoDepositService.deposit(params);
    log('Deposit instruction generated');
    res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
  }

  async withdraw(req: e.Request, res: e.Response) {
    const params = deserializeWithdraw(req);
    const mangoWithdrawService = new MangoWithdrawService();
    const ixsAndSigners = await mangoWithdrawService.withdraw(params);
    log('Withdraw instruction generated');
    res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
  }

  async settleSpot(req: e.Request, res: e.Response) {
    const params = deserializeSettle(req);
    const mangoMarketService = new MangoMarketService();
    const ixsAndSigners = await mangoMarketService.settleSpot(params);
    log('Settle spot orders instruction generated');
    res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
  }

  async placeSpotOrder(req: e.Request, res: e.Response) {
    const params = deserializePlace(req);
    const mangoOrderService = new MangoOrderService();
    const ixsAndSigners = await mangoOrderService.placeSpot(params);
    log('Place spot order instruction generated');
    res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
  }

  async cancelSpotOrder(req: e.Request, res: e.Response) {
    const params = deserializeCancel(req);
    const mangoOrderService = new MangoOrderService();
    const ixsAndSigners = await mangoOrderService.cancelSpot(params);
    log('Cancel spot order instruction generated');
    res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
  }

  async placePerpOrder(req: e.Request, res: e.Response) {
    const params = deserializePlace(req);
    const mangoOrderService = new MangoOrderService();
    const ixsAndSigners = await mangoOrderService.placePerp(params);
    log('Place perp order instruction generated');
    res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
  }

  async cancelPerpOrder(req: e.Request, res: e.Response) {
    const params = deserializeCancel(req);
    const mangoOrderService = new MangoOrderService();
    const ixsAndSigners = await mangoOrderService.cancelPerp(params);
    log('Cancel perp order instruction generated');
    res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
  }

  async settlePerp(req: e.Request, res: e.Response) {
    const params = deserializeSettle(req);
    const mangoMarketService = new MangoMarketService();
    const ixsAndSigners = await mangoMarketService.settlePerp(params);
    log('Settle perp PnL instruction generated');
    res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
  }
}

export default new MangoController();
