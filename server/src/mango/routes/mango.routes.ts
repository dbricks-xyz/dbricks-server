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
    this.app.route('/mango/deposit')
      .post(
        MangoMiddleware.validateStuff,
        MangoController.deposit,
      );

    this.app.route('/mango/withdraw')
      .post(
        MangoMiddleware.validateStuff,
        MangoController.withdraw,
      );

    this.app.route('/mango/borrow')
      .post(
        MangoMiddleware.validateStuff,
        MangoController.borrow,
      );

    return this.app;
  }
}
