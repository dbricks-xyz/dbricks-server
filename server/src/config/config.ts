require('dotenv').config();

console.log('ENV:', process.env.NETWORK);

/*eslint-disable */
import {PublicKey} from '@solana/web3.js';

export let SERUM_PROG_ID: PublicKey;
export let SABER_PROG_ID: PublicKey;
export let MANGO_PROG_ID: PublicKey;
export let CONNECTION_URL: string;
/* eslint-enable */

// todo adjust for local testing
export const TESTING_KP_PATH = '/Users/ilmoi/.config/solana/id.json';

if (process.env.NETWORK === 'mainnet') {
  SERUM_PROG_ID = new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin');
  SABER_PROG_ID = new PublicKey('SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ');
  MANGO_PROG_ID = new PublicKey('5fNfvyp5czQVX77yoACa3JJVEhdRaWjPuazuWgjhTqEH');
  CONNECTION_URL = 'https://api.mainnet-beta.solana.com';
} else if (process.env.NETWORK === 'devnet') {
  SERUM_PROG_ID = new PublicKey('DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY');
  SABER_PROG_ID = new PublicKey('Crt7UoUR6QgrFrN7j8rmSQpUTNWNSitSwWvsWGf1qZ5t');
  MANGO_PROG_ID = new PublicKey('9XzhtAtDXxW2rjbeVFhTq4fnhD8dqzr154r5b2z6pxEp');
  CONNECTION_URL = 'https://api.devnet.solana.com';
} else if (process.env.NETWORK === 'localnet') {
  // todo adjust for local testing:
  //  1)git clone the respective programs
  //  2)cargo build-bpf,
  //  3)solana program deploy [path]
  //  4)paste the IDs below
  SERUM_PROG_ID = new PublicKey('DVieqxNimmtbZpZTw2sZiSAohNJuHLywGaMs47RAW97Z');
  SABER_PROG_ID = new PublicKey('32X9WvCHTtab6QUujy3edG1ogdAWUKrJ3VXApZjNq7dD');
  MANGO_PROG_ID = new PublicKey('32X9WvCHTtab6QUujy3edG1ogdAWUKrJ3VXApZjNq7dD');
  CONNECTION_URL = 'http://localhost:8899';
} else {
  throw new Error(`Network unrecognized. Should be mainnet/devnet/localnet. Currently: ${process.env.NETWORK}`);
}
