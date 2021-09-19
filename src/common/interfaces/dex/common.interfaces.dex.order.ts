import {PublicKey,} from '@solana/web3.js';
import BN from 'bn.js';
import {ixsAndSigners, orderType, side} from "dbricks-lib";

export interface IDEXOrder {
  place: (params: IDEXOrderPlaceParamsParsed) => Promise<ixsAndSigners[]>;
  cancel: (params: IDEXOrderCancelParamsParsed) => Promise<ixsAndSigners[]>
}

export interface IDEXOrderCancelParamsParsed {
  marketPk: PublicKey,
  orderId?: BN,
  ownerPk: PublicKey,
}

export interface IDEXOrderPlaceParamsParsed {
  marketPk: PublicKey,
  side: side,
  price: number,
  size: number,
  orderType: orderType,
  ownerPk: PublicKey,
}