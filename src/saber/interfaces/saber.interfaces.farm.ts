import {PublicKey} from '@solana/web3.js';
import {instructionsAndSigners} from '@dbricks/dbricks-ts';

export interface ISaberFarm {
  deposit: (params: ISaberFarmParamsParsed) => Promise<instructionsAndSigners[]>
  withdraw: (params: ISaberFarmParamsParsed) => Promise<instructionsAndSigners[]>;
  harvest: (params: ISaberFarmHarvestParamsParsed) => Promise<instructionsAndSigners[]>;
}

export interface ISaberFarmParamsParsed {
  poolMintPubkey: PublicKey,
  amount: number,
  ownerPubkey: PublicKey,
}

export interface ISaberFarmHarvestParamsParsed {
  poolMintPubkey: PublicKey,
  ownerPubkey: PublicKey,
}
