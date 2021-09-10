import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import axios from 'axios';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ownerKp } from './keypair';
import {
  deserializeIxs,
  deserializeSigners,
} from '../src/common/util/serializers';

// --------------------------------------- helpers

let connection: Connection;

async function getConnection() {
  const url = 'https://api.mainnet-beta.solana.com';
  connection = new Connection(url, 'processed');
  const version = await connection.getVersion();
  console.log('connection to cluster established:', url, version);
}

async function prepareAndSendTx(instructions: TransactionInstruction[], signers: Signer[]) {
  const tx = new Transaction().add(...instructions);
  const sig = await sendAndConfirmTransaction(connection, tx, signers);
  console.log(sig);
}

async function getTokenAccsForOwner(
  ownerKp: Keypair,
) {
  const payerAccs = await connection.getParsedTokenAccountsByOwner(
    ownerKp.publicKey,
    {
      programId: TOKEN_PROGRAM_ID,
    },
  );
  payerAccs.value.forEach((a) => {
    console.log('// ---------------------------------------');
    console.log(a.pubkey.toBase58());
    console.log(a.account.data.parsed.info);
  });
}

// --------------------------------------- play

const BASE = 'ATLAS';
const QUOTE = 'USDC';
const MARKET = `${BASE}/${QUOTE}`;

async function play() {
  // prepare requests
  const r1 = axios.post('http://localhost:3000/serum/orders', {
    market: MARKET,
    side: 'buy',
    price: 0.2,
    size: 0.1,
    orderType: 'ioc',
    ownerPk: ownerKp.publicKey.toBase58(),
  });
  const r2 = axios.post('http://localhost:3000/serum/settle', {
    market: MARKET,
    ownerPk: ownerKp.publicKey.toBase58(),
  });
  const [placeOrderTx, settleTx] = await axios.all([r1, r2]);

  // deserialize
  let [placeOrderIx, placeOrderSigners] = placeOrderTx.data;
  placeOrderIx = deserializeIxs(placeOrderIx);
  placeOrderSigners = deserializeSigners(placeOrderSigners);

  let [settleIx, settleSigners] = settleTx.data;
  settleIx = deserializeIxs(settleIx);
  settleSigners = deserializeSigners(settleSigners);

  // execute tx
  await getConnection();
  const hash = await prepareAndSendTx(
    [
      ...placeOrderIx,
      ...settleIx,
    ],
    [
      ownerKp,
      ...placeOrderSigners,
      ...settleSigners,
    ],
  );
  console.log(hash);
}

play();
