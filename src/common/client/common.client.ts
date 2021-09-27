import {
  Account,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import debug from 'debug';
import {AccountInfo, AccountLayout, MintInfo, Token, TOKEN_PROGRAM_ID,} from '@solana/spl-token';
import {COMMITTMENT, CONNECTION_URL, TESTING_KP_PATH} from '../../config/config';
import {loadKpSync, sleep} from '../util/common.util';
import {instructionsAndSigners} from "dbricks-lib";

const log: debug.IDebugger = debug('app:sol-client');

type FoundTokenAccount = {
  pubkey: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  state: string,
  amount: number,
}

export default class SolClient {
  connection: Connection;

  constructor() {
    this.connection = new Connection(CONNECTION_URL, COMMITTMENT);
    log('Initialized Sol Client');
  }

  // --------------------------------------- passive

  async getConnectionVersion() {
    const version = await this.connection.getVersion();
    log('Connection to cluster established:', CONNECTION_URL, version);
  }

  async getTokenBalance(tokenAccPk: PublicKey): Promise<number> {
    const balance = await this.connection.getTokenAccountBalance(tokenAccPk);
    if (!balance.value.uiAmount) {
      return 0;
    }
    return balance.value.uiAmount;
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    return this.connection.getBalance(publicKey);
  }

  async getTokenAccountsForOwner(
    ownerPubkey: PublicKey,
    mintPubkey?: PublicKey,
  ): Promise<FoundTokenAccount[]> {
    let payerAccounts;
    if (mintPubkey) {
      payerAccounts = await this.connection.getParsedTokenAccountsByOwner(
        ownerPubkey,
        {programId: TOKEN_PROGRAM_ID, mint: mintPubkey},
      );
    } else {
      payerAccounts = await this.connection.getParsedTokenAccountsByOwner(
        ownerPubkey,
        {programId: TOKEN_PROGRAM_ID},
      );
    }
    return payerAccounts.value.map((a) => ({
      pubkey: a.pubkey,
      mint: new PublicKey(a.account.data.parsed.info.mint),
      owner: new PublicKey(a.account.data.parsed.info.owner),
      state: a.account.data.parsed.info.state,
      amount: a.account.data.parsed.info.tokenAmount.uiAmount,
    } as FoundTokenAccount));
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

  async deserializeToken(mintPubkey: PublicKey): Promise<Token> {
    // todo TESTING_KP_PATH should not be used here
    const tempKp = loadKpSync(TESTING_KP_PATH);
    return new Token(this.connection, mintPubkey, TOKEN_PROGRAM_ID, tempKp);
  }

  async deserializeTokenAcc(mintPubkey: PublicKey, tokenAccPk: PublicKey): Promise<AccountInfo> {
    const t = await this.deserializeToken(mintPubkey);
    return t.getAccountInfo(tokenAccPk);
  }

  async deserializeTokenMint(mintPubkey: PublicKey): Promise<MintInfo> {
    const t = await this.deserializeToken(mintPubkey);
    return t.getMintInfo();
  }

  // --------------------------------------- active

  /**
   * Re-make of the official function from the SDK found here:
   * https://github.com/solana-labs/solana-program-library/blob/master/token/js/client/token.js#L446
   * This prepares the TRANSACTION and returns it, instead of sending it.
   */
  async prepCreateTokenAccTransaction(
    payerPk: PublicKey,
    mintPubkey: PublicKey,
    ownerPubkey?: PublicKey,
  ): Promise<[instructionsAndSigners, PublicKey]> {
    // Allocate memory for the account
    const balanceNeeded = await this.getMinBalanceRentForExemptAccount();

    const newAccount = Keypair.generate();
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payerPk,
        newAccountPubkey: newAccount.publicKey,
        lamports: balanceNeeded,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
      }),
    );
    transaction.add(
      Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        mintPubkey,
        newAccount.publicKey,
        ownerPubkey ?? payerPk,
      ),
    );
    return [{instructions: transaction.instructions, signers: [newAccount]}, newAccount.publicKey];
  }

  async getOrCreateTokenAccByMint(
    ownerPubkey: PublicKey,
    mintPubkey: PublicKey,
  ): Promise<[instructionsAndSigners, PublicKey]> {
    let instructionsAndSigners: instructionsAndSigners = {instructions: [], signers: []};
    let tokenAccPk: PublicKey;
    if (mintPubkey.toBase58() === 'So11111111111111111111111111111111111111112') {
      return [instructionsAndSigners, ownerPubkey];
    }
    const tokenAccounts = (await this.connection.getTokenAccountsByOwner(ownerPubkey, {
        mint: mintPubkey,
      }
    )).value;

    if (tokenAccounts.length === 0) {
      log(`Creating token account for mint ${mintPubkey.toBase58()}`);
      [instructionsAndSigners, tokenAccPk] = await this.prepCreateTokenAccTransaction(ownerPubkey, mintPubkey);
    } else {
      tokenAccPk = tokenAccounts[0].pubkey;
    }
    log(`User's account for mint ${mintPubkey.toBase58()} is ${tokenAccPk.toBase58()}`);

    return [instructionsAndSigners, tokenAccPk];
  }

  // --------------------------------------- testing only

  async _prepareAndSendTransaction(instructionsAndSigners: instructionsAndSigners): Promise<string | undefined> {
    if (instructionsAndSigners.instructions.length === 0) {
      log('No instructions provided, aborting.')
      return;
    }
    const transaction = new Transaction().add(...instructionsAndSigners.instructions);
    const sig = await sendAndConfirmTransaction(this.connection, transaction, instructionsAndSigners.signers);
    console.log('Transaction successful,', sig);
    return sig;
  }

  async _createMint(ownerKp: Keypair): Promise<Token> {
    return Token.createMint(
      this.connection,
      ownerKp as any,
      ownerKp.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID,
    );
  }

  async _createTokenAcc(mint: Token, ownerPubkey: PublicKey): Promise<PublicKey> {
    const newAcc = await mint.createAccount(ownerPubkey);
    log('Created token account', newAcc.toBase58());
    return newAcc;
  }

  async _fundTokenAcc(mint: Token, ownerPubkey: PublicKey, tokenAccPk: PublicKey, amount: number) {
    await mint.mintTo(tokenAccPk, ownerPubkey, [], amount);
    log(`Funded account ${tokenAccPk.toBase58()} with ${amount} tokens of mint ${mint.publicKey.toBase58()}`);
  }

  /**
   * WARNING: Doesn't work on localnet - only devnet
   */
  async _newAccountWithLamports(
    lamports: number = 1000000,
  ): Promise<Account> {
    const account = new Account();

    let retries = 30;
    await this.connection.requestAirdrop(account.publicKey, lamports);
    for (; ;) {
      await sleep(500);
      if (lamports == (await this.getBalance(account.publicKey))) {
        return account;
      }
      if (--retries <= 0) {
        break;
      }
    }
    throw new Error(`Airdrop of ${lamports} failed`);
  }

  async _transferLamports(
    fromKp: Keypair,
    toPk: PublicKey,
    lamports: number
  ) {
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: fromKp.publicKey,
      toPubkey: toPk,
      lamports,
    })
    await this._prepareAndSendTransaction({
      instructions: [transferInstruction],
      signers: [fromKp]
    })
  }
}
