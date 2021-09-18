import e from "express";
import {
  deserializePk,
  IDEXMarketInit,
  IDEXMarketSettle,
  IDEXOrderCancel,
  IDEXOrderPlace
} from "dbricks-lib";
import BN from "bn.js";
import {
  IDEXOrderCancelParsed,
  IDEXOrderPlaceParsed
} from "../../common/interfaces/dex/common.interfaces.dex.order";
import {
  IDEXMarketInitParsed,
  IDEXMarketSettleParsed
} from "../../common/interfaces/dex/common.interfaces.dex.market";

export function deserializeCancelOrder(req: e.Request): IDEXOrderCancelParsed {
  const body: IDEXOrderCancel = req.body;
  return {
    marketPk: deserializePk(body.marketPk),
    orderId: new BN(body.orderId, 16), //comes as string, hex
    ownerPk: deserializePk(body.ownerPk),
  }
}

export function deserializePlaceOrder(req: e.Request): IDEXOrderPlaceParsed {
  const body: IDEXOrderPlace = req.body;
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

export function deserializeInitMarket(req: e.Request): IDEXMarketInitParsed {
  const body: IDEXMarketInit = req.body;
  return {
    baseMintPk: deserializePk(body.baseMintPk),
    quoteMintPk: deserializePk(body.quoteMintPk),
    //converted to BN in calcBaseAndQuoteLotSizes()
    lotSize: parseFloat(body.lotSize), //comes as string
    tickSize: parseFloat(body.tickSize), //comes as string
    ownerPk: deserializePk(body.ownerPk),
  }
}

export function deserializeSettleMarket(req: e.Request): IDEXMarketSettleParsed {
  const body: IDEXMarketSettle = req.body;
  return {
    marketPk: deserializePk(body.marketPk),
    ownerPk: deserializePk(body.ownerPk),
  }
}