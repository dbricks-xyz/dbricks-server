import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import request from 'supertest';
import app from '../../src/app';
import {
  deserializeIxs,
  deserializeSigners,
} from '../../src/common/util/common.serializers';
import { assert, loadKpSync } from '../../src/common/util/common.util';
import { TESTING_KP_PATH } from '../../src/config/config';
import { getMint } from '../../src/config/config.util';
import MangoClientTester from '../../src/mango/client/mango.client.tester';

const testMangoClient = new MangoClientTester();
const ownerKp = loadKpSync(TESTING_KP_PATH);

// describe('Mango init and deposit', () => {
//   it('Can initialize a mangoAccount and deposit into it', async () => {
//     const tokenName = 'SOL';
//     const newAcc = await testMangoClient._newAccountWithLamports(
//       LAMPORTS_PER_SOL * 10,
//     );
//     const newKp = Keypair.fromSecretKey(new Uint8Array(newAcc.secretKey));
//     const tokenQuantity = 3;

//     const depositTx = await request(app)
//       .post('/mango/deposit')
//       .send({
//         token: tokenName,
//         quantity: tokenQuantity,
//         ownerPk: newKp.publicKey.toBase58(),
//       })
//       .expect(200);
//     let [depositIx, depositSigners] = depositTx.body;
//     depositIx = deserializeIxs(depositIx);
//     depositSigners = deserializeSigners(depositSigners);

//     // execute tx
//     await testMangoClient._prepareAndSendTx(
//       [...depositIx],
//       [newKp, ...depositSigners],
//     );
//     const userAccounts = await testMangoClient.loadUserAccounts(
//       newKp.publicKey,
//     );
//     const cache = await testMangoClient.getCache();
//     const tokenIndex = testMangoClient.getTokenIndex(tokenName);
//     const tokenAmount = userAccounts[0]
//       .getUiDeposit(
//         cache.rootBankCache[tokenIndex],
//         testMangoClient.group,
//         tokenIndex,
//       )
//       .toFixed();

//     assert(userAccounts.length > 0);
//     assert(+tokenAmount === tokenQuantity);
//   });
// });

describe('Mango deposit and withdraw', () => {
  it('Can deposit into an existing mangoAccount', async () => {
    const tokenName = 
    const mangoAccounts = await testMangoClient.loadUserAccounts(
      ownerKp.publicKey,
    );
    const destinationPk = mangoAccounts[0].publicKey;
    const tokenQuantity = 5;
    const beginningAmount = await testMangoClient.getBalance(mangoAccounts[0].publicKey);

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
    const tx = await testMangoClient._prepareAndSendTx(
      [...depositIx],
      [ownerKp, ...depositSigners],
    );

    // await testMangoClient._confirmTransaction(mangoAccounts[0].publicKey);
    const finalAmount = await testMangoClient.getBalance(mangoAccounts[0].publicKey);

    console.log(beginningAmount, finalAmount);

    assert(finalAmount === beginningAmount + tokenQuantity);
  });
});
