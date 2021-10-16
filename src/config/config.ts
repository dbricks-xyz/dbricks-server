/* eslint-disable import/no-mutable-exports */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/*eslint-disable */
require('dotenv').config();
/* eslint-enable */

import {Commitment, PublicKey} from '@solana/web3.js';
import debug from "debug";

const log: debug.IDebugger = debug('config');

// --------------------------------------- network config
export let NETWORK: string;
if (process.env.TESTING_LOCAL) {
  NETWORK = 'localnet';
} else if (process.env.TESTING_DEV) {
  NETWORK = 'devnet';
} else if (process.env.NETWORK) {
  NETWORK = process.env.NETWORK as string;
} else {
  NETWORK = 'mainnet';
}
log('// ---------------------------------------')
log('LOADED ENV:', NETWORK);

// --------------------------------------- on-chain connection config
export let SERUM_PROG_ID: PublicKey;
export let SABER_SWAP_PROG_ID: PublicKey;
export let MANGO_PROG_ID: PublicKey;
export let SOLEND_PROG_ID: PublicKey;
export let SOLEND_MARKET_ID: PublicKey;
export let SOLEND_MARKET_OWNER_ID: PublicKey;
export let CONNECTION_URL: string;

if (NETWORK === 'mainnet') {
  SERUM_PROG_ID = new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin');
  SABER_SWAP_PROG_ID = new PublicKey('SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ');
  MANGO_PROG_ID = new PublicKey('mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68');
  SOLEND_PROG_ID = new PublicKey('So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo');
  SOLEND_MARKET_ID = new PublicKey('4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY');
  SOLEND_MARKET_OWNER_ID = new PublicKey('DdZR6zRFiUt4S5mg7AV1uKB2z1f1WzcNYCaTEEWPAuby');
  CONNECTION_URL = process.env.MAINNET_NODE_URL
    ? process.env.MAINNET_NODE_URL
    : 'https://rough-thrumming-haze.solana-mainnet.quiknode.pro/9e0eb0a4e3f28f489f1e15e22559bb89bfb8d319/';
  console.log('Connected to', CONNECTION_URL.substring(0, 20));
} else if (NETWORK === 'devnet') {
  SERUM_PROG_ID = new PublicKey('DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY');
  SABER_SWAP_PROG_ID = new PublicKey('Crt7UoUR6QgrFrN7j8rmSQpUTNWNSitSwWvsWGf1qZ5t');
  MANGO_PROG_ID = new PublicKey('4skJ85cdxQAFVKbcGgfun8iZPL7BadVYXG3kGEGkufqA');
  SOLEND_PROG_ID = new PublicKey('ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx');
  SOLEND_MARKET_ID = new PublicKey('GvjoVKNjBvQcFaSKUW1gTE7DxhSpjHbE69umVR5nPuQp');
  SOLEND_MARKET_OWNER_ID = new PublicKey('So11111111111111111111111111111111111111112'); //todo need to ask the solend guys, not in the docs
  CONNECTION_URL = 'https://api.devnet.solana.com';
} else if (NETWORK === 'localnet') {
  SERUM_PROG_ID = process.env.LOCAL_SERUM_PROG_ID
    ? new PublicKey(process.env.LOCAL_SERUM_PROG_ID)
    : new PublicKey('So11111111111111111111111111111111111111112');
  SABER_SWAP_PROG_ID = process.env.LOCAL_SABER_SWAP_PROG_ID
    ? new PublicKey(process.env.LOCAL_SABER_SWAP_PROG_ID)
    : new PublicKey('So11111111111111111111111111111111111111112');
  MANGO_PROG_ID = process.env.LOCAL_MANGO_PROG_ID
    ? new PublicKey(process.env.LOCAL_MANGO_PROG_ID)
    : new PublicKey('So11111111111111111111111111111111111111112');
  SOLEND_PROG_ID = process.env.LOCAL_SOLEND_PROG_ID
    ? new PublicKey(process.env.LOCAL_SOLEND_PROG_ID)
    : new PublicKey('So11111111111111111111111111111111111111112');
  SOLEND_MARKET_ID = process.env.LOCAL_SOLEND_MARKET_ID
    ? new PublicKey(process.env.LOCAL_SOLEND_MARKET_ID)
    : new PublicKey('So11111111111111111111111111111111111111112');
  SOLEND_MARKET_OWNER_ID = process.env.LOCAL_SOLEND_MARKET_OWNER_ID
    ? new PublicKey(process.env.LOCAL_SOLEND_MARKET_OWNER_ID)
    : new PublicKey('So11111111111111111111111111111111111111112');
  CONNECTION_URL = 'http://localhost:8899';
} else {
  throw new Error(`Network unrecognized. Should be mainnet/devnet/localnet. Currently: ${NETWORK}`);
}

export const COMMITTMENT: Commitment = 'processed';

// --------------------------------------- other
export const TESTING_KEYPAIR_PATH = process.env.KEYPAIR_PATH ?? '';