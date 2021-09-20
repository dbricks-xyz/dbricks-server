import e from 'express';
import BN from 'bn.js';
import { deserializePk } from 'dbricks-lib';
import { IMangoLenderDepositParams, IMangoLenderDepositParamsParsed } from '../interfaces/lender/mango.interfaces.lender.deposit';
import { IMangoLenderWithdrawParams, IMangoLenderWithdrawParamsParsed } from '../interfaces/lender/mango.interfaces.lender.withdraw';
import { IMangoDEXOrderPlaceParamsParsed, IMangoDEXOrderCancelParamsParsed, IMangoDEXOrderPlaceParams, IMangoDEXOrderCancelParams } from '../interfaces/dex/mango.interfaces.dex.order';
import { IMangoDEXMarketSettleParams, IMangoDEXMarketSettleParamsParsed } from '../interfaces/dex/mango.interfaces.dex.market';

export function deserializeDeposit(req: e.Request): IMangoLenderDepositParamsParsed {
  const body: IMangoLenderDepositParams = req.body;
  return {
    mintPk: deserializePk(body.mintPk),
    quantity: parseFloat(body.quantity),
    ownerPk: deserializePk(body.ownerPk),
    mangoAccPk: body.mangoAccPk ? deserializePk(body.mangoAccPk) : undefined,
  };
}

export function deserializeWithdraw(req: e.Request): IMangoLenderWithdrawParamsParsed {
  const body: IMangoLenderWithdrawParams = req.body;
  return {
    mintPk: deserializePk(body.mintPk),
    quantity: parseFloat(body.quantity),
    isBorrow: body.isBorrow,
    ownerPk: deserializePk(body.ownerPk),
    mangoAccPk: deserializePk(body.mangoAccPk),
  };
}

export function deserializePlace(req: e.Request): IMangoDEXOrderPlaceParamsParsed {
  const body: IMangoDEXOrderPlaceParams = req.body;
  return {
    marketPk: deserializePk(body.marketPk),
    side: body.side,
    price: parseFloat(body.price),
    size: parseFloat(body.size),
    orderType: body.orderType,
    ownerPk: deserializePk(body.ownerPk),
    mangoAccPk: deserializePk(body.mangoAccPk),
  };
}

export function deserializeCancel(req: e.Request): IMangoDEXOrderCancelParamsParsed {
  const body: IMangoDEXOrderCancelParams = req.body;
  return {
    marketPk: deserializePk(body.marketPk),
    orderId: new BN(body.orderId, 16), // comes as string, hex,
    ownerPk: deserializePk(body.ownerPk),
    mangoAccPk: deserializePk(body.mangoAccPk),
  };
}

export function deserializeSettle(req: e.Request): IMangoDEXMarketSettleParamsParsed {
  const body: IMangoDEXMarketSettleParams = req.body;
  return {
    marketPk: deserializePk(body.marketPk),
    ownerPk: deserializePk(body.ownerPk),
    mangoAccPk: deserializePk(body.mangoAccPk),
  };
}
