import {PublicKey} from '@solana/web3.js';
import {ixsAndSigners} from "dbricks-lib";

export interface ILenderDeposit {
  deposit: (params: ILenderDepositParamsParsed) => Promise<ixsAndSigners[]>;
}

export interface ILenderDepositParamsParsed {
  mintPk: PublicKey,
  quantity: number,
  ownerPk: PublicKey,
  destinationPk?: PublicKey,
}