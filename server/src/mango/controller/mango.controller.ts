import e from 'express';
import debug from 'debug';
import MangoDepositService from '../services/mango.service.deposit';
import { deserializePk, serializeIxs, serializeSigners } from '../../common/util/common.serializers';

const log: debug.IDebugger = debug('app:mango-controller');

class MangoController {

  async deposit(req: e.Request, res: e.Response) {
    log('Begin deposit');
    const [ix, signers] = await MangoDepositService.deposit(
      req.body.token,
      req.body.quantity,
      deserializePk(req.body.ownerPk),
      req.body.destinationPk ? deserializePk(req.body.destinationPk) : undefined
    );
    log('Deposit instruction generated');
    res.status(200).send([serializeIxs(ix), serializeSigners(signers)]);
  }
}

export default new MangoController();
