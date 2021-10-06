import {instructionsAndSigners} from "@dbricks/dbricks-ts";
import {PublicKey} from "@solana/web3.js";

export interface ISolendLenderWithdraw {
  withdraw: (params: ISolendLenderWithdrawParamsParsed) => Promise<instructionsAndSigners[]>;
}

export interface ISolendLenderWithdrawParamsParsed {
  mintPubkey: PublicKey,
  quantity: bigint,
  ownerPubkey: PublicKey,
}
