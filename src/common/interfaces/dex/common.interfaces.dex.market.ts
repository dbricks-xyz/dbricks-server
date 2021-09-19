import {PublicKey} from '@solana/web3.js';
import {ixsAndSigners} from "dbricks-lib";

export interface IDEXMarket {
  init: (params: IDEXMarketInitParsed) => Promise<ixsAndSigners[]>
  settle: (params: IDEXMarketSettleParsed) => Promise<ixsAndSigners[]>;
}

export interface IDEXMarketInitParsed {
  baseMintPk: PublicKey,
  quoteMintPk: PublicKey,
  lotSize: number,
  tickSize: number,
  ownerPk: PublicKey,
}

export interface IDEXMarketSettleParsed {
  marketPk: PublicKey,
  ownerPk: PublicKey
}