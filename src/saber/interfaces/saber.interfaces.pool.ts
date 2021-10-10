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
  payingMintPubkey: PublicKey, // TODO: better name?
  swapAmount: number,
  ownerPubkey: PublicKey,
}

// TODO: move to the SDK or wherever?
export interface ISaberPoolDepositParams {
  swapPubkey: string,
  tokenAmountA: string,
  tokenAmountB: string,
  ownerPubkey: string,
}

export interface ISaberPoolWithdrawParams {
  swapPubkey: string,
  poolTokenAmount: string,
  withdrawMintPubkey: string,
  ownerPubkey: string,
}

export interface ISaberSwapParams {
  swapPubkey: string,
  payingMintPubkey: string, // TODO: better name?
  swapAmount: string,
  ownerPubkey: string,
}
