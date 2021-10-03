import debug from 'debug'
import e from 'express'
import TokenService from "../services/common.services.token";

const log: debug.IDebugger = debug('app:serum-controller');

class CommonController {
  async getMintName(request: e.Request, response: e.Response, next: e.NextFunction) {
    const tokenService = new TokenService();
    Promise.resolve(tokenService.getMintName(request.body.mintPubkey))
      .then((name) => {
        log(`Mint with name ${name} fetched.`)
        response.status(200).send(name);
      })
      .catch(next);
  }

}

export default new CommonController();

