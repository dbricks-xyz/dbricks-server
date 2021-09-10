import e from 'express';
import debug from 'debug';
import MangoAccountService from '../services/mango.account.service';
// import MangoDepositService from '../services/mango.deposit.service';

const log: debug.IDebugger = debug('app:mango-controller');

class MangoController {
  async getMangoAccounts(req: e.Request, res: e.Response) {
    console.log('in controller');
    const mangoAccounts = await MangoAccountService.getMangoAccounts('DAETLz1E6ThdzRYqx131swWGLqzA4UjyPC3M7nTvSQve');
    console.log(mangoAccounts);
    res.status(200).send(mangoAccounts);
  }
}

export default new MangoController();
