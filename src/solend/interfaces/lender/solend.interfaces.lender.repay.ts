import {instructionsAndSigners} from "@dbricks/dbricks-ts";
import {PublicKey} from "@solana/web3.js";

export interface ISolendLenderRepay {
  repay: (params: ISolendLenderRepayParamsParsed) => Promise<instructionsAndSigners[]>;
}

export interface ISolendLenderRepayParamsParsed {
  mintPubkey: PublicKey,
  quantity: bigint,
  ownerPubkey: PublicKey,
}
