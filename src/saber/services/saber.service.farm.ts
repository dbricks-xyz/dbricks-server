import {
  instructionsAndSigners} from '@dbricks/dbricks-ts';
import SaberClient from '../client/saber.client';
import { ISaberFarm, ISaberFarmHarvestParamsParsed, ISaberFarmParamsParsed } from '../interfaces/saber.interfaces.farm';

export default class SaberFarmService extends SaberClient implements ISaberFarm {
  async deposit(params: ISaberFarmParamsParsed): Promise<instructionsAndSigners[]> {
    const farmDepositInstructionsAndSigners = await
    this.prepareFarmDepositOrWithdrawTransaction(params, 'deposit');
    return [farmDepositInstructionsAndSigners];
  }

  async withdraw(params: ISaberFarmParamsParsed): Promise<instructionsAndSigners[]> {
    const farmWithdrawInstructionsAndSigners = await
    this.prepareFarmDepositOrWithdrawTransaction(params, 'withdraw');
    return [farmWithdrawInstructionsAndSigners];
  }

  async harvest(params: ISaberFarmHarvestParamsParsed): Promise<instructionsAndSigners[]> {
    const farmHarvestInstructionsAndSigners = await
    this.prepareFarmHarvestTransaction(params);
    return [farmHarvestInstructionsAndSigners];
  }
}
