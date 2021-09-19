import e from "express";
import {
  deserializePk,
  IDEXMarketInitParams,
  IDEXMarketSettleParams,
  IDEXOrderCancelParams,
  IDEXOrderPlaceParams
} from "dbricks-lib";
import BN from "bn.js";
import {
  IDEXOrderCancelParamsParsed,
  IDEXOrderPlaceParamsParsed
} from "../../common/interfaces/dex/common.interfaces.dex.order";
import {
  IDEXMarketInitParamsParsed,
  IDEXMarketSettleParamsParsed
} from "../../common/interfaces/dex/common.interfaces.dex.market";

export function deserializeCancelOrder(req: e.Request): IDEXOrderCancelParamsParsed {
  const body: IDEXOrderCancelParams = req.body;
  return {
    marketPk: deserializePk(body.marketPk),
    orderId: body.orderId ? new BN(body.orderId, 16) : undefined, //comes as string, hex
    ownerPk: deserializePk(body.ownerPk),
  }
}

export function deserializePlaceOrder(req: e.Request): IDEXOrderPlaceParamsParsed {
  const body: IDEXOrderPlaceParams = req.body;
  return {
    marketPk: deserializePk(body.marketPk),
    side: body.side,
    //serum's sdk takes these as numbers, so no point converting to BN
    price: parseFloat(body.price), //comes as string
    size: parseFloat(body.size), //comes as string
    orderType: body.orderType,
    ownerPk: deserializePk(body.ownerPk),
  }
}

export function deserializeInitMarket(req: e.Request): IDEXMarketInitParamsParsed {
  const body: IDEXMarketInitParams = req.body;
  return {
    baseMintPk: deserializePk(body.baseMintPk),
    quoteMintPk: deserializePk(body.quoteMintPk),
    //converted to BN in calcBaseAndQuoteLotSizes()
    lotSize: parseFloat(body.lotSize), //comes as string
    tickSize: parseFloat(body.tickSize), //comes as string
    ownerPk: deserializePk(body.ownerPk),
  }
}

export function deserializeSettleMarket(req: e.Request): IDEXMarketSettleParamsParsed {
  const body: IDEXMarketSettleParams = req.body;
  return {
    marketPk: deserializePk(body.marketPk),
    ownerPk: deserializePk(body.ownerPk),
  }
}