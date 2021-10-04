import debug from "debug";
import e from "express";
import {
  deserializeDeposit,
  deserializeWithdraw
} from "./solend.controller.serializers";
import SolendDepositService from "../services/solend.service.deposit";
import {serializeInstructionsAndSigners} from "@dbricks/dbricks-ts";
import SolendWithdrawService from "../services/solend.service.withdraw";

const log: debug.IDebugger = debug('app:solend-controller');

class SolendController {
    async deposit(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeDeposit(request);
    const solendDepositService = new SolendDepositService();
    Promise.resolve(solendDepositService.deposit(params))
      .then((instructionsAndSigners) => {
        log('Deposit instruction generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async withdraw(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeWithdraw(request);
    const solendWithdrawService = new SolendWithdrawService();
    Promise.resolve(solendWithdrawService.withdraw(params))
      .then((instructionsAndSigners) => {
        log('Withdraw instruction generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }
}

export default new SolendController();