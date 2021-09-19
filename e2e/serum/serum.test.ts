import SerumTester from "./serum.tester";
import {Keypair} from "@solana/web3.js";
import {side} from "dbricks-lib";

//todo obv need to test more than just the happy path
describe('Serum', () => {
  it('Inits market + places/settles a trade', async () => {
    const amount = '123.0';
    const tester = new SerumTester();
    await tester.prepAccs();
    await tester.prepMarket();

    // place order from user 2
    await placeOrder(tester, 'sell', amount, tester.user2Kp);

    // place + settle order from user 1
    await placeOrder(tester, 'buy', amount, tester.user1Kp);
    const settleTx = (await tester.requestSettleIx(tester.user1Pk.toBase58()))[0];
    settleTx.signers.unshift(tester.user1Kp);
    await tester._prepareAndSendTx(settleTx);

    // verify went through
    let userTokenAccount = await tester.getTokenAccsForOwner(
      tester.user1Kp.publicKey,
      tester.baseMint.publicKey,
    );
    expect(userTokenAccount[0].amount === parseFloat(amount));
  });
});

describe('Serum', () => {
  it('Inits market + places/cancels a trade', async () => {
    const amount = '123.0';
    const tester = new SerumTester();
    await tester.prepAccs();
    await tester.prepMarket();

    // place order
    await placeOrder(tester, 'buy', amount, tester.user1Kp);
    let userTokenAccount = await tester.getTokenAccsForOwner(
      tester.user1Kp.publicKey,
      tester.quoteMint.publicKey,
    );
    expect(userTokenAccount[0].amount === 10000 - parseFloat(amount));

    //cancel order
    const cancelTx = (await tester.requestCancelOrderIx(
      'affffffffffffffff',
      tester.user1Pk.toBase58(),
    ))[0];
    cancelTx.signers.unshift(tester.user1Kp);
    await tester._prepareAndSendTx(cancelTx);

    //settle funds back to user
    const settleTx = (await tester.requestSettleIx(tester.user1Pk.toBase58()))[0];
    settleTx.signers.unshift(tester.user1Kp);
    await tester._prepareAndSendTx(settleTx);

    // verify went through
    userTokenAccount = await tester.getTokenAccsForOwner(
      tester.user1Kp.publicKey,
      tester.quoteMint.publicKey,
    );
    expect(userTokenAccount[0].amount === 10000);
  });
});

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