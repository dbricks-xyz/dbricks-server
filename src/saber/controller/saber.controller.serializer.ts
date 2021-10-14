import e from 'express';
import {
  deserializePubkey,
  ISaberFarmHarvestParams,
  ISaberFarmParams,
  ISaberPoolDepositParams,
  ISaberPoolWithdrawParams,
  ISaberSwapParams,
} from '@dbricks/dbricks-ts';
import {
  ISaberPoolDepositParamsParsed,
  ISaberPoolWithdrawParamsParsed,
  ISaberSwapParamsParsed,
} from '../interfaces/saber.interfaces.pool';
import {
  ISaberFarmHarvestParamsParsed,
  ISaberFarmParamsParsed,
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
  console.log(body);
  return {
    poolMintPubkey: deserializePubkey(body.poolMintPubkey),
    amount: parseFloat(body.amount),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}

export function deserializeFarmWithdraw(request: e.Request): ISaberFarmParamsParsed {
  const body: ISaberFarmParams = request.body;
  return {
    poolMintPubkey: deserializePubkey(body.poolMintPubkey),
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
