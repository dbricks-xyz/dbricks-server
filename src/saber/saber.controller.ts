import e from 'express';
import debug from 'debug';

class SaberController {
    async placeOrder(req: e.Request, res: e.Response, next: e.NextFunction) {
        // TODO:
        // const params = deserializePlaceOrder(req);
        // const serumOrderService = new SerumOrderService();
        // Promise.resolve(serumOrderService.place(params))
        //   .then((ixsAndSigners) => {
        //     log('Order instruction/signers generated');
        //     res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
        //   })
        //   .catch(next);
        res.status(200).send({})
      }
}

export default new SaberController();
