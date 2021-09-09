import {
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import axios from 'axios';
import BN from 'bn.js';
import { ownerKp } from './keypair';

const BASE = 'SRM';
const QUOTE = 'USDC';
const MARKET = `${BASE}/${QUOTE}`;

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

function deserializeIx(instructions: any[]) {
  instructions.forEach((ix: any) => {
    const { keys } = ix;
    keys.forEach((k: any) => {
      k.pubkey = new PublicKey(new BN(k.pubkey._bn, 16));
    });
    ix.programId = new PublicKey(new BN(ix.programId._bn, 16));
    ix.data = Buffer.from(ix.data.data);
  });
}

async function play() {
  // place order
  const placeOrderTx = await axios.post('http://localhost:3000/serum/orders', {
    market: MARKET,
    side: 'buy',
    price: 20,
    size: 0.1,
    orderType: 'ioc',
  });
  const [placeOrderIx, placeOrderSigners] = placeOrderTx.data;
  deserializeIx(placeOrderIx);

  // settle funds
  const settleTx = await axios.post('http://localhost:3000/serum/settle', {
    market: MARKET,
  });
  const [settleIx, settleSigners] = settleTx.data;
  deserializeIx(settleIx);

  // execute both together
  await getConnection();
  const hash = await prepareAndSendTx(
    [...placeOrderIx, ...settleIx],
    [ownerKp, ...placeOrderSigners, ...settleSigners],
  );
  console.log(hash);
}

play();
