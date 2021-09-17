import { PublicKey } from '@solana/web3.js';
import { ixsAndSigners } from '../../common/interfaces/dex/common.interfaces.dex.order';
import { ILenderWithdraw } from '../../common/interfaces/lender/common.interfaces.lender.withdraw';
import MangoClient from '../client/mango.client';

export default class MangoWithdrawService extends MangoClient implements ILenderWithdraw {
  async withdraw(token: string, quantity: number, isBorrow: boolean, ownerPk: PublicKey, sourcePk?: PublicKey): Promise<ixsAndSigners> {
    const mangoInformation = await this.loadAllAccounts(ownerPk, token);
    const {
      userAccs, rootBank, nodeBank, vault,
    } = mangoInformation;

    if (!sourcePk) {
      throw new Error('Source account for withdrawal not specified');
    }
    const mangoAcc = userAccs.find(
      (acc) => acc.publicKey.toBase58() === sourcePk.toBase58(),
    );
    if (!mangoAcc) {
      throw new Error(
        `${sourcePk.toBase58()} is not owned by ${ownerPk.toBase58()}`,
      );
    }

    return this.prepWithdrawTx(
      mangoAcc,
      ownerPk,
      rootBank,
      nodeBank,
      vault,
      quantity,
      isBorrow,
    );
  }
}
