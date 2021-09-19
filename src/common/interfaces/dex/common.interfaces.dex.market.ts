import {PublicKey} from '@solana/web3.js';
import {ixsAndSigners} from "dbricks-lib";

export interface IDEXMarket {
  init: (params: IDEXMarketInitParamsParsed) => Promise<ixsAndSigners[]>
  settle: (params: IDEXMarketSettleParamsParsed) => Promise<ixsAndSigners[]>;
}

export interface IDEXMarketInitParamsParsed {
  baseMintPk: PublicKey,
  quoteMintPk: PublicKey,
  lotSize: number,
  tickSize: number,
  ownerPk: PublicKey,
}

export interface IDEXMarketSettleParamsParsed {
  marketPk: PublicKey,
  ownerPk: PublicKey
}