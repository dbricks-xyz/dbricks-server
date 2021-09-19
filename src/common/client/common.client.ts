import {
  Account,
  Connection,
  Keypair, ParsedAccountData,
  PublicKey,
  sendAndConfirmTransaction,
  Signer,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import debug from 'debug';
import {
  AccountInfo, AccountLayout, MintInfo, Token, TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {CONNECTION_URL, TESTING_KP_PATH} from '../../config/config';
import {loadKpSync, sleep} from '../util/common.util';
import {ixsAndSigners} from "dbricks-lib";

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
    this.connection = new Connection(CONNECTION_URL, 'processed');
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

  async getBalance(publicKey: PublicKey) {
    return this.connection.getBalance(publicKey);
  }

  async getTokenAccsForOwner(
    ownerPk: PublicKey,
    mintPk?: PublicKey,
  ): Promise<FoundTokenAccount[]> {
    let payerAccs;
    if (mintPk) {
      payerAccs = await this.connection.getParsedTokenAccountsByOwner(
        ownerPk,
        {programId: TOKEN_PROGRAM_ID, mint: mintPk},
      );
    } else {
      payerAccs = await this.connection.getParsedTokenAccountsByOwner(
        ownerPk,
        {programId: TOKEN_PROGRAM_ID},
      );
    }
    return payerAccs.value.map((a) => ({
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

  async deserializeToken(mintPk: PublicKey): Promise<Token> {
    // todo TESTING_KP_PATH should not be used here
    const tempKp = loadKpSync(TESTING_KP_PATH);
    return new Token(this.connection, mintPk, TOKEN_PROGRAM_ID, tempKp);
  }

  async deserializeTokenAcc(mintPk: PublicKey, tokenAccPk: PublicKey): Promise<AccountInfo> {
    const t = await this.deserializeToken(mintPk);
    return t.getAccountInfo(tokenAccPk);
  }

  async deserializeTokenMint(mintPk: PublicKey): Promise<MintInfo> {
    const t = await this.deserializeToken(mintPk);
    return t.getMintInfo();
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
  ): Promise<[ixsAndSigners, PublicKey]> {
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
    return [{ixs: transaction.instructions, signers: [newAccount]}, newAccount.publicKey];
  }

  // --------------------------------------- testing only

  async _prepareAndSendTx(ixs: TransactionInstruction[], signers: Signer[]) {
    const tx = new Transaction().add(...ixs);
    const sig = await sendAndConfirmTransaction(this.connection, tx, signers);
    console.log('Tx successful,', sig);
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

  async _createTokenAcc(mint: Token, ownerPk: PublicKey): Promise<PublicKey> {
    const newAcc = await mint.createAccount(ownerPk);
    log('Created token account', newAcc.toBase58());
    return newAcc;
  }

  async _fundTokenAcc(mint: Token, ownerPk: PublicKey, tokenAccPk: PublicKey, amount: number) {
    await mint.mintTo(tokenAccPk, ownerPk, [], amount);
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
    const transferIx = SystemProgram.transfer({
      fromPubkey: fromKp.publicKey,
      toPubkey: toPk,
      lamports,
    })
    await this._prepareAndSendTx(
      [transferIx],
      [fromKp]
    )
  }
}
