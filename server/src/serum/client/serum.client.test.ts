// import BN from 'bn.js';
// import {assert} from '../serum.util';
//
// describe('Serum', () => {
//   it('Successfully initializes a market', async () => {
//     // --------------------------------------- place buy order & try to settle
//
//     // check that so far no successful trade
//     let userBaseBalance = await serumClient.connection.getTokenAccountBalance(
//       baseUserPk,
//     );
//     assert(userBaseBalance.value.uiAmount === 0);
//     // --------------------------------------- place sell order that matches the buy order
//
//     // check that so far no successful trade
//     userBaseBalance = await serumClient.connection.getTokenAccountBalance(
//       baseUserPk,
//     );
//     assert(userBaseBalance.value.uiAmount === 10);
//
//     // --------------------------------------- cancel remaining order
//
//     let orders = await market.loadOrdersForOwner(
//       serumClient.connection,
//       serumClient.testingPk,
//     );
//     assert(orders.length === 1);
//
//     const orderId = new BN('36893488147419103231', 10);
//
//     orders = await market.loadOrdersForOwner(
//       serumClient.connection,
//       serumClient.testingPk,
//     );
//     assert(orders.length === 0);
//   });
// });

// todo TBD ilja
