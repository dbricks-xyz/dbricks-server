import SerumTester from "./serum.tester";

const fundingAmount = 10000;
const amount = 100;
const price = 10;

describe('Serum', () => {
  // √ tests place order: 1)buy ,2)sell
  // √ tests settle order 1)no settle acc (user1), 2)xisting settle acc(user2)
  it('Inits market + places/settles a trade', async () => {
    const tester = new SerumTester();
    await tester.prepAccounts(fundingAmount);
    await tester.prepMarket();

    // place orders from both users
    await tester.placeLimitOrder(tester.user1Kp, 'buy', amount, price);
    await tester.verifyOpenOrdersCount(tester.user1Kp, 1);
    await tester.placeLimitOrder(tester.user2Kp, 'sell', amount, price);
    await tester.verifyOpenOrdersCount(tester.user1Kp, 0);

    // settle + verify
    await tester.settleAndVerifyAmount(tester.user1Kp, tester.baseMint.publicKey, amount);
    await tester.settleAndVerifyAmount(tester.user1Kp, tester.quoteMint.publicKey, fundingAmount - amount * price);
    await tester.settleAndVerifyAmount(tester.user2Kp, tester.baseMint.publicKey, fundingAmount - amount);
    // since user 1 is the maker - user 2 pays the fees as a taker
    await tester.settleAndVerifyAmount(tester.user2Kp, tester.quoteMint.publicKey, amount * price - 3);
  });
});

describe('Serum', () => {
  // √ tests cancelling 1 order
  // √ tests cancelling all orders (single transaction)
  // √ tests cancelling all orders (split transactions)
  // √ tests cancelling all orders, when none exist
  // √ tests cancelling an order with a non-existent id
  it('Inits market + places/cancels a trade', async () => {
    const tester = new SerumTester();
    await tester.prepAccounts(fundingAmount);
    await tester.prepMarket();

    // place 1 order
    await tester.placeLimitOrder(tester.user1Kp, 'buy', amount, price);
    await tester.verifyOpenOrdersCount(tester.user1Kp, 1);
    await tester.settleAndVerifyAmount(tester.user1Kp, tester.quoteMint.publicKey, fundingAmount - amount * price);

    // cancel 1 order
    await tester.cancelOrder(tester.user1Kp, 'affffffffffffffff');
    await tester.verifyOpenOrdersCount(tester.user1Kp, 0);
    await tester.settleAndVerifyAmount(tester.user1Kp, tester.quoteMint.publicKey, fundingAmount);

    // place 2 orders
    await tester.placeLimitOrder(tester.user1Kp, 'buy', amount, price);
    await tester.placeLimitOrder(tester.user1Kp, 'buy', amount, price);
    await tester.verifyOpenOrdersCount(tester.user1Kp, 2);
    await tester.settleAndVerifyAmount(tester.user1Kp, tester.quoteMint.publicKey, fundingAmount - 2 * amount * price);

    // cancel all at once
    await tester.cancelOrder(tester.user1Kp, '');
    await tester.verifyOpenOrdersCount(tester.user1Kp, 0);
    await tester.settleAndVerifyAmount(tester.user1Kp, tester.quoteMint.publicKey, fundingAmount);

    // place 15 orders (too many to fit into a single transaction - will have to be broken up)
    for (let i = 0; i < 15; i += 1) {
      await tester.placeLimitOrder(tester.user1Kp, 'buy', amount / 10, price + i);
    }

    // cancel all at once
    await tester.cancelOrder(tester.user1Kp, '');
    await tester.verifyOpenOrdersCount(tester.user1Kp, 0);
    await tester.settleAndVerifyAmount(tester.user1Kp, tester.quoteMint.publicKey, fundingAmount);

    // cancel all when 0 exist
    await tester.cancelOrder(tester.user1Kp, '');

    // cancel a non-existent order
    await tester.cancelOrder(tester.user1Kp, 'fff');
  });
});

