import e from "express";

class SaberController {
    async placeOrder(req: e.Request, res: e.Response) {
        // const params = deserializePlaceOrder(req);
        // const serumOrderService = new SerumOrderService();
        // const ixsAndSigners = await serumOrderService.place(params);
        // log('Order instruction/signers generated');
        // res.status(200).send(serializeIxsAndSigners(ixsAndSigners));
        res.status(500)
    }
}