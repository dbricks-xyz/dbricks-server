import SolendClient from "../client/solend.client";
import {
  ISolendLenderRepay,
  ISolendLenderRepayParamsParsed
} from "../interfaces/lender/solend.interfaces.lender.repay";
import {instructionsAndSigners} from "@dbricks/dbricks-ts";
import {splitInstructionsAndSigners} from "../../common/util/common.util";

export default class SolendRepayService extends SolendClient implements ISolendLenderRepay {
  async repay(params: ISolendLenderRepayParamsParsed): Promise<instructionsAndSigners[]> {
    const [tokenInstructionsAndSigners, solendInstructionsAndSigners] = await this.prepareRepayTransaction(
      params.mintPubkey,
      params.quantity,
      params.ownerPubkey,
    );
    // solend ixs might be too long, due to all the refreshes, need to split
    // todo in practice if the split needs to happen it's going to be very hard (impossible?) to get the txs through
    //  that's because both need to get in within the same slot (400ms)
    const solendSplitInstructions = await splitInstructionsAndSigners(solendInstructionsAndSigners);
    return [tokenInstructionsAndSigners, ...solendSplitInstructions]
  }
}