import { Account, Connection, PublicKey } from '@solana/web3.js';
import { Market } from '@project-serum/serum';
import debug from 'debug';
import { ixAndSigners } from '../common/interfaces/dex/common.interfaces.dex.order';
import { SERUM_PROG_ID } from '../config/config';
import SolClient from '../common/client/common.client';
import { getMint, getSerumMarket } from '../config/config.util';

const log: debug.IDebugger = debug('app:serum-logic');

export async function getOrCreateTokenAccByMint(
  connection: Connection,
  market: Market,
  ownerPk: PublicKey,
  mintName: string,
): Promise<[ixAndSigners, PublicKey]> {
  let ixAndSigners: ixAndSigners = [[], []];
  let tokenAccPk: PublicKey;
  if (mintName === 'SOL') {
    return [ixAndSigners, ownerPk];
  }
  const mintPk = getMint(mintName);
  const tokenAccounts = await market.getTokenAccountsByOwnerForMint(
    connection, ownerPk, mintPk,
  );

  if (tokenAccounts.length === 0) {
    log(`Creating token account for mint ${mintName}, ${mintPk.toBase58()}`);
    [ixAndSigners, tokenAccPk] = await SolClient.prepCreateTokenAccTx(ownerPk, mintPk);
  } else {
    tokenAccPk = tokenAccounts[0].pubkey;
  }
  log(`User's account for mint ${mintName} (${mintPk.toBase58()}) is ${tokenAccPk.toBase58()}`);

  return [ixAndSigners, tokenAccPk];
}

export async function loadSerumMarketFromName(
  connection: Connection,
  name: string,
) {
  log(`Market pk for market ${name} is ${getSerumMarket(name)}`);
  return Market.load(connection, getSerumMarket(name), {}, SERUM_PROG_ID);
}

export async function loadSerumMarketFromPk(
  connection: Connection,
  marketPk: PublicKey,
) {
  return Market.load(connection, marketPk, {}, SERUM_PROG_ID);
}

export async function newAccountWithLamports(
  connection: Connection,
  lamports: number = 1000000,
): Promise<Account> {
  const account = new Account();

  let retries = 30;
  await connection.requestAirdrop(account.publicKey, lamports);
  for (;;) {
    await sleep(500);
    if (lamports == (await connection.getBalance(account.publicKey))) {
      return account;
    }
    if (--retries <= 0) {
      break;
    }
  }
  throw new Error(`Airdrop of ${lamports} failed`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function assert(condition: boolean, message?: string) {
  if (!condition) {
    console.log(`${Error().stack}:main.ts`);
    throw message || 'Assertion failed';
  }
}
