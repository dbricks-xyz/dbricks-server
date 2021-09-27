import { PublicKey } from '@solana/web3.js';
import { instructionsAndSigners } from 'dbricks-lib';

export interface IMangoLenderDeposit {
  deposit: (params: IMangoLenderDepositParamsParsed) => Promise<instructionsAndSigners[]>;
}

export interface IMangoLenderDepositParamsParsed {
  mintPubkey: PublicKey,
  quantity: number,
  ownerPubkey: PublicKey,
  mangoAccountNumber: number,
}
