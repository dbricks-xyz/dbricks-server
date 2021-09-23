import {ixsAndSigners} from 'dbricks-lib';
import {ISerumDEXMarketSettleParamsParsed} from "../../../serum/interfaces/dex/serum.interfaces.dex.market";

export interface IMangoDEXMarket {
  settleSpot: (params: IMangoDEXMarketSettleParamsParsed) => Promise<ixsAndSigners[]>;
  settlePerp: (params: IMangoDEXMarketSettleParamsParsed) => Promise<ixsAndSigners[]>;
}

export interface IMangoDEXMarketSettleParamsParsed extends ISerumDEXMarketSettleParamsParsed {
  mangoAccNr: number,
}