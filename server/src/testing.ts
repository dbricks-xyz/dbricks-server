require('dotenv').config()

import { fetchMangoAccounts, getMangoClient } from "./bricks/mango";
import {
    Connection,
    Keypair,
    sendAndConfirmTransaction,
    Signer,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import fs from 'fs';
import {CONNECTION_URL} from "./constants/constants";

let connection: Connection;

export async function getConnection() {
    connection = new Connection(CONNECTION_URL, 'processed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', CONNECTION_URL, version);
}

// ============================================================================= helpers

async function prepareAndSendTx(instructions: TransactionInstruction[], signers: Signer[]) {
    const tx = new Transaction().add(...instructions);
    const sig = await sendAndConfirmTransaction(connection, tx, signers);
    console.log(sig);
}

async function play() {
    await getConnection();
    // await getTokenAccsForOwner(connection, ownerKp);
    await getMangoClient();
    const accounts = await fetchMangoAccounts();
    console.log(accounts?.length);
}

play()
