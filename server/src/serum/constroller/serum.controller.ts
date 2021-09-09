import e from 'express';
import debug from 'debug';
import SerumOrderService from '../services/serum.order.service'

const log: debug.IDebugger = debug('app:serum-controller');

class SerumController {
    async placeOrder(req: e.Request, res: e.Response) {
        const orderId = await SerumOrderService.place(
            'buy',
            123,
            0.1,
            'ioc',
        );
        log('Order placed');
        res.status(200).send({id: orderId});
    }

    async getOrders(req: e.Request, res: e.Response) {
        res.status(200).send('your orders are xyz');
    }
}

export default new SerumController();