import { ZERO_BN } from '@blockworks-foundation/mango-client';
import { Market, OpenOrders } from '@project-serum/serum';
import { PublicKey } from '@solana/web3.js';
import { SERUM_PROG_ID } from '../../src/config/config';
import MangoTester from './mango.tester';

const tester = new MangoTester();

describe('Mango', () => {
  it('Can init Mango Group', async () => {
    await tester.setupLocalForTests();
  });

  it('Can create a MangoAccount by depositing', async () => {
    // verify that user 2 has no mango accounts, and thus no deposits
    const beforeMangoAccts = await tester.loadUserAccounts(tester.user2Pk);
    expect(beforeMangoAccts.length === 0);

    // deposit and create an account
    await tester.depositTxn(tester.baseMint.publicKey, '1', tester.user2Kp);

    // verify that there is a mangoAccount with 1 coin in it
    const amount = await tester.getTokenAmount(tester.user2Pk, 0, 1);
    expect(amount).toBeGreaterThanOrEqual(0.999999);
  });

  it('Can deposit into an existing MangoAccount', async () => {
    const beforeTokenAmount = await tester.getTokenAmount(tester.user2Pk, 0, 1);
    expect(beforeTokenAmount).toBeGreaterThanOrEqual(0.999999);

    // deposit
    await tester.depositTxn(tester.baseMint.publicKey, '1000', tester.user2Kp);

    // verify that there is a mangoAccount with 1 coin in it
    const afterTokenAmount = await tester.getTokenAmount(tester.user2Pk, 0, 1);
    expect(afterTokenAmount).toBeGreaterThanOrEqual(1000.999999);
    expect(afterTokenAmount - beforeTokenAmount).toBeGreaterThanOrEqual(999.999999);
  });

  it('Can withdraw from an existing MangoAccount', async () => {
    const beforeTokenAmount = await tester.getTokenAmount(tester.user2Pk, 0, 1);
    expect(beforeTokenAmount).toBeGreaterThanOrEqual(1000.999999);

    // withdraw
    await tester.withdrawTxn(tester.baseMint.publicKey, '10', tester.user2Kp, false);

    // verify withdrawal
    const afterTokenAmount = await tester.getTokenAmount(tester.user2Pk, 0, 1);
    expect(afterTokenAmount).toBeLessThanOrEqual(9991);
    expect(afterTokenAmount - beforeTokenAmount).toBeLessThanOrEqual(-9.999999);
  });

  it('Can borrow QUOTE with BASE as collateral', async () => {
    // user 1 deposits so that there is something to borrow
    await tester.depositTxn(tester.quoteMint.publicKey, '1000', tester.user1Kp);

    // user 2 borrows via withdraw
    await tester.withdrawTxn(tester.quoteMint.publicKey, '10', tester.user2Kp, true);

    // verify borrow
    const userTokenAccount = await tester.getTokenAccsForOwner(
      tester.user2Pk,
      tester.quoteMint.publicKey,
    );
    expect(userTokenAccount[0].amount === 10);
  });

  it('Can place orders', async () => {
    const mangoAcc = await tester.loadMangoAccForOwner(tester.user2Pk, 0);
    const openOrdersAccs = mangoAcc.spotOpenOrdersAccounts.filter((oo) => oo !== undefined);
    expect(openOrdersAccs.length).toBe(0);

    await tester.placeSpotOrderTxn(tester.marketKp.publicKey, 'buy', '1', '5', 'limit', tester.user2Kp);
    await tester.keeperUpdateAll();
    await tester.loadGroup();

    await mangoAcc.reload(tester.connection, SERUM_PROG_ID);
    const updatedOrders = mangoAcc.spotOpenOrdersAccounts[1]?.orders.filter(
      (oo) => !oo.eq(ZERO_BN),
    );
    expect(updatedOrders?.length).toBe(1);
  });

  // it('Can cancel a single order', async () => {
  //   const mangoAcc = await tester.loadMangoAccForOwner(tester.user2Pk, 0);
  //   const orders = mangoAcc.spotOpenOrdersAccounts[1]?.orders.filter((oo) => !oo.eq(ZERO_BN));
  //   expect(orders?.length).toBe(1);
  //   if (orders === undefined) {
  //     throw new Error('There should be an order to cancel');
  //   }

  //   const orderIdHexString = orders[0].toString('hex');
  //   await tester.placeCancelOrderTxn(tester.marketKp.publicKey, orderIdHexString, tester.user2Kp);
  //   await tester.keeperUpdateAll();
  //   await tester.loadGroup();

  //   await mangoAcc.reload(tester.connection, SERUM_PROG_ID);
  //   // why no cancel??
  //   const updatedOrders = mangoAcc.spotOpenOrdersAccounts[1]?.orders.filter(
  //     (oo) => !oo.eq(ZERO_BN),
  //   );
  //   expect(updatedOrders?.length).toBe(0);
  // });

  // it can cancel multiple orders at once


  
  // take other side and settle -> need to crank
  // await tester.placeSpotOrderTxn(tester.marketKp.publicKey, 'buy', '1', '11', 'limit', tester.user2Kp);
  
  // same with perps??

});
