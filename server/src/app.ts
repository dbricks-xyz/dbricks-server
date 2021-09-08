require('dotenv').config()

import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {
    getNewOrderV3Tx,
    getSettleFundsTx,
    loadSerumMarket
} from "./bricks/serum";
import {
    Connection,
    Keypair,
    sendAndConfirmTransaction,
    Signer,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import fs from 'fs'
import {CONNECTION_URL} from "./constants/constants";

let connection: Connection;

// ============================================================================= helpers

async function getConnection() {
    connection = new Connection(CONNECTION_URL, 'processed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', CONNECTION_URL, version);
}

async function prepareAndSendTx(instructions: TransactionInstruction[], signers: Signer[]) {
    const tx = new Transaction().add(...instructions);
    const sig = await sendAndConfirmTransaction(connection, tx, signers);
    console.log(sig);
}

async function getTokenAccsForOwner(
    connection: Connection,
    ownerKp: Keypair,
) {
    const payerAccs = await connection.getParsedTokenAccountsByOwner(
        ownerKp.publicKey,
        {
            programId: TOKEN_PROGRAM_ID,
        }
    )
    payerAccs.value.forEach(a => {
        console.log('// ---------------------------------------')
        console.log(a.pubkey.toBase58())
        console.log(a.account.data.parsed.info)
    })
}

// ============================================================================= play

const BASE = 'SRM';
const QUOTE = 'USDC';
const MARKET = `${BASE}/${QUOTE}`;

const secretKey = JSON.parse(fs.readFileSync('/Users/ilmoi/.config/solana/id.json', 'utf8'));
const ownerKp = Keypair.fromSecretKey(Uint8Array.from(secretKey));

// works for √SOL, √tokens that already have an acc, √tokens that don't
async function serumTradeAndSettle() {
    const market = await loadSerumMarket(connection, MARKET);
    const tradeTx = await getNewOrderV3Tx(
        connection,
        market,
        MARKET,
        ownerKp,
        'sell',
        0.1,
        0.1,
        'ioc'
    );
    const settleTx = await getSettleFundsTx(
        connection,
        market,
        ownerKp,
        MARKET,
    );
    const settleIx = settleTx ? settleTx.transaction.instructions : []
    const settleSigners = settleTx ? settleTx.signers : []
    await prepareAndSendTx(
        [
            ...tradeTx.transaction.instructions,
            ...settleIx,
        ],
        [
            ownerKp,
            ...tradeTx.signers,
            ...settleSigners,
        ]
    )
}

async function play() {
    await getConnection();
    // await getTokenAccsForOwner(connection, ownerKp);
    await serumTradeAndSettle();
}

play()
