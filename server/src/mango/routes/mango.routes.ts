import e from 'express';
import CommonRoutesConfig from '../../common/routes/common.routes.config';
import MangoMiddleware from '../middleware/mango.middleware';
import MangoController from '../controller/mango.controller';

export class MangoRoutes extends CommonRoutesConfig {
  constructor(app: e.Application) {
    super(app, 'MangoRoutes');
    this.configureRoutes();
  }

  configureRoutes(): e.Application {
    // this.app.route('/mango/accounts/:publicKey')
    //   .get(
    //     MangoController.getMangoAccounts,
    //   );

    this.app.route('/mango/deposit')
      .post(
        MangoMiddleware.validateStuff,
        MangoController.deposit,
      );

    return this.app;
  }
}
