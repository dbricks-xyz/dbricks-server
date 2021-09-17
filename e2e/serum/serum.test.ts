import SerumTester from "./serum.tester";

//todo obv need to test more than just the happy path
describe('Serum', () => {
  it('Inits market + places/settles a trade', async () => {
    const amount = '123.0';

    const tester = new SerumTester();
    await tester.prepareAccs();
    await prepMarket(tester);

    // place order from user 2
    const [placeOrderIx2, placeOrderSigners2] = await tester.requestPlaceOrderIx(
      'sell',
      '10',
      amount,
      'limit',
      tester.user2Pk.toBase58(),
    );

    await tester._prepareAndSendTx(
      [
        ...placeOrderIx2,
      ],
      [
        tester.user2Kp,
        ...placeOrderSigners2,
      ],
    );

    // place + settle order from user 1
    const [placeOrderIx1, placeOrderSigners1] = await tester.requestPlaceOrderIx(
      'buy',
      '10',
      amount,
      'limit',
      tester.user1Pk.toBase58(),
    );
    await tester._prepareAndSendTx(
      [
        ...placeOrderIx1,
      ],
      [
        tester.user1Kp,
        ...placeOrderSigners1,
      ],
    );

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
    const [placeOrderIx1, placeOrderSigners1] = await tester.requestPlaceOrderIx(
      'buy',
      '10',
      amount,
      'limit',
      tester.user1Pk.toBase58(),
    );
    await tester._prepareAndSendTx(
      [
        ...placeOrderIx1,
      ],
      [
        tester.user1Kp,
        ...placeOrderSigners1,
      ],
    );

    let userTokenAccount = await tester.getTokenAccsForOwner(
      tester.user1Kp.publicKey,
      tester.quoteMint.publicKey,
    );
    expect(userTokenAccount[0].amount === 10000-parseFloat(amount));

    //cancel order
    const [cancelOrderIx1, cancelOrderSigners1] = await tester.requestCancelOrderIx(
      'affffffffffffffff',
      tester.user1Pk.toBase58(),
    );
    await tester._prepareAndSendTx(
      [
        ...cancelOrderIx1,
      ],
      [
        tester.user1Kp,
        ...cancelOrderSigners1,
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