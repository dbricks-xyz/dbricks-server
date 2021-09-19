import e from 'express';
import debug from 'debug';
import {
  deserializePk,
  serializeIxs, serializeIxsAndSigners,
  serializeSigners,
} from 'dbricks-lib';
import MangoDepositService from '../services/mango.service.deposit';
import MangoWithdrawService from '../services/mango.service.withdraw';
import {deserializeDeposit, deserializeWithdraw} from "./mango.controller.serializers";

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

  // todo hm this doesn't look like a good idea to me -
  //  you should have a single route if it's the same call, and FE will decide isBorrow = false or true
  // async borrow(req: e.Request, res: e.Response) {
  //   const mangoWithdrawService = new MangoWithdrawService();
  //   const ixsAndSigners = await mangoWithdrawService.withdraw(
  //     deserializePk(req.body.mintPk),
  //     req.body.quantity,
  //     true,
  //     deserializePk(req.body.ownerPk),
  //     req.body.sourcePk ? deserializePk(req.body.sourcePk) : undefined,
  //   );
  //   log('Borrow instruction generated');
  //   res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
  // }
}

export default new MangoController();
