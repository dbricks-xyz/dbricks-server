import {ixsAndSigners} from 'dbricks-lib';
import {
  ISerumDEXOrderCancelParamsParsed,
  ISerumDEXOrderPlaceParamsParsed
} from "../../../serum/interfaces/dex/serum.interfaces.dex.order";

export interface IMangoDEXOrder {
  placeSpot: (params: ISerumDEXOrderPlaceParamsParsed) => Promise<ixsAndSigners[]>;
  placePerp: (params: ISerumDEXOrderPlaceParamsParsed) => Promise<ixsAndSigners[]>;
  cancelSpot: (params: ISerumDEXOrderCancelParamsParsed) => Promise<ixsAndSigners[]>;
  cancelPerp: (params: ISerumDEXOrderCancelParamsParsed) => Promise<ixsAndSigners[]>;
}
