import { PublicKey } from '@solana/web3.js';
import debug from 'debug';
import { ILenderDeposit, ixAndSigners } from '../../common/interfaces/lender/common.interfaces.lender.deposit';
import MangoClient from '../client/mango.client';

const log: debug.IDebugger = debug('app:mango-deposit-service');

class MangoDepositService implements ILenderDeposit {
  // TODO: implement 1. create + deposit
  async deposit(token: string, quantity: number, ownerPk: PublicKey, destinationPk?: PublicKey): Promise<ixAndSigners> {
    const mangoInformation = await MangoClient.loadAllAccounts(ownerPk, token);
    if (!mangoInformation) {
      return [[], []];
    }
    const {userAccounts, tokenAccount, rootBank, nodeBank, vault} = mangoInformation;

    let mangoAccount;
    if (destinationPk && userAccounts.length > 0){
      mangoAccount = userAccounts.find((acc) => acc.publicKey.toBase58() === destinationPk.toBase58());
    } else if (userAccounts.length > 0) {
      mangoAccount = userAccounts[0];
    } else {
      // Init Mango Account and deposit
      log('Error loading Mango account');
      return [[], []];
    }
    

    // will delete this after other deposit logic is complete
    if(!mangoAccount) {
      log('Error loading Mango account');
      return [[], []];
    }

    return MangoClient.getDepositTxn(mangoAccount,
    ownerPk,
    rootBank,
    nodeBank,
    vault,
    tokenAccount,
    quantity);
  }
}

export default new MangoDepositService();
