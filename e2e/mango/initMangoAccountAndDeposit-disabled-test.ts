import {Keypair, LAMPORTS_PER_SOL, PublicKey} from '@solana/web3.js';
import request from 'supertest';
import app from '../../src/app';
import { assert } from '../../src/common/util/common.util';
import MangoClientTester from '../../src/mango/client/mango.client.tester';
import {deserializeIxs, deserializeSigners} from "dbricks-lib";

const testMangoClient = new MangoClientTester();
const mintPk = new PublicKey('So11111111111111111111111111111111111111112');

describe('Mango init and deposit', () => {
  it('Can initialize a mangoAccount and deposit into it', async () => {
    const newAcc = await testMangoClient._newAccountWithLamports(
      LAMPORTS_PER_SOL * 5,
    );
    const newKp = Keypair.fromSecretKey(new Uint8Array(newAcc.secretKey));
    const tokenQuantity = 3;

    const depositTx = await request(app)
      .post('/mango/deposit')
      .send({
        mintPk: mintPk.toBase58(),
        quantity: tokenQuantity,
        ownerPk: newKp.publicKey.toBase58(),
      })
      .expect(200);
    let [depositIx, depositSigners] = depositTx.body;
    depositIx = deserializeIxs(depositIx);
    depositSigners = deserializeSigners(depositSigners);

    // execute tx
    await testMangoClient._prepareAndSendTx(
      [...depositIx],
      [newKp, ...depositSigners],
    );
    const userAccounts = await testMangoClient.loadUserAccounts(
      newKp.publicKey,
    );
    const cache = await testMangoClient.getCache();
    const tokenIndex = testMangoClient.getTokenIndex(mintPk);
    const tokenAmount = +userAccounts[0]
      .getUiDeposit(
        cache.rootBankCache[tokenIndex],
        testMangoClient.group,
        tokenIndex,
      )
      .toFixed();

    assert(userAccounts.length > 0);
    assert(tokenAmount > 2.9999999); // Txn fee
  });
});
