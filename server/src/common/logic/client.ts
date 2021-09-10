import {
  Connection, Keypair, PublicKey,
  sendAndConfirmTransaction,
  Signer, SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import debug from 'debug';
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { CONNECTION_URL } from '../../constants/constants';
import { ixAndSigners } from '../interfaces/dex/dex.order.interface';

const log: debug.IDebugger = debug('app:sol-client');

class SolClient {
  connection: Connection;

  constructor() {
    this.connection = new Connection(CONNECTION_URL, 'processed');
  }

  async checkConnection() {
    const version = await this.connection.getVersion();
    log('Connection to cluster established:', CONNECTION_URL, version);
  }

  async prepareAndSendTx(instructions: TransactionInstruction[], signers: Signer[]) {
    const tx = new Transaction().add(...instructions);
    const sig = await sendAndConfirmTransaction(this.connection, tx, signers);
    log(sig);
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

  /**
   * Re-make of the official function from the SDK found here:
   * https://github.com/solana-labs/solana-program-library/blob/master/token/js/client/token.js#L446
   * This prepares the TX and returns it, instead of sending it.
   */
  async prepCreateTokenAccTx(
    ownerPk: PublicKey,
    mintPk: PublicKey,
  ): Promise<[ ixAndSigners, PublicKey ]> {
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
}

export default new SolClient();
