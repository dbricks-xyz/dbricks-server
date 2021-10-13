import e from 'express';
import debug from 'debug';

const log: debug.IDebugger = debug('app:saber-middleware');

class SaberMiddleware {
  async validateStuff(request: e.Request, response: e.Response, next: e.NextFunction) {
    // todo does any necessary validation before passing to controller
    log('Checks successfully passed');
    next();
  }
}

export default new SaberMiddleware();
