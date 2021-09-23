import {ixsAndSigners} from 'dbricks-lib';
import {
  ISerumDEXOrderCancelParamsParsed,
  ISerumDEXOrderPlaceParamsParsed
} from "../../../serum/interfaces/dex/serum.interfaces.dex.order";

export interface IMangoDEXOrder {
  placeSpot: (params: IMangoDEXOrderPlaceParamsParsed) => Promise<ixsAndSigners[]>;
  placePerp: (params: IMangoDEXOrderPlaceParamsParsed) => Promise<ixsAndSigners[]>;
  cancelSpot: (params: IMangoDEXOrderCancelParamsParsed) => Promise<ixsAndSigners[]>;
  cancelPerp: (params: IMangoDEXOrderCancelParamsParsed) => Promise<ixsAndSigners[]>;
}

export interface IMangoDEXOrderPlaceParamsParsed extends ISerumDEXOrderPlaceParamsParsed {
  mangoAccNr: number,
}

export interface IMangoDEXOrderCancelParamsParsed extends ISerumDEXOrderCancelParamsParsed {
  mangoAccNr: number,
}