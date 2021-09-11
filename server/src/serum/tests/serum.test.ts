import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { DexInstructions, Market } from '@project-serum/serum';
import { getVaultOwnerAndNonce } from '@project-serum/swap/lib/utils';
import { SerumTestingClient } from '../client/serum.client.testing';
import { prepInitMarketTx } from '../logic/serum.logic.market';
import { SERUM_PROG_ID } from '../../config/config';
import { prepCancelOrderTx, prepPlaceOrderTx } from '../logic/serum.logic.order';
import { assert, loadSerumMarketFromPk } from '../serum.util';
import { prepSettleFundsTx } from '../logic/serum.logic.settle';

describe('Serum', () => {
  it('Successfully initializes a market', async () => {
    const serumClient = new SerumTestingClient();
    // await serumClient.connection.requestAirdrop(serumClient.testingPk, 10 * LAMPORTS_PER_SOL);

    console.log('Generating mints');
    const baseMint = await serumClient.createMint();
    const quoteMint = await serumClient.createMint();

    console.log('Generating state accounts');
    const marketKp = new Keypair();
    const reqQKp = new Keypair();
    const eventQKp = new Keypair();
    const bidsKp = new Keypair();
    const asksKp = new Keypair();

    // length taken from here - https://github.com/project-serum/serum-dex/blob/master/dex/crank/src/lib.rs#L1286
    const marketIx = await serumClient.generateCreateStateAccIx(marketKp.publicKey, 376 + 12);
    const requestQueueIx = await serumClient.generateCreateStateAccIx(reqQKp.publicKey, 640 + 12);
    const eventQueueIx = await serumClient.generateCreateStateAccIx(
      eventQKp.publicKey, 1048576 + 12,
    );
    const bidsIx = await serumClient.generateCreateStateAccIx(bidsKp.publicKey, 65536 + 12);
    const asksIx = await serumClient.generateCreateStateAccIx(asksKp.publicKey, 65536 + 12);

    await serumClient.prepareAndSendTx(
      [marketIx, requestQueueIx, eventQueueIx, bidsIx, asksIx],
      [serumClient.testingKp, marketKp, reqQKp, eventQKp, bidsKp, asksKp],
    );

    // create the vault signer PDA
    // (!) IMPORTANT - must use this function and not do manually
    // otherwise will get an error: Provided seeds do not result in a valid address
    // see my question in Serum's dev-questions chat
    const [vaultSignerPk, vaultSignerNonce] = await getVaultOwnerAndNonce(
      marketKp.publicKey,
      SERUM_PROG_ID,
    );

    console.log('Generating token accounts');
    const baseVaultPk = await serumClient.createTokenAcc(baseMint, vaultSignerPk as PublicKey);
    const quoteVaultPk = await serumClient.createTokenAcc(quoteMint, vaultSignerPk as PublicKey);
    // user 1
    const baseUserPk = await serumClient.createTokenAcc(baseMint, serumClient.testingPk);
    const quoteUserPk = await serumClient.createTokenAcc(quoteMint, serumClient.testingPk);
    await serumClient.fundTokenAcc(quoteMint, quoteUserPk, 1000);
    // user 2
    const baseUser2Pk = await serumClient.createTokenAcc(baseMint, serumClient.testingPk);
    const quoteUser2Pk = await serumClient.createTokenAcc(quoteMint, serumClient.testingPk);
    await serumClient.fundTokenAcc(baseMint, baseUser2Pk, 1000);

    console.log('Preparing InitMarket ix');
    const [ixM, signersM] = await prepInitMarketTx(
      marketKp.publicKey,
      reqQKp.publicKey,
      eventQKp.publicKey,
      bidsKp.publicKey,
      asksKp.publicKey,
      baseVaultPk,
      quoteVaultPk,
      baseMint.publicKey,
      quoteMint.publicKey,
      new BN(1),
      new BN(1),
      new BN(50),
      vaultSignerNonce as BN,
      new BN(100),
    );

    await serumClient.prepareAndSendTx(
      ixM,
      [serumClient.testingKp, ...signersM],
    );
    console.log('Successfully initialized a new Serum market');

    // --------------------------------------- place buy order & try to settle

    const market = await loadSerumMarketFromPk(
      serumClient.connection,
      marketKp.publicKey,
    );

    const [ixO, signersO] = await prepPlaceOrderTx(
      serumClient.connection,
      market,
      'buy',
      1,
      20,
      'limit',
      serumClient.testingPk,
      quoteUserPk,
    );
    await serumClient.prepareAndSendTx(
      [...ixO],
      [serumClient.testingKp, ...signersO],
    );

    const [ixS, signersS] = await prepSettleFundsTx(
      serumClient.connection,
      market,
      serumClient.testingPk,
      baseUserPk,
      quoteUserPk,
    );
    await serumClient.prepareAndSendTx(
      [...ixS],
      [serumClient.testingKp, ...signersS],
    );

    // check that so far no successful trade
    let userBaseBalance = await serumClient.connection.getTokenAccountBalance(
      baseUserPk,
    );
    assert(userBaseBalance.value.uiAmount === 0);

    console.log('Buy order placed');

    // --------------------------------------- place sell order that matches the buy order

    const [ixO2, signersO2] = await prepPlaceOrderTx(
      serumClient.connection,
      market,
      'sell',
      1,
      10,
      'limit',
      serumClient.testingPk,
      baseUser2Pk,
    );
    await serumClient.prepareAndSendTx(
      [...ixO2],
      [serumClient.testingKp, ...signersO2],
    );

    const [ixS2, signersS2] = await prepSettleFundsTx(
      serumClient.connection,
      market,
      serumClient.testingPk,
      baseUserPk,
      quoteUserPk,
    );
    await serumClient.prepareAndSendTx(
      [...ixS2],
      [serumClient.testingKp, ...signersS2],
    );

    // check that so far no successful trade
    userBaseBalance = await serumClient.connection.getTokenAccountBalance(
      baseUserPk,
    );
    assert(userBaseBalance.value.uiAmount === 10);

    console.log('Matching sell order placed');

    // --------------------------------------- cancel remaining order

    let orders = await market.loadOrdersForOwner(
      serumClient.connection,
      serumClient.testingPk,
    );
    assert(orders.length === 1);

    const orderId = new BN('36893488147419103231', 10);

    // const [ixO3, signersO3] = await prepPlaceOrderTx(
    //   serumClient.connection,
    //   market,
    //   'buy',
    //   1,
    //   20,
    //   'limit',
    //   serumClient.testingPk,
    //   quoteUserPk,
    // );
    // await serumClient.prepareAndSendTx(
    //   [...ixO3],
    //   [serumClient.testingKp, ...signersO3],
    // );

    const [ixC, signersC] = await prepCancelOrderTx(
      serumClient.connection,
      market,
      serumClient.testingPk,
      orderId,
    );

    await serumClient.prepareAndSendTx(
      ixC,
      [serumClient.testingKp],
    );

    orders = await market.loadOrdersForOwner(
      serumClient.connection,
      serumClient.testingPk,
    );
    assert(orders.length === 0);
  });
});
