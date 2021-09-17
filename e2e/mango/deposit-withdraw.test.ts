import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import request from 'supertest';
import {
  deserializeIxs,
  deserializeSigners,
} from 'dbricks-lib';
import app from '../../src/app';
import { assert, loadKpSync } from '../../src/common/util/common.util';
import { TESTING_KP_PATH } from '../../src/config/config';
import MangoClientTester from '../../src/mango/client/mango.client.tester';

const testMangoClient = new MangoClientTester();
const ownerKp = loadKpSync(TESTING_KP_PATH);
const tokenName = 'SOL';

describe('Mango deposit and withdraw', () => {
  it('Can deposit into an existing mangoAccount', async () => {
    const mangoAccounts = await testMangoClient.loadUserAccounts(
      ownerKp.publicKey,
    );
    const destinationPk = mangoAccounts[0].publicKey;
    const tokenQuantity = 5;

    const beginningAmount = await testMangoClient.getBalance(ownerKp.publicKey);

    const depositTx = await request(app)
      .post('/mango/deposit')
      .send({
        token: tokenName,
        quantity: tokenQuantity,
        ownerPk: ownerKp.publicKey.toBase58(),
        destinationPk: destinationPk.toBase58(),
      })
      .expect(200);
    let [depositIx, depositSigners] = depositTx.body;
    depositIx = deserializeIxs(depositIx);
    depositSigners = deserializeSigners(depositSigners);

    // execute tx
    await testMangoClient._prepareAndSendTx(
      [...depositIx],
      [ownerKp, ...depositSigners],
    );

    const finalAmount = await testMangoClient.getBalance(ownerKp.publicKey);
    assert(finalAmount === beginningAmount - (tokenQuantity * LAMPORTS_PER_SOL) - 10000);// Txn fee
  });

  it('Can withdraw from an existing mangoAccount', async () => {
    const mangoAccounts = await testMangoClient.loadUserAccounts(
      ownerKp.publicKey,
    );
    const sourcePk = mangoAccounts[0].publicKey;
    const tokenQuantity = 5;

    const beginningAmount = await testMangoClient.getBalance(ownerKp.publicKey);

    const withdrawTx = await request(app)
      .post('/mango/withdraw')
      .send({
        token: tokenName,
        quantity: tokenQuantity,
        ownerPk: ownerKp.publicKey.toBase58(),
        sourcePk: sourcePk.toBase58(),
      })
      .expect(200);
    let [withdrawIx, withdrawSigners] = withdrawTx.body;
    withdrawIx = deserializeIxs(withdrawIx);
    withdrawSigners = deserializeSigners(withdrawSigners);

    // execute tx
    await testMangoClient._prepareAndSendTx(
      [...withdrawIx],
      [ownerKp, ...withdrawSigners],
    );

    const finalAmount = await testMangoClient.getBalance(ownerKp.publicKey);
    assert(finalAmount === beginningAmount + (tokenQuantity * LAMPORTS_PER_SOL) - 10000);// Txn fee
  });
});
