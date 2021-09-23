import {ixsAndSigners} from 'dbricks-lib';
import {
  IMangoLenderWithdraw,
  IMangoLenderWithdrawParamsParsed,
} from '../interfaces/lender/mango.interfaces.lender.withdraw';
import MangoClient from '../client/mango.client';

export default class MangoWithdrawService extends MangoClient implements IMangoLenderWithdraw {
  async withdraw(params: IMangoLenderWithdrawParamsParsed): Promise<ixsAndSigners[]> {
    const bankVaultInfo = await this.loadBankVaultInformation(params.mintPk);
    const {rootBank, nodeBank, vault} = bankVaultInfo;
    const mangoAcc = await this.loadMangoAccForOwner(params.ownerPk, params.mangoAccNr);

    const tx = await this.prepWithdrawTx(
      mangoAcc,
      params.ownerPk,
      rootBank,
      nodeBank,
      vault,
      params.quantity,
      params.isBorrow,
    );
    return [tx];
  }
}
