import {instructionsAndSigners} from "@dbricks/dbricks-ts";
import {PublicKey} from "@solana/web3.js";

export interface ISolendLenderDeposit {
  deposit: (params: ISolendLenderDepositParamsParsed) => Promise<instructionsAndSigners[]>;
}

export interface ISolendLenderDepositParamsParsed {
  mintPubkey: PublicKey,
  quantity: bigint,
  ownerPubkey: PublicKey,
}
