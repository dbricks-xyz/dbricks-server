import {PublicKey,} from '@solana/web3.js';
import BN from 'bn.js';
import {instructionsAndSigners, orderType, side} from "@dbricks/dbricks-ts";

export interface ISerumDEXOrder {
  place: (params: ISerumDEXOrderPlaceParamsParsed) => Promise<instructionsAndSigners[]>;
  cancel: (params: ISerumDEXOrderCancelParamsParsed) => Promise<instructionsAndSigners[]>
}

export interface ISerumDEXOrderCancelParamsParsed {
  marketPubkey: PublicKey,
  orderId?: BN,
  ownerPubkey: PublicKey,
}

export interface ISerumDEXOrderPlaceParamsParsed {
  marketPubkey: PublicKey,
  side: side,
  price: number,
  size: number,
  orderType: orderType,
  ownerPubkey: PublicKey,
}