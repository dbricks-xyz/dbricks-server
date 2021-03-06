import { PublicKey } from '@solana/web3.js';
import { instructionsAndSigners } from '@dbricks/dbricks-ts';

export interface IMangoLenderWithdraw {
  withdraw: (params: IMangoLenderWithdrawParamsParsed) => Promise<instructionsAndSigners[]>;
}

export interface IMangoLenderWithdrawParamsParsed {
  mintPubkey: PublicKey,
  quantity: number,
  isBorrow: boolean,
  ownerPubkey: PublicKey,
  mangoAccountNumber: number,
}
