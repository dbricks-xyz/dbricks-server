import {Keypair} from '@solana/web3.js';
import fs from 'fs';
import {PublicKey} from '@solana/web3.js';
import {NETWORK, SERUM_PROG_ID} from "../../config/config";
import {ixsAndSigners} from "dbricks-lib";

export function loadKpSync(path: string): Keypair {
  const secretKey = JSON.parse(fs.readFileSync(path, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


export function tryGetMintPk(name: string): PublicKey | undefined {
  const tokenMints = JSON.parse(fs.readFileSync(`${__dirname}/../data/token-mints.json`, 'utf8'));
  const foundMint = tokenMints.filter((el: any) => {
    if (el.name.toLowerCase() === name.toLowerCase() && el.network === NETWORK) {
      return el;
    }
  })[0];
  return foundMint ? new PublicKey(foundMint.address) : undefined
}

export function tryGetSerumMarketPk(name: string): PublicKey | undefined {
  const serumMarkets = JSON.parse(fs.readFileSync(`${__dirname}/../data/markets.json`, 'utf8'));
  const foundMarket = serumMarkets.filter((el: any) => {
    if (el.name.toLowerCase() === name.toLowerCase() && el.programId === SERUM_PROG_ID.toBase58()) {
      return el;
    }
  })[0];
  return foundMarket ? new PublicKey(foundMarket.address) : undefined
}

export function tryGetMintName(mintPk: string): string | undefined {
  const tokenMints = JSON.parse(fs.readFileSync(`${__dirname}/../data/token-mints.json`, 'utf8'));
  const foundMint = tokenMints.filter((el: any) => {
    if (el.address.toLowerCase() === mintPk.toLowerCase() && el.network === NETWORK) {
      return el;
    }
  })[0];
  return foundMint ? foundMint.name : undefined
}

export function tryGetSerumMarketName(marketPk: string): string | undefined {
  const serumMarkets = JSON.parse(fs.readFileSync(`${__dirname}/../data/markets.json`, 'utf8'));
  const foundMarket = serumMarkets.filter((el: any) => {
    if (el.address.toLowerCase() === marketPk.toLowerCase() && el.programId === SERUM_PROG_ID.toBase58()) {
      return el;
    }
  })[0];
  return foundMarket ? foundMarket.name : undefined
}

export function mergeIxsAndSigners(x: ixsAndSigners, y: ixsAndSigners): ixsAndSigners {
  const result = x;
  y.ixs.forEach(yix => {
    if (result.ixs.indexOf(yix) === -1) {
      result.ixs.push(yix)
    }
  });
  y.signers.forEach(ysigner => {
    if (result.signers.indexOf(ysigner) === -1) {
      result.signers.push(ysigner)
    }
  });
  return result;
}