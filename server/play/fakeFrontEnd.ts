// import axios from 'axios';
// import {
//   deserializeIxs,
//   deserializeSigners,
// } from '../src/common/util/common.serializers';
// import { SolTestingClient } from '../src/common/client/common.client.testing';
//
// const BASE = 'ATLAS';
// const QUOTE = 'USDC';
// const MARKET = `${BASE}/${QUOTE}`;
// const testingClient = new SolTestingClient();
// const ownerKp = testingClient.testingKp;
//
// async function play() {
//   // prepare requests
//   const r1 = axios.post('http://localhost:3000/serum/orders', {
//     market: MARKET,
//     side: 'buy',
//     price: 0.2,
//     size: 0.1,
//     orderType: 'ioc',
//     ownerPk: ownerKp.publicKey.toBase58(),
//   });
//   const r2 = axios.post('http://localhost:3000/serum/settle', {
//     market: MARKET,
//     ownerPk: ownerKp.publicKey.toBase58(),
//   });
//   const [placeOrderTx, settleTx] = await axios.all([r1, r2]);
//
//   // deserialize
//   let [placeOrderIx, placeOrderSigners] = placeOrderTx.data;
//   placeOrderIx = deserializeIxs(placeOrderIx);
//   placeOrderSigners = deserializeSigners(placeOrderSigners);
//
//   let [settleIx, settleSigners] = settleTx.data;
//   settleIx = deserializeIxs(settleIx);
//   settleSigners = deserializeSigners(settleSigners);
//
//   // execute tx
//   await testingClient.prepareAndSendTx(
//     [
//       ...placeOrderIx,
//       ...settleIx,
//     ],
//     [
//       ownerKp,
//       ...placeOrderSigners,
//       ...settleSigners,
//     ],
//   );
// }
//
// play();

// todo TBD ilja
