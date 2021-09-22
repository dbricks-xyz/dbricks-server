import SerumTester from "./serum.tester";
import {Keypair, PublicKey} from "@solana/web3.js";
import {side} from "dbricks-lib";
import SerumClient from "../../src/serum/client/serum.client";

//todo obv need to test more than just the happy path
describe('Serum', () => {
  it('Inits market + places/settles a trade', async () => {
    const amount = '123.0';
    const tester = new SerumTester();
    await tester.prepAccs();
    await tester.prepMarket();

    // 1st user places an order
    // only quote account exists, base account will have to be created by the BE
    await placeOrder(tester, 'buy', amount, tester.user1Kp);

    // 2nd user places an order
    // both quote and base accounts exist
    await placeOrder(tester, 'sell', amount, tester.user2Kp);
    await settleAndVerify(tester, tester.baseMint.publicKey, parseFloat(amount));
  });
});

describe('Serum', () => {
  it('Inits market + places/cancels a trade', async () => {
    const amount = '123.0';
    const tester = new SerumTester();
    await tester.prepAccs();
    await tester.prepMarket();

    //place order
    await placeOrder(tester, 'buy', amount, tester.user1Kp);
    await settleAndVerify(tester, tester.quoteMint.publicKey, 10000 - parseFloat(amount));

    const srm = new SerumClient();
    const market = await srm.loadSerumMarket(tester.marketKp.publicKey);
    const oo = await srm.loadOrdersForOwner(market, tester.user1Kp.publicKey)
    console.log(oo);

    //cancel order
    const cancelTx = (await tester.requestCancelOrderIx(
      'affffffffffffffff',
      tester.user1Pk.toBase58(),
    ))[0];
    cancelTx.signers.unshift(tester.user1Kp);
    await tester._prepareAndSendTx(cancelTx);
    await settleAndVerify(tester, tester.quoteMint.publicKey, 10000);

    //place 2 more orders
    await placeOrder(tester, 'buy', amount, tester.user1Kp);
    await placeOrder(tester, 'buy', amount, tester.user1Kp);
    await settleAndVerify(tester, tester.quoteMint.publicKey, 10000 - 2 * parseFloat(amount));

    //cancel all at once
    const cancelAllTx = (await tester.requestCancelOrderIx(
      '',
      tester.user1Pk.toBase58(),
    ))[0];
    cancelAllTx.signers.unshift(tester.user1Kp);
    await tester._prepareAndSendTx(cancelAllTx);
    await settleAndVerify(tester, tester.quoteMint.publicKey, 10000);

  });
});

async function settleAndVerify(tester: SerumTester, mint: PublicKey, expectedAmount: number) {
  // settle
  const settleTx = (await tester.requestSettleIx(tester.user1Pk.toBase58()))[0];
  settleTx.signers.unshift(tester.user1Kp);
  await tester._prepareAndSendTx(settleTx);

  // verify went through
  const userTokenAccount = await tester.getTokenAccsForOwner(
    tester.user1Kp.publicKey,
    mint,
  );
  expect(userTokenAccount[0].amount === expectedAmount);
}

async function placeOrder(tester: SerumTester, side: side, amount: string, user: Keypair) {
  const tx = (await tester.requestPlaceOrderIx(
    side,
    '10',
    amount,
    'limit',
    user.publicKey.toBase58(),
  ))[0];
  tx.signers.unshift(user);
  await tester._prepareAndSendTx(tx);
}