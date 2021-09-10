import e from 'express';
import debug from 'debug';
// import MangoAccountService from '../services/mango.account.service';
import MangoDepositService from '../services/mango.deposit.service';

const log: debug.IDebugger = debug('app:mango-controller');

class MangoController {
  // async getMangoAccounts(req: e.Request, res: e.Response) {
  //   const mangoAccounts = await MangoAccountService.getMangoAccounts(req.params.publicKey);
  //   res.status(200).send(mangoAccounts);
  // }

  async deposit(req: e.Request, res: e.Response) {
    const ixAndSigners = await MangoDepositService.deposit(
      req.body.walletPk,
      req.body.mangoPk,
      req.body.tokenMintPk,
      req.body.quantity,
    );
    log('Deposit instruction generated');
    res.status(200).send(ixAndSigners);
  }
}

export default new MangoController();
