import e from "express";
import debug from "debug";
import MangoDepositService from "../services/mango.service.deposit";
import MangoWithdrawService from "../services/mango.service.withdraw";
import {
  deserializePk,
  serializeIxs,
  serializeSigners,
} from "../../common/util/common.serializers";

const log: debug.IDebugger = debug("app:mango-controller");

class MangoController {
  async deposit(req: e.Request, res: e.Response) {
    log("Begin deposit");
    const [ix, signers] = await MangoDepositService.deposit(
      req.body.token,
      req.body.quantity,
      deserializePk(req.body.ownerPk),
      req.body.destinationPk ? deserializePk(req.body.destinationPk) : undefined
    );
    const serializedSigners = serializeSigners(signers);
    log("Deposit instruction generated");
    res.status(200).send([serializeIxs(ix), serializedSigners]);
  }

  async withdraw(req: e.Request, res: e.Response) {
    log("Begin withdraw");
    const [ix, signers] = await MangoWithdrawService.withdraw(
      req.body.token,
      req.body.quantity,
      deserializePk(req.body.ownerPk),
      req.body.sourcePk ? deserializePk(req.body.sourcePk) : undefined
    );
    log("Withdraw instruction generated");
    res.status(200).send([serializeIxs(ix), serializeSigners(signers)]);
  }
}

export default new MangoController();
