import SolendClient from "../client/solend.client";
import {
  ISolendLenderDeposit,
  ISolendLenderDepositParamsParsed
} from "../interfaces/lender/solend.interfaces.lender.deposit";
import {instructionsAndSigners} from "@dbricks/dbricks-ts";

export default class SolendDepositService extends SolendClient implements ISolendLenderDeposit {
  async deposit(params: ISolendLenderDepositParamsParsed): Promise<instructionsAndSigners[]> {
    const transaction = await this.prepareDepositTransaction(
      params.mintPubkey,
      params.quantity,
      params.ownerPubkey,
    );
    return [transaction]
  }
}