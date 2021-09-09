import e from 'express';
import {CommonRoutesConfig} from "../../common/routes/common.routes.config";
import SerumMiddleware from '../middleware/serum.middleware';
import SerumController from '../constroller/serum.controller';

export class SerumRoutes extends CommonRoutesConfig {
    constructor(app: e.Application) {
        super(app, 'SerumRoutes');
        this.configureRoutes();
    }

    configureRoutes(): e.Application {
        this.app.route('/serum/orders')
            .get(
                SerumController.getOrders,
            )
            .post(
                SerumMiddleware.validateStuff,
                SerumController.placeOrder,
            )

        this.app.route('/serum/orders/:orderId')
            .get() //todo returns order details
            .post() //todo modifies the order

        this.app.route('/serum/orders/by_client_id/:clientId')
            .get() //todo returns order by client id
            .post() //todo modifies order by client id

        this.app.post('/serum/settle')

        return this.app;
    }
}