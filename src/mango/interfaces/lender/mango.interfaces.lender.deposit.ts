import { PublicKey } from '@solana/web3.js';
import { ixsAndSigners } from 'dbricks-lib';

export interface IMangoLenderDeposit {
  deposit: (params: IMangoLenderDepositParamsParsed) => Promise<ixsAndSigners[]>;
}

export interface IMangoLenderDepositParams {
  mintPk: string,
  quantity: string,
  ownerPk: string,
  mangoAccPk?: string,
}

export interface IMangoLenderDepositParamsParsed {
  mintPk: PublicKey,
  quantity: number,
  ownerPk: PublicKey,
  mangoAccPk?: PublicKey,
}
