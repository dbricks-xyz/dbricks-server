import { PublicKey } from '@solana/web3.js';
import { ixsAndSigners } from 'dbricks-lib';

export interface IMangoLenderDeposit {
  deposit: (params: IMangoLenderDepositParamsParsed) => Promise<ixsAndSigners[]>;
}

export interface IMangoLenderDepositParamsParsed {
  mintPk: PublicKey,
  quantity: number,
  ownerPk: PublicKey,
}
