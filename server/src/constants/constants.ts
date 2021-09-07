import {PublicKey} from "@solana/web3.js";
import fs from "fs";

export let SERUM_PROG_ID: PublicKey;
export let SABER_PROG_ID: PublicKey;
export let MANGO_PROG_ID: PublicKey;
export let CONNECTION_URL: string;

if (process.env.NETWORK === 'mainnet') {
    SERUM_PROG_ID = new PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin");
    SABER_PROG_ID = new PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
    MANGO_PROG_ID = new PublicKey("5fNfvyp5czQVX77yoACa3JJVEhdRaWjPuazuWgjhTqEH");
    CONNECTION_URL = 'https://solana-api.projectserum.com'; //a little faster than solana's original one

} else if (process.env.NETWORK === 'devnet') {
    SERUM_PROG_ID = new PublicKey("DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY");
    SABER_PROG_ID = new PublicKey("Crt7UoUR6QgrFrN7j8rmSQpUTNWNSitSwWvsWGf1qZ5t");
    MANGO_PROG_ID = new PublicKey("9XzhtAtDXxW2rjbeVFhTq4fnhD8dqzr154r5b2z6pxEp");
    CONNECTION_URL = 'https://api.devnet.solana.com';

} else {
    throw `Network unrecognized. Should be mainnet or devnet. Currently: ${process.env.NETWORK}`
}

export function getMint(name: string) {
    const tokenMints = JSON.parse(fs.readFileSync('./src/constants/token-mints.json', 'utf8'));
    const targetMint = tokenMints.filter((i: any) => {
        if (i.name.toLowerCase() === name.toLowerCase() && i.network === process.env.NETWORK) {
            return i
        }
    })
    if (targetMint.length === 0) {
        throw `Mint with name ${name} and network ${process.env.NETWORK} not found`
    }
    return targetMint[0].address
}

export function getSerumMarket(name: string) {
    const serumMarkets = JSON.parse(fs.readFileSync('./src/constants/markets.json', 'utf8'));
    const targetMarket = serumMarkets.filter((m: any) => {
        if (m.name.toLowerCase() === name.toLowerCase() && m.programId === SERUM_PROG_ID.toBase58()) {
            return m
        }
    })
    if (targetMarket.length === 0) {
        throw `Market with name ${name} and network ${process.env.NETWORK} not found`
    } else if (targetMarket[0].deprecated) {
        throw `Market with name ${name} and network ${process.env.NETWORK} is deprecated`
    }
    return targetMarket[0].address
}