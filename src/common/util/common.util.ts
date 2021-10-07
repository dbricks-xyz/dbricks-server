import {Keypair, PublicKey} from '@solana/web3.js';
import fs from 'fs';
import {
  Action,
  Builder,
  IFlattenedBrick,
  instructionsAndSigners,
  Protocol
} from '@dbricks/dbricks-ts';
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
 * Keeps splitting the transaction until appropriate size found
 */
export async function splitInstructionsAndSigners(
  instructionsAndSigners: instructionsAndSigners
): Promise<instructionsAndSigners[]> {
  const flattenedBricks: IFlattenedBrick[] = instructionsAndSigners.instructions.map(i => {
    return {
      protocol: Protocol.Serum, //it doesn't matter which protocol is passed here
      action: Action.Serum.CancelOrder, //it doesn't matter which action is passed here
      instructionsAndSigners: {
        instructions: [i],
        signers: []
      } as instructionsAndSigners
    }
  })
  //we need to pass some publicKey to instantiate the builder, here it doesn't matter which
  const ownerPubkey = new PublicKey("75ErM1QcGjHiPMX7oLsf9meQdGSUs4ZrwS2X8tBpsZhA");
  const builder = new Builder({
    ownerPubkey,
    connectionUrl: CONNECTION_URL,
    committment: COMMITTMENT,
  });
  const sizedBricks = await builder.optimallySizeBricks(flattenedBricks);
  return sizedBricks.map(brick => {
    return {
      instructions: brick.transaction.instructions,
      signers: [],
    } as instructionsAndSigners;
  })
}