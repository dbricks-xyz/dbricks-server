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
import {
  AccountInfo,
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintInfo,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {COMMITTMENT, CONNECTION_URL} from '../../config/config';
import {sleep} from '../util/common.util';
import {instructionsAndSigners} from "@dbricks/dbricks-ts";

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

  async getTokenBalance(tokenAccountPubkey: PublicKey): Promise<number> {
    const balance = await this.connection.getTokenAccountBalance(tokenAccountPubkey);
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
    if (mintPubkey?.toBase58() === "So11111111111111111111111111111111111111112") {
      return [{
        pubkey: ownerPubkey,
        mint: new PublicKey("So11111111111111111111111111111111111111112"),
        owner: ownerPubkey,
        state: "",
        amount: 0,
      }]
    }
    let tokenAccounts;
    if (mintPubkey) {
      tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        ownerPubkey,
        {programId: TOKEN_PROGRAM_ID, mint: mintPubkey},
      );
    } else {
      tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        ownerPubkey,
        {programId: TOKEN_PROGRAM_ID},
      );
    }
    return tokenAccounts.value.map((a) => ({
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
    //doesn't matter which keypair goes here
    const tempKeypair = Keypair.fromSecretKey(Uint8Array.from([208, 175, 150, 242, 88, 34, 108, 88, 177, 16, 168, 75, 115, 181, 199, 242, 120, 4, 78, 75, 19, 227, 13, 215, 184, 108, 226, 53, 111, 149, 179, 84, 137, 121, 79, 1, 160, 223, 124, 241, 202, 203, 220, 237, 50, 242, 57, 158, 226, 207, 203, 188, 43, 28, 70, 110, 214, 234, 251, 15, 249, 157, 62, 80]));
    return new Token(this.connection, mintPubkey, TOKEN_PROGRAM_ID, tempKeypair);
  }

  async deserializeTokenAccount(mintPubkey: PublicKey, tokenAccountPubkey: PublicKey): Promise<AccountInfo> {
    const t = await this.deserializeToken(mintPubkey);
    return t.getAccountInfo(tokenAccountPubkey);
  }

  async deserializeTokenMint(mintPubkey: PublicKey): Promise<MintInfo> {
    const t = await this.deserializeToken(mintPubkey);
    return t.getMintInfo();
  }

  // --------------------------------------- active

  async prepareCreateAssociatedTokenAccountTransaction(
    mintPubkey: PublicKey,
    ownerPubkey: PublicKey,
    payerPubkey: PublicKey,
    newAddrPubkey: PublicKey,
  ): Promise<[instructionsAndSigners, PublicKey]> {
    const instructionsAndSigners: instructionsAndSigners = {instructions: [], signers: []};
    const createAssociatedTokenAccountInstructions = Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintPubkey,
      newAddrPubkey,
      ownerPubkey,
      payerPubkey,
    );
    instructionsAndSigners.instructions.push(createAssociatedTokenAccountInstructions);
    return [instructionsAndSigners, newAddrPubkey];
  }

  async getOrCreateAssociatedTokenAccountByMint(
    mintPubkey: PublicKey,
    ownerPubkey: PublicKey,
    payerPubkey: PublicKey,
    fetchOnly = false,
    allowOwnerOffCurve = false,
  ): Promise<[instructionsAndSigners, PublicKey]> {
    const instructionsAndSigners: instructionsAndSigners = {instructions: [], signers: []};
    if (mintPubkey.toBase58() === 'So11111111111111111111111111111111111111112') {
      return [instructionsAndSigners, ownerPubkey];
    }

    const associatedAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintPubkey,
      ownerPubkey,
      allowOwnerOffCurve,
    );
    log(`User's associated token account for mint ${mintPubkey.toBase58()} is ${associatedAddress.toBase58()}`);

    if (fetchOnly) {
      return [instructionsAndSigners, associatedAddress];
    }

    //if the call succeeds, then an account already exists - otherwise we need to create one
    try {
      await this.deserializeTokenAccount(mintPubkey, associatedAddress);
      log(`Associated account for mint ${mintPubkey.toBase58()} already exists.`);
      return [instructionsAndSigners, associatedAddress];
    } catch (e) {
      log(`Creating associated token account for mint ${mintPubkey.toBase58()}`);
      return this.prepareCreateAssociatedTokenAccountTransaction(
        mintPubkey,
        ownerPubkey,
        payerPubkey,
        associatedAddress,
      )
    }
  }

  // --------------------------------------- testing only

  async _prepareAndSendTransaction(instructionsAndSigners: instructionsAndSigners): Promise<string | undefined> {
    if (instructionsAndSigners.instructions.length === 0) {
      log('No instructions provided, aborting.')
      return;
    }
    const transaction = new Transaction().add(...instructionsAndSigners.instructions);
    const sig = await sendAndConfirmTransaction(this.connection, transaction, instructionsAndSigners.signers);
    log('Transaction successful,', sig);
    return sig;
  }

  async _createMint(ownerKeypair: Keypair): Promise<Token> {
    return Token.createMint(
      this.connection,
      ownerKeypair as any,
      ownerKeypair.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID,
    );
  }

  async _createTokenAccount(mint: Token, ownerPubkey: PublicKey): Promise<PublicKey> {
    // really important to keep this as associated token account, not just token account
    const newAccount = await mint.createAssociatedTokenAccount(ownerPubkey);
    log('Created token account', newAccount.toBase58());
    return newAccount;
  }

  async _fundTokenAccount(mint: Token, ownerPubkey: PublicKey, tokenAccountPubkey: PublicKey, amount: number) {
    await mint.mintTo(tokenAccountPubkey, ownerPubkey, [], amount);
    log(`Funded account ${tokenAccountPubkey.toBase58()} with ${amount} tokens of mint ${mint.publicKey.toBase58()}`);
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
    fromKeypair: Keypair,
    toPubkey: PublicKey,
    lamports: number
  ) {
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: toPubkey,
      lamports,
    })
    await this._prepareAndSendTransaction({
      instructions: [transferInstruction],
      signers: [fromKeypair]
    })
  }

  /**
   * todo NOTE: should NOT be used for anything in prod! Only for tests!
   * Re-make of the official function from the SDK found here:
   * https://github.com/solana-labs/solana-program-library/blob/master/token/js/client/token.js#L446
   * This prepares the TRANSACTION and returns it, instead of sending it.
   */
  async _prepareCreateTokenAccountTransaction(
    payerPubkey: PublicKey,
    mintPubkey: PublicKey,
    ownerPubkey?: PublicKey,
  ): Promise<[instructionsAndSigners, PublicKey]> {
    const balanceNeeded = await this.getMinBalanceRentForExemptAccount();

    const newAccount = Keypair.generate();
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payerPubkey,
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
        ownerPubkey ?? payerPubkey,
      ),
    );
    return [{instructions: transaction.instructions, signers: [newAccount]}, newAccount.publicKey];
  }
}
