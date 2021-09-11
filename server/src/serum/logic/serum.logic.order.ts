import { Connection, PublicKey } from '@solana/web3.js';
import { Market } from '@project-serum/serum';
import debug from 'debug';
import {
  ixAndSigners,
  orderType,
  side,
} from '../../common/interfaces/dex/common.interfaces.dex.order';
import { getOrCreateTokenAccByMint } from '../serum.util';

const log: debug.IDebugger = debug('app:serum-logic');

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
