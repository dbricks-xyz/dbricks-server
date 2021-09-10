import { Connection, PublicKey } from '@solana/web3.js';
import { Market } from '@project-serum/serum';
import debug from 'debug';
import {
  getMint,
  getSerumMarket,
  SERUM_PROG_ID,
} from '../../constants/constants';
import {
  ixAndSigners,
  orderType,
  side,
} from '../../common/interfaces/dex/dex.order.interface';
import SolClient from '../../common/logic/client';

const log: debug.IDebugger = debug('app:serum-logic');

async function getOrCreateTokenAccByMint(
  connection: Connection,
  market: Market,
  ownerPk: PublicKey,
  mintName: string,
): Promise<[ ixAndSigners, PublicKey ]> {
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

export async function loadSerumMarket(
  connection: Connection,
  name: string,
) {
  log(`Market pk for market ${name} is ${getSerumMarket(name)}`);
  return Market.load(connection, getSerumMarket(name), {}, SERUM_PROG_ID);
}

export async function prepPlaceOrderV3Tx(
  connection: Connection,
  market: Market,
  marketName: string,
  side: side,
  price: number,
  size: number,
  orderType: orderType,
  ownerPk: PublicKey,
): Promise<ixAndSigners> {
  // log('ownerPk is ', ownerPk.toBase58());
  const [base, quote] = marketName.split('/');
  let tokenIxAndSigners;
  let payerPk;
  if (side === 'buy') {
    [tokenIxAndSigners, payerPk] = await getOrCreateTokenAccByMint(
      connection, market, ownerPk, quote,
    );
  } else {
    [tokenIxAndSigners, payerPk] = await getOrCreateTokenAccByMint(
      connection, market, ownerPk, base,
    );
  }
  const placeOrderTx = await market.makePlaceOrderTransaction(connection, {
    owner: ownerPk,
    payer: payerPk,
    side,
    price,
    size,
    orderType,
  });
  // log(`token ix: ${tokenIxAndSigners[0]}`);
  // log(`order ix: ${placeOrderTx.transaction.instructions}`);
  // log(`token signers: ${tokenIxAndSigners[1]}`);
  // log(`order signers: ${placeOrderTx.signers}`);
  return [
    [...tokenIxAndSigners[0], ...placeOrderTx.transaction.instructions],
    [...tokenIxAndSigners[1], ...placeOrderTx.signers],
  ];
}

export async function prepSettleFundsTx(
  connection: Connection,
  market: Market,
  marketName: string,
  ownerPk: PublicKey,
): Promise<ixAndSigners> {
  const [base, quote] = marketName.split('/');
  const [ownerBaseIxAndSigners, ownerBasePk] = await getOrCreateTokenAccByMint(
    connection, market, ownerPk, base,
  );
  const [ownerQuoteIxAndSigners, ownerQuotePk] = await getOrCreateTokenAccByMint(
    connection, market, ownerPk, quote,
  );
  // todo currently this will fail if this is the first ever trade for this user in this market
  // this means the 1st trade won't settle and we have to run this twice to actually settle it
  const openOrdersAccounts = await market.findOpenOrdersAccountsForOwner(
    connection, ownerPk,
  );
  if (openOrdersAccounts.length === 0) {
    return [[], []];
  }
  const settleFundsTx = await market.makeSettleFundsTransaction(
    connection,
    openOrdersAccounts[0],
    ownerBasePk,
    ownerQuotePk,
  );
  return [
    [
      ...ownerBaseIxAndSigners[0],
      ...ownerQuoteIxAndSigners[0],
      ...settleFundsTx.transaction.instructions,
    ],
    [...ownerBaseIxAndSigners[1], ...ownerQuoteIxAndSigners[1], ...settleFundsTx.signers],
  ];
}
