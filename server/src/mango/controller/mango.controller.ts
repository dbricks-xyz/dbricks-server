import e from 'express';
import debug from 'debug';
import MangoDepositService from '../services/mango.service.deposit';
import MangoWithdrawService from '../services/mango.service.withdraw';
import {
  deserializePk,
  serializeIxs,
  serializeSigners,
} from '../../common/util/common.serializers';

const log: debug.IDebugger = debug('app:mango-controller');

class MangoController {
  async deposit(req: e.Request, res: e.Response) {
    const mangoDepositService = new MangoDepositService();
    const [ix, signers] = await mangoDepositService.deposit(
      req.body.token,
      req.body.quantity,
      deserializePk(req.body.ownerPk),
      deserializePk(req.body.destinationPk),
    );
    log('Deposit instruction generated');
    res.status(200).send([serializeIxs(ix), serializeSigners(signers)]);
  }

  async withdraw(req: e.Request, res: e.Response) {
    const mangoWithdrawService = new MangoWithdrawService();
    const [ix, signers] = await mangoWithdrawService.withdraw(
      req.body.token,
      req.body.quantity,
      false,
      deserializePk(req.body.ownerPk),
      deserializePk(req.body.sourcePk),
    );
    log('Withdraw instruction generated');
    res.status(200).send([serializeIxs(ix), serializeSigners(signers)]);
  }

  async borrow(req: e.Request, res: e.Response) {
    const mangoWithdrawService = new MangoWithdrawService();
    const [ix, signers] = await mangoWithdrawService.withdraw(
      req.body.token,
      req.body.quantity,
      true,
      deserializePk(req.body.ownerPk),
      req.body.sourcePk ? deserializePk(req.body.sourcePk) : undefined,
    );
    log('Borrow instruction generated');
    res.status(200).send([serializeIxs(ix), serializeSigners(signers)]);
  }
}

export default new MangoController();
