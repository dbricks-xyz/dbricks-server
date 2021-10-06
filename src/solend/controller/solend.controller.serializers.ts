import e from "express";
import {ISolendLenderDepositParamsParsed} from "../interfaces/lender/solend.interfaces.lender.deposit";
import {
  deserializePubkey,
  ISolendLenderDepositParams,
  ISolendLenderWithdrawParams
} from "@dbricks/dbricks-ts";
import {ISolendLenderWithdrawParamsParsed} from "../interfaces/lender/solend.interfaces.lender.withdraw";
import fs from "fs";
import {PublicKey} from "@solana/web3.js";
import {findSolendReserveInfoByMint} from "../client/solend.client";

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

function deserializeSolendAmount(amount: string, mint: string, ): bigint {
  const mintPubkey = new PublicKey(mint);
  const foundReserve = findSolendReserveInfoByMint(mintPubkey);
  return BigInt(parseFloat(amount) * 10**foundReserve.decimals);
}