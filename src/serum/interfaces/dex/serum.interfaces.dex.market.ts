import {PublicKey} from '@solana/web3.js';
import {instructionsAndSigners} from "dbricks-lib";

export interface ISerumDEXMarket {
  init: (params: ISerumDEXMarketInitParamsParsed) => Promise<instructionsAndSigners[]>
  settle: (params: ISerumDEXMarketSettleParamsParsed) => Promise<instructionsAndSigners[]>;
}

export interface ISerumDEXMarketInitParamsParsed {
  baseMintPubkey: PublicKey,
  quoteMintPubkey: PublicKey,
  lotSize: number,
  tickSize: number,
  ownerPubkey: PublicKey,
}

export interface ISerumDEXMarketSettleParamsParsed {
  marketPubkey: PublicKey,
  ownerPubkey: PublicKey
}