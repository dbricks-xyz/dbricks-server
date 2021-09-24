import SerumTester from "./serum.tester";
import {Keypair, PublicKey} from "@solana/web3.js";
import {side} from "dbricks-lib";

//todo obv need to test more than just the happy path
describe('Serum', () => {
  it('Inits market + places/settles a trade', async () => {
    const fundingAmount = 10000;
    const amount = 100;
    const price = 10;
    const tester = new SerumTester();
    await tester.prepAccs(fundingAmount);
    await tester.prepMarket();

    // 1st user places an order
    // only quote account exists, base account will have to be created by the BE
    await placeOrder(tester, 'buy', amount, price, tester.user1Kp);

    // 2nd user places an order
    // both quote and base accounts exist
    await placeOrder(tester, 'sell', amount, price, tester.user2Kp);

    // settle + verify
    // since user 1 is the maker - user 2 pays the fees as a taker
    await settleAndVerify(tester, tester.baseMint.publicKey, amount, tester.user1Kp);
    await settleAndVerify(tester, tester.quoteMint.publicKey, fundingAmount - amount * price, tester.user1Kp);
    await settleAndVerify(tester, tester.baseMint.publicKey, fundingAmount - amount, tester.user2Kp);
    await settleAndVerify(tester, tester.quoteMint.publicKey, amount * price - 3, tester.user2Kp);
  });
});

// describe('Serum', () => {
//   it('Inits market + places/cancels a trade', async () => {
//     const fundingAmount = 10000;
//     const amount = 100;
//     const price = 10;
//     const tester = new SerumTester();
//     await tester.prepAccs(fundingAmount);
//     await tester.prepMarket();
//
//     //place order
//     await placeOrder(tester, 'buy', amount, price, tester.user1Kp);
//     await settleAndVerify(tester, tester.quoteMint.publicKey, fundingAmount-amount*price, tester.user1Kp);
//
//     //cancel order
//     const cancelTx = (await tester.requestCancelOrderIx(
//       'affffffffffffffff',
//       tester.user1Pk.toBase58(),
//     ))[0];
//     cancelTx.signers.unshift(tester.user1Kp);
//     await tester._prepareAndSendTx(cancelTx);
//     await settleAndVerify(tester, tester.quoteMint.publicKey, fundingAmount, tester.user1Kp);
//
//     //place 2 more orders
//     await placeOrder(tester, 'buy', amount, price, tester.user1Kp);
//     await placeOrder(tester, 'buy', amount, price, tester.user1Kp);
//     await settleAndVerify(tester, tester.quoteMint.publicKey, fundingAmount - 2 * amount*price, tester.user1Kp);
//
//     //cancel all at once
//     const cancelAllTx = (await tester.requestCancelOrderIx(
//       '',
//       tester.user1Pk.toBase58(),
//     ))[0];
//     cancelAllTx.signers.unshift(tester.user1Kp);
//     await tester._prepareAndSendTx(cancelAllTx);
//     await settleAndVerify(tester, tester.quoteMint.publicKey, fundingAmount, tester.user1Kp);
//
//   });
// });

async function settleAndVerify(tester: SerumTester, mint: PublicKey, expectedAmount: number, user: Keypair) {
  // must consume events for settlement to work
  await tester._consumeEvents(tester.market, user);

  // settle
  const settleTx = (await tester.requestSettleIx(user.publicKey.toBase58()))[0];
  settleTx.signers.unshift(user);
  await tester._prepareAndSendTx(settleTx);

  // verify went through
  const userTokenAccounts = await tester.getTokenAccsForOwner(
    user.publicKey,
    mint,
  );
  expect(userTokenAccounts[0].amount).toEqual(expectedAmount);
}

async function placeOrder(tester: SerumTester, side: side, amount: number, price: number, user: Keypair) {
  const tx = (await tester.requestPlaceOrderIx(
    side,
    `${price}`,
    `${amount}`,
    'limit',
    user.publicKey.toBase58(),
  ))[0];
  tx.signers.unshift(user);
  await tester._prepareAndSendTx(tx);
}
