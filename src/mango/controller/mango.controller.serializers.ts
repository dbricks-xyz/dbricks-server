import e from 'express';
import BN from 'bn.js';
import {
  deserializePubkey, IMangoDEXMarketSettleParams,
  IMangoDEXOrderCancelParams,
  IMangoDEXOrderPlaceParams,
  IMangoLenderDepositParams, IMangoLenderWithdrawParams
} from '@dbricks/dbricks-ts';
import { IMangoLenderDepositParamsParsed } from '../interfaces/lender/mango.interfaces.lender.deposit';
import { IMangoLenderWithdrawParamsParsed } from '../interfaces/lender/mango.interfaces.lender.withdraw';
import { IMangoDEXOrderPlaceParamsParsed, IMangoDEXOrderCancelParamsParsed } from '../interfaces/dex/mango.interfaces.dex.order';
import { IMangoDEXMarketSettleParamsParsed } from '../interfaces/dex/mango.interfaces.dex.market';

export function deserializeDeposit(request: e.Request): IMangoLenderDepositParamsParsed {
  const body: IMangoLenderDepositParams = request.body;
  return {
    mintPubkey: deserializePubkey(body.mintPubkey),
    quantity: parseFloat(body.quantity),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
    mangoAccountNumber: body.mangoAccountNumber ? parseFloat(body.mangoAccountNumber) : 0,
  };
}

export function deserializeWithdraw(request: e.Request): IMangoLenderWithdrawParamsParsed {
  const body: IMangoLenderWithdrawParams = request.body;
  return {
    mintPubkey: deserializePubkey(body.mintPubkey),
    quantity: parseFloat(body.quantity),
    isBorrow: body.isBorrow,
    ownerPubkey: deserializePubkey(body.ownerPubkey),
    mangoAccountNumber: body.mangoAccountNumber ? parseFloat(body.mangoAccountNumber) : 0,
  };
}

export function deserializePlace(request: e.Request): IMangoDEXOrderPlaceParamsParsed {
  const body: IMangoDEXOrderPlaceParams = request.body;
  return {
    marketPubkey: deserializePubkey(body.marketPubkey),
    side: body.side,
    price: parseFloat(body.price),
    size: parseFloat(body.size),
    orderType: body.orderType,
    ownerPubkey: deserializePubkey(body.ownerPubkey),
    mangoAccountNumber: body.mangoAccountNumber ? parseFloat(body.mangoAccountNumber) : 0,
  };
}

export function deserializeCancel(request: e.Request): IMangoDEXOrderCancelParamsParsed {
  const body: IMangoDEXOrderCancelParams = request.body;
  return {
    marketPubkey: deserializePubkey(body.marketPubkey),
    orderId: new BN(body.orderId, 16), // comes as string, hex,
    ownerPubkey: deserializePubkey(body.ownerPubkey),
    mangoAccountNumber: body.mangoAccountNumber ? parseFloat(body.mangoAccountNumber) : 0,
  };
}

export function deserializeSettle(request: e.Request): IMangoDEXMarketSettleParamsParsed {
  const body: IMangoDEXMarketSettleParams = request.body;
  return {
    marketPubkey: deserializePubkey(body.marketPubkey),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
    mangoAccountNumber: body.mangoAccountNumber ? parseFloat(body.mangoAccountNumber) : 0,
  };
}
