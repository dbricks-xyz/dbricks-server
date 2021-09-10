import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, Keypair } from '@solana/web3.js';
import { Market } from '@project-serum/serum';
import debug from 'debug';
import {
  getMint,
  getSerumMarket,
  SERUM_PROG_ID,
} from '../../constants/constants';

const log: debug.IDebugger = debug('app:serum-logis');

async function getTokenAccByMint(
  connection: Connection,
  market: Market,
  ownerKp: Keypair,
  mintName: string,
) {
  if (mintName === 'SOL') {
    return ownerKp.publicKey;
  }
  const mintPk = getMint(mintName);
  const tokenAccounts = await market.getTokenAccountsByOwnerForMint(
    connection, ownerKp.publicKey, mintPk,
  );

  if (tokenAccounts.length === 0) {
    log(`Creating token account for mint ${mintName}, ${mintPk.toBase58()}`);
    const mint = new Token(connection, mintPk, TOKEN_PROGRAM_ID, ownerKp);
    // todo this really should be an instruction and bundled into the same tx
    return mint.createAccount(ownerKp.publicKey);
  }
  log(`User's account for mint ${mintName} (${mintPk.toBase58()}) is ${tokenAccounts[0].pubkey.toBase58()}`);

  return tokenAccounts[0].pubkey;
}

export async function loadSerumMarket(
  connection: Connection,
  name: string,
) {
  log(`Market pk for market ${name} is ${getSerumMarket(name)}`);
  return Market.load(connection, getSerumMarket(name), {}, SERUM_PROG_ID);
}

// todo import from interface
type side = 'buy' | 'sell';
type orderType = 'limit' | 'ioc' | 'postOnly' | undefined;

export async function getNewOrderV3Tx(
  connection: Connection,
  market: Market,
  marketName: string,
  ownerKp: Keypair,
  side: side,
  price: number,
  size: number,
  orderType: orderType,
) {
  const [base, quote] = marketName.split('/');
  let payer;
  if (side == 'buy') {
    payer = await getTokenAccByMint(connection, market, ownerKp, quote);
  } else {
    payer = await getTokenAccByMint(connection, market, ownerKp, base);
  }
  return market.makePlaceOrderTransaction(connection, {
    owner: ownerKp as any,
    payer,
    side,
    price,
    size,
    orderType,
  });
}

export async function getSettleFundsTx(
  connection: Connection,
  market: Market,
  ownerKp: Keypair,
  marketName: string,
) {
  const [base, quote] = marketName.split('/');
  const baseWallet = await getTokenAccByMint(connection, market, ownerKp, base);
  const quoteWallet = await getTokenAccByMint(connection, market, ownerKp, quote);
  // todo currently this will fail if this is the first ever trade for this user in this market
  // this means the 1st trade won't settle and we have to run this twice to actually settle it
  const openOrdersAccounts = await market.findOpenOrdersAccountsForOwner(
    connection, ownerKp.publicKey,
  );
  if (openOrdersAccounts.length === 0) {
    return;
  }
  return market.makeSettleFundsTransaction(
    connection,
    openOrdersAccounts[0],
    baseWallet,
    quoteWallet,
  );
}
