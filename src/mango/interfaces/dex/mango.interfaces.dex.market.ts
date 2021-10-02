import {instructionsAndSigners} from '@dbricks/dbricks-ts';
import {ISerumDEXMarketSettleParamsParsed} from "../../../serum/interfaces/dex/serum.interfaces.dex.market";

export interface IMangoDEXMarket {
  settleSpot: (params: IMangoDEXMarketSettleParamsParsed) => Promise<instructionsAndSigners[]>;
  settlePerp: (params: IMangoDEXMarketSettleParamsParsed) => Promise<instructionsAndSigners[]>;
}

export interface IMangoDEXMarketSettleParamsParsed extends ISerumDEXMarketSettleParamsParsed {
  mangoAccountNumber: number,
}