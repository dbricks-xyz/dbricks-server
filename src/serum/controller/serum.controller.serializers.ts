import e from "express";
import {
  deserializePubkey,
  ISerumDEXMarketInitParams,
  ISerumDEXMarketSettleParams,
  ISerumDEXOrderCancelParams,
  ISerumDEXOrderPlaceParams
} from "dbricks-lib";
import BN from "bn.js";
import {
  ISerumDEXOrderCancelParamsParsed,
  ISerumDEXOrderPlaceParamsParsed
} from "../interfaces/dex/serum.interfaces.dex.order";
import {
  ISerumDEXMarketInitParamsParsed,
  ISerumDEXMarketSettleParamsParsed
} from "../interfaces/dex/serum.interfaces.dex.market";

export function deserializeCancelOrder(req: e.Request): ISerumDEXOrderCancelParamsParsed {
  const body: ISerumDEXOrderCancelParams = req.body;
  return {
    marketPubkey: deserializePubkey(body.marketPubkey),
    orderId: body.orderId ? new BN(body.orderId, 16) : undefined, //comes as string, hex
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  }
}

export function deserializePlaceOrder(req: e.Request): ISerumDEXOrderPlaceParamsParsed {
  const body: ISerumDEXOrderPlaceParams = req.body;
  return {
    marketPubkey: deserializePubkey(body.marketPubkey),
    side: body.side,
    //serum's sdk takes these as numbers, so no point converting to BN
    price: parseFloat(body.price), //comes as string
    size: parseFloat(body.size), //comes as string
    orderType: body.orderType,
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  }
}

export function deserializeInitMarket(req: e.Request): ISerumDEXMarketInitParamsParsed {
  const body: ISerumDEXMarketInitParams = req.body;
  return {
    baseMintPubkey: deserializePubkey(body.baseMintPubkey),
    quoteMintPubkey: deserializePubkey(body.quoteMintPubkey),
    //converted to BN in calcBaseAndQuoteLotSizes()
    lotSize: parseFloat(body.lotSize), //comes as string
    tickSize: parseFloat(body.tickSize), //comes as string
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  }
}

export function deserializeSettleMarket(req: e.Request): ISerumDEXMarketSettleParamsParsed {
  const body: ISerumDEXMarketSettleParams = req.body;
  return {
    marketPubkey: deserializePubkey(body.marketPubkey),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  }
}