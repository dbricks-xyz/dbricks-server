import { Connection, PublicKey } from '@solana/web3.js';
import { Market } from '@project-serum/serum';
import debug from 'debug';
import { ixAndSigners } from '../../common/interfaces/dex/common.interfaces.dex.order';
import { getOrCreateTokenAccByMint } from '../serum.util';

const log: debug.IDebugger = debug('app:serum-logic');

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
