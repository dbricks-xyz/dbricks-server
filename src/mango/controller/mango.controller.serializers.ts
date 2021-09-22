import e from 'express';
import BN from 'bn.js';
import {
  deserializePk,
  IMangoLenderDepositParams,
  IMangoLenderWithdrawParams,
  ISerumDEXMarketSettleParams,
  ISerumDEXOrderCancelParams,
  ISerumDEXOrderPlaceParams
} from 'dbricks-lib';
import {IMangoLenderDepositParamsParsed} from '../interfaces/lender/mango.interfaces.lender.deposit';
import {IMangoLenderWithdrawParamsParsed} from '../interfaces/lender/mango.interfaces.lender.withdraw';
import {ISerumDEXMarketSettleParamsParsed} from "../../serum/interfaces/dex/serum.interfaces.dex.market";
import {
  ISerumDEXOrderCancelParamsParsed,
  ISerumDEXOrderPlaceParamsParsed
} from "../../serum/interfaces/dex/serum.interfaces.dex.order";

export function deserializeDeposit(req: e.Request): IMangoLenderDepositParamsParsed {
  const body: IMangoLenderDepositParams = req.body;
  return {
    mintPk: deserializePk(body.mintPk),
    quantity: parseFloat(body.quantity),
    ownerPk: deserializePk(body.ownerPk),
  };
}

export function deserializeWithdraw(req: e.Request): IMangoLenderWithdrawParamsParsed {
  const body: IMangoLenderWithdrawParams = req.body;
  return {
    mintPk: deserializePk(body.mintPk),
    quantity: parseFloat(body.quantity),
    isBorrow: body.isBorrow,
    ownerPk: deserializePk(body.ownerPk),
  };
}

export function deserializePlace(req: e.Request): ISerumDEXOrderPlaceParamsParsed {
  const body: ISerumDEXOrderPlaceParams = req.body;
  return {
    marketPk: deserializePk(body.marketPk),
    side: body.side,
    price: parseFloat(body.price),
    size: parseFloat(body.size),
    orderType: body.orderType,
    ownerPk: deserializePk(body.ownerPk),
  };
}

export function deserializeCancel(req: e.Request): ISerumDEXOrderCancelParamsParsed {
  const body: ISerumDEXOrderCancelParams = req.body;
  return {
    marketPk: deserializePk(body.marketPk),
    orderId: new BN(body.orderId, 16), // comes as string, hex,
    ownerPk: deserializePk(body.ownerPk),
  };
}

export function deserializeSettle(req: e.Request): ISerumDEXMarketSettleParamsParsed {
  const body: ISerumDEXMarketSettleParams = req.body;
  return {
    marketPk: deserializePk(body.marketPk),
    ownerPk: deserializePk(body.ownerPk),
  };
}
