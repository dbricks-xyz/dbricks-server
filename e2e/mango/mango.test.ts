import { getMultipleAccounts, zeroKey, ZERO_BN } from '@blockworks-foundation/mango-client';
import { Market, OpenOrders } from '@project-serum/serum';
import { PublicKey } from '@solana/web3.js';
import { SERUM_PROG_ID } from '../../src/config/config';
import { pause } from '../common/e2e.common';
import MangoTester from './mango.tester';

const tester = new MangoTester();

describe('Mango', () => {
  it('Can init Mango Group', async () => {
    await tester.setupLocalForTests();
  });
});

describe('Mango', () => {
  it('Can create a MangoAccount by depositing', async () => {
  // verify that user 2 has no mango accounts, and thus no deposits
    const beforeMangoAccts = await tester.loadUserAccounts(tester.user2Pk);
    expect(beforeMangoAccts.length === 0);

    // deposit and create an account
    await tester.deposit(tester.baseMint.publicKey, '1', tester.user2Kp);

    // verify that there is a mangoAccount with 1 coin in it
    const amount = await tester.getTokenAmount(tester.user2Pk, 0, 1);
    expect(amount).toBeGreaterThanOrEqual(0.999999);
    expect(amount).toBeLessThanOrEqual(1);
  });
});

describe('Mango', () => {
  it('Can deposit into an existing MangoAccount', async () => {
    const beforeTokenAmount = await tester.getTokenAmount(tester.user2Pk, 0, 1);
    expect(beforeTokenAmount).toBeGreaterThanOrEqual(0.999999);
    expect(beforeTokenAmount).toBeLessThanOrEqual(1);

    // deposit
    await tester.deposit(tester.baseMint.publicKey, '1000', tester.user2Kp);

    // verify that there is a mangoAccount with 1 coin in it
    const afterTokenAmount = await tester.getTokenAmount(tester.user2Pk, 0, 1);
    expect(afterTokenAmount).toBeGreaterThanOrEqual(1000.999999);
    expect(afterTokenAmount).toBeLessThanOrEqual(1001);
    expect(afterTokenAmount - beforeTokenAmount).toBeGreaterThanOrEqual(999.999999);
    expect(afterTokenAmount - beforeTokenAmount).toBeLessThanOrEqual(1000);
  });
});

describe('Mango', () => {
  it('Can withdraw from an existing MangoAccount', async () => {
    const beforeTokenAmount = await tester.getTokenAmount(tester.user2Pk, 0, 1);
    expect(beforeTokenAmount).toBeGreaterThanOrEqual(1000.999999);
    expect(beforeTokenAmount).toBeLessThanOrEqual(1001);

    // withdraw
    await tester.withdraw(tester.baseMint.publicKey, '10', tester.user2Kp, false);

    // verify withdrawal
    const afterTokenAmount = await tester.getTokenAmount(tester.user2Pk, 0, 1);
    expect(afterTokenAmount).toBeLessThanOrEqual(991);
    expect(afterTokenAmount).toBeGreaterThanOrEqual(990.999);
    expect(afterTokenAmount - beforeTokenAmount).toBeLessThanOrEqual(-9.999999);
    expect(afterTokenAmount - beforeTokenAmount).toBeGreaterThanOrEqual(-10);
  });
});

describe('Mango', () => {
  it('Can borrow QUOTE with BASE as collateral', async () => {
    // user 1 deposits so that there is something to borrow
    await tester.deposit(tester.quoteMint.publicKey, '1000', tester.user1Kp);

    // user 2 borrows via withdraw
    await tester.withdraw(tester.quoteMint.publicKey, '10', tester.user2Kp, true);

    // verify borrow
    const userTokenAccount = await tester.getTokenAccsForOwner(
      tester.user2Pk,
      tester.quoteMint.publicKey,
    );
    expect(userTokenAccount[0].amount === 10);
  });
});

describe('Mango', () => {
  it('Can place orders', async () => {
    const mangoAcc = await tester.loadMangoAccForOwner(tester.user2Pk, 0);
    const openOrdersAccs = mangoAcc.spotOpenOrdersAccounts.filter((oo) => oo !== undefined);
    expect(openOrdersAccs.length).toBe(0);

    await tester.placeSpotOrder(tester.marketKp.publicKey, 'buy', '1', '5', 'limit', tester.user2Kp);
    // await tester.keeperUpdateAll(); // NECESSARY?
    // await tester.loadGroup();

    await mangoAcc.reload(tester.connection, SERUM_PROG_ID);
    const updatedOrders = mangoAcc.spotOpenOrdersAccounts[1]?.orders.filter(
      (oo) => !oo.eq(ZERO_BN),
    );

    expect(updatedOrders?.length).toBe(1);
  });
});



// const ooPk = mangoAcc.spotOpenOrdersAccounts[1]?.publicKey;
// if (!ooPk) {
//   throw new Error('aaa');
// }

// const market = await Market.load(tester.connection, tester.marketKp.publicKey, {}, SERUM_PROG_ID);

// const accounts = await getMultipleAccounts(
//   tester.connection,
//   mangoAcc.spotOpenOrders.filter((pk) => !pk.equals(zeroKey)),
// );

// console.log(mangoAcc.spotOpenOrdersAccounts[1]);

// const oog = await market.findOpenOrdersAccountsForOwner(
//   tester.connection,
//   ooPk,
// );

// const own = await market.findOpenOrdersAccountsForOwner(
//   tester.connection,
//   tester.user2Kp.publicKey,
// );

// const owl = await market.findOpenOrdersAccountsForOwner(
//   tester.connection,
//   mangoAcc.publicKey,
// );

// await tester._consumeEvents(market, tester.user2Kp);

// const oog = await market.loadOrdersForOwner(
//   tester.connection,
//   ooPk,
// );

// const own = await market.loadOrdersForOwner(
//   tester.connection,
//   tester.user2Kp.publicKey,
// );

// const owl = await market.loadOrdersForOwner(
//   tester.connection,
//   mangoAcc.publicKey,
// );

// const {
//   allMarketConfigs, allMarketAccountInfos, mangoGroupConfig,
// } = await tester.getAllMarketInfos();
// console.log(allMarketAccountInfos);

// console.log(`open orders pubkey: ${ooPk.toBase58()}`);
// console.log(` market pubkey: ${tester.marketKp.publicKey.toBase58()}`);
// console.log(tester.user2Kp.publicKey.toBase58());
// console.log(mangoAcc.publicKey.toBase58());
// console.log(oog);
// console.log(own);
// console.log(owl);












  // it('Can cancel a single order', async () => {
  //   const mangoAcc = await tester.loadMangoAccForOwner(tester.user2Pk, 0);
  //   console.log(mangoAcc.orders);
  //   const orders = mangoAcc.spotOpenOrdersAccounts[1]?.orders.filter((oo) => !oo.eq(ZERO_BN));
  //   expect(orders?.length).toBe(1);
  //   if (orders === undefined) {
  //     throw new Error('There should be an order to cancel');
  //   }

  //   const ooPk = mangoAcc.spotOpenOrdersAccounts[1]?.publicKey;
  //   if (!ooPk) {
  //     throw new Error('fuq');
  //   }
  //   const market = await Market.load(tester.connection, tester.marketKp.publicKey, {}, SERUM_PROG_ID);

  //   const orderIdHexString = orders[0].toString('hex');
  //   await tester.placeCancelOrderTxn(tester.marketKp.publicKey, orderIdHexString, tester.user2Kp);
  //   await tester.keeperUpdateAll();
  //   // await tester._consumeEvents(market, tester.user2Kp);
  //   await tester.loadGroup();


  //   await mangoAcc.reload(tester.connection, SERUM_PROG_ID);
  //   // why no cancel??
  //   const updatedOrders = mangoAcc.spotOpenOrdersAccounts[1]?.orders.filter(
  //     (oo) => !oo.eq(ZERO_BN),
  //   );
  //   // console.log(mangoAcc.loa);
  //   // console.log(tester.user2Kp.publicKey.toBase58());
  //   expect(updatedOrders?.length).toBe(0);
  // });

  // it can cancel multiple orders at once



  // take other side and settle -> need to crank
  // await tester.placeSpotOrderTxn(tester.marketKp.publicKey, 'buy', '1', '11', 'limit', tester.user2Kp);

  // same with perps??