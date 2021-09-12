import {
  Account,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Signer,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import debug from 'debug';
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { CONNECTION_URL } from '../../config/config';
import { ixAndSigners } from '../interfaces/dex/common.interfaces.dex.order';
import { sleep } from '../util/common.util';

const log: debug.IDebugger = debug('app:sol-client');

export class SolClient {
  connection: Connection;

  constructor() {
    this.connection = new Connection(CONNECTION_URL, 'processed');
    log('Initialized Sol Client');
  }

  // --------------------------------------- passive

  async getConnectionVersion() {
    const version = await this.connection.getVersion();
    log('Connection to cluster established:', CONNECTION_URL, version);
  }

  async getTokenBalance(tokenAccPk: PublicKey): Promise<number | null> {
    const balance = await this.connection.getTokenAccountBalance(tokenAccPk);
    return balance.value.uiAmount;
  }

  async getTokenAccsForOwner(ownerKp: Keypair) {
    const payerAccs = await this.connection.getParsedTokenAccountsByOwner(
      ownerKp.publicKey,
      { programId: TOKEN_PROGRAM_ID },
    );
    payerAccs.value.forEach((a) => {
      log(a.pubkey.toBase58());
      log(a.account.data.parsed.info);
    });
  }

  /**
   * Re-make of the official function from the SDK found here:
   * https://github.com/solana-labs/solana-program-library/blob/master/token/js/client/token.js#L352
   * This uses the local connection instead of a passed one.
   */
  async getMinBalanceRentForExemptAccount(): Promise<number> {
    return this.connection.getMinimumBalanceForRentExemption(
      AccountLayout.span,
    );
  }

  // --------------------------------------- active

  /**
   * Re-make of the official function from the SDK found here:
   * https://github.com/solana-labs/solana-program-library/blob/master/token/js/client/token.js#L446
   * This prepares the TX and returns it, instead of sending it.
   */
  async prepCreateTokenAccTx(
    ownerPk: PublicKey,
    mintPk: PublicKey,
  ): Promise<[ixAndSigners, PublicKey]> {
    // Allocate memory for the account
    const balanceNeeded = await this.getMinBalanceRentForExemptAccount();

    const newAccount = Keypair.generate();
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: ownerPk,
        newAccountPubkey: newAccount.publicKey,
        lamports: balanceNeeded,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
      }),
    );
    transaction.add(
      Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        mintPk,
        newAccount.publicKey,
        ownerPk,
      ),
    );
    return [[transaction.instructions, [newAccount]], newAccount.publicKey];
  }

  async prepareAndSendTx(ix: TransactionInstruction[], signers: Signer[]) {
    const tx = new Transaction().add(...ix);
    const sig = await sendAndConfirmTransaction(this.connection, tx, signers);
    log('Tx successful,', sig);
  }

  async createMint(ownerKp: Keypair): Promise<Token> {
    return Token.createMint(
      this.connection,
      ownerKp as any,
      ownerKp.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID,
    );
  }

  async createTokenAcc(mint: Token, ownerPk: PublicKey): Promise<PublicKey> {
    const newAcc = await mint.createAccount(ownerPk);
    log('Created token account', newAcc.toBase58());
    return newAcc;
  }

  async fundTokenAcc(mint: Token, ownerPk: PublicKey, tokenAccPk: PublicKey, amount: number) {
    await mint.mintTo(tokenAccPk, ownerPk, [], amount);
    log(`Funded account ${tokenAccPk.toBase58()} with ${amount} tokens of mint ${mint.publicKey.toBase58()}`);
  }

  /**
 * WARNING: Doesn't work on localnet
 */
  async newAccountWithLamports(
    lamports: number = 1000000,
  ): Promise<Account> {
    const account = new Account();

    let retries = 30;
    await this.connection.requestAirdrop(account.publicKey, lamports);
    for (;;) {
      await sleep(500);
      if (lamports == (await this.connection.getBalance(account.publicKey))) {
        return account;
      }
      if (--retries <= 0) {
        break;
      }
    }
    throw new Error(`Airdrop of ${lamports} failed`);
  }
}

export default new SolClient();
