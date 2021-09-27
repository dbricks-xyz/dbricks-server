import debug from 'debug'
import e from 'express'
import TokenService from "../services/common.services.token";

const log: debug.IDebugger = debug('app:serum-controller');

class CommonController {
  async getMintName(request: e.Request, response: e.Response) {
    const tokenService = new TokenService();
    const name = tokenService.getMintName(request.body.mintPubkey);
    response.status(200).send(name);
  }

}

export default new CommonController();

