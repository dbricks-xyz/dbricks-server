import {ixsAndSigners} from 'dbricks-lib';
import {ISerumDEXMarketSettleParamsParsed} from "../../../serum/interfaces/dex/serum.interfaces.dex.market";

export interface IMangoDEXMarket {
  settleSpot: (params: ISerumDEXMarketSettleParamsParsed) => Promise<ixsAndSigners[]>;
  settlePerp: (params: ISerumDEXMarketSettleParamsParsed) => Promise<ixsAndSigners[]>;
}
