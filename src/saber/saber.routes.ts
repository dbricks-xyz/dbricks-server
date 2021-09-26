import e from 'express';
import CommonRoutesConfig from '../common/routes/common.routes.config';
import SaberController from './saber.controller';

export class SaberRoutes extends CommonRoutesConfig {
  constructor(app: e.Application) {
    super(app, 'SaberRoutes');
  }

  configureRoutes(): e.Application {
    // --------------------------------------- orders
    this.app.route('/saber/orders')
      .get()
      .post(
        // todo: validation middleware
        SaberController.placeOrder,
      );

    return this.app;
  }
}
