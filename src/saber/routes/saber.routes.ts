import e from 'express';
import CommonRoutesConfig from '../../common/routes/common.routes.config';
import SerumController from '../../serum/controller/serum.controller';

export class SaberRoutes extends CommonRoutesConfig {
  constructor(app: e.Application) {
    super(app, 'SaberRoutes');
  }

  configureRoutes(): e.Application {
    // --------------------------------------- orders
    this.app.route('/saber/orders')
      .get() // todo returns all orders
      .post(
        // SerumMiddleware.validateStuff,
        SerumController.placeOrder,
      );

    // TODO:
    // this.app.route('/saber/orders/cancel')
    //   .post(
    //     SerumMiddleware.validateStuff,
    //     SerumController.cancelOrder,
    //   );

    // // --------------------------------------- markets

    // this.app.route('/saber/markets')
    //   .get() // todo return all markets
    //   .post(
    //     SerumMiddleware.validateStuff,
    //     SerumController.initMarket,
    //   );

    // this.app.route('/saber/markets/settle')
    //   .post(
    //     SerumMiddleware.validateStuff,
    //     SerumController.settleMarket,
    //   );

    // this.app.route('/saber/markets/basequote')
    //   .post(
    //     SerumMiddleware.validateStuff,
    //     SerumController.getBaseQuote
    //   )

    return this.app;
  }
}
