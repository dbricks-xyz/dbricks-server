import { PublicKey } from '@solana/web3.js';
import { Market } from '@project-serum/serum';
import BN from 'bn.js';
import { SerumClientTester } from './serum.client.tester';
import { assert } from '../../common/util/common.util';

describe('Serum', () => {
  it('Executes a trade', async () => {
    const serumTester = new SerumClientTester();
    await serumTester.initMarket();

    // --------------------------------------- execute a successful order
    await serumTester.placeAndSettleOrder(
      'buy',
      1,
      20,
      serumTester.quoteUserPk as PublicKey,
    );
    let userBaseBalance = await serumTester.getTokenBalance(serumTester.baseUserPk as PublicKey);
    assert(userBaseBalance === 0);

    await serumTester.placeAndSettleOrder(
      'sell',
      1,
      10,
      serumTester.baseUser2Pk as PublicKey,
    );
    userBaseBalance = await serumTester.getTokenBalance(serumTester.baseUserPk as PublicKey);
    assert(userBaseBalance === 10);

    // --------------------------------------- cancel remaining order
    let orders = await serumTester.loadOrdersForOwner(
      serumTester.market as Market,
      serumTester.testingPk,
    );
    assert(orders.length === 1);

    const orderId = new BN('36893488147419103231', 10);
    await serumTester.cancelOrder(orderId);

    orders = await serumTester.loadOrdersForOwner(
      serumTester.market as Market,
      serumTester.testingPk,
    );
    assert(orders.length === 0);
  });
});
