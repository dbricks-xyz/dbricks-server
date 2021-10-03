import {Commitment, PublicKey} from '@solana/web3.js';
import debug from "debug";

const log: debug.IDebugger = debug('config');

/*eslint-disable */
require('dotenv').config();

export let NETWORK: string;
if (process.env.TESTING_LOCAL) {
  NETWORK = 'localnet';
} else if (process.env.TESTING_DEV) {
  NETWORK = 'devnet';
} else {
  NETWORK = process.env.NETWORK as string;
}
log('// ---------------------------------------')
log('LOADED ENV:', NETWORK);

export let SERUM_PROG_ID: PublicKey;
export let SABER_PROG_ID: PublicKey;
export let MANGO_PROG_ID: PublicKey;
export let CONNECTION_URL: string;
/* eslint-enable */

export const TESTING_KEYPAIR_PATH = process.env.KEYPAIR_PATH ?? '';

if (NETWORK === 'mainnet') {
  SERUM_PROG_ID = new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin');
  SABER_PROG_ID = new PublicKey('SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ');
  MANGO_PROG_ID = new PublicKey('mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68');
  CONNECTION_URL = 'https://solana-api.projectserum.com';
} else if (NETWORK === 'devnet') {
  SERUM_PROG_ID = new PublicKey('DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY');
  SABER_PROG_ID = new PublicKey('Crt7UoUR6QgrFrN7j8rmSQpUTNWNSitSwWvsWGf1qZ5t');
  MANGO_PROG_ID = new PublicKey('4skJ85cdxQAFVKbcGgfun8iZPL7BadVYXG3kGEGkufqA');
  CONNECTION_URL = 'https://api.devnet.solana.com';
} else if (NETWORK === 'localnet') {
  SERUM_PROG_ID = new PublicKey(process.env.LOCAL_SERUM_PROG_ID!);
  SABER_PROG_ID = new PublicKey(process.env.LOCAL_SABER_PROG_ID!);
  MANGO_PROG_ID = new PublicKey(process.env.LOCAL_MANGO_PROG_ID!);
  CONNECTION_URL = 'http://localhost:8899';
} else {
  throw new Error(`Network unrecognized. Should be mainnet/devnet/localnet. Currently: ${NETWORK}`);
}

export const COMMITTMENT: Commitment = 'processed';