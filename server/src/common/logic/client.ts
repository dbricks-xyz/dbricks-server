import {
  Connection,
  sendAndConfirmTransaction,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import debug from 'debug';
import { CONNECTION_URL } from '../../constants/constants';

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
}

export default new SolClient();
