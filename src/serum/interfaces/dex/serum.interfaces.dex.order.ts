import {PublicKey,} from '@solana/web3.js';
import BN from 'bn.js';
import {ixsAndSigners, orderType, side} from "dbricks-lib";

export interface ISerumDEXOrder {
  place: (params: ISerumDEXOrderPlaceParamsParsed) => Promise<ixsAndSigners[]>;
  cancel: (params: ISerumDEXOrderCancelParamsParsed) => Promise<ixsAndSigners[]>
}

export interface ISerumDEXOrderCancelParamsParsed {
  marketPk: PublicKey,
  orderId?: BN,
  ownerPk: PublicKey,
}

export interface ISerumDEXOrderPlaceParamsParsed {
  marketPk: PublicKey,
  side: side,
  price: number,
  size: number,
  orderType: orderType,
  ownerPk: PublicKey,
}