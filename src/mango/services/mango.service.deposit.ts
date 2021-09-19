import {ixsAndSigners} from 'dbricks-lib';
import {
  ILenderDeposit,
  ILenderDepositParamsParsed,
} from '../../common/interfaces/lender/common.interfaces.lender.deposit';
import MangoClient from '../client/mango.client';

export default class MangoDepositService extends MangoClient implements ILenderDeposit {
  async deposit(params: ILenderDepositParamsParsed): Promise<ixsAndSigners[]> {
    const mangoInformation = await this.loadAllAccounts(params.ownerPk, params.mintPk);
    const {
      userAccs, tokenAccPk, rootBank, nodeBank, vault,
    } = mangoInformation;

    if (userAccs.length === 0) {
      const tx = await this.prepDepositTx(
        params.ownerPk,
        rootBank,
        nodeBank,
        vault,
        tokenAccPk,
        params.quantity,
      );
      return [tx];
    }

    if (!params.destinationPk) {
      throw new Error('Destination account for deposit not specified');
    }
    const mangoAcc = userAccs.find(
      (acc) => acc.publicKey.toBase58() === params.destinationPk!.toBase58(),
    );
    if (!mangoAcc) {
      throw new Error(
        `${params.destinationPk.toBase58()} is not owned by ${params.ownerPk.toBase58()}`,
      );
    }

    const tx = await this.prepDepositTx(
      params.ownerPk,
      rootBank,
      nodeBank,
      vault,
      tokenAccPk,
      params.quantity,
      mangoAcc.publicKey,
    );
    return [tx];
  }
}
