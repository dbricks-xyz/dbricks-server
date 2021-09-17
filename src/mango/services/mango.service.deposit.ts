import { PublicKey } from '@solana/web3.js';
import { ixsAndSigners } from '../../common/interfaces/dex/common.interfaces.dex.order';
import {
  ILenderDeposit,
} from '../../common/interfaces/lender/common.interfaces.lender.deposit';
import MangoClient from '../client/mango.client';

export default class MangoDepositService extends MangoClient implements ILenderDeposit {
  async deposit(
    token: string,
    quantity: number,
    ownerPk: PublicKey,
    destinationPk?: PublicKey,
  ): Promise<ixsAndSigners> {
    const mangoInformation = await this.loadAllAccounts(ownerPk, token);
    const {
      userAccs, tokenAccPk, rootBank, nodeBank, vault,
    } = mangoInformation;

    if (userAccs.length === 0) {
      return this.prepDepositTx(
        ownerPk,
        rootBank,
        nodeBank,
        vault,
        tokenAccPk,
        quantity,
      );
    }

    if (!destinationPk) {
      throw new Error('Destination account for deposit not specified');
    }
    const mangoAcc = userAccs.find(
      (acc) => acc.publicKey.toBase58() === destinationPk.toBase58(),
    );
    if (!mangoAcc) {
      throw new Error(
        `${destinationPk.toBase58()} is not owned by ${ownerPk.toBase58()}`,
      );
    }

    return this.prepDepositTx(
      ownerPk,
      rootBank,
      nodeBank,
      vault,
      tokenAccPk,
      quantity,
      mangoAcc.publicKey,
    );
  }
}
