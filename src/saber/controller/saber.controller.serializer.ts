import e from 'express';
import {
  deserializePubkey,
} from '@dbricks/dbricks-ts';
import {
    ISaberPoolDepositParamsParsed,
    ISaberPoolDepositParams,
    ISaberPoolWithdrawParamsParsed,
    ISaberPoolWithdrawParams,
    ISaberSwapParams,
    ISaberSwapParamsParsed,
} from '../interfaces/saber.interfaces.pool';
import {
  ISaberFarmDepositParamsParsed,
  ISaberFarmDepositParams,
} from '../interfaces/saber.interfaces.farm';

export function deserializePoolDeposit(request: e.Request): ISaberPoolDepositParamsParsed {
  const body: ISaberPoolDepositParams = request.body;
  return {
    swapPubkey: deserializePubkey(body.swapPubkey),
    tokenAmountA: parseFloat(body.tokenAmountA),
    tokenAmountB: parseFloat(body.tokenAmountB),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}

export function deserializePoolWithdraw(request: e.Request): ISaberPoolWithdrawParamsParsed {
  const body: ISaberPoolWithdrawParams = request.body;
  return {
    swapPubkey: deserializePubkey(body.swapPubkey),
    withdrawMintPubkey: deserializePubkey(body.withdrawMintPubkey),
    poolTokenAmount: parseFloat(body.poolTokenAmount),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}

export function deserializeSwap(request: e.Request): ISaberSwapParamsParsed {
  const body: ISaberSwapParams = request.body;
  return {
    swapPubkey: deserializePubkey(body.swapPubkey),
    payingMintPubkey: deserializePubkey(body.payingMintPubkey),
    swapAmount: parseFloat(body.swapAmount),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}

export function deserializeFarmDeposit(request: e.Request): ISaberFarmDepositParamsParsed {
  const body: ISaberFarmDepositParams = request.body;
  return {
    mintPubkey: deserializePubkey(body.mintPubkey),
    depositAmount: parseFloat(body.depositAmount),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}
