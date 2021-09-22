import debug from 'debug'
import e from 'express'
import TokenService from "../services/common.services.token";

const log: debug.IDebugger = debug('app:serum-controller');

class CommonController {
  async getMintName(req: e.Request, res: e.Response) {
    const tokenService = new TokenService();
    const name = tokenService.getMintName(req.body.mintPk);
    res.status(200).send(name);
  }

}

export default new CommonController();

