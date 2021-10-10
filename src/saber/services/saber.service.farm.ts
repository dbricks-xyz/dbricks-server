import {
  instructionsAndSigners} from '@dbricks/dbricks-ts';
import SaberClient from '../client/saber.client';
import { ISaberFarm, ISaberFarmDepositParamsParsed } from '../interfaces/saber.interfaces.farm';

export default class SaberFarmService extends SaberClient implements ISaberFarm {
  async deposit(params: ISaberFarmDepositParamsParsed): Promise<instructionsAndSigners[]> {
    const farmDepositInstructionsAndSigners = await this.prepareFarmDepositTransaction(params);
    return [farmDepositInstructionsAndSigners];
  }
}
