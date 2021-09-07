require('dotenv').config()

import {
    Account,
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
    Signer,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import fs from 'fs'
import {CONNECTION_URL, getMint, getSerumMarket} from "./constants/constants";


// ============================================================================= globals & consts
let connection: Connection;

//todo later these will come from the wallet
const secretKey = JSON.parse(fs.readFileSync('/Users/ilmoi/.config/solana/id.json', 'utf8'));
const payer = Keypair.fromSecretKey(Uint8Array.from(secretKey));
let payerUSDC = new PublicKey("E1trhd2juz39n6kQ1eLR5j6QCkSQk6UY1GL9EnUYKdSz");
let payerSRM = new PublicKey("4JAWe2S5TYTAzoEz66PJdANfB3T22Ais92BrnSPtvh3X");
let payerUSDT = new PublicKey("CZw4hjxANmmdSzNpYgNnaZujm3CGejd9irhsUK3kQ2JD");

// ============================================================================= helpers

async function getConnection() {
    connection = new Connection(CONNECTION_URL);
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', CONNECTION_URL, version);
}

async function prepareAndSendTx(instructions: TransactionInstruction[], signers: Signer[]) {
    const tx = new Transaction().add(...instructions);
    const sig = await sendAndConfirmTransaction(connection, tx, signers);
    console.log(sig);
}

// ============================================================================= play

async function play() {
    await getConnection();
    
}

play()
