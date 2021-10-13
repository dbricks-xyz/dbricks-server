import {instructionsAndSigners} from '@dbricks/dbricks-ts';
import {
  ISerumDEXOrderCancelParamsParsed,
  ISerumDEXOrderPlaceParamsParsed
} from "../../../serum/interfaces/dex/serum.interfaces.dex.order";

export interface IMangoDEXOrder {
  placeSpot: (params: IMangoDEXOrderPlaceParamsParsed) => Promise<instructionsAndSigners[]>;
  placePerp: (params: IMangoDEXOrderPlaceParamsParsed) => Promise<instructionsAndSigners[]>;
  cancelSpot: (params: IMangoDEXOrderCancelParamsParsed) => Promise<instructionsAndSigners[]>;
  cancelPerp: (params: IMangoDEXOrderCancelParamsParsed) => Promise<instructionsAndSigners[]>;
}

export interface IMangoDEXOrderPlaceParamsParsed extends ISerumDEXOrderPlaceParamsParsed {
  mangoAccountNumber: number,
}

export interface IMangoDEXOrderCancelParamsParsed extends ISerumDEXOrderCancelParamsParsed {
  mangoAccountNumber: number,
}