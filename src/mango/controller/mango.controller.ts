import e from 'express';
import debug from 'debug';
import {
  deserializePk,
  serializeIxs, serializeIxsAndSigners,
  serializeSigners,
} from 'dbricks-lib';
import MangoDepositService from '../services/mango.service.deposit';
import MangoWithdrawService from '../services/mango.service.withdraw';

const log: debug.IDebugger = debug('app:mango-controller');

class MangoController {
  async deposit(req: e.Request, res: e.Response) {
    const mangoDepositService = new MangoDepositService();
    const ixsAndSigners = await mangoDepositService.deposit(
      deserializePk(req.body.mintPk),
      req.body.quantity, //todo let's pass this in as a string and deserialize into BN - ask me to explain
      deserializePk(req.body.ownerPk),
      deserializePk(req.body.destinationPk),
    );
    log('Deposit instruction generated');
    res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
  }

  async withdraw(req: e.Request, res: e.Response) {
    const mangoWithdrawService = new MangoWithdrawService();
    const ixsAndSigners = await mangoWithdrawService.withdraw(
      deserializePk(req.body.mintPk),
      req.body.quantity, //todo let's pass this in as a string and deserialize into BN - ask me to explain
      false,
      deserializePk(req.body.ownerPk),
      deserializePk(req.body.sourcePk),
    );
    log('Withdraw instruction generated');
    res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
  }

  async borrow(req: e.Request, res: e.Response) {
    const mangoWithdrawService = new MangoWithdrawService();
    const ixsAndSigners = await mangoWithdrawService.withdraw(
      deserializePk(req.body.mintPk),
      req.body.quantity,
      true,
      deserializePk(req.body.ownerPk),
      req.body.sourcePk ? deserializePk(req.body.sourcePk) : undefined,
    );
    log('Borrow instruction generated');
    res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
  }
}

export default new MangoController();
