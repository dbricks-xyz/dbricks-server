import {instructionsAndSigners} from '@dbricks/dbricks-ts';
import {
  IMangoLenderDeposit,
  IMangoLenderDepositParamsParsed,
} from '../interfaces/lender/mango.interfaces.lender.deposit.js';
import MangoClient from '../client/mango.client';

export default class MangoDepositService extends MangoClient implements IMangoLenderDeposit {
  async deposit(params: IMangoLenderDepositParamsParsed): Promise<instructionsAndSigners[]> {
    const bankVaultInfo = await this.loadBankVaultInformation(params.mintPubkey);
    const tokenAccount = (await this.getTokenAccountsForOwner(params.ownerPubkey, params.mintPubkey))[0];
    const { rootBank, nodeBank, vault } = bankVaultInfo;

    const transaction = await this.prepareDepositTransaction(
      params.ownerPubkey,
      rootBank,
      nodeBank,
      vault,
      tokenAccount.pubkey,
      params.quantity,
      params.mangoAccountNumber,
    );
    return [transaction];
  }
}
