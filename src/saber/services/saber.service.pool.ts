import {
  instructionsAndSigners} from '@dbricks/dbricks-ts';
import SaberClient from '../client/saber.client';
import { ISaberPool, ISaberPoolDepositParamsParsed, ISaberPoolWithdrawParamsParsed, ISaberSwapParamsParsed } from '../interfaces/saber.interfaces.pool';

export default class SaberPoolService extends SaberClient implements ISaberPool {
  async deposit(params: ISaberPoolDepositParamsParsed): Promise<instructionsAndSigners[]> {
    const poolDepositInstructionsAndSigners = await this.preparePoolDepositTransaction(params);
    return [poolDepositInstructionsAndSigners];
  }

  async withdraw(params: ISaberPoolWithdrawParamsParsed): Promise<instructionsAndSigners[]> {
    const poolWithdrawInstructionsAndSigners = await this.preparePoolWithdrawTransaction(params);
    return [poolWithdrawInstructionsAndSigners];
  }

  async swap(params: ISaberSwapParamsParsed): Promise<instructionsAndSigners[]> {
    const poolSwapInstructionsAndSigners = await this.preparePoolSwapTransaction(params);
    return [poolSwapInstructionsAndSigners];
  }
}
