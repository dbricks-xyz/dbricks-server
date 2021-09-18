import SerumTester from "./serum.tester";
import {Keypair} from "@solana/web3.js";
import {side} from "../../src/common/interfaces/dex/common.interfaces.dex.order";

//todo obv need to test more than just the happy path
describe('Serum', () => {
  it('Inits market + places/settles a trade', async () => {
    const amount = '123.0';
    const tester = new SerumTester();
    await tester.prepareAccs();
    await prepMarket(tester);

    // place order from user 2
    await placeOrder(tester, 'sell', amount, tester.user2Kp);

    // place + settle order from user 1
    await placeOrder(tester, 'buy', amount, tester.user1Kp);
    //todo currently a bug so can't send in 1 tx
    const [settleIx, settleSigners] = await tester.requestSettleIx(
      tester.user1Pk.toBase58(),
    );
    await tester._prepareAndSendTx(
      [
        ...settleIx,
      ],
      [
        tester.user1Kp,
        ...settleSigners,
      ],
    );

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
    await tester.prepareAccs();
    await prepMarket(tester);

    // place order
    await placeOrder(tester, 'buy', amount, tester.user1Kp);
    let userTokenAccount = await tester.getTokenAccsForOwner(
      tester.user1Kp.publicKey,
      tester.quoteMint.publicKey,
    );
    expect(userTokenAccount[0].amount === 10000 - parseFloat(amount));

    //cancel order
    const [cancelOrderIx, cancelOrderSigners] = await tester.requestCancelOrderIx(
      'affffffffffffffff',
      tester.user1Pk.toBase58(),
    );
    await tester._prepareAndSendTx(
      [
        ...cancelOrderIx,
      ],
      [
        tester.user1Kp,
        ...cancelOrderSigners,
      ],
    );

    //settle funds back to user
    //todo currently a bug so can't send in 1 tx
    const [settleIx, settleSigners] = await tester.requestSettleIx(
      tester.user1Pk.toBase58(),
    );
    await tester._prepareAndSendTx(
      [
        ...settleIx,
      ],
      [
        tester.user1Kp,
        ...settleSigners,
      ],
    );

    // verify went through
    userTokenAccount = await tester.getTokenAccsForOwner(
      tester.user1Kp.publicKey,
      tester.quoteMint.publicKey,
    );
    expect(userTokenAccount[0].amount === 10000);
  });
});

async function prepMarket(tester: SerumTester) {
  const [initMarketIx, initMarketSigners] = await tester.requestInitMarketIx();
  const firstIxSet = initMarketIx.splice(0, 5);
  const secondIxSet = initMarketIx;
  const firstSignersSet = initMarketSigners.splice(0, 5);
  const secondSignersSet = initMarketSigners;

  await tester._prepareAndSendTx(
    [
      ...firstIxSet,
    ],
    [
      tester.user1Kp,
      ...firstSignersSet,
    ],
  );
  await tester._prepareAndSendTx(
    [
      ...secondIxSet,
    ],
    [
      tester.user1Kp,
      ...secondSignersSet,
    ],
  );
}

async function placeOrder(tester: SerumTester, side: side, amount: string, user: Keypair) {
  const [placeOrderIx, placeOrderSigners] = await tester.requestPlaceOrderIx(
    side,
    '10',
    amount,
    'limit',
    user.publicKey.toBase58(),
  );
  await tester._prepareAndSendTx(
    [
      ...placeOrderIx,
    ],
    [
      user,
      ...placeOrderSigners,
    ],
  );
}