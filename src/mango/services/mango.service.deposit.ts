import {ixsAndSigners} from 'dbricks-lib';
import {
  IMangoLenderDeposit,
  IMangoLenderDepositParamsParsed,
} from '../interfaces/lender/mango.interfaces.lender.deposit.js';
import MangoClient from '../client/mango.client';

export default class MangoDepositService extends MangoClient implements IMangoLenderDeposit {
  async deposit(params: IMangoLenderDepositParamsParsed): Promise<ixsAndSigners[]> {
    const bankVaultInfo = await this.loadBankVaultInformation(params.mintPk);
    const tokenAcc = (await this.getTokenAccsForOwner(params.ownerPk, params.mintPk))[0];
    const { rootBank, nodeBank, vault } = bankVaultInfo;

    const tx = await this.prepDepositTx(
      params.ownerPk,
      rootBank,
      nodeBank,
      vault,
      tokenAcc.pubkey,
      params.quantity,
      params.mangoAccNr,
    );
    return [tx];
  }
}
