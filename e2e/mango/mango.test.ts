import { getMultipleAccounts, zeroKey } from '@blockworks-foundation/mango-client';
import { publicKey } from '@project-serum/anchor/dist/utils';
import { Market, OpenOrders } from '@project-serum/serum';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { SERUM_PROG_ID } from '../../src/config/config';
import MangoTester from './mango.tester';

const tester = new MangoTester();
const BASE = 1; // Token index in Mango
const QUOTE = 15; // Token index in Mango

describe('Mango', () => {
  // √ Initializes everything needed to run mango locally
  it('Can init Mango Group', async () => {
    await tester.setupLocalForTests();
  });
});

describe('Mango', () => {
  // √ Tests depositing and creating mangoAccount
  // √ Tests depositing to an already existing mangoAccount
  it('Can deposit into a MangoAccount', async () => {
  // verify that user 2 has no mango accounts, and thus no deposits
    const beforeMangoAccounts = await tester.loadUserAccounts(tester.user2Pubkey);
    expect(beforeMangoAccounts.length === 0);

    // deposit and create an account
    await tester.deposit(tester.baseMint.publicKey, '1', tester.user2Keypair);

    // verify that there is a mangoAccount with 1 coin in it
    await tester.verifyAmount(tester.user2Pubkey, 1, BASE);

    // deposit
    await tester.deposit(tester.baseMint.publicKey, '9999', tester.user2Keypair);

    // verify new balance
    await tester.verifyAmount(tester.user2Pubkey, 10000, BASE);
  });
});

describe('Mango', () => {
  // √ Tests withdrawing tokens
  it('Can withdraw from an existing MangoAccount', async () => {
    await tester.verifyAmount(tester.user2Pubkey, 10000, BASE);

    // withdraw
    await tester.withdraw(tester.baseMint.publicKey, '100', tester.user2Keypair, false);

    // verify withdrawal
    const user2BaseAccount = await tester.getTokenAccountsForOwner(
      tester.user2Pubkey,
      tester.quoteMint.publicKey,
    );
    expect(user2BaseAccount[0].amount === 100);
    await tester.verifyAmount(tester.user2Pubkey, 9900, BASE);
  });
});

describe('Mango', () => {
  // √ Tests borrowing tokens via withdrawal
  it('Can borrow QUOTE with BASE as collateral', async () => {
    // user 1 deposits so that there is something to borrow
    await tester.deposit(tester.quoteMint.publicKey, '10000', tester.user1Keypair);

    await tester.verifyAmount(tester.user1Pubkey, 10000, QUOTE);
    await tester.verifyAmount(tester.user2Pubkey, 9900, BASE);

    // user 2 borrows 10 QUOTE via withdraw
    await tester.withdraw(tester.quoteMint.publicKey, '100', tester.user2Keypair, true);

    // verify borrow, should have 100 QUOTE in wallet, and still 9900 BASE in Mango
    const user2QuoteAccount = await tester.getTokenAccountsForOwner(
      tester.user2Pubkey,
      tester.quoteMint.publicKey,
    );
    expect(user2QuoteAccount[0].amount === 100);
    await tester.verifyAmount(tester.user2Pubkey, 9900, BASE);
  });
});

describe('Mango', () => {
  // √ Tests placing a Serum spot order through Mango
  it('Can place a spot order', async () => {
    // load orders and market
    const mangoAccount = await tester.loadMangoAccountForOwner(tester.user2Pubkey, 0);
    const openOrdersAccounts = mangoAccount.spotOpenOrdersAccounts.filter((oo) => oo !== undefined);
    const beforeOrders = await tester.loadAllOrdersForTestMarket();
    expect(openOrdersAccounts.length).toBe(0);
    expect(beforeOrders?.length).toBe(0);

    // place order
    await tester.placeSpotOrder(tester.marketKeypair.publicKey, 'buy', '1', '5', 'limit', tester.user2Keypair);

    // verify that an order was placed
    const updatedOrders = await tester.loadAllOrdersForTestMarket();
    expect(updatedOrders?.length).toBe(1);
  });
});

describe('Mango', () => {
  // √ Tests cancelling a Serum spot order through Mango
  it('Can cancel a spot order', async () => {
    // load orders and market
    const mangoAccount = await tester.loadMangoAccountForOwner(tester.user2Pubkey, 0);
    const mangoAccountOrders = mangoAccount.spotOpenOrdersAccounts[1]
      ?.orders.filter((oo) => !oo.eq(new BN(0)));
    const beforeOrders = await tester.loadAllOrdersForTestMarket();
    expect(mangoAccountOrders?.length).toBe(1);
    expect(beforeOrders?.length).toBe(1);

    // cancel order
    const orderIdHexString = (mangoAccountOrders as BN[])[0].toString('hex');
    await tester.cancelSpotOrder(
      tester.marketKeypair.publicKey, orderIdHexString, tester.user2Keypair,
    );

    // verify that there are no more orders
    const updatedOrders = await tester.loadAllOrdersForTestMarket();
    expect(updatedOrders?.length).toBe(0);
  });
});

describe('Mango', () => {
  // √ Tests cancelling multiple Serum spot orders at once
  it('Can cancel multiple orders at once', async () => {
    // place some orders
    await tester.placeSpotOrder(tester.marketKeypair.publicKey, 'buy', '1.1', '5', 'limit', tester.user2Keypair);
    await tester.placeSpotOrder(tester.marketKeypair.publicKey, 'buy', '1.2', '5', 'limit', tester.user2Keypair);
    await tester.placeSpotOrder(tester.marketKeypair.publicKey, 'buy', '1.3', '5', 'limit', tester.user2Keypair);

    // check that the orders have been placed
    const beforeOrders = await tester.loadAllOrdersForTestMarket();
    expect(beforeOrders?.length).toBe(3);

    // cancel all orders
    await tester.cancelSpotOrder(
      tester.marketKeypair.publicKey, '', tester.user2Keypair,
    );

    // verify that there are no more orders
    const updatedOrders = await tester.loadAllOrdersForTestMarket();
    expect(updatedOrders?.length).toBe(0);
  });
});

describe('Mango', () => {
  // √ Tests settling Mango balances after a completed spot order
  it('Can settle balances after a completed spot order', async () => {
    // check balances
    await tester.verifyAmount(tester.user1Pubkey, 0, BASE);
    await tester.verifyAmount(tester.user1Pubkey, 10000, QUOTE);
    await tester.verifyAmount(tester.user2Pubkey, 9900, BASE);
    await tester.verifyAmount(tester.user2Pubkey, 0, QUOTE);

    // place some orders
    await tester.placeSpotOrder(tester.marketKeypair.publicKey, 'buy', '1', '1000', 'limit', tester.user1Keypair); // Buying BASE
    await tester.placeSpotOrder(tester.marketKeypair.publicKey, 'sell', '1', '1000', 'limit', tester.user2Keypair); // Selling BASE
    const orders = await tester.loadAllOrdersForTestMarket();
    expect(orders?.length).toBe(0);

    // crank
    const market = await Market.load(
      tester.connection, tester.marketKeypair.publicKey, {}, SERUM_PROG_ID,
    );
    const mangoAccount = await tester.loadMangoAccountForOwner(tester.user2Pubkey, 0);
    const openOrdersPubkey = mangoAccount.spotOpenOrdersAccounts.find(
      (account) => account?.market.toBase58() === tester.marketKeypair.publicKey.toBase58(),
    )?.owner as PublicKey;

    await tester._consumeEvents(market, openOrdersPubkey, tester.user2Keypair);

    await tester.settleSpot(market.publicKey, tester.user1Keypair);
    await tester.settleSpot(market.publicKey, tester.user2Keypair);

    // check balances again
    await tester.verifyAmount(tester.user1Pubkey, 1000, BASE);
    await tester.verifyAmount(tester.user1Pubkey, 9000, QUOTE);
    await tester.verifyAmount(tester.user2Pubkey, 8900, BASE);
    await tester.verifyAmount(tester.user2Pubkey, 897, QUOTE); // 1000 - 100 (earlier borrow) - 3 (Serum fees)
  });
});

// describe('Mango', () => {
//   // √ Tests placing a Mango perp order
//   it('Can place a perp order', async () => {
//     const mangoAcc = await tester.loadMangoAccountForOwner(tester.user2Pubkey, 0);
//     expect(mangoAcc.perpAccounts[1].bidsQuantity.toNumber()).toBe(0);

//     await tester.placePerpOrder(tester.perpMarketPubkey, 'buy', '1', '500', 'limit', tester.user2Keypair);

//     await mangoAcc.reload(tester.connection, SERUM_PROG_ID);
//     expect(mangoAcc.perpAccounts[1].bidsQuantity.toNumber()).toBe(500);
//   });
// });

// describe('Mango', () => {
//   // √ Tests cancelling a Mango perp order
//   it('Can cancel a perp order', async () => {
//     const mangoAcc = await tester.loadMangoAccountForOwner(tester.user2Pubkey, 0);
//     expect(mangoAcc.perpAccounts[1].bidsQuantity.toNumber()).toBe(500);

//     const perpMarket = await tester.loadPerpMarket(tester.perpMarketPubkey);
//     const openOrders = await perpMarket.loadOrdersForAccount(
//       tester.connection,
//       mangoAcc,
//     );
//     const orderIdHexString = openOrders[0].orderId.toString('hex');
//     await tester.cancelPerpOrder(tester.perpMarketPubkey, orderIdHexString, tester.user2Keypair);

//     await mangoAcc.reload(tester.connection, SERUM_PROG_ID);
//     expect(mangoAcc.perpAccounts[1].bidsQuantity.toNumber()).toBe(0);
//   });
// });

// describe('Mango', () => {
//   // √ Tests cancelling multiple Mango perp orders at once
//   it('Can cancel multiple perp orders at once', async () => {
//     const mangoAcc = await tester.loadMangoAccountForOwner(tester.user2Pubkey, 0);
//     expect(mangoAcc.perpAccounts[1].bidsQuantity.toNumber()).toBe(0);

//     await tester.placePerpOrder(tester.perpMarketPubkey, 'buy', '1', '500', 'limit', tester.user2Keypair);
//     await tester.placePerpOrder(tester.perpMarketPubkey, 'buy', '1', '500', 'limit', tester.user2Keypair);
//     await tester.placePerpOrder(tester.perpMarketPubkey, 'buy', '1', '500', 'limit', tester.user2Keypair);
//     await tester.placePerpOrder(tester.perpMarketPubkey, 'buy', '1', '500', 'limit', tester.user2Keypair);
//     await tester.placePerpOrder(tester.perpMarketPubkey, 'buy', '1', '500', 'limit', tester.user2Keypair);

//     await mangoAcc.reload(tester.connection, SERUM_PROG_ID);
//     expect(mangoAcc.perpAccounts[1].bidsQuantity.toNumber()).toBe(2500);

//     await tester.cancelPerpOrder(tester.perpMarketPubkey, '', tester.user2Keypair);

//     await mangoAcc.reload(tester.connection, SERUM_PROG_ID);
//     expect(mangoAcc.perpAccounts[1].bidsQuantity.toNumber()).toBe(0);
//   });
// });

// describe('Mango', () => {
//   // √ Tests settling pnl on a Mango perp
//   it('Can settle pnl on a perp contract', async () => {
//     // verify token amounts
//     await tester.verifyAmount(tester.user1Pubkey, 1000, BASE);
//     await tester.verifyAmount(tester.user1Pubkey, 9000, QUOTE);
//     await tester.verifyAmount(tester.user2Pubkey, 8900, BASE);
//     await tester.verifyAmount(tester.user2Pubkey, 897, QUOTE);

//     const user1MangoAccount = await tester.loadMangoAccountForOwner(tester.user1Pubkey, 0);
//     const user2MangoAccount = await tester.loadMangoAccountForOwner(tester.user2Pubkey, 0);

//     // user 1 goes short perp at $1
//     await tester.placePerpOrder(tester.perpMarketPubkey, 'sell', '1', '500', 'limit', tester.user1Keypair);
//     await user1MangoAccount.reload(tester.connection, SERUM_PROG_ID);
//     expect(user1MangoAccount.perpAccounts[1].asksQuantity.toNumber()).toBe(500);

//     // user 2 goes long perp at $1
//     await tester.placePerpOrder(tester.perpMarketPubkey, 'buy', '1', '500', 'limit', tester.user2Keypair);
//     await user2MangoAccount.reload(tester.connection, SERUM_PROG_ID);
//     expect(user2MangoAccount.perpAccounts[1].takerBase.toNumber()).toBe(500);

//     // crank and verify both sides have a position
//     await tester.keeperUpdateAll(true);
//     await user1MangoAccount.reload(tester.connection, SERUM_PROG_ID);
//     await user2MangoAccount.reload(tester.connection, SERUM_PROG_ID);
//     expect(user1MangoAccount.perpAccounts[1].basePosition.eq(new BN(-500)));
//     expect(user2MangoAccount.perpAccounts[1].basePosition.eq(new BN(500)));

//     // update price so that there will be something to settle
//     await tester.setOraclePrice('BASE', 2);

//     // crank again -> both sides have unsettled pnl and unchanged token amounts
//     await tester.keeperUpdateAll(true);
//     await tester.verifyAmount(tester.user1Pubkey, 1000, BASE);
//     await tester.verifyAmount(tester.user1Pubkey, 9000, QUOTE);
//     await tester.verifyAmount(tester.user2Pubkey, 8900, BASE);
//     await tester.verifyAmount(tester.user2Pubkey, 897, QUOTE);

//     // settle pnl and verify that it has been realized on both sides
//     await tester.settlePerpPnl(tester.perpMarketPubkey, tester.user2Keypair);
//     await tester.verifyAmount(tester.user1Pubkey, 1000, BASE);
//     await tester.verifyAmount(tester.user1Pubkey, 8500.25, QUOTE);
//     await tester.verifyAmount(tester.user2Pubkey, 8900, BASE);
//     await tester.verifyAmount(tester.user2Pubkey, 1396.75, QUOTE);
//   });
// });
