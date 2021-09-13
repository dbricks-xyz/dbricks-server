import fs from 'fs';
import { PublicKey } from '@solana/web3.js';
import { NETWORK, SERUM_PROG_ID } from './config';

export function getMint(name: string) {
  const tokenMints = JSON.parse(fs.readFileSync(`${__dirname}/data/token-mints.json`, 'utf8'));
  const targetMint = tokenMints.filter((i: any) => {
    if (i.name.toLowerCase() === name.toLowerCase() && i.network === NETWORK) {
      return i;
    }
  });
  if (targetMint.length === 0) {
    throw new Error(`Mint with name ${name} and network ${NETWORK} not found`);
  }
  return new PublicKey(targetMint[0].address);
}

export function getSerumMarket(name: string) {
  const serumMarkets = JSON.parse(fs.readFileSync(`${__dirname}/data/markets.json`, 'utf8'));
  const targetMarket = serumMarkets.filter((m: any) => {
    if (m.name.toLowerCase() === name.toLowerCase() && m.programId === SERUM_PROG_ID.toBase58()) {
      return m;
    }
  });
  if (targetMarket.length === 0) {
    throw new Error(`Market with name ${name} and network ${NETWORK} not found`);
  } else if (targetMarket[0].deprecated) {
    throw new Error(`Market with name ${name} and network ${NETWORK} is deprecated`);
  }
  return new PublicKey(targetMarket[0].address);
}
