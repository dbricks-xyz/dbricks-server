import {PublicKey} from '@solana/web3.js';
import {instructionsAndSigners} from '@dbricks/dbricks-ts';

export interface ISaberPool {
  deposit: (params: ISaberPoolDepositParamsParsed) => Promise<instructionsAndSigners[]>
  withdraw: (params: ISaberPoolWithdrawParamsParsed) => Promise<instructionsAndSigners[]>;
  swap: (params: ISaberSwapParamsParsed) => Promise<instructionsAndSigners[]>;
}

export interface ISaberPoolDepositParamsParsed {
  swapPubkey: PublicKey,
  tokenAmountA: number,
  tokenAmountB: number,
  ownerPubkey: PublicKey,
}

export interface ISaberPoolWithdrawParamsParsed {
  swapPubkey: PublicKey,
  poolTokenAmount: number,
  withdrawMintPubkey: PublicKey,
  ownerPubkey: PublicKey,
}

export interface ISaberSwapParamsParsed {
  swapPubkey: PublicKey,
  payingMintPubkey: PublicKey,
  swapAmount: number,
  ownerPubkey: PublicKey,
}
