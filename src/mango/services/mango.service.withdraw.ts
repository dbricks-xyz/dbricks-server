import {instructionsAndSigners} from 'dbricks-lib';
import {
  IMangoLenderWithdraw,
  IMangoLenderWithdrawParamsParsed,
} from '../interfaces/lender/mango.interfaces.lender.withdraw';
import MangoClient from '../client/mango.client';

export default class MangoWithdrawService extends MangoClient implements IMangoLenderWithdraw {
  async withdraw(params: IMangoLenderWithdrawParamsParsed): Promise<instructionsAndSigners[]> {
    const bankVaultInfo = await this.loadBankVaultInformation(params.mintPubkey);
    const {rootBank, nodeBank, vault} = bankVaultInfo;
    const mangoAcc = await this.loadMangoAccForOwner(params.ownerPubkey, params.mangoAccountNumber);

    const transaction = await this.prepWithdrawTransaction(
      mangoAcc,
      params.ownerPubkey,
      rootBank,
      nodeBank,
      vault,
      params.quantity,
      params.isBorrow,
    );
    return [transaction];
  }
}
