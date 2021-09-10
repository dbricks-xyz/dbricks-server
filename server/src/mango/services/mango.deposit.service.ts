import { MangoAccount, TokenAccount, TokenAccountLayout } from '@blockworks-foundation/mango-client';
import { PublicKey } from '@solana/web3.js';
import { TokenInstructions } from '@project-serum/serum';
import { ixAndSigners } from '../../common/interfaces/dex/dex.order.interface';
import { ILenderDeposit } from '../../common/interfaces/lender/lender.deposit.interface';
import { getDepositTxn } from '../logic/mango.deposit.logic';
import MangoInformation from '../logic/mangoClient';
import SolClient from '../../common/logic/client';
import debug from 'debug';

function parseTokenResponse(r: { value: { pubkey: any; account: any; }[]; }): TokenAccount[] { //TODO: Refactor this away 
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

    await MangoInformation.loadGroup();
    await MangoInformation.loadAccounts(); // really want to abstract this out, not sure how

    const mangoAccount = MangoInformation.accounts.find((acc) => acc.publicKey === mangoPk);

    return getDepositTxn(mangoAccount ?? new MangoAccount(mangoPk, undefined),
      MangoInformation.group,
      walletPk,
      tokenAccount ?? new TokenAccount(mangoPk, undefined),
      quantity);
  }
}

export default new MangoDepositService();
