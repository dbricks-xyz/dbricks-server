import e from 'express';
import CommonRoutesConfig from '../../common/routes/common.routes.config';
import SerumMiddleware from '../middleware/serum.middleware';
import SerumController from '../controller/serum.controller';

export class SerumRoutes extends CommonRoutesConfig {
  constructor(app: e.Application) {
    super(app, 'SerumRoutes');
  }

  configureRoutes(): e.Application {
    // --------------------------------------- orders
    this.app.route('/serum/orders')
      .get() // todo returns all orders
      .post(
        SerumMiddleware.validateStuff,
        SerumController.placeOrder,
      );

    this.app.route('/serum/orders/cancel')
      .post(
        SerumMiddleware.validateStuff,
        SerumController.cancelOrder,
      );

    // --------------------------------------- markets

    this.app.route('/serum/markets')
      .get() // todo return all markets
      .post(
        SerumMiddleware.validateStuff,
        SerumController.initMarket,
      );

    this.app.route('/serum/markets/settle')
      .post(
        SerumMiddleware.validateStuff,
        SerumController.settleMarket,
      );

    this.app.route('/serum/markets/basequote')
      .post(
        SerumMiddleware.validateStuff,
        SerumController.getMarketMints
      )

    return this.app;
  }
}
