import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SolClient } from './common.client';
import { loadKpSync } from '../util/common.util';
import { CONNECTION_URL, TESTING_KP_PATH } from '../../config/config';

/**
 * Note: using console.log here because this is run client-side
 */
export class SolTestingClient extends SolClient {
  testingKp: Keypair;

  constructor() {
    super();
    this.testingKp = loadKpSync(TESTING_KP_PATH);
    console.log('Initialized Sol Testing Client');
  }

  // --------------------------------------- passive

  get testingPk() {
    return this.testingKp.publicKey;
  }

  async getConnectionVersion() {
    const version = await this.connection.getVersion();
    console.log('Connection to cluster established:', CONNECTION_URL, version);
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
      console.log(a.pubkey.toBase58());
      console.log(a.account.data.parsed.info);
    });
  }

  // --------------------------------------- active

  async prepareAndSendTx(ix: TransactionInstruction[], signers: Signer[]) {
    const tx = new Transaction().add(...ix);
    const sig = await sendAndConfirmTransaction(this.connection, tx, signers);
    console.log('Tx successful,', sig);
  }

  async createMint(): Promise<Token> {
    return Token.createMint(
      this.connection,
      this.testingKp as any,
      this.testingKp.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID,
    );
  }

  async createTokenAcc(mint: Token, ownerPk: PublicKey): Promise<PublicKey> {
    const newAcc = await mint.createAccount(ownerPk);
    console.log('Created token account', newAcc.toBase58());
    return newAcc;
  }

  async fundTokenAcc(mint: Token, tokenAccPk: PublicKey, amount: number) {
    await mint.mintTo(tokenAccPk, this.testingKp.publicKey, [], amount);
    console.log(`Funded account ${tokenAccPk.toBase58()} with ${amount} tokens of mint ${mint.publicKey.toBase58()}`);
  }
}
