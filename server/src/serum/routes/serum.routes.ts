import e from 'express';
import CommonRoutesConfig from '../../common/routes/common.routes.config';
import SerumMiddleware from '../middleware/serum.middleware';
import SerumController from '../constroller/serum.controller';

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

    this.app.route('/serum/orders/:orderId')
      .get() // todo returns order details
      .post(); // todo modifies the order

    this.app.route('/serum/orders/by_client_id/:clientId')
      .get() // todo returns order by client id
      .post(); // todo modifies order by client id

    // --------------------------------------- markets

    this.app.route('/serum/markets/settle')
      .post(
        SerumMiddleware.validateStuff,
        SerumController.settleBalance,
      );

    return this.app;
  }
}
