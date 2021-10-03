import {Keypair} from '@solana/web3.js';
import fs from 'fs';
import {PublicKey} from '@solana/web3.js';
import {DBricksSDK, flattenedBrick, instructionsAndSigners} from 'dbricks-lib';
import {COMMITTMENT, CONNECTION_URL, NETWORK, SERUM_PROG_ID} from '../../config/config';

export function loadKeypairSync(path: string): Keypair {
  const secretKey = JSON.parse(fs.readFileSync(path, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


export function tryGetMintPubkey(name: string): PublicKey | undefined {
  const tokenMints = JSON.parse(fs.readFileSync(`${__dirname}/../data/token-mints.json`, 'utf8'));
  const foundMint = tokenMints.filter((el: any) => {
    if (el.name.toLowerCase() === name.toLowerCase() && el.network === NETWORK) {
      return el;
    }
  })[0];
  return foundMint ? new PublicKey(foundMint.address) : undefined
}

export function tryGetSerumMarketPubkey(name: string): PublicKey | undefined {
  const serumMarkets = JSON.parse(fs.readFileSync(`${__dirname}/../data/markets.json`, 'utf8'));
  const foundMarket = serumMarkets.filter((el: any) => {
    if (el.name.toLowerCase() === name.toLowerCase() && el.programId === SERUM_PROG_ID.toBase58()) {
      return el;
    }
  })[0];
  return foundMarket ? new PublicKey(foundMarket.address) : undefined
}

export function tryGetMintName(mintPubkey: string): string | undefined {
  const tokenMints = JSON.parse(fs.readFileSync(`${__dirname}/../data/token-mints.json`, 'utf8'));
  const foundMint = tokenMints.filter((el: any) => {
    if (el.address.toLowerCase() === mintPubkey.toLowerCase() && el.network === NETWORK) {
      return el;
    }
  })[0];
  return foundMint ? foundMint.name : undefined
}

export function tryGetSerumMarketName(marketPubkey: string): string | undefined {
  const serumMarkets = JSON.parse(fs.readFileSync(`${__dirname}/../data/markets.json`, 'utf8'));
  const foundMarket = serumMarkets.filter((el: any) => {
    if (el.address.toLowerCase() === marketPubkey.toLowerCase() && el.programId === SERUM_PROG_ID.toBase58()) {
      return el;
    }
  })[0];
  return foundMarket ? foundMarket.name : undefined
}

/**
 * NOTE: deduplicates signers, but not instructions.
 * This is because instructions can repeat (eg 2 place orders), but signers can't
 */
export function mergeInstructionsAndSigners(
  x: instructionsAndSigners,
  y: instructionsAndSigners
): instructionsAndSigners {
  const result: instructionsAndSigners = {instructions: [], signers: []};
  result.instructions = [...x.instructions, ...y.instructions];
  result.signers = [...x.signers];
  y.signers.forEach(ysigner => {
    if (result.signers.indexOf(ysigner) === -1) {
      result.signers.push(ysigner)
    }
  });
  return result;
}
/**
 * NOTE: Function assumes no signers are provided
 * This is used to ensure batch cancels don't exceed the Transaction size limit
 */
export async function splitInstructionsAndSigners(instructionsAndSigners: instructionsAndSigners) {
  // the next steps are needed in case there are too many orders to cancel in a single Transaction
  const flattenedBricks: flattenedBrick[] = instructionsAndSigners.instructions.map((i) => ({
    id: 0,
    description: '',
    instructionsAndSigners: {
      instructions: [i],
      signers: [],
    } as instructionsAndSigners,
  }));
  const sizedBricks = await (new DBricksSDK(CONNECTION_URL, COMMITTMENT)).findOptimalBrickSize(
    flattenedBricks,
    new PublicKey('75ErM1QcGjHiPMX7oLsf9meQdGSUs4ZrwS2X8tBpsZhA'), // doesn't matter what Pk is passed here
  );
  return sizedBricks.map((brick) => ({
    instructions: brick.transaction.instructions,
    signers: [],
  } as instructionsAndSigners));
}