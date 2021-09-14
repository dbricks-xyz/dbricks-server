import { PublicKey } from '@solana/web3.js';
import debug from 'debug';
import { ixsAndSigners } from '../../common/interfaces/dex/common.interfaces.dex.order';
import { ILenderWithdraw } from '../../common/interfaces/lender/common.interfaces.lender.withdraw';
import MangoClient from '../client/mango.client';

const log: debug.IDebugger = debug('app:mango-withdraw-service');

class MangoWithdrawService implements ILenderWithdraw {
  async withdraw(token: string, quantity: number, ownerPk: PublicKey, sourcePk?: PublicKey): Promise<ixsAndSigners> {
    const mangoInformation = await MangoClient.loadAllAccounts(ownerPk, token);
    if (!mangoInformation) {
      return [[], []];
    }
    const {
      userAccounts, rootBank, nodeBank, vault,
    } = mangoInformation;

    let mangoAccount;
    if (sourcePk) {
      mangoAccount = userAccounts.find(
        (acc) => acc.publicKey.toBase58() === sourcePk.toBase58(),
      );
      if (!mangoAccount) {
        log(
          `${sourcePk.toBase58()} is not owned by ${ownerPk.toBase58()}`,
        );
        return [[], []];
      }
    } else {
      return [[], []];
    }

    return MangoClient.prepWithdrawTx(
      mangoAccount,
      ownerPk,
      rootBank,
      nodeBank,
      vault,
      quantity,
      false,
    );
  }
}

export default new MangoWithdrawService();
