import {ixsAndSigners} from 'dbricks-lib';
import {
  IMangoLenderDeposit,
  IMangoLenderDepositParamsParsed,
} from '../interfaces/lender/mango.interfaces.lender.deposit.js';
import MangoClient from '../client/mango.client';

export default class MangoDepositService extends MangoClient implements IMangoLenderDeposit {
  async deposit(params: IMangoLenderDepositParamsParsed): Promise<ixsAndSigners[]> {
    const bankVaultInfo = await this.loadBankVaultInformation(params.mintPk);
    const tokenAcc = await this.loadTokenAccount(params.ownerPk, params.mintPk);
    const { rootBank, nodeBank, vault } = bankVaultInfo;
    const mangoAcc = await this.loadMangoAccForOwner(params.ownerPk, params.mangoAccNr);

    const tx = await this.prepDepositTx(
      params.ownerPk,
      rootBank,
      nodeBank,
      vault,
      tokenAcc.publicKey,
      params.quantity,
      mangoAcc.publicKey,
    );
    return [tx];
  }
}
