import e from "express";
import {ISolendLenderDepositParamsParsed} from "../interfaces/lender/solend.interfaces.lender.deposit";
import {
  deserializePubkey,
  ISolendLenderDepositParams,
  ISolendLenderWithdrawParams
} from "@dbricks/dbricks-ts";
import {ISolendLenderWithdrawParamsParsed} from "../interfaces/lender/solend.interfaces.lender.withdraw";

export function deserializeDeposit(request: e.Request): ISolendLenderDepositParamsParsed {
  const body: ISolendLenderDepositParams = request.body;
  return {
    mintPubkey: deserializePubkey(body.mintPubkey),
    quantity: parseFloat(body.quantity),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}

export function deserializeWithdraw(request: e.Request): ISolendLenderWithdrawParamsParsed {
  const body: ISolendLenderWithdrawParams = request.body;
  return {
    mintPubkey: deserializePubkey(body.mintPubkey),
    quantity: parseFloat(body.quantity),
    isBorrow: body.isBorrow,
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}