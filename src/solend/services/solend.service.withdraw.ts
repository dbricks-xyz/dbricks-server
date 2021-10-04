import SolendClient from "../client/solend.client";
import {
  ISolendLenderWithdraw,
  ISolendLenderWithdrawParamsParsed
} from "../interfaces/lender/solend.interfaces.lender.withdraw";
import {instructionsAndSigners} from "@dbricks/dbricks-ts";

export default class SolendWithdrawService extends SolendClient implements ISolendLenderWithdraw {
  async withdraw(params: ISolendLenderWithdrawParamsParsed): Promise<instructionsAndSigners[]> {
    await this.prepareWithdrawTransaction();
    return []
  }
}