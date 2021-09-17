// import request from 'supertest';
// import { deserializeIxs, deserializeSigners } from 'dbricks-lib';
// import { assert, loadKpSync } from '../../src/common/util/common.util';
// import { TESTING_KP_PATH } from '../../src/config/config';
// import SerumClient from '../../src/serum/client/serum.client';
// import app from '../../src/app';
// import { getMint } from '../../src/config/config.util';

// const BASE = 'ATLAS';
// const QUOTE = 'USDC';
// const MARKET = `${BASE}/${QUOTE}`;
// const ownerKp = loadKpSync(TESTING_KP_PATH);
// const serumClient = new SerumClient();

// describe('Serum Order', () => {
//   it('Places/settles a trade', async () => {
//     // fire off requests to server
//     const placeOrderTx = await request(app).post('/serum/orders').send({
//       marketName: MARKET,
//       side: 'buy',
//       price: 0.2,
//       size: 0.1,
//       orderType: 'ioc',
//       ownerPk: ownerKp.publicKey.toBase58(),
//     }).expect(200);
//     const settleTx = await request(app).post('/serum/markets/settle').send({
//       marketName: MARKET,
//       ownerPk: ownerKp.publicKey.toBase58(),
//     }).expect(200);

//     // deserialize
//     let [placeOrderIx, placeOrderSigners] = placeOrderTx.body;
//     placeOrderIx = deserializeIxs(placeOrderIx);
//     placeOrderSigners = deserializeSigners(placeOrderSigners);

//     let [settleIx, settleSigners] = settleTx.body;
//     settleIx = deserializeIxs(settleIx);
//     settleSigners = deserializeSigners(settleSigners);

//     let userTokenAccount = await serumClient.getTokenAccsForOwner(
//       ownerKp.publicKey,
//       getMint(BASE),
//     );
//     const preTradeBalance = userTokenAccount[0].amount;

//     // execute tx client-side
//     await serumClient._prepareAndSendTx(
//       [
//         ...placeOrderIx,
//         ...settleIx,
//       ],
//       [
//         ownerKp,
//         ...placeOrderSigners,
//         ...settleSigners,
//       ],
//     );

//     // verify went through
//     userTokenAccount = await serumClient.getTokenAccsForOwner(
//       ownerKp.publicKey,
//       getMint(BASE),
//     );
//     const postTradeBalance = userTokenAccount[0].amount;
//     assert(postTradeBalance === preTradeBalance + 0.1);
//   });
// });

// // todo this currently requires mainnet, should be devnet
