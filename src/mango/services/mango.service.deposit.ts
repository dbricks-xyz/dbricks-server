import { ixsAndSigners } from 'dbricks-lib';
import {
  IMangoLenderDeposit,
  IMangoLenderDepositParamsParsed,
} from '../interfaces/lender/mango.interfaces.lender.deposit';
import MangoClient from '../client/mango.client';
import { SERUM_PROG_ID } from '../../config/config';

export default class MangoDepositService extends MangoClient implements IMangoLenderDeposit {
  async deposit(params: IMangoLenderDepositParamsParsed): Promise<ixsAndSigners[]> {
    const bankVaultInfo = await this.loadBankVaultInformation(params.mintPk);
    const tokenAcc = await this.loadTokenAccount(params.ownerPk, params.mintPk);
    const { rootBank, nodeBank, vault } = bankVaultInfo;

    if (!params.mangoAccPk) {
      const tx = await this.prepDepositTx(
        params.ownerPk,
        rootBank,
        nodeBank,
        vault,
        tokenAcc.publicKey,
        params.quantity,
      );
      return [tx];
    }
    const mangoAcc = await this.nativeClient.getMangoAccount(params.mangoAccPk, SERUM_PROG_ID);

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
