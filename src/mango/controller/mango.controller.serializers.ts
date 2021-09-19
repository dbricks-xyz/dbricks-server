import {ILenderDepositParamsParsed} from "../../common/interfaces/lender/common.interfaces.lender.deposit";
import e from 'express';
import {deserializePk, ILenderDepositParams, ILenderWithdrawParams} from "dbricks-lib";
import {ILenderWithdrawParamsParsed} from "../../common/interfaces/lender/common.interfaces.lender.withdraw";

export function deserializeDeposit(req: e.Request): ILenderDepositParamsParsed {
  const body: ILenderDepositParams = req.body;
  return {
      mintPk: deserializePk(body.mintPk),
      quantity: parseFloat(body.quantity), //todo might need a different deserializer
      ownerPk: deserializePk(body.ownerPk),
      destinationPk: body.destinationPk ? deserializePk(body.destinationPk): undefined
  }
}

export function deserializeWithdraw(req: e.Request): ILenderWithdrawParamsParsed {
  const body: ILenderWithdrawParams = req.body;
  return {
      mintPk: deserializePk(body.mintPk),
      quantity: parseFloat(body.quantity), //todo might need a different deserializer
      isBorrow: body.isBorrow,
      ownerPk: deserializePk(body.ownerPk),
      sourcePk: body.sourcePk ? deserializePk(body.sourcePk): undefined
  }
}

