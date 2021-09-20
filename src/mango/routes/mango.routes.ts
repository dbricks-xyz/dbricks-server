import e from 'express';
import CommonRoutesConfig from '../../common/routes/common.routes.config';
import MangoMiddleware from '../middleware/mango.middleware';
import MangoController from '../controller/mango.controller';

export class MangoRoutes extends CommonRoutesConfig {
  constructor(app: e.Application) {
    super(app, 'MangoRoutes');
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

    this.app.route('/mango/spot/settle')
      .post(
        MangoMiddleware.validateStuff,
        MangoController.settleSpot,
      );

    this.app.route('/mango/spot/place')
      .post(
        MangoMiddleware.validateStuff,
        MangoController.placeSpotOrder,
      );

    this.app.route('/mango/spot/cancel')
      .post(
        MangoMiddleware.validateStuff,
        MangoController.cancelSpotOrder,
      );

    this.app.route('/mango/perp/place')
      .post(
        MangoMiddleware.validateStuff,
        MangoController.placePerpOrder,
      );

    this.app.route('/mango/perp/cancel')
      .post(
        MangoMiddleware.validateStuff,
        MangoController.cancelPerpOrder,
      );

    this.app.route('/mango/perp/settle')
      .post(
        MangoMiddleware.validateStuff,
        MangoController.settlePerp,
      );

    return this.app;
  }
}
