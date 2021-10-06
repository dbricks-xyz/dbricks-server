import {instructionsAndSigners} from "@dbricks/dbricks-ts";
import {PublicKey} from "@solana/web3.js";

export interface ISolendLenderBorrow {
  borrow: (params: ISolendLenderBorrowParamsParsed) => Promise<instructionsAndSigners[]>;
}

export interface ISolendLenderBorrowParamsParsed {
  mintPubkey: PublicKey,
  quantity: bigint,
  ownerPubkey: PublicKey,
}
