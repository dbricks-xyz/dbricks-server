import {PublicKey} from '@solana/web3.js';
import {ixsAndSigners} from "dbricks-lib";

export interface ISerumDEXMarket {
  init: (params: ISerumDEXMarketInitParamsParsed) => Promise<ixsAndSigners[]>
  settle: (params: ISerumDEXMarketSettleParamsParsed) => Promise<ixsAndSigners[]>;
}

export interface ISerumDEXMarketInitParamsParsed {
  baseMintPk: PublicKey,
  quoteMintPk: PublicKey,
  lotSize: number,
  tickSize: number,
  ownerPk: PublicKey,
}

export interface ISerumDEXMarketSettleParamsParsed {
  marketPk: PublicKey,
  ownerPk: PublicKey
}