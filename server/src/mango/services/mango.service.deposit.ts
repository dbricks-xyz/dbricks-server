import { PublicKey } from '@solana/web3.js';
import debug from 'debug';
import { ILenderDeposit, ixAndSigners } from '../../common/interfaces/lender/common.interfaces.lender.deposit';
import { getDepositTxn } from '../client/mango.deposit.logic';
import MangoClient from '../client/mango.client';

const log: debug.IDebugger = debug('app:mango-deposit-service');

class MangoDepositService implements ILenderDeposit {
  // TODO: implement 1. create + deposit 2. DepositSrm 
  async deposit(token: string, quantity: number, ownerPk: PublicKey, destinationPk?: PublicKey): Promise<ixAndSigners> {
    await MangoClient.loadInformation(ownerPk)

    const tokenAccount = await MangoClient.getTokenAccount(token, ownerPk);

    // Maybe I'd prefer to have checks inside the client, and then it throws an error? Not sure best practice
    if (!tokenAccount) {
      log(`Error loading selected ${token} token account`);
      return [[], []];
    }
    
    const [rootBank, nodeBank, vault] = MangoClient.getBanksAndVault(tokenAccount);

    if (!rootBank || !nodeBank || !vault) {
      log('Error loading Mango Info');
      return [[], []];
    }

    let mangoAccount;
    if (destinationPk){
      mangoAccount = MangoClient.accounts.find((acc) => acc.publicKey.toBase58() === destinationPk.toBase58());
    } else if (MangoClient.accounts.length > 0) {
      mangoAccount = MangoClient.accounts[0];
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

    //If it's serum -> do Serum deposit

    return getDepositTxn(mangoAccount,
    MangoClient.group,
    ownerPk,
    rootBank,
    nodeBank,
    vault,
    tokenAccount,
    quantity);
  }
}

export default new MangoDepositService();
