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
    isBorrow: body.isBorrow,
    ownerPubkey: deserializePubkey(body.ownerPubkey),
  };
}

function deserializeSolendAmount(amount: string, mint: string, ): bigint {
  const mintPubkey = new PublicKey(mint);
  const reserves = JSON.parse(fs.readFileSync(`${__dirname}/../data/solendReservesMainnet.json`, 'utf8'));
  const foundReserveRaw = reserves[mintPubkey.toBase58()];
  return BigInt(parseFloat(amount) * 10**foundReserveRaw.decimals);
}