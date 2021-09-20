import { PublicKey } from '@solana/web3.js';
import { ixsAndSigners } from 'dbricks-lib';

export interface IMangoLenderWithdraw {
  withdraw: (params: IMangoLenderWithdrawParamsParsed) => Promise<ixsAndSigners[]>;
}

export interface IMangoLenderWithdrawParamsParsed {
  mintPk: PublicKey,
  quantity: number,
  isBorrow: boolean,
  ownerPk: PublicKey,
  mangoAccPk: PublicKey,
}
