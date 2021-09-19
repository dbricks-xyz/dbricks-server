import {ixsAndSigners} from 'dbricks-lib';
import {
  ILenderWithdraw,
  ILenderWithdrawParamsParsed
} from '../../common/interfaces/lender/common.interfaces.lender.withdraw';
import MangoClient from '../client/mango.client';

export default class MangoWithdrawService extends MangoClient implements ILenderWithdraw {
  async withdraw(params: ILenderWithdrawParamsParsed): Promise<ixsAndSigners[]> {
    const mangoInformation = await this.loadAllAccounts(params.ownerPk, params.mintPk);
    const {
      userAccs, rootBank, nodeBank, vault,
    } = mangoInformation;

    if (!params.sourcePk) {
      throw new Error('Source account for withdrawal not specified');
    }
    const mangoAcc = userAccs.find(
      (acc) => acc.publicKey.toBase58() === params.sourcePk!.toBase58(),
    );
    if (!mangoAcc) {
      throw new Error(
        `${params.sourcePk.toBase58()} is not owned by ${params.ownerPk.toBase58()}`,
      );
    }

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
