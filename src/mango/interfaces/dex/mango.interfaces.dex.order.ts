import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { ixsAndSigners, orderType, side } from 'dbricks-lib';

export interface IMangoDEXOrder {
  placeSpot: (params: IMangoDEXOrderPlaceParamsParsed) => Promise<ixsAndSigners[]>;
  placePerp: (params: IMangoDEXOrderPlaceParamsParsed) => Promise<ixsAndSigners[]>;
  cancelSpot: (params: IMangoDEXOrderCancelParamsParsed) => Promise<ixsAndSigners[]>;
  cancelPerp: (params: IMangoDEXOrderCancelParamsParsed) => Promise<ixsAndSigners[]>;
}

export interface IMangoDEXOrderCancelParams {
  marketPk: string,
  orderId: string,
  ownerPk: string,
  mangoAccPk: string,
}

export interface IMangoDEXOrderCancelParamsParsed {
  marketPk: PublicKey,
  orderId: BN,
  ownerPk: PublicKey,
  mangoAccPk: PublicKey,
}

export interface IMangoDEXOrderPlaceParams {
  marketPk: string,
  side: side,
  price: string,
  size: string,
  orderType: orderType,
  ownerPk: string,
  mangoAccPk: string,
}

export interface IMangoDEXOrderPlaceParamsParsed {
  marketPk: PublicKey,
  side: side,
  price: number,
  size: number,
  orderType: orderType,
  ownerPk: PublicKey,
  mangoAccPk: PublicKey,
}
