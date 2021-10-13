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
  ISaberFarmParamsParsed,
  ISaberFarmParams,
  ISaberFarmHarvestParamsParsed,
  ISaberFarmHarvestParams,
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

export function deserializeFarmDeposit(request: e.Request): ISaberFarmParamsParsed {
  const body: ISaberFarmParams = request.body;
  return {
    mintPubkey: deserializePubkey(body.mintPubkey),
    amount: parseFloat(body.amount),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}

export function deserializeFarmWithdraw(request: e.Request): ISaberFarmParamsParsed {
  const body: ISaberFarmParams = request.body;
  return {
    mintPubkey: deserializePubkey(body.mintPubkey),
    amount: parseFloat(body.amount),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}

export function deserializeFarmHarvest(request: e.Request): ISaberFarmHarvestParamsParsed {
  const body: ISaberFarmHarvestParams = request.body;
  return {
    poolMintPubkey: deserializePubkey(body.poolMintPubkey),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}
