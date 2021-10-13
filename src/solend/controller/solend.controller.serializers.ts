import e from "express";
import {ISolendLenderDepositParamsParsed} from "../interfaces/lender/solend.interfaces.lender.deposit";
import {
  deserializePubkey,
  ISolendLenderDepositParams,
  ISolendLenderWithdrawParams
} from "@dbricks/dbricks-ts";
import {ISolendLenderWithdrawParamsParsed} from "../interfaces/lender/solend.interfaces.lender.withdraw";
import {PublicKey} from "@solana/web3.js";
import {findSolendReserveInfoByMint} from "../client/solend.client";
import {ISolendLenderRepayParams} from "@dbricks/dbricks-ts/dist/src/solend/interfaces/lender/solend.interfaces.repay";
import {ISolendLenderBorrowParams} from "@dbricks/dbricks-ts/dist/src/solend/interfaces/lender/solend.interfaces.borrow";
import {ISolendLenderBorrowParamsParsed} from "../interfaces/lender/solend.interfaces.lender.borrow";
import {ISolendLenderRepayParamsParsed} from "../interfaces/lender/solend.interfaces.lender.repay";

export function deserializeDeposit(request: e.Request): ISolendLenderDepositParamsParsed {
  const body: ISolendLenderDepositParams = request.body;
  return {
    mintPubkey: deserializePubkey(body.mintPubkey),
    quantity: deserializeSolendAmount(body.quantity, body.mintPubkey),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}

export function deserializeWithdraw(request: e.Request): ISolendLenderWithdrawParamsParsed {
  const body: ISolendLenderWithdrawParams = request.body;
  return {
    mintPubkey: deserializePubkey(body.mintPubkey),
    quantity: deserializeSolendAmount(body.quantity, body.mintPubkey),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}

export function deserializeBorrow(request: e.Request): ISolendLenderBorrowParamsParsed {
  const body: ISolendLenderBorrowParams = request.body;
  return {
    mintPubkey: deserializePubkey(body.mintPubkey),
    quantity: deserializeSolendAmount(body.quantity, body.mintPubkey),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}

export function deserializeRepay(request: e.Request): ISolendLenderRepayParamsParsed {
  const body: ISolendLenderRepayParams = request.body;
  return {
    mintPubkey: deserializePubkey(body.mintPubkey),
    quantity: deserializeSolendAmount(body.quantity, body.mintPubkey),
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}

function deserializeSolendAmount(amount: string, mint: string, ): bigint {
  const mintPubkey = new PublicKey(mint);
  const foundReserve = findSolendReserveInfoByMint(mintPubkey);
  return BigInt(parseFloat(amount) * 10**foundReserve.decimals);
}