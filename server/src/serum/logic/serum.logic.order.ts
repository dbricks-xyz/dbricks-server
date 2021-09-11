import { Connection, PublicKey } from '@solana/web3.js';
import { Market } from '@project-serum/serum';
import debug from 'debug';
import BN from 'bn.js';
import { Order } from '@project-serum/serum/lib/market';
import {
  ixAndSigners,
  orderType,
  side,
} from '../../common/interfaces/dex/common.interfaces.dex.order';
import { getOrCreateTokenAccByMint } from '../serum.util';

const log: debug.IDebugger = debug('app:serum-logic');

export async function marketToPayer(
  connection: Connection,
  market: Market,
  marketName: string,
  side: side,
  ownerPk: PublicKey,
): Promise<[ixAndSigners, PublicKey]> {
  let tokenIxAndSigners;
  let payerPk;
  const [base, quote] = marketName.split('/');
  if (side === 'buy') {
    [tokenIxAndSigners, payerPk] = await getOrCreateTokenAccByMint(
      connection, market, ownerPk, quote,
    );
  } else {
    [tokenIxAndSigners, payerPk] = await getOrCreateTokenAccByMint(
      connection, market, ownerPk, base,
    );
  }
  return [tokenIxAndSigners, payerPk];
}

export async function prepPlaceOrderTx(
  connection: Connection,
  market: Market,
  side: side,
  price: number,
  size: number,
  orderType: orderType,
  ownerPk: PublicKey,
  payerPk: PublicKey,
): Promise<ixAndSigners> {
  const placeOrderTx = await market.makePlaceOrderTransaction(connection, {
    owner: ownerPk,
    payer: payerPk,
    side,
    price,
    size,
    orderType,
    feeDiscountPubkey: null, // needed to bypass problems on devnet/localnet
  });
  return [
    [...placeOrderTx.transaction.instructions],
    [...placeOrderTx.signers],
  ];
}

export async function prepCancelOrderTx(
  connection: Connection,
  market: Market,
  ownerPk: PublicKey,
  orderId: BN,
): Promise<ixAndSigners> {
  const orders = await market.loadOrdersForOwner(
    connection,
    ownerPk,
  );
  if (orders.length === 0) {
    return [[], []];
  }
  const [order] = orders.filter((o: Order) => {
    if (o.orderId.eq(orderId)) {
      return o;
    }
  });
  const cancelOrderTx = await market.makeCancelOrderTransaction(
    connection,
    ownerPk,
    order,
  );
  return [
    [...cancelOrderTx.instructions],
    [],
  ];
}
