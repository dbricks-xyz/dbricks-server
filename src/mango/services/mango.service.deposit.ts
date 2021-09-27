import {instructionsAndSigners} from 'dbricks-lib';
import {
  IMangoLenderDeposit,
  IMangoLenderDepositParamsParsed,
} from '../interfaces/lender/mango.interfaces.lender.deposit.js';
import MangoClient from '../client/mango.client';

export default class MangoDepositService extends MangoClient implements IMangoLenderDeposit {
  async deposit(params: IMangoLenderDepositParamsParsed): Promise<instructionsAndSigners[]> {
    const bankVaultInfo = await this.loadBankVaultInformation(params.mintPubkey);
    const tokenAcc = (await this.getTokenAccountsForOwner(params.ownerPubkey, params.mintPubkey))[0];
    const { rootBank, nodeBank, vault } = bankVaultInfo;

    const transaction = await this.prepDepositTransaction(
      params.ownerPubkey,
      rootBank,
      nodeBank,
      vault,
      tokenAcc.pubkey,
      params.quantity,
      params.mangoAccountNumber,
    );
    return [transaction];
  }
}
