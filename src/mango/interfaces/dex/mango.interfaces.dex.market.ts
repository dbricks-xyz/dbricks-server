import { PublicKey } from '@solana/web3.js';
import { ixsAndSigners } from 'dbricks-lib';

export interface IMangoDEXMarket {
  settleSpot: (params: IMangoDEXMarketSettleParamsParsed) => Promise<ixsAndSigners[]>;
  settlePerp: (params: IMangoDEXMarketSettleParamsParsed) => Promise<ixsAndSigners[]>;
}

export interface IMangoDEXMarketSettleParams {
  marketPk: string,
  ownerPk: string,
  mangoAccPk: string,
}

export interface IMangoDEXMarketSettleParamsParsed {
  marketPk: PublicKey,
  ownerPk: PublicKey,
  mangoAccPk: PublicKey,
}
