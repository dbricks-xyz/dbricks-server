import { MangoAccount, TokenAccount, TokenAccountLayout } from '@blockworks-foundation/mango-client';
import { Account, PublicKey, Transaction } from '@solana/web3.js';
import { TokenInstructions } from '@project-serum/serum';
import debug from 'debug';
import { ixAndSigners } from '../../common/interfaces/dex/dex.order.interface';
import { ILenderDeposit } from '../../common/interfaces/lender/lender.deposit.interface';
import { getDepositTxn } from '../logic/mango.deposit.logic';
import MangoInformation from '../logic/mangoClient';
import SolClient from '../../common/logic/client';
import { ownerKp } from '../../../play/keypair';

const log: debug.IDebugger = debug('app:mango-deposit-service');

function parseTokenResponse(r: { value: { pubkey: any; account: any; }[]; }): TokenAccount[] { // TODO: Refactor this away
  return r.value.map(
    ({ pubkey, account }) => new TokenAccount(pubkey, TokenAccountLayout.decode(account.data)),
  );
}

// implements ILenderDeposit
class MangoDepositService {
  // eslint-disable-next-line max-len
  async deposit(walletPkString: string, mangoPkString: string, tokenMintString: string, quantity: number): Promise<ixAndSigners> {
    // What's the most repoducible way to specify which token?
    const mangoPk = new PublicKey(mangoPkString);
    const walletPk = new PublicKey(walletPkString);

    // Parsing Token accounts will be refactored away, this is a copypasta of how Mango does it
    const tokenResp = await SolClient.connection.getTokenAccountsByOwner(walletPk, {
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
    });

    const tokenAccounts = parseTokenResponse(tokenResp);
    const tokenAccount = tokenAccounts.find((acc) => acc.mint.toBase58() === tokenMintString);
    if (!tokenAccount) {
      return [[], []];
    }

    await MangoInformation.loadGroup();
    await MangoInformation.loadAccounts(); // really want to abstract this out, not sure how

    const mangoAccount = MangoInformation.accounts.find((acc) => acc.publicKey.toBase58() === mangoPk.toBase58());
    const tokenIndex = MangoInformation.group.getTokenIndex(tokenAccount.mint);
    const { rootBank } = MangoInformation.group.tokens[tokenIndex];
    const nodeBank = MangoInformation.group.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].publicKey;
    const vault = MangoInformation.group.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].vault;
    if (!rootBank || !nodeBank || !vault || !mangoAccount) {
      log('Error loading Mango Info');
      return [[], []];
    }

    // return getDepositTxn(mangoAccount ?? new MangoAccount(mangoPk, undefined),
    //   MangoInformation.group,
    //   walletPk,
    //   rootBank,
    //   nodeBank,
    //   vault,
    //   tokenAccount ?? new TokenAccount(mangoPk, undefined),
    //   quantity);

    const depositTxn = await getDepositTxn(mangoAccount ?? new MangoAccount(mangoPk, undefined),
    MangoInformation.group,
    walletPk,
    rootBank,
    nodeBank,
    vault,
    tokenAccount ?? new TokenAccount(mangoPk, undefined),
    quantity);

    const tx = new Transaction().add(...depositTxn[0]);
    const ownerAccount = new Account(ownerKp.secretKey);
    const txid = await MangoInformation.client.sendTransaction(tx, ownerAccount, []); // This works but it throws an error?

    log(txid);

    return [[],[]];
  }
}

export default new MangoDepositService();
